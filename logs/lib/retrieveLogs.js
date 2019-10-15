'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const models = tencentcloud.scf.v20180416.Models;

class LogsFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async logs(funcName, startTime, endTime, filter) {
        return new Promise((done) => {
            const req = new models.GetFunctionLogsRequest();
            req.FunctionName = funcName;
            req.Namespace = "default";
            req.StartTime = startTime;
            req.EndTime = endTime;
            req.Filter = filter;
            this.scfClient.GetFunctionLogs(req, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }
}

module.exports = LogsFunction;
