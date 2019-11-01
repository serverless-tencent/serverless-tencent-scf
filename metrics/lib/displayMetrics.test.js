'use strict';

const sinon          = require('sinon');
const DisplayMetrics = require('./displayMetrics');

describe('DisplayMetrics@Library', () => {
    let displayMetrics;
    let funcListStub;
    let getMonitorStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        displayMetrics = new DisplayMetrics('appid', 'secret_id', 'secret_key', options);

        funcListStub = sinon.stub(displayMetrics, 'functionList')
            .returns(Promise.resolve());
        getMonitorStub = sinon.stub(displayMetrics, 'getMonitor')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        displayMetrics.functionList.restore();
    });

    it('should make the function list accessible', () => {
        displayMetrics.should.to.be.an.instanceof(DisplayMetrics);
    });

    it('should run library function list function', () => displayMetrics
        .functionList().then(()=>{
        funcListStub.calledOnce.should.equal(true)
    }));

    it('should run library get monitor function', () => displayMetrics
        .getMonitor().then(()=>{
        getMonitorStub.calledOnce.should.equal(true)
    }));
});