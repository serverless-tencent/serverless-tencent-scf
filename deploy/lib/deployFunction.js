'use strict';
const tencentcloud = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const utils = require('../../shared/utils');
const models = tencentcloud.scf.v20180416.Models;
const assert = require('assert');
const fs = require('fs');
const _ = require('lodash');
const filesize = require('filesize');
const request = require('request');
const util = require('util');

const ScfZipCodeSizeLimit = 20 * 1024 * 1024;
const ScfUploadSliceLimit = 8 * 1024 * 1024

class DeployFunction extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	async deploy(ns, funcObject, packagePath) {
		const func = await this.getFunction(ns, funcObject.FuncName);
		if (!func)
			await this.createFunction(ns, funcObject, packagePath);
		else {
			await this.updateFunctionCode(ns, funcObject, packagePath);
			await this.updateConfiguration(ns, func, funcObject);
			return func;
		}
		return null;
	}

	async updateFunctionCode(ns, funcObject, packagePath) {
		return new Promise(async (done) => {
			const updateArgs = {
				Region: funcObject.Properties.Region,
				FunctionName: funcObject.FuncName,
				Handler: funcObject.Properties.Handler,
				Namespace: ns,
			};

			if (!funcObject.Properties.CodeUri.Key) {
				this.logger('Updating function code... ', packagePath);
				const zipBinContent = fs.readFileSync(packagePath);
				updateArgs.ZipFile = zipBinContent.toString('base64');
				const result = await this._updateFunctionCodeTc3(updateArgs);
				if (result.Error)
					throw new Error(`${result.Error.Code}: ${result.Error.Message}`);
				this.logger('Request id', result.RequestId);
				return result;
			} else {
				this.logger('Updating function code to cos... ');
				updateArgs.CosBucketName = funcObject.Properties.CodeUri.Bucket;
				updateArgs.CosObjectName = funcObject.Properties.CodeUri.Key;
				this.scfClient.UpdateFunctionCode(updateArgs, (err, response) => {
					if (err)
						throw err;
					this.logger('Request id', response.RequestId);
					done(response);
				});
			}
		});
	}

	async createFunction(ns, funcObject, packagePath) {
		let funcCode;

		if (funcObject.Properties.CodeUri.Key) {
			funcCode = {
				CosBucketName: funcObject.Properties.CodeUri.Bucket,
				CosObjectName: funcObject.Properties.CodeUri.Key
			};
		} else {
			const size = fs.statSync(packagePath).size;
			assert(size <= ScfZipCodeSizeLimit, `file size(${filesize(size)}) exceeds maximum(${filesize(ScfZipCodeSizeLimit)}) limit.`);

			const zipBinContent = fs.readFileSync(packagePath);
			funcCode = {
				ZipFile: zipBinContent.toString('base64')
			};
		}

		const createFuncRequest = {
			Region: funcObject.Properties.Region,
			FunctionName: funcObject.FuncName,
			Code: funcCode,
			Namespace: ns,
			Runtime: funcObject.Properties.Runtime,
			Handler: funcObject.Properties.Handler,
			Role: funcObject.Properties.Role,
			MemorySize: funcObject.Properties.MemorySize,
			Timeout: funcObject.Properties.Timeout,
			Description: funcObject.Properties.Description,
		};

		if (!_.isEmpty(funcObject.Properties.Environment)) {
			const env = funcObject.Properties.Environment;

			createFuncRequest.Environment = {
				Variables: []
			};
			for (let key in env.Variables) {
				const item = {
					Key: key,
					Value: env.Variables[key]
				};
				createFuncRequest.Environment.Variables.push(item);
			}
		}

		if (!_.isEmpty(funcObject.Properties.VpcConfig)) {
			const vpc = funcObject.Properties.VpcConfig;

			createFuncRequest.VpcConfig = {
				VpcId: vpc.vpcId,
				SubnetId: vpc.subnetId
			};
		}

		this.logger('Uploading function', packagePath);
		const result = await this._createFunctionTc3(createFuncRequest);
		if (result.Error)
			throw new Error(`${result.Error.Code}: ${result.Error.Message}`);
		this.logger('Request id', result.RequestId);
		return result;
	}

	_createFunctionTc3(req) {
		for (let key in req) {
			if (req[key] == null)
				delete req[key];
		}

		const region = req.Region;
		delete req.Region;

		if (req.Action)
			delete req.Action;

		return new Promise(res => {

			const signObj = utils.TC3HMACSHA256('scf', req, this.secret_id, this.secret_key);
			const headers = {
				'X-TC-Action': 'CreateFunction',
				'X-TC-RequestClient': 'sls-scf-cli',
				'X-TC-Timestamp': signObj.timestamp,
				'X-TC-Version': signObj.version,
				'X-TC-Region': region,
				'Authorization': signObj.sign,
			}

			var options = {
				headers: headers,
				url: 'https://' + signObj.host,
				method: 'POST',
				json: true,
				body: req
			};

			request(options, (error, response, data) => {
				if (error)
					throw error;
				res(data.Response);
			});
		});
	}

	_updateFunctionCodeTc3(req) {
		for (let key in req) {
			if (req[key] == null)
				delete req[key];
		}

		const region = req.Region;
		delete req.Region;

		if (req.Action)
			delete req.Action;
		return new Promise(res => {
			const signObj = utils.TC3HMACSHA256('scf', req, this.secret_id, this.secret_key);

			const headers = {
				'X-TC-Action': 'UpdateFunctionCode',
				'X-TC-RequestClient': 'sls-scf-cli',
				'X-TC-Timestamp': signObj.timestamp,
				'X-TC-Version': signObj.version,
				'X-TC-Region': region,
				'Authorization': signObj.sign,
			}

			var options = {
				headers: headers,
				url: 'https://' + signObj.host,
				method: 'POST',
				json: true,
				body: req
			};

			request(options, (error, response, data) => {
				if (error)
					throw error
				res(data.Response);
			});
		});
	}

	getFunction(ns, funcName, showCode) {
		return new Promise((done) => {
			const req = new models.GetFunctionRequest();
			req.FunctionName = funcName;
			req.Namespace = ns;
			req.ShowCode = showCode ? 'TRUE' : 'FALSE';

			this.scfClient.GetFunction(req, function (err, response) {
				if (err) {
					if (err.code == 'ResourceNotFound.FunctionName' || err.code == 'ResourceNotFound.Function')
						return done(null);
					throw err;
				}
				done(response);
			});
		});
	}

	async updateConfiguration(ns, oldFunc, funcObject) {
		// console.log(oldFunc)
		// console.log(funcObject)
		const configArgs = {
			Region: funcObject.Properties.Region,
			FunctionName: funcObject.FuncName,
			Namespace: ns,
			Runtime: funcObject.Properties.Runtime,
			Role: funcObject.Properties.Role,
			MemorySize: funcObject.Properties.MemorySize,
			Timeout: funcObject.Properties.Timeout,
		};


		if (!_.isEmpty(funcObject.Properties.Environment)) {
			const env = funcObject.Properties.Environment;

			configArgs.Environment = {
				Variables: []
			};
			for (let key in env.Variables) {
				const item = {
					Key: key,
					Value: env.Variables[key]
				};
				configArgs.Environment.Variables.push(item);
			}
		}

		if (!_.isEmpty(funcObject.Properties.VpcConfig)) {
			const vpc = funcObject.Properties.VpcConfig;

			configArgs.VpcConfig = {
				VpcId: vpc.vpcId,
				SubnetId: vpc.subnetId
			};
		}

		if (!_.isEmpty(configArgs)) {
			configArgs.Region = this.options.region;
			configArgs.FunctionName = funcObject.FuncName;
			configArgs.Namespace = ns;
			if (funcObject.Properties.Timeout)
				configArgs.Timeout = funcObject.Properties.Timeout;
			if (funcObject.Properties.MemorySize)
				configArgs.MemorySize = funcObject.Properties.MemorySize;
			this.logger(`Updating function ${funcObject.FuncName} configure ${JSON.stringify(configArgs)}`);

			const result = await this.request(this.scfClient, 'UpdateFunctionConfiguration', configArgs);
			this.logger('Request id', result.RequestId);
		} else
			this.logger('configure not changed. function %s', funcObject.FuncName);

	}

	async uploadPackage2Cos(bucketName, key, filePath) {

		const region = this.options.region;
		const cosBucketNameFull = util.format('%s-%s', bucketName, this.appid);

		// get region all bucket list
		const buckets = await this.request(this.cosClient, 'getService', {Region: region});
		const findBucket = _.find(buckets.Buckets, (item) => {
			if (item.Name == cosBucketNameFull)
				return item;
		});

		let result;
		// create a new bucket
		if (_.isEmpty(findBucket)) {
			const putArgs = {
				Bucket: cosBucketNameFull,
				Region: region
			}
			await this.request(this.cosClient, 'putBucket', putArgs);
		}

		if (fs.statSync(filePath).size <= ScfUploadSliceLimit) {
			const objArgs = {
				Bucket: cosBucketNameFull,
				Region: region,
				Key: key,
				Body: fs.createReadStream(filePath),
				ContentLength: fs.statSync(filePath).size
			};
			result = await this.request(this.cosClient, 'putObject', objArgs);
		} else {
			const sliceArgs = {
				Bucket: cosBucketNameFull,
				Region: region,
				Key: key,
				FilePath: filePath,
				onTaskReady: function (taskId) {
				},
				onProgress: function (progressData) {
				}
			};

			result = await this.request(this.cosClient, 'sliceUploadFile', sliceArgs);
		}

		this.logger(`Uploaded file[${result.ETag}] success. assess url ${result.Location}`);

		return {
			CosBucketName: bucketName,
			CosObjectName: '/' + key
		};
	}

	async uploadService2Cos(bucketName, key, object) {
		let value;
		if (_.isObject(object))
			value = JSON.stringify(object);
		else
			value = object;

		const region = this.options.region;
		const cosBucketNameFull = util.format('%s-%s', bucketName, this.appid);

		const args = {
			Bucket: cosBucketNameFull,
			Region: region,
			Key: key,
			Body: value,
		};
		return await this.request(this.cosClient, 'putObject', args);
	}

	async createTags(ns, funcName, tags) {
		if (_.isEmpty(tags)) return;
		const func = await this.getFunction(ns, funcName);
		if (!func)
			throw new Error(`Function ${funcName} dont't exists`);

		const resource = util.format('qcs::scf:%s::lam/%s', this.options.region, func.FunctionId);
		const req = {
			Resource: resource,
			ReplaceTags: [],
			DeleteTags: []
		};

		const findRequest = {
			ResourceRegion: this.options.region,
			ResourceIds: [func.FunctionId],
			ResourcePrefix: 'lam',
			ServiceType: 'scf',
			Limit: 1000
		}
		const result = await this.request(this.tagClient, 'DescribeResourceTagsByResourceIds', findRequest);
		const len = _.size(result.Tags);
		for (let i = 0; i < len; i++) {
			const oldTag = result.Tags[i];
			const ret = _.find(tags, (value, key) => {
				if (oldTag.TagKey == key)
					return true;
			});
			if (!ret) {
				req.DeleteTags.push({
					TagKey: oldTag.TagKey
				});
			}
		}

		for (let key in tags) {
			req.ReplaceTags.push({
				TagKey: key,
				TagValue: tags[key]
			});
		}
		await this.request(this.tagClient, 'ModifyResourceTags', req);
	}

}

module.exports = DeployFunction;
