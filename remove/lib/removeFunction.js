'use strict';
const tencentcloud    = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models          = tencentcloud.scf.v20180416.Models;

class RemoveFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async remove(funcName) {
        return new Promise((done) => {
            const req = new models.DeleteFunctionRequest();
            req.FunctionName  = funcName;
            this.scfClient.DeleteFunction(req, (err, response) => {
                if (err) {
                    if (!(err.code == 'ResourceNotFound.FunctionName' || err.code == 'ResourceNotFound.Function'))
                        throw err;
                }

                done(response);
            });
        });
    }
}

module.exports = RemoveFunction;
