'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const tencentcloudcos = require('cos-nodejs-sdk-v5');
const AbstractHandler = require('../../shared/handler');
const scf_models = tencentcloud.scf.v20180416.Models;

class RollbackService extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async historyList(fileKey, cosBucket) {
        return new Promise((done) => {
            this.cosClient.getBucket({
                Bucket: cosBucket,
                Region: this.options.region,
                Prefix: fileKey,
            }, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }

    async getCosObject(fileKey, cosBucket) {
        return new Promise((done) => {
            this.cosClient.getObject({
                Bucket: cosBucket,
                Region: this.options.region,
                Key: fileKey,
            }, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }

}

module.exports = RollbackService;
