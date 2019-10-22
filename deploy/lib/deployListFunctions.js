'use strict';
const tencentcloud = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;
const util = require('util');

class InvokeFunction extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	functionsList(funcName) {
		const req = new models.ListVersionByFunctionRequest();
		req.FunctionName = funcName;
		req.Namespace = "default";
		const handler = util.promisify(this.scfClient.ListVersionByFunction.bind(this.scfClient));
		try {
			return handler(req)
		} catch (e) {
			throw e
		}
	}
}

module.exports = InvokeFunction;
