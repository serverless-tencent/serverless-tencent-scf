const sinon = require('sinon')
const Serverless = require('../test/serverless')
const DeployListFunctions = require('./deployListFunctions')

describe('DeployListFunctions@Library', () => {
  let deployListFunctions
  let deployListFunctionsStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }
    deployListFunctions = new DeployListFunctions(options, serverless)

    deployListFunctionsStub = sinon
      .stub(deployListFunctions, 'functionsList')
      .returns(Promise.resolve())
  })

  afterEach(() => {
    deployListFunctions.functionsList.restore()
  })

  it('should make the info function accessible', () => {
    deployListFunctions.should.to.be.an.instanceof(DeployListFunctions)
  })

  it('should run library functions list', () =>
    deployListFunctions.functionsList().then(() => {
      deployListFunctionsStub.calledOnce.should.equal(true)
    }))
})
