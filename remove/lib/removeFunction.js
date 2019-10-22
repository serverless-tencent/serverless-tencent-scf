'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;
const util = require('util');

class RemoveFunction extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	async remove(funcName) {
		const req = new models.DeleteFunctionRequest();
		const body = {
			FunctionName: funcName
		};
		req.from_json_string(JSON.stringify(body));
		const handler = util.promisify(this.scfClient.DeleteFunction.bind(this.scfClient));
		try {
			return await handler(req)
		} catch (e) {
			if (!(e.code == 'ResourceNotFound.FunctionName' || e.code == 'ResourceNotFound.Function'))
				throw err;
		}
	}
}

module.exports = RemoveFunction;
