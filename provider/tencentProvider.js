'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ini = require('ini');
const _ = require('lodash');
const util = require('util')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const ClientProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/client_profile.js')
const HttpProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/http_profile.js')
const AbstractModel = require('tencentcloud-sdk-nodejs/tencentcloud/common/abstract_model')
const AbstractClient = require('tencentcloud-sdk-nodejs/tencentcloud/common/abstract_client')
const constants = {
	providerName: 'tencent',
};

class GetUserAppIdResponse extends AbstractModel {
	constructor() {
		super()

		this.RequestId = null
	}

	deserialize(params) {
		if (!params) {
			return
		}
		this.AppId = 'RequestId' in params ? params.AppId : null
		this.RequestId = 'RequestId' in params ? params.RequestId : null
	}
}

class AppidClient extends AbstractClient {
	constructor(credential, region, profile) {
		super('cam.tencentcloudapi.com', '2019-01-16', credential, region, profile)
	}

	GetUserAppId(req, cb) {
		const resp = new GetUserAppIdResponse()
		this.request('GetUserAppId', req, resp, cb)
	}
}

class TencentProvider {
	static getProviderName() {
		return constants.providerName;
	}

	getAppid(credentials) {
		const secret_id = credentials.SecretId
		const secret_key = credentials.SecretKey

		let cred; 
		if (credentials.Token)
			cred = new tencentcloud.common.Credential(secret_id, secret_key, credentials.Token)
		else
			cred = new tencentcloud.common.Credential(secret_id, secret_key)
		const httpProfile = new HttpProfile()
		httpProfile.reqTimeout = 30
		const clientProfile = new ClientProfile('HmacSHA256', httpProfile)
		const cam = new AppidClient(cred, 'ap-guangzhou', clientProfile)
		const req = new GetUserAppIdResponse()
		const body = {}
		req.from_json_string(JSON.stringify(body))
		const handler = util.promisify(cam.GetUserAppId.bind(cam))
		try {
			return handler(req)
		} catch (e) {
			throw 'Get Appid failed! '
		}
	}

	constructor(serverless, options) {
		this.options = options;
		this.serverless = serverless;
		if (serverless.pluginManager.cliCommands && 
			serverless.pluginManager.cliCommands.indexOf('login') == -1) 
			this.getCredentials(this.serverless, this.options);
		this.serverless.setProvider(constants.providerName, this);
		this.provider = this;
		// this.getServiceResource();
	}

	jsonObjectIsEmpty(jsonObject) {
		let isEmpty = true;
		for (let _ in jsonObject) {
			isEmpty = false;
			break;
		}
		return isEmpty;
	}

	getFunctionName(functionName) {
		return this.serverless.service.service + "-" + this.getStage() + "-" + functionName
	}

	randomString() {
		const len = 6;
		const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
		const maxPos = chars.length;
		let result = '';
		for (let i = 0; i < len; i++) {
			result += chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return result;
	}

	getStage() {
		return this.options.stage || this.serverless.service.provider.stage || 'dev'
	}

	getRegion() {
		const region = this.options.region || this.serverless.service.provider.region || "ap-guangzhou";
		return (region === 'ap-guangzhou-open') ? 'ap-guangzhou' : region
	}

	getFuntionBucketKey(functionName, keyTime, serviceStr) {
		// return this.serverless.service.service + "-" + this.getStage() + "-" + serviceStr + "-" + functionName + "-" + keyTime + ".zip";
		return this.serverless.service.service + "-" + this.getStage() + "-" + serviceStr + "-" + keyTime + ".zip";
	}

	getServiceFileName(timeData) {
		return this.serverless.service.service + "-" + this.getStage() + "-" + timeData;
	}

	getEnvironment(funcObject) {
		const providerInfo = this.serverless.service.provider.environment;
		const funcObjectInfo = funcObject.environment;
		const providerEenvironment = (providerInfo && providerInfo.variables) ? providerInfo.variables : {};
		const funcObjectEenvironment = (funcObjectInfo && funcObjectInfo.variables) ? funcObjectInfo.variables : {};
		for (let obj in funcObjectEenvironment) {
			providerEenvironment[obj] = funcObjectEenvironment[obj];
		}
		return this.jsonObjectIsEmpty(providerEenvironment) ? null : {"Variables": providerEenvironment}
	}

	getVPCConfig(funcObject) {
		const providerInfo = this.serverless.service.provider.vpcConfig;
		const funcObjectInfo = funcObject.vpcConfig;
		const providerVpcId = (providerInfo && providerInfo.vpcId) ? providerInfo.vpcId : null;
		const providerSubnetId = (providerInfo && providerInfo.subnetId) ? providerInfo.subnetId : null;
		const funcObjectVpcId = (funcObjectInfo && funcObjectInfo.vpcId) ? funcObjectInfo.vpcId : null;
		const funcObjectSubnetId = (funcObjectInfo && funcObjectInfo.subnetId) ? funcObjectInfo.subnetId : null;
		const vpcId = funcObjectVpcId ? funcObjectVpcId : providerVpcId;
		const subnetId = funcObjectSubnetId ? funcObjectSubnetId : providerSubnetId;
		return (vpcId && subnetId) ? {'VpcId': vpcId, 'SubnetId': subnetId} : null
	}

	async getCredentials() {

		if (this.options.credentials) {
			return
		} else {
			let credentials = this.serverless.service.provider.credentials || "~/credentials";
			const credParts = credentials.split(path.sep);
			if (credParts[0] === '~') {
				credParts[0] = os.homedir();
				credentials = credParts.reduce((memo, part) => path.join(memo, part), '');
			}
			const keyFileContent = fs.readFileSync(credentials, 'utf-8').toString();
			// TODO(dfounderliu) support profiles other than [default]
			this.options.credentials = ini.parse(keyFileContent).default;
			[
				'tencent_secret_id',
				'tencent_secret_key'
			].forEach((field) => {
				if (!this.options.credentials[field]) {
					throw new Error(`Credentials in ${credentials} does not contain ${field}`);
				}
			});

			// From cam to getting appid
			const appid = await this.getAppid({
				SecretId: this.options.credentials.tencent_secret_id,
				SecretKey: this.options.credentials.tencent_secret_key,
				Token: this.options.credentials.tencent_token || null,
			})
			this.options.credentials.tencent_appid = appid.AppId
			return
		}
	}

	getFunctionResource(funcObject, functionName, serviceStr, keyTime) {
		const service = this.serverless.service;
		const options = this.options;
		const provider = service.provider;
		const functionResource = {
			"Type": "TencentCloud::Serverless::Function",
			'Properties': {
				'CodeUri': {
					'Bucket': this.getDeployCosBucket(true),
					'Key': this.getFuntionBucketKey(functionName, keyTime, serviceStr)
				},
				"Type": "Event",
				'Description': funcObject.description || provider.description || "",
				'Role': funcObject.role || provider.role || "QCS_SCFExcuteRole",
				'Handler': funcObject.handler || "index.main_handler",
				'MemorySize': funcObject.memorySize || provider.memorySize || 128,
				'Timeout': funcObject.timeout || provider.timeout || 3,
				'Region': options.region || provider.region || "ap-guangzhou",
				'Runtime': funcObject.runtime || options.runtime || provider.runtime || 'nodejs8',
				'Tags': {
					"CLI": "Serverless",
					"Application": service.service,
					"Stage": this.getStage()
				}
			}
		};
		const vpcConfig = this.getVPCConfig(funcObject);
		if (vpcConfig) {
			functionResource['Properties']['VpcConfig'] = vpcConfig
		}
		const environment = this.getEnvironment(funcObject);
		if (environment) {
			functionResource['Properties']['Environment'] = environment
		}
		return functionResource
	}


	getTimerEvent(event, funcObject) {
		const trigger = {};
		if (!event.parameters.cronExpression) {
			throw new Error("Specify timer trigger cronexpression must be filled in.")
		}
		trigger[event.name] = {
			'Type': 'Timer',
			'Properties': {
				'CronExpression': event.parameters.cronExpression,
				'Enable': event.parameters.enable
			}
		};
		return trigger;
	}

	getCOSEvent(event, funcObject) {
		const trigger = {};
		const filter = {
			'Prefix': event.parameters.filter && event.parameters.filter.prefix ? event.parameters.filter.prefix : "",
			'Suffix': event.parameters.filter && event.parameters.filter.suffix ? event.parameters.filter.suffix : ""
		};

		trigger[event.name] = {
			'Type': 'COS',
			'Properties': {
				'Bucket': event.parameters.bucket,
				'Events': event.parameters.events,
				'Enable': event.parameters.enable,
				'Filter': filter
			}
		};
		return trigger;
	}

	getAPIGWEvent(event, funcObject, apigwTimes) {
		const trigger = {};
		const apiGateway = this.serverless.service.provider.apiGateway;
		const serviceId = apigwTimes == 0 ?
			event.parameters.serviceId || (apiGateway && apiGateway.serviceId ? apiGateway.serviceId : "") :
			event.parameters.serviceId || ""
		trigger[event.name] = {
			'Type': 'APIGW',
			'Properties': {
				'StageName': event.parameters.stageName,
				'HttpMethod': event.parameters.httpMethod,
				'ServiceId': serviceId,
				'IntegratedResponse': event.parameters.integratedResponse,
				'Enable': event.parameters.enable
			}
		};
		return trigger;
	}

	getCMQEvent(event, funcObject) {
		const trigger = {};
		trigger[event.name] = {
			'Type': 'CMQ',
			'Properties': {
				'Name': event.parameters.name,
				'Enable': event.parameters.enable
			}
		};
		return trigger;
	}

	getCkafkaEvent(event, funcObject) {
		const trigger = {};
		trigger[event.name] = {
			'Type': 'Ckafka',
			'Properties': {
				'Name': event.parameters.name,
				'Topic': event.parameters.topic,
				'MaxMsgNum': event.parameters.maxMsgNum,
				'Offset': event.parameters.offset,
				'Enable': event.parameters.enable
			}
		};
		return trigger;
	}

	getDeployCosBucket(short) {
		if (short) {
			const cousBucket = this.serverless.service.provider.cosBucket || "DEFAULT";
			return cousBucket != "DEFAULT" ? cousBucket : 'sls-cloudfunction-' + this.getRegion();
		} else {
			const cousBucket = this.serverless.service.provider.cosBucket || "DEFAULT";
			return cousBucket != "DEFAULT" ? cousBucket : 'sls-cloudfunction-' + this.getRegion() + "-" + this.options.credentials.tencent_appid;
		}
	}

	getServiceResource() {
		var functionList = {
			"Type": "TencentCloud::Serverless::Namespace",
		};
		const serviceStr = this.randomString();
		const date = new Date();
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // toJSON 的时区补偿
		const keyTime = date.toJSON().substr(0, 19).replace(/[:T]/g, '-');
		this.serverless.service.getAllFunctions().forEach((functionName) => {
			const funcObject = this.serverless.service.getFunction(functionName);
			const funtionResource = this.getFunctionResource(funcObject, functionName, serviceStr, keyTime);
			const eventList = new Array();
			if (funcObject.events) {
				let apigwTimes = 0
				for (var eventIndex = 0; eventIndex < funcObject.events.length; eventIndex++) {
					const event = funcObject.events[eventIndex];
					const eventType = Object.keys(event)[0];
					if (eventType === 'timer') {
						const triggerResource = this.provider.getTimerEvent(event.timer, funcObject);
						const triggerName = triggerResource.TriggerName;
						eventList.push(triggerResource);
					} else if (eventType === 'cos') {
						const triggerResource = this.provider.getCOSEvent(event.cos, funcObject);
						const triggerName = triggerResource.TriggerName;
						eventList.push(triggerResource);
					} else if (eventType === 'apigw') {
						const triggerResource = this.provider.getAPIGWEvent(event.apigw, funcObject, apigwTimes);
						const triggerName = triggerResource.TriggerName;
						eventList.push(triggerResource);
						apigwTimes = apigwTimes + 1
					} else if (eventType === 'ckafka') {
						const triggerResource = this.provider.getCkafkaEvent(event.ckafka, funcObject);
						const triggerName = triggerResource.TriggerName;
						eventList.push(triggerResource);
					} else if (eventType === 'cmq') {
						const triggerResource = this.provider.getCMQEvent(event.cmq, funcObject);
						const triggerName = triggerResource.TriggerName;
						eventList.push(triggerResource);
					}
				}
				funtionResource["Properties"]["Events"] = eventList;
			}
			functionList[functionName] = funtionResource
		});
		const resource = {
			"Service": this.serverless.service.service,
			"Stage": this.getStage(),
			"ServiceFileName": this.getServiceFileName(Date.parse(date) / 1000) + ".json",
			"ServiceZipName": this.getFuntionBucketKey("default", keyTime, serviceStr),
			"CreateTime": date,
			"CreateTimestamp": Date.parse(date) / 1000,
			"Resources": {}
		};

		resource["Resources"]["default"] = functionList;
		// this.serverless.cli.log(JSON.stringify(resource));
		return resource
	}

}

module.exports = TencentProvider;
