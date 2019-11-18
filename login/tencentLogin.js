'use strict';

const BbPromise = require('bluebird');
const util      = require('util');
const path      = require('path');
const request   = require('request');
const _         = require('lodash');
const os        = require('os');
const fs        = require('fs');
const ini       = require('ini');
const uuidv4    = require('uuid/v4');
const QRCode    = require('qrcode-terminal');
const querystring     = require('querystring');
const utils           = require('../shared/utils');
const tencentProvider = require('../provider/tencentProvider');
const HttpService     = require('../shared/httpService');

const cosBaseUrl = 'https://sls-token-1256141942.cos.ap-guangzhou.myqcloud.com'
const appId = '100005789219';
const redirectUrl = 'http://scfdev.tencentserverless.com/release/authserver/success';
const authorizeUrl = 'https://cloud.tencent.com/open/authorize?scope=login';
// const authUrl = util.format('https://cloud.tencent.com/open/authorize?scope=login&app_id=%s&redirect_url=%s', 
//                             appId, redirectUrl);

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

    async checkStatus(uuid) {
        return new Promise((done, reject)=> {
            const tokenUrl = util.format('%s/%s_%s', cosBaseUrl, os.type(), uuid);
            request(tokenUrl, (error, response, body) => {
                if (error) {
                    done(false);
                    return;
                }

                if (response.statusCode != 200) {
                    done(false);
                    return;
                }
                try {
                    done(JSON.parse(body))
                } catch (e) {
                    done(false);
                    return;
                }
            })
        })
    }

    async login() {
        try {
            let credentials = this.serverless.service.provider.credentials || "~/credentials";
            if (!_.isEmpty(this.options.credentials)) {
                this.serverless.cli.log('Login credentials already exists');
                process.exit(0);
            }
            const uuid = uuidv4();
            const callbackUrl = util.format('%s?uuid=%s&os=%s', redirectUrl, uuid, os.type());
            const authUrl = util.format('%s&app_id=%s&redirect_url=%s', authorizeUrl,
                            appId, querystring.escape(callbackUrl));
            console.log(authUrl);
            QRCode.generate(authUrl, {small: true});

            // QRCode.toString(authUrl, {type: 'terminal'}, function (err, url) {
            //     console.log(url)
            // })

            this.serverless.cli.log('Please scan qr code login from wechat');

            this.serverless.cli.log('Wait login...');
            // wait 3s start check login status
            await this.sleep(3000);

            let loginFlag = false;
            let timeout = 600;
            let loginData;
            while (timeout > 0) {
                loginData = await this.checkStatus(uuid);
                if (loginData != false) {
                    loginFlag = true;
                    break;
                }
                timeout--;
                await this.sleep(1000);
            }
            if (loginFlag == false && timeout == 0) {
                this.serverless.cli.log('Login timeout. please login again');
                process.exit(0);
            }
            const config = {
                'tencent_secret_id': loginData.secretId,
                'tencent_secret_key': loginData.secretKey,
                'tencent_token': loginData.token,
                'tencent_appid': loginData.appId,
            }

            if (credentials[0] == '~' && credentials[1] == '/') 
                credentials = path.join(os.homedir(), credentials.substr(2));

            const iniBody = ini.stringify(config, { section: 'default' });
            fs.writeFileSync(credentials, iniBody);
            this.serverless.cli.log('Login successful for TencentCloud');
            
            // setTimeout(async ()=>{
            //     await open(authUrl, {wait: true});
            //     quit = true;
            // }, 0);

            // const httpd = new HttpService(null, null);
            // const ret = httpd.addRoute('GET', '/authorization/token', TencentLogin.tokenHandler);
            // if (!ret) {
            //     this.serverless.cli.log('Add http route failed');
            //     process.exit(0);
            // }
            // httpd.run();

            // this.serverless.cli.log('Please login in the open browser');
            // let expire = 300; // 300s timeout
            // while (!quit && expire > 0) {
            //     expire--;
            //     await this.sleep(1000);
            // }
            // if (_.isEmpty(config) && expire == 0) {
            //     this.serverless.cli.log('Login timeout. please login again');
            //     process.exit(0);
            // }
            // if (_.isEmpty(config)) {
            //     this.serverless.cli.log('Login failed. please login again');
            //     process.exit(0);
            // }
            // this.serverless.cli.log('Login successful for TencentCloud');
            // console.log(ini.stringify(config, { section: 'default' }));

            // httpd.stop();
        } catch (e) {
            this.serverless.cli.log(e.message);
        }
        process.exit(0);
    }
}

module.exports = TencentLogin;
