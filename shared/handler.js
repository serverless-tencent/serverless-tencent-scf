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

		this.output = console.log;

		assert(options, 'options should not is empty');
		this._scfClient = AbstractHandler.createScfClient(secret_id, secret_key, options);
		this._cosClient = AbstractHandler.createCosClient(secret_id, secret_key, options);
		this._tagClient = AbstractHandler.createTagClient(secret_id, secret_key, options);
	}

	logger() {
		if (process.env['SLS_SCF_DEBUG'])
			this.output(...arguments);
	}

	setOutput(output) {
		this.output = output;
	}

	static createTagClient(secret_id, secret_key, options) {
		const conf = this.tencentCloudBaseConf();
		assert(options.region, 'region should not is empty');
		return new TagClient(conf.cred, options.region, conf.clientProfile);
	}

	get tagClient() {
		return this._tagClient;
	}

	static createScfClient(secret_id, secret_key, options) {
		const conf = this.tencentCloudBaseConf();
		assert(options.region, 'region should not is empty');
		const scfCli = new ScfClient(conf.cred, options.region, conf.clientProfile)
		scfCli._sdkVersion = "Serverless Framework"
		return scfCli;
	}

	tencentCloudBaseConf() {
		const cred = new Credential(this.secret_id, this.secret_key);
		const httpProfile = new HttpProfile();
		httpProfile.reqTimeout = 30;
		const clientProfile = new ClientProfile('HmacSHA256', httpProfile);
		assert(this.options.region, 'Region could not be empty');
		return {
			"cred": cred,
			"region": this.options.region,
			"clientProfile": clientProfile
		}
	}


	get monitorClient() {
		const conf = this.tencentCloudBaseConf();
		return new MonitorClinet(conf.cred, conf.region, conf.clientProfile);
	}

	get scfClient() {
		return this._scfClient;
	}

	static createCosClient(secret_id, secret_key, options) {
		const fileParallelLimit = options.fileParallelLimit || 5;
		const chunkParallelLimit = options.chunkParallelLimit || 8;
		const chunkSize = options.chunkSize || 1024 * 1024 * 8;
		const timeout = options.timeout || 60;

		return new COS({
			SecretId: secret_id,
			SecretKey: secret_key,
			FileParallelLimit: fileParallelLimit,
			ChunkParallelLimit: chunkParallelLimit,
			ChunkSize: chunkSize,
			Timeout: timeout * 1000
		});
	}

	get cosClient() {
		return this._cosClient;
	}

	request(client, func, args) {
		return new Promise(async done => {
			client[func](args, (err, data) => {
				if (err) {
					throw err
				}
				done(data);
			});
		});
	}

	requestTrigger(client, func, args) {
		return new Promise(async done => {
			client[func](args, (err, data) => {
				if (err) {
					console.log(err)
					done(false)
				}
				done(data);
			});
		});
	}
}

module.exports = AbstractHandler;
