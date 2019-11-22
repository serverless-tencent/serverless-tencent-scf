const sinon = require('sinon')
const Serverless = require('../test/serverless')
const DeployTrigger = require('./deployTrigger')

describe('DeployTrigger@Library', () => {
  let deployTrigger
  let deployTriggerCreateStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }
    deployTrigger = new DeployTrigger(options, serverless)

    deployTriggerCreateStub = sinon.stub(deployTrigger, 'create').returns(Promise.resolve())
  })

  afterEach(() => {
    deployTrigger.create.restore()
  })

  it('should make the info function accessible', () => {
    deployTrigger.should.to.be.an.instanceof(DeployTrigger)
  })

  it('should run library create trigger', () =>
    deployTrigger.create().then(() => {
      deployTriggerCreateStub.calledOnce.should.equal(true)
    }))
})
