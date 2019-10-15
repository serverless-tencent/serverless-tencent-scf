'use strict';
const tencentcloud = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;

class InvokeFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    functionsList(funcName) {
        return new Promise((done) => {
            const req = new models.ListVersionByFunctionRequest();
            req.FunctionName = funcName;
            req.Namespace = "default";

            this.scfClient.ListVersionByFunction(req, function (err, response) {
                if (err)
                    throw err;
                done(response);
            });
        });
    }

}

module.exports = InvokeFunction;
