'use strict';

const sinon              = require('sinon');
const DisplayServiceInfo = require('./displayServiceInfo');

describe('DisplayServiceInfo@Library', () => {
    let displayServiceInfo;
    let displayServiceInfoStub;

    let options;

    beforeEach(() => {
        options = {
            region: 'ap-guangzhou',
        };
        displayServiceInfo = new DisplayServiceInfo('appid', 'secret_id', 'secret_key', options);

        displayServiceInfoStub = sinon.stub(displayServiceInfo, 'info')
            .returns(Promise.resolve());
    });

    afterEach(() => {
        displayServiceInfo.info.restore();
    });

    it('should make the info function accessible', () => {
        displayServiceInfo.should.to.be.an.instanceof(DisplayServiceInfo);
    });

    it('should run library info function', () => displayServiceInfo
        .info().then(()=>{
        displayServiceInfoStub.calledOnce.should.equal(true)
    }));
});