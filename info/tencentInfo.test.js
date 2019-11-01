'use strict';

const sinon           = require('sinon');
const TencentProvider = require('../provider/tencentProvider');
const Serverless      = require('../test/serverless');
const TencentInfo     = require('./tencentInfo');

describe('TencentInfo', () => {
    let serverless;
    let options;
    let tencentInfo;

    beforeEach(() => {
        serverless = new Serverless();
        options = {
            stage: 'dev',
            region: 'ap-guangzhou',
            function: 'test'
        };
        serverless.setProvider('tencent', new TencentProvider(serverless, options));
        tencentInfo = new TencentInfo(serverless, options);
    });

    describe('#constructor()', () => {
        it('should set the serverless instance', () => {
            tencentInfo.serverless.should.equal(serverless);
        });

        it('should set options if provided', () => {
            tencentInfo.options.should.equal(options);
        });

        it('should make the provider accessible', () => {
            tencentInfo.provider.should.to.be.an.instanceof(TencentProvider);
        });

        describe('hooks', () => {
            let validateStub;
            let setDefaultsStub;
            let tencentInfoStub;

            beforeEach(() => {
                validateStub = sinon.stub(tencentInfo, 'validate')
                    .returns(Promise.resolve());
                setDefaultsStub = sinon.stub(tencentInfo, 'setDefaults')
                    .returns(Promise.resolve());
                tencentInfoStub = sinon.stub(tencentInfo, 'info')
                    .returns(Promise.resolve());
            });

            afterEach(() => {
                tencentInfo.validate.restore();
                tencentInfo.setDefaults.restore();
                tencentInfo.info.restore();
            });

            it('should run "before:info:info" promise chain', () => tencentInfo
                .hooks['before:info:info']().then(() => {
                    validateStub.calledOnce.should.equal(true);
                    setDefaultsStub.calledAfter(validateStub).should.equal(true);
                }));

            it('should run "info:info" promise chain', () => tencentInfo
                .hooks['info:info']().then(() => {
                    tencentInfoStub.calledOnce.should.equal(true);
                }));
        });
    });
});