'use strict';
const tencentcloud    = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const models          = tencentcloud.scf.v20180416.Models;

class InvokeFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    invoke(ns, funcName, context) {
        return new Promise((done) => {
            const req = new models.InvokeRequest();
            req.FunctionName  = funcName;
            req.LogType       = 'Tail';
            req.ClientContext = context;
            req.Namespace     = ns;
            this.scfClient.Invoke(req, function(err, response) {
                if (err)
                    throw err;
                if (!response.Result.InvokeResult)
                    done(response);
                else
                    done(response);
            });
        });
    }

}

module.exports = InvokeFunction;
