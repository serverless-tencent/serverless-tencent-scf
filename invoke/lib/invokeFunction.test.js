const sinon = require('sinon')
const Serverless = require('../test/serverless')
const InvokeFunction = require('./invokeFunction')

describe('InvokeFunction@Library', () => {
  let invokeFunction
  let invokeFunctionStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }
    invokeFunction = new InvokeFunction(options, serverless)

    invokeFunctionStub = sinon.stub(invokeFunction, 'invoke').returns(Promise.resolve())
  })

  afterEach(() => {
    invokeFunction.invoke.restore()
  })

  it('should make the invoke function accessible', () => {
    invokeFunction.should.to.be.an.instanceof(InvokeFunction)
  })

  it('should run library invoke function', () =>
    invokeFunction.invoke().then(() => {
      invokeFunctionStub.calledOnce.should.equal(true)
    }))
})
