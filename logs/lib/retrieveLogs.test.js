'use strict';

const sinon         = require('sinon');
const RetrieveLogs  = require('./retrieveLogs');

describe('RetrieveLogs@Library', () => {
    let retrieveLogs;
    let retrieveLogsStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        retrieveLogs = new RetrieveLogs('appid', 'secret_id', 'secret_key', options);

        retrieveLogsStub = sinon.stub(retrieveLogs, 'logs')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        retrieveLogs.logs.restore();
    });

    it('should make the logs function accessible', () => {
        retrieveLogs.should.to.be.an.instanceof(RetrieveLogs);
    });

    it('should run library logs function', () => retrieveLogs
        .logs().then(()=>{
        retrieveLogsStub.calledOnce.should.equal(true)
    }));
});