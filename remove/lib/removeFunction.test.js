'use strict';

const sinon          = require('sinon');
const RemoveFunction = require('./removeFunction');

describe('RemoveFunction@Library', () => {
    let removeFunction;
    let removeFunctionStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        removeFunction = new RemoveFunction('appid', 'secret_id', 'secret_key', options);

        removeFunctionStub = sinon.stub(removeFunction, 'remove')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        removeFunction.remove.restore();
    });

    it('should make the remove function accessible', () => {
        removeFunction.should.to.be.an.instanceof(RemoveFunction);
    });

    it('should run library remove function', () => removeFunction
        .remove().then(()=>{
        removeFunctionStub.calledOnce.should.equal(true)
    }));
});