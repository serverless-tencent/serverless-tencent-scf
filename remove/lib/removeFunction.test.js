const sinon = require('sinon')
const Serverless = require('../test/serverless')
const RemoveFunction = require('./removeFunction')

describe('RemoveFunction@Library', () => {
  let removeFunction
  let removeFunctionStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }
    removeFunction = new RemoveFunction(options, serverless)

    removeFunctionStub = sinon.stub(removeFunction, 'remove').returns(Promise.resolve())
  })

  afterEach(() => {
    removeFunction.remove.restore()
  })

  it('should make the remove function accessible', () => {
    removeFunction.should.to.be.an.instanceof(RemoveFunction)
  })

  it('should run library remove function', () =>
    removeFunction.remove().then(() => {
      removeFunctionStub.calledOnce.should.equal(true)
    }))
})
