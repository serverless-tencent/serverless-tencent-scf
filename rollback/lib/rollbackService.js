'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const tencentcloudcos = require('cos-nodejs-sdk-v5');
const AbstractHandler = require('../../shared/handler');
const scf_models = tencentcloud.scf.v20180416.Models;
const util = require('util');

class RollbackService extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	async historyList(fileKey, cosBucket) {
		const req = {
			Bucket: cosBucket,
			Region: this.options.region,
			Prefix: fileKey,
		};
		const handler = util.promisify(this.cosClient.getBucket.bind(this.cosClient));
		try {
			return await handler(req)
		} catch (e) {
			console.log(e)
			console.log("ErrorCode: " + e.code + " RequestId: " + e.requestId);
			throw e
		}
	}

	async getCosObject(fileKey, cosBucket) {
		const req = {
			Bucket: cosBucket,
			Region: this.options.region,
			Key: fileKey,
		};
		const handler = util.promisify(this.cosClient.getObject.bind(this.cosClient));
		try {
			return await handler(req)
		} catch (e) {
			console.log("ErrorCode: " + e.code + " RequestId: " + e.requestId);
			throw e
		}

	}

}

module.exports = RollbackService;
