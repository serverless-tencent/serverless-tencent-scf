'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;

class InfoFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async info(service, stage) {
        return new Promise((done) => {
            const req = new models.ListFunctionsRequest();
            let filters = {
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
            req.from_json_string(JSON.stringify(filters));
            this.scfClient.ListFunctions(req, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }
}

module.exports = InfoFunction;
