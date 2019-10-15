'use strict';

const BbPromise = require('bluebird');
const validate = require('../shared/validate');
const utils = require('../shared/utils');
const _ = require('lodash');
const tencentProvider = require('../provider/tencentProvider');
const RollbackService = require('../rollback/lib/rollbackService');

class TencentDeployList {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = this.serverless.getProvider('tencent');

        Object.assign(
            this,
            validate,
            utils,
            tencentProvider);

        this.hooks = {
            'before:deploy:list:log': () => BbPromise.bind(this)
                .then(this.validate)
                .then(this.setDefaults),
            'deploy:list:log': this.serviceList.bind(this),
        };
    }

    async serviceList() {
        const region = this.options.region;
        const Handler = new RollbackService(this.options.credentials.tencent_appid,
            this.options.credentials.tencent_secret_id,
            this.options.credentials.tencent_secret_key, {region});
        const fileKeyPrefix = this.serverless.service.service + "-" + this.options.stage;
        const cosBucket = this.provider.getDeployCosBucket();
        const functionList = await Handler.historyList(fileKeyPrefix, cosBucket);
        if (functionList.Contents) {
            this.serverless.cli.log("Listing deployments:");
            for (let functionIndex = functionList.Contents.length-1; functionIndex >=0; functionIndex--) {
                try {
                    /**
                     * Serverless: -------------
                     * Serverless: Timestamp: 1570942070508
                     * Serverless: Datetime: 2019-10-13T04:47:50.508Z
                     * Serverless: Files:
                     * Serverless: - compiled-cloudformation-template.json
                     * Serverless: - sls-aws.zip
                     */
                    let thisFileKey = functionList.Contents[functionIndex].Key;
                    let thisFunctionJson = await Handler.getCosObject(thisFileKey, cosBucket);
                    let thisFileJson = JSON.parse(thisFunctionJson.Body.toString("utf-8"));
                    this.serverless.cli.log('-------------');
                    this.serverless.cli.log('Timestamp: ' + thisFileJson.CreateTimestamp);
                    this.serverless.cli.log('Datetime: ' + thisFileJson.CreateTime);
                    this.serverless.cli.log('Files:');
                    this.serverless.cli.log('- ' + thisFileJson.ServiceFileName);
                    this.serverless.cli.log('- ' + thisFileJson.ServiceZipName);
                } catch (e) {

                }
            }
        }

    }
}

module.exports = TencentDeployList;
