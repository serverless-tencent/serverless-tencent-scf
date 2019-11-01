'use strict';

const sinon           = require('sinon');
const TencentProvider = require('../provider/tencentProvider');
const Serverless      = require('../test/serverless');
const TencentRemove   = require('./tencentRemove');

describe('TencentRemove', () => {
    let serverless;
    let options;
    let tencentRemove;

    beforeEach(() => {
        serverless = new Serverless();
        options = {
            stage: 'dev',
            region: 'ap-guangzhou',
            function: 'test'
        };
        serverless.setProvider('tencent', new TencentProvider(serverless, options));
        tencentRemove = new TencentRemove(serverless, options);
    });

    describe('#constructor()', () => {
        it('should set the serverless instance', () => {
            tencentRemove.serverless.should.equal(serverless);
        });

        it('should set options if provided', () => {
            tencentRemove.options.should.equal(options);
        });

        it('should make the provider accessible', () => {
            tencentRemove.provider.should.to.be.an.instanceof(TencentProvider);
        });

        describe('hooks', () => {
            let validateStub;
            let setDefaultsStub;
            let tencentRemoveStub;

            beforeEach(() => {
                validateStub = sinon.stub(tencentRemove, 'validate')
                    .returns(Promise.resolve());
                setDefaultsStub = sinon.stub(tencentRemove, 'setDefaults')
                    .returns(Promise.resolve());
                tencentRemoveStub = sinon.stub(tencentRemove, 'remove')
                    .returns(Promise.resolve());
            });

            afterEach(() => {
                tencentRemove.validate.restore();
                tencentRemove.setDefaults.restore();
                tencentRemove.remove.restore();
            });

            it('should run "before:remove:remove" promise chain', () => tencentRemove
                .hooks['before:remove:remove']().then(() => {
                    validateStub.calledOnce.should.equal(true);
                    setDefaultsStub.calledAfter(validateStub).should.equal(true);
                }));

            it('should run "remove:remove" promise chain', () => tencentRemove
                .hooks['remove:remove']().then(() => {
                    tencentRemoveStub.calledOnce.should.equal(true);
                }));
        });
    });
});