'use strict';

const BbPromise = require('bluebird');
const validate = require('../shared/validate');
const utils = require('../shared/utils');
const util = require('util');
const _ = require('lodash');
const tencentProvider = require('../provider/tencentProvider');
const DeployFunction = require('./lib/deployFunction');
const DeployTrigger = require('./lib/deployTrigger');

class TencentDeploy {
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
			'before:deploy:deploy': () => BbPromise.bind(this)
				.then(this.validate)
				.then(this.setDefaults),

			'deploy:deploy': this.deploy.bind(this),
		};
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

		// upload file to cos
		let result;
		const cosBucket = this.provider.getDeployCosBucket(true);
		this.serverless.cli.log(`Uploading service package to cos[${cosBucket}]. ${services.ServiceZipName}`);
		await func.uploadPackage2Cos(cosBucket,
			services.ServiceZipName,
			this.serverless.service.package.artifact);
		this.serverless.cli.log(`Uploaded package successful ${this.serverless.service.package.artifact}`);
		await func.uploadService2Cos(cosBucket, services.ServiceFileName, services);

		for (const funcName in services.Resources.default) {
			if (funcName == 'Type')
				continue;
			const funcObject = _.cloneDeep(services.Resources.default[funcName]);
			funcObject.Name = funcName;
			funcObject.FuncName = this.provider.getFunctionName(funcName);


			this.serverless.cli.log(`Creating function ${funcObject.FuncName}`);
			const oldFunc = await func.deploy('default', funcObject, this.serverless.service.package.artifact,
				this.serverless.service.provider.cosBucket);
			this.serverless.cli.log(`Created function ${funcObject.FuncName}`);

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
}

module.exports = TencentDeploy;
