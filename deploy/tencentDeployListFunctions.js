'use strict';

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const tencentProvider = require('../provider/tencentProvider');
const ListFunctions = require('./lib/deployListFunctions');
const InfoFunction = require('../info/lib/displayServiceInfo');

class TencentInvoke {

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
            'before:deploy:list:functions:log': () => BbPromise.bind(this)
                .then(this.validate)
                .then(this.setDefaults),

            'deploy:list:functions:log': this.functionList.bind(this)
        };
    }

    async functionList() {
        try {
            const region = this.options.region;
            const infoHandler = new InfoFunction(this.options.credentials.tencent_appid,
                this.options.credentials.tencent_secret_id,
                this.options.credentials.tencent_secret_key, {region});
            const deployHandler = new ListFunctions(this.options.credentials.tencent_appid,
                this.options.credentials.tencent_secret_id,
                this.options.credentials.tencent_secret_key, {region});
            const functionList = await infoHandler.info(this.serverless.service.service, this.options.stage);
            const totalData = functionList.Functions || [];
            if (totalData.length > 0) {
                this.serverless.cli.log("Listing functions:");
                this.serverless.cli.log("-------------");
                let eveFunctionVersion;
                for (let eveFunctionIndex = 0; eveFunctionIndex < totalData.length; eveFunctionIndex++) {
                    eveFunctionVersion = await deployHandler.functionsList(totalData[eveFunctionIndex].FunctionName);
                    let thisVersionString = totalData[eveFunctionIndex].FunctionName + ": ";
                    if (eveFunctionVersion.Versions) {
                        for (let eveVersion = 0; eveVersion < eveFunctionVersion.Versions.length; eveVersion++) {
                            thisVersionString = thisVersionString + eveFunctionVersion.Versions[eveVersion].Version;
                            if (eveVersion < eveFunctionVersion.Versions.length - 1) {
                                thisVersionString = thisVersionString + ", "
                            }
                        }
                        this.serverless.cli.log(thisVersionString);
                    }
                }
            }

        } catch (e) {
            this.serverless.cli.log(e);
        }
    }
}

module.exports = TencentInvoke;
