'use strict';
const tencentcloud = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;
const fs = require('fs');
const _ = require('lodash');
const util = require('util');

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
		const updateArgs = {
			Region: funcObject.Properties.Region,
			FunctionName: funcObject.FuncName,
			Handler: funcObject.Properties.Handler,
			Namespace: ns,
			CosBucketName: funcObject.Properties.CodeUri.Bucket,
			CosObjectName: funcObject.Properties.CodeUri.Key
		};
		const handler = util.promisify(this.scfClient.UpdateFunctionCode.bind(this.scfClient));
		try {
			return await handler(updateArgs)
		} catch (e) {
			throw e
		}
	}

	async createFunction(ns, funcObject, packagePath) {

		const createFuncRequest = {
			Region: funcObject.Properties.Region,
			FunctionName: funcObject.FuncName,
			Code: {
				CosBucketName: funcObject.Properties.CodeUri.Bucket,
				CosObjectName: funcObject.Properties.CodeUri.Key
			},
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

		const handler = util.promisify(this.scfClient.CreateFunction.bind(this.scfClient));
		try {
			return await handler(createFuncRequest)
		} catch (e) {
			throw e
		}
	}

	async getFunction(ns, funcName, showCode) {
		const req = new models.GetFunctionRequest();
		const body = {
			FunctionName: funcName,
			Namespace: ns,
			ShowCode: showCode ? 'TRUE' : 'FALSE'
		};
		req.from_json_string(JSON.stringify(body));
		const handler = util.promisify(this.scfClient.GetFunction.bind(this.scfClient));
		try {
			return await handler(req)
		} catch (e) {
			if (e.code == 'ResourceNotFound.FunctionName' || e.code == 'ResourceNotFound.Function') {
				return null
			} else {
				throw e
			}
		}
	}

	async updateConfiguration(ns, oldFunc, funcObject) {
		const configArgs = {
			Region: this.options.region,
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
			const handler = util.promisify(this.scfClient.UpdateFunctionConfiguration.bind(this.scfClient));
			try {
				await handler(configArgs)
			} catch (e) {
				throw e
			}
		}

	}

	async uploadPackage2Cos(bucketName, key, filePath) {

		const region = this.options.region;
		const cosBucketNameFull = util.format('%s-%s', bucketName, this.appid);

		// get region all bucket list
		let buckets;
		const handler = util.promisify(this.cosClient.getService.bind(this.cosClient));
		try {
			buckets = await handler({Region: region})
		} catch (e) {
			throw e
		}

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
			};
			const handler = util.promisify(this.cosClient.putBucket.bind(this.cosClient));
			try {
				await handler(putArgs)
			} catch (e) {
				throw e
			}
		}


		if (fs.statSync(filePath).size <= ScfUploadSliceLimit) {
			const objArgs = {
				Bucket: cosBucketNameFull,
				Region: region,
				Key: key,
				Body: fs.createReadStream(filePath),
				ContentLength: fs.statSync(filePath).size
			};
			const handler = util.promisify(this.cosClient.putObject.bind(this.cosClient));
			try {
				result = await handler(objArgs)
			} catch (e) {
				throw e
			}
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
			const handler = util.promisify(this.cosClient.sliceUploadFile.bind(this.cosClient));
			try {
				result = await handler(sliceArgs)
			} catch (e) {
				throw e
			}
		}
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
		const handler = util.promisify(this.cosClient.putObject.bind(this.cosClient));
		try {
			return await handler(args)
		} catch (e) {
			throw e
		}
	}

	async createTags(ns, funcName, tags) {
		let handler;
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
		};
		let result
		handler = util.promisify(this.tagClient.DescribeResourceTagsByResourceIds.bind(this.tagClient));
		try {
			result = await handler(findRequest)
		} catch (e) {
			throw e
		}
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
		handler = util.promisify(this.tagClient.ModifyResourceTags.bind(this.tagClient));
		try {
			await handler(req)
		} catch (e) {
			throw e
		}
	}

}

module.exports = DeployFunction;
