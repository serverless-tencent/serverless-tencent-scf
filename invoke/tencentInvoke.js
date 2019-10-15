'use strict';

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const tencentProvider = require('../provider/tencentProvider');
const Invoke = require('./lib/invokeFunction');

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
            'before:invoke:invoke': () => BbPromise.bind(this)
                .then(this.validate)
                .then(this.setDefaults),

            'invoke:invoke': this.invoke.bind(this)
        };
    }

    async invoke() {
        try {
            const options = {
                region: this.options.region
            };
            const invokeHandler = new Invoke(this.options.credentials.tencent_appid,
                this.options.credentials.tencent_secret_id,
                this.options.credentials.tencent_secret_key, options);
            const result = await invokeHandler.invoke('default', this.provider.getFunctionName(this.options.function), null);
            // this.serverless.cli.log(JSON.stringify(result.Result));
            let outputStr = "\n\n" + result.Result.RetMsg + "\n\n----------\nLog: \n" + result.Result.Log;
            this.serverless.cli.log(outputStr);
        } catch (e) {
            this.serverless.cli.log(e);
        }
    }
}

module.exports = TencentInvoke;
