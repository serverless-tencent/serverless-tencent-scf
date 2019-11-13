'use strict';

const BbPromise = require('bluebird');
const util      = require("util");
const _         = require('lodash');
const ini       = require('ini');
const open      = require('open');
const utils           = require('../shared/utils');
const tencentProvider = require('../provider/tencentProvider');
const HttpService     = require('../shared/httpService');

const appId = '100005789219';
const redirectUrl = 'http://scfdev.tencentserverless.com/release/authserver/success';
const authUrl = util.format('https://cloud.tencent.com/open/authorize?scope=login&app_id=%s&redirect_url=%s', 
                            appId, redirectUrl);

const config = {};
let quit = false;
class TencentLogin {

    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = this.serverless.getProvider('tencent');

        Object.assign(
            this,
            utils,
            tencentProvider);
        this.hooks = {
            'login:login': () => BbPromise.bind(this)
                .then(this.login),
            'logout:logout': () => BbPromise.bind(this)
                .then(this.logout)
        };
    }
    async logout() {
        console.log('logout')
    }

    static tokenHandler(request, response, httpd) {

        if (!request.query)
            return { body: 'invalid param', code: 412 };

        if (!request.query.token)
            return { body: 'token invalid param', code: 412 };

        if (!request.query.secretId)
            return { body: 'secretId invalid param', code: 412 };

        if (!request.query.appId)
            return { body: 'appId invalid param', code: 412 };

        if (!request.query.secretKey)
            return { body: 'secretKey invalid param', code: 412 };

        config['tencent_secret_id']  = request.query.secretId;
        config['tencent_secret_key'] = request.query.secretKey;
        config['tencent_token']      = request.query.token;
        config['tencent_appid']      = request.query.appId;

        // quit login cmd
        quit = true;
        return { body: 'success', code: 200 };
    }

    async login() {
        try {
            let credentials = this.serverless.service.provider.credentials || "~/credentials";
            if (!_.isEmpty(this.options.credentials)) 
                this.serverless.cli.log('Login credentials already exists');

            setTimeout(async ()=>{
                await open(authUrl, {wait: true});
                quit = true;
            }, 0);

            const httpd = new HttpService(null, null);
            const ret = httpd.addRoute('GET', '/authorization/token', TencentLogin.tokenHandler);
            if (!ret) {
                this.serverless.cli.log('Add http route failed');
                process.exit(0);
            }
            httpd.run();

            this.serverless.cli.log('Please login in the open browser');
            let expire = 300; // 300s timeout
            while (!quit && expire > 0) {
                expire--;
                await this.sleep(1000);
            }
            if (_.isEmpty(config) && expire == 0) {
                this.serverless.cli.log('Login timeout. please login again');
                process.exit(0);
            }
            if (_.isEmpty(config)) {
                this.serverless.cli.log('Login failed. please login again');
                process.exit(0);
            }
            this.serverless.cli.log('Login successful for TencentCloud');
            console.log(ini.stringify(config, { section: 'default' }));

            httpd.stop();
        } catch (e) {
            this.serverless.cli.log(e.message);
        }
        process.exit(0);
    }
}

module.exports = TencentLogin;
