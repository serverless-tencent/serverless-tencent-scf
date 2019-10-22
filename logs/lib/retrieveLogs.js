'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;
const util = require('util');

class LogsFunction extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	async logs(funcName, startTime, endTime, filter) {
		const req = new models.GetFunctionLogsRequest();
		const body = {
			FunctionName: funcName,
			StartTime: startTime,
			EndTime: endTime,
			Namespace: "default",
			Filter: filter
		};
		req.from_json_string(JSON.stringify(body));
		const handler = util.promisify(this.scfClient.GetFunctionLogs.bind(this.scfClient));
		try {
			return await handler(req)
		} catch (e) {
			throw e
		}

	}
}

module.exports = LogsFunction;
