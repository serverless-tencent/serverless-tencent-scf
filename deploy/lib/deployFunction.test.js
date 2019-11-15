const sinon = require('sinon')
const Serverless = require('../test/serverless')
const DeployFunction = require('./deployFunction')

describe('DeployFunction@Library', () => {
  let deployFunction
  let deployFunctionStub
  let updateFunctionCodeStub
  let createFunctionStub
  let getFunctionStub
  let updateConfigurationStub
  let createTagsStub
  let uploadService2CosStub

  let options
  let serverless

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      region: 'ap-guangzhou'
    }

    deployFunction = new DeployFunction(options, serverless)

    deployFunctionStub = sinon.stub(deployFunction, 'deploy').returns(Promise.resolve())
    updateFunctionCodeStub = sinon
      .stub(deployFunction, 'updateFunctionCode')
      .returns(Promise.resolve())
    createFunctionStub = sinon.stub(deployFunction, 'createFunction').returns(Promise.resolve())
    getFunctionStub = sinon.stub(deployFunction, 'getFunction').returns(Promise.resolve())
    updateConfigurationStub = sinon
      .stub(deployFunction, 'updateConfiguration')
      .returns(Promise.resolve())
    createTagsStub = sinon.stub(deployFunction, 'createTags').returns(Promise.resolve())
    uploadService2CosStub = sinon
      .stub(deployFunction, 'uploadService2Cos')
      .returns(Promise.resolve())
  })

  afterEach(() => {
    deployFunction.deploy.restore()
    deployFunction.updateFunctionCode.restore()
    deployFunction.createFunction.restore()
    deployFunction.getFunction.restore()
    deployFunction.updateConfiguration.restore()
    deployFunction.createTags.restore()
    deployFunction.uploadService2Cos.restore()
  })

  it('should make the deploy function accessible', () => {
    deployFunction.should.to.be.an.instanceof(DeployFunction)
  })

  it('should run library deploy function', () =>
    deployFunction.deploy().then(() => {
      deployFunctionStub.calledOnce.should.equal(true)
    }))

  it('should run library update function code', () =>
    deployFunction.updateFunctionCode().then(() => {
      updateFunctionCodeStub.calledOnce.should.equal(true)
    }))

  it('should run library create function', () =>
    deployFunction.createFunction().then(() => {
      createFunctionStub.calledOnce.should.equal(true)
    }))

  it('should run library get function', () =>
    deployFunction.getFunction().then(() => {
      getFunctionStub.calledOnce.should.equal(true)
    }))

  it('should run library update configuration', () =>
    deployFunction.updateConfiguration().then(() => {
      updateConfigurationStub.calledOnce.should.equal(true)
    }))

  it('should run library create tags', () =>
    deployFunction.createTags().then(() => {
      createTagsStub.calledOnce.should.equal(true)
    }))
  it('should run library upload service to cos', () =>
    deployFunction.uploadService2Cos().then(() => {
      uploadService2CosStub.calledOnce.should.equal(true)
    }))
})
