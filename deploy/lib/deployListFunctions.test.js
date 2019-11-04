'use strict';

const sinon               = require('sinon');
const DeployListFunctions = require('./deployListFunctions');

describe('DeployListFunctions@Library', () => {
    let deployListFunctions;
    let deployListFunctionsStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        deployListFunctions = new DeployListFunctions('appid', 'secret_id', 'secret_key', options);

        deployListFunctionsStub = sinon.stub(deployListFunctions, 'functionsList')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        deployListFunctions.functionsList.restore();
    });

    it('should make the info function accessible', () => {
        deployListFunctions.should.to.be.an.instanceof(DeployListFunctions);
    });

    it('should run library functions list', () => deployListFunctions
        .functionsList().then(()=>{
        deployListFunctionsStub.calledOnce.should.equal(true)
    }));
});