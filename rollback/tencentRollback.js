'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');
const validate = require('../shared/validate');
const utils = require('../shared/utils');
const tencentProvider = require('../provider/tencentProvider');
const RollbackService = require('./lib/rollbackService');
const DeployFunction = require('../deploy/lib/deployFunction');
const DeployTrigger = require('../deploy/lib/deployTrigger');

class TencentRollback {
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
            'before:rollback:rollback': () => BbPromise.bind(this)
                .then(this.validate)
                .then(this.setDefaults),

            'rollback:rollback': this.rollback.bind(this),
        };
    }


    async rollback() {
        const region = this.options.region;
        const Handler = new RollbackService(this.options.credentials.tencent_appid,
            this.options.credentials.tencent_secret_id,
            this.options.credentials.tencent_secret_key, {region});
        const fileKeyPrefix = this.serverless.service.service + "-" + this.options.stage;
        const cosBucket = this.provider.getDeployCosBucket()
        const functionList = await Handler.historyList(fileKeyPrefix, cosBucket);
        if (this.options.verbose) {
            this.serverless.cli.log("Use a timestamp from the deploy list below to rollback to a specific version.\nRun `sls rollback -t YourTimeStampHere`");
            if (functionList.Contents) {
                this.serverless.cli.log("Listing deployments:");
                for (let functionIndex = functionList.Contents.length-1; functionIndex >=0; functionIndex--) {
                    /**
                     * Serverless: -------------
                     * Serverless: Timestamp: 1570942070508
                     * Serverless: Datetime: 2019-10-13T04:47:50.508Z
                     * Serverless: Files:
                     * Serverless: - compiled-cloudformation-template.json
                     * Serverless: - sls-aws.zip
                     */
                    try {
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
        for (let functionIndex = 0; functionIndex < functionList.Contents.length; functionIndex++) {
            try {
                let thisFileKey = functionList.Contents[functionIndex].Key;
                let thisFunctionJson = await Handler.getCosObject(thisFileKey, cosBucket);
                let services = JSON.parse(thisFunctionJson.Body.toString("utf-8"));
                if (this.options.timestamp.toString() == services.CreateTimestamp.toString()) {


                    const region = this.options.region;

                    const func = new DeployFunction(this.options.credentials.tencent_appid,
                        this.options.credentials.tencent_secret_id,
                        this.options.credentials.tencent_secret_key, {region});

                    const trigger = new DeployTrigger(this.options.credentials.tencent_appid,
                        this.options.credentials.tencent_secret_id,
                        this.options.credentials.tencent_secret_key, {region});

                    let result;

                    for (const funcName in services.Resources.default) {
                        if (funcName == 'Type')
                            continue;
                        const funcObject = _.cloneDeep(services.Resources.default[funcName]);
                        funcObject.Name = funcName;
                        funcObject.FuncName = this.provider.getFunctionName(funcName);

                        this.serverless.cli.log(`Rollback function ${funcObject.FuncName}`);
                        const oldFunc = await func.deploy('default', funcObject, this.serverless.service.package.artifact,
                            this.serverless.service.provider.cosBucket);
                        this.serverless.cli.log(`Rollback function ${funcObject.FuncName}`);

                        this.serverless.cli.log(`Rollback configure for function ${funcObject.FuncName}`);
                        await func.updateConfiguration('default', oldFunc, funcObject);

                        this.serverless.cli.log(`Setting tags for function ${funcObject.FuncName}`);
                        await func.createTags('default', funcObject.FuncName, funcObject.Properties.Tags);

                        this.serverless.cli.log(`Rollback trigger for function ${funcObject.FuncName}`);
                        result = await trigger.create('default', oldFunc ? oldFunc.Triggers : null, funcObject,
                            (response, trigger) => {
                                if (trigger.Type == 'apigw') {
                                    const resultDesc = JSON.parse(response.TriggerDesc);
                                    this.serverless.cli.log(`Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success. service id ${resultDesc.service.serviceId} url ${resultDesc.service.subDomain}`);
                                } else
                                    this.serverless.cli.log(`Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success.`);
                            },
                            (error, trigger) => {
                                this.serverless.cli.log(error)
                            }
                        );
                        this.serverless.cli.log(`Deployed function ${funcObject.FuncName} successful`);
                    }
                }
            } catch (e) {

            }
        }
    }

}

module.exports = TencentRollback;
