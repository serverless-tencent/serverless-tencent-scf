'use strict';

const sinon          = require('sinon');
const InvokeFunction = require('./invokeFunction');

describe('InvokeFunction@Library', () => {
    let invokeFunction;
    let invokeFunctionStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        invokeFunction = new InvokeFunction('appid', 'secret_id', 'secret_key', options);

        invokeFunctionStub = sinon.stub(invokeFunction, 'testInvoke')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        invokeFunction.testInvoke.restore();
    });

    it('should make the invoke function accessible', () => {
        invokeFunction.should.to.be.an.instanceof(InvokeFunction);
    });

    it('should run library invoke function', () => invokeFunction
        .testInvoke().then(()=>{
        invokeFunctionStub.calledOnce.should.equal(true)
    }));
});