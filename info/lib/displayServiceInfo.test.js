const sinon = require('sinon')
const Serverless = require('../test/serverless')
const DisplayServiceInfo = require('./displayServiceInfo')

describe('DisplayServiceInfo@Library', () => {
  let displayServiceInfo
  let displayServiceInfoStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }
    displayServiceInfo = new DisplayServiceInfo(options, serverless)

    displayServiceInfoStub = sinon.stub(displayServiceInfo, 'info').returns(Promise.resolve())
  })

  afterEach(() => {
    displayServiceInfo.info.restore()
  })

  it('should make the info function accessible', () => {
    displayServiceInfo.should.to.be.an.instanceof(DisplayServiceInfo)
  })

  it('should run library info function', () =>
    displayServiceInfo.info().then(() => {
      displayServiceInfoStub.calledOnce.should.equal(true)
    }))
})
