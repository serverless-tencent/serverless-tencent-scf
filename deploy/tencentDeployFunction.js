'use strict';

const BbPromise = require('bluebird');
const validate = require('../shared/validate');
const utils = require('../shared/utils');
const util = require('util');
const _ = require('lodash');
const tencentProvider = require('../provider/tencentProvider');
const DeployFunction = require('./lib/deployFunction');
const DeployTrigger = require('./lib/deployTrigger');

class TencentDeployFunction {
	constructor(serverless, options) {
		this.serverless = serverless;
		this.options = options;
		this.provider = this.serverless.getProvider('tencent');

		Object.assign(
			this,
			validate,
			utils,
			tencentProvider);

		this.hooks = {
			'deploy:function:initialize': () => BbPromise.bind(this)
				.then(this.validate)
				.then(this.setDefaults),
			'deploy:function:packageFunction': this.packageFunction.bind(this),
			'deploy:function:deploy': this.deploy.bind(this),
		};
	}

	packageFunction() {
		return this.serverless.pluginManager.spawn('package:function');
	}

	async deploy() {
		const services = this.provider.getServiceResource();
		const region = this.options.region;

		const func = new DeployFunction(this.options.credentials.tencent_appid,
			this.options.credentials.tencent_secret_id,
			this.options.credentials.tencent_secret_key, {region});

		const trigger = new DeployTrigger(this.options.credentials.tencent_appid,
			this.options.credentials.tencent_secret_id,
			this.options.credentials.tencent_secret_key, {region});

		let result;
		if (_.isEmpty(services.Resources.default[this.options.function]))
			throw new Error(`Function ${this.options.function} doesn't exists`);

		const funcObject = _.cloneDeep(services.Resources.default[this.options.function]);
		funcObject.Name = this.options.function;
		funcObject.FuncName = this.provider.getFunctionName(this.options.function);

		const artifactPath = util.format('%s/.serverless/%s.zip', this.serverless.service.serverless.config.servicePath, this.options.function);

		// upload file to cos
		this.serverless.cli.log(`Uploading function ${funcObject.FuncName} package to cos[${funcObject.Properties.CodeUri.Bucket}]. ${artifactPath}`);
		await func.uploadPackage2Cos(funcObject.Properties.CodeUri.Bucket,
			funcObject.Properties.CodeUri.Key, artifactPath);
		this.serverless.cli.log(`Uploaded package successful`);


		this.serverless.cli.log(`Uploading service to cos[${funcObject.Properties.CodeUri.Bucket}].`);
		result = await func.uploadService2Cos(funcObject.Properties.CodeUri.Bucket,
			services.ServiceFileName, services);
		this.serverless.cli.log(`Uploaded service successful ${result.Location}`);


		this.serverless.cli.log(`Creating function ${funcObject.FuncName}`);
		const oldFunc = await func.deploy('default', funcObject, artifactPath,
			this.serverless.service.provider.cosBucket);
		this.serverless.cli.log(`Created function ${funcObject.FuncName}`);

		this.serverless.cli.log(`Updating configure for function ${funcObject.FuncName}`);
		await func.updateConfiguration('default', oldFunc, funcObject);

		this.serverless.cli.log(`Setting tags for function ${funcObject.FuncName}`);
		await func.createTags('default', funcObject.FuncName, funcObject.Properties.Tags);

		this.serverless.cli.log(`Creating trigger for function ${funcObject.FuncName}`);
		result = await trigger.create('default', oldFunc ? oldFunc.Triggers : null, funcObject,
			(response, trigger) => {
				if (trigger.Type == 'apigw') {
					const resultDesc = JSON.parse(response.TriggerDesc);
					this.serverless.cli.log(`Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success. service id ${resultDesc.service.serviceId} url ${resultDesc.service.subDomain}`);
				} else
					this.serverless.cli.log(`Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success.`);
			},
			(error, trigger) => {
				this.serverless.cli.log(error)
			}
		);
		this.serverless.cli.log(`Deployed function ${funcObject.FuncName} successful`);
	}
}

module.exports = TencentDeployFunction;
