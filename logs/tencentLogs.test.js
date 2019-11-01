'use strict';

const sinon           = require('sinon');
const TencentProvider = require('../provider/tencentProvider');
const TencentLogs     = require('./tencentLogs');
const Serverless      = require('../test/serverless');

describe('TencentLogs', () => {
    let serverless;
    let options;
    let tencentLogs;

    beforeEach(() => {
        serverless = new Serverless();
        options = {
            stage: 'dev',
            region: 'ap-guangzhou',
            function: 'test'
        };
        serverless.setProvider('tencent', new TencentProvider(serverless, options));
        tencentLogs = new TencentLogs(serverless, options);
    });

    describe('#constructor()', () => {
        it('should set the serverless instance', () => {
            tencentLogs.serverless.should.equal(serverless);
        });

        it('should set options if provided', () => {
            tencentLogs.options.should.equal(options);
        });

        it('should make the provider accessible', () => {
            tencentLogs.provider.should.to.be.an.instanceof(TencentProvider);
        });

        describe('hooks', () => {
            let validateStub;
            let setDefaultsStub;
            let logsStub;

            beforeEach(() => {
                validateStub = sinon.stub(tencentLogs, 'validate')
                    .returns(Promise.resolve());
                setDefaultsStub = sinon.stub(tencentLogs, 'setDefaults')
                    .returns(Promise.resolve());
                logsStub = sinon.stub(tencentLogs, 'logs')
                    .returns(Promise.resolve());
            });

            afterEach(() => {
                tencentLogs.validate.restore();
                tencentLogs.setDefaults.restore();
                tencentLogs.logs.restore();
            });

            it('should run "before:logs:logs" promise chain', () => tencentLogs
                .hooks['before:logs:logs']().then(() => {
                    validateStub.calledOnce.should.equal(true);
                    setDefaultsStub.calledAfter(validateStub).should.equal(true);
                }));

            it('should run "logs:logs" promise chain', () => tencentLogs
                .hooks['logs:logs']().then(() => {
                    logsStub.calledOnce.should.equal(true);
                }));
        });
    });
});