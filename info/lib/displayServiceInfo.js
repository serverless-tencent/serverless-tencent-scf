'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;
const util = require('util');

class InfoFunction extends AbstractHandler {
	constructor(appid, secret_id, secret_key, options) {
		super(appid, secret_id, secret_key, options);
	}

	async info(service, stage) {
		const req = new models.ListFunctionsRequest();
		const body = {
			Namespace: "default",
			Filters: [
				{
					Name: "tag-Application",
					Values: [service,]
				},
				{
					Name: "tag-Stage",
					Values: [stage,]
				}
			]
		};

		req.from_json_string(JSON.stringify(body));
		const handler = util.promisify(this.scfClient.ListFunctions.bind(this.scfClient));
		try {
			return await handler(req)
		} catch (e) {
			throw e
		}
	}
}

module.exports = InfoFunction;
