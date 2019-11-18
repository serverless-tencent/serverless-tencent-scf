const tencentcloudcos = require('cos-nodejs-sdk-v5');
const tencentcloud = require('tencentcloud-sdk-nodejs');
const ClientProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/client_profile.js');
const HttpProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/http_profile.js');
const assert = require('assert');
const COS = require('cos-nodejs-sdk-v5');

const Credential = tencentcloud.common.Credential;
const ScfClient = tencentcloud.scf.v20180416.Client;
const TagClient = tencentcloud.tag.v20180813.Client;
const MonitorClinet = tencentcloud.monitor.v20180724.Client;

class AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		this.appid = appid;
		this.secret_id = secret_id;
		this.secret_key = secret_key;
		this.options = options;

		assert(options, 'options should not is empty');
		this._scfClient = AbstractHandler.createScfClient(secret_id, secret_key, options);
		this._cosClient = AbstractHandler.createCosClient(secret_id, secret_key, options);
		this._tagClient = AbstractHandler.createTagClient(secret_id, secret_key, options);
		this._monitorClient = AbstractHandler.createMonitorClient(secret_id, secret_key, options);
	}

	logger() {
		if (process.env['SLS_SCF_DEBUG'])
			this.output(...arguments);
	}

	setOutput(output) {
		this.output = output;
	}

	static getClientInfo(secret_id, secret_key, options) {
		let cred;
		if (options.token)
			cred = new Credential(secret_id, secret_key, options.token);
		else
			cred = new Credential(secret_id, secret_key);
		const httpProfile = new HttpProfile();
		httpProfile.reqTimeout = 30;
		const clientProfile = new ClientProfile('HmacSHA256', httpProfile);
		assert(options.region, 'region should not is empty');
		return {
			"cred": cred,
			"region": options.region,
			"clientProfile": clientProfile
		}
	}

	static createTagClient(secret_id, secret_key, options) {
		const info = this.getClientInfo(secret_id, secret_key, options);
		return new TagClient(info.cred, info.region, info.clientProfile);
	}

	static createScfClient(secret_id, secret_key, options) {
		const info = this.getClientInfo(secret_id, secret_key, options);
		const scfCli = new ScfClient(info.cred, info.region, info.clientProfile);
		scfCli.sdkVersion = "ServerlessFramework";
		return scfCli;
	}

	static createMonitorClient(secret_id, secret_key, options) {
		const info = this.getClientInfo(secret_id, secret_key, options);
		return new MonitorClinet(info.cred, info.region, info.clientProfile);
	}


	static createCosClient(secret_id, secret_key, options) {
		const fileParallelLimit = options.fileParallelLimit || 5;
		const chunkParallelLimit = options.chunkParallelLimit || 8;
		const chunkSize = options.chunkSize || 1024 * 1024 * 8;
		const timeout = options.timeout || 60;

		if (!options.token) {
			return new COS({
				SecretId: secret_id,
				SecretKey: secret_key,
				FileParallelLimit: fileParallelLimit,
				ChunkParallelLimit: chunkParallelLimit,
				ChunkSize: chunkSize,
				Timeout: timeout * 1000
			});
		}
		return new COS({
			getAuthorization: function (option, callback) {
				callback({
                    TmpSecretId: secret_id,
                    TmpSecretKey: secret_key,
                    XCosSecurityToken: options.token,
                    ExpiredTime: 1574054865,
                });
			}
		});
	}

	get monitorClient() {
		return this._monitorClient;
	}

	get cosClient() {
		return this._cosClient;
	}

	get tagClient() {
		return this._tagClient;
	}

	get scfClient() {
		return this._scfClient;
	}


}

module.exports = AbstractHandler;
