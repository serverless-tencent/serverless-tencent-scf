'use strict';

const sinon             = require('sinon');
const TencentProvider   = require('../provider/tencentProvider');
const Serverless        = require('../test/serverless');
const TencentDeployList = require('./tencentDeployList');

describe('TencentDeployList', () => {
    let serverless;
    let options;
    let tencentDeployList;

    beforeEach(() => {
        serverless = new Serverless();
        options = {
            stage: 'dev',
            region: 'ap-guangzhou',
            function: 'test'
        };
        serverless.setProvider('tencent', new TencentProvider(serverless, options));
        tencentDeployList = new TencentDeployList(serverless, options);
    });

    describe('#constructor()', () => {
        it('should set the serverless instance', () => {
            tencentDeployList.serverless.should.equal(serverless);
        });

        it('should set options if provided', () => {
            tencentDeployList.options.should.equal(options);
        });

        it('should make the provider accessible', () => {
            tencentDeployList.provider.should.to.be.an.instanceof(TencentProvider);
        });

        describe('hooks', () => {
            let validateStub;
            let setDefaultsStub;
            let tencentDeployListStub;

            beforeEach(() => {
                validateStub = sinon.stub(tencentDeployList, 'validate')
                    .returns(Promise.resolve());
                setDefaultsStub = sinon.stub(tencentDeployList, 'setDefaults')
                    .returns(Promise.resolve());
                tencentDeployListStub = sinon.stub(tencentDeployList, 'serviceList')
                    .returns(Promise.resolve());
            });

            afterEach(() => {
                tencentDeployList.validate.restore();
                tencentDeployList.setDefaults.restore();
                tencentDeployList.serviceList.restore();
            });

            it('should run "before:deploy:list:log" promise chain', () => tencentDeployList
                .hooks['before:deploy:list:log']().then(() => {
                    validateStub.calledOnce.should.equal(true);
                    setDefaultsStub.calledAfter(validateStub).should.equal(true);
                }));

            it('should run "deploy:list:log" promise chain', () => tencentDeployList
                .hooks['deploy:list:log']().then(() => {
                    tencentDeployListStub.calledOnce.should.equal(true);
                }));
        });
    });
});