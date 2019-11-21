const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('./tencentProvider')
const Serverless = require('../test/serverless')

describe('TencentProvider@Public', () => {
  let readFileSyncStub
  let tencentProvider
  let serverless
  let setProviderStub
  let homedirStub
  let getFunctionResourceStub
  let getServiceResourceStub
  let getEnvironmentStub
  let getVPCConfigStub
  let getCredentialsStub
  let getTimerEventStub
  let getCOSEventStub
  let getAPIGWEventStub
  let getCMQEventStub
  let getCkafkaEventStub
  let getDeployCosBucketStub

  beforeEach(() => {
    serverless = new Serverless()
    serverless.version = '1.0.0'
    setProviderStub = sinon.stub(serverless, 'setProvider').returns()
    readFileSyncStub = sinon.stub(fs, 'readFileSync').returns(`[default]
tencent_secret_key = PYR4a0HSZ******eVvHRe
tencent_secret_id = AKIDoM*****mxsfOirI
tencent_appid = 12561*****`)
    homedirStub = sinon.stub(os, 'homedir').returns('/root')

    const options = {
      stage: 'dev',
      region: 'ap-guangzhou',
      function: 'test'
    }
    tencentProvider = new TencentProvider(serverless, options)
    getFunctionResourceStub = sinon.stub(tencentProvider, 'getFunctionResource').returns(true)
    getServiceResourceStub = sinon.stub(tencentProvider, 'getServiceResource').returns(true)
    getEnvironmentStub = sinon.stub(tencentProvider, 'getEnvironment').returns(true)
    getVPCConfigStub = sinon.stub(tencentProvider, 'getVPCConfig').returns(true)
    getCredentialsStub = sinon.stub(tencentProvider, 'getCredentials').returns(true)
    getTimerEventStub = sinon.stub(tencentProvider, 'getTimerEvent').returns(true)
    getCOSEventStub = sinon.stub(tencentProvider, 'getCOSEvent').returns(true)
    getAPIGWEventStub = sinon.stub(tencentProvider, 'getAPIGWEvent').returns(true)
    getCMQEventStub = sinon.stub(tencentProvider, 'getCMQEvent').returns(true)
    getCkafkaEventStub = sinon.stub(tencentProvider, 'getCkafkaEvent').returns(true)
    getDeployCosBucketStub = sinon.stub(tencentProvider, 'getDeployCosBucket').returns(true)
  })

  afterEach(() => {
    tencentProvider.getFunctionResource.restore()
    tencentProvider.getServiceResource.restore()
    tencentProvider.getEnvironment.restore()
    tencentProvider.getVPCConfig.restore()
    tencentProvider.getCredentials.restore()
    tencentProvider.getTimerEvent.restore()
    tencentProvider.getCOSEvent.restore()
    tencentProvider.getAPIGWEvent.restore()
    tencentProvider.getCMQEvent.restore()
    tencentProvider.getCkafkaEvent.restore()
    tencentProvider.getDeployCosBucket.restore()
    serverless.setProvider.restore()
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#getProviderName()', () => {
    it('should return the provider name', () => {
      TencentProvider.getProviderName().should.equal('tencent')
    })
  })

  describe('#constructor()', () => {
    it('should store an instance of serverless', () => {
      tencentProvider.serverless.should.to.be.an.instanceof(Serverless)
    })

    it('should store an instance of itself', () => {
      tencentProvider.provider.should.to.be.an.instanceof(TencentProvider)
    })

    it('should set the provider with the Serverless instance', () => {
      setProviderStub.calledOnce.should.equal(true)
    })
  })

  describe('public function', () => {
    it('should return a new function resource getFunctionResource()', () => {
      tencentProvider.getFunctionResource().should.equal(true)
    })

    it('should return a new service resource getServiceResource()', () => {
      tencentProvider.getServiceResource().should.equal(true)
    })
    it('should return a function name "test-service-dev-hello"', () => {
      tencentProvider.getFunctionName('hello').should.equal('test-service-dev-hello')
    })
    it('should return a stage name "dev"', () => {
      tencentProvider.getStage().should.equal('dev')
    })
    it('should return a region name "ap-guangzhou"', () => {
      tencentProvider.getRegion().should.equal('ap-guangzhou')
    })
    it('should return a function configure environment', () => {
      tencentProvider.getEnvironment().should.equal(true)
    })
    it('should return a function vpc configure', () => {
      tencentProvider.getVPCConfig().should.equal(true)
    })
    it('should return a function credentials configure', () => {
      tencentProvider.getCredentials().should.equal(true)
    })
    it('should return a function timer trigger', () => {
      tencentProvider.getTimerEvent().should.equal(true)
    })
    it('should return a function cos trigger', () => {
      tencentProvider.getCOSEvent().should.equal(true)
    })
    it('should return a function apigw trigger', () => {
      tencentProvider.getAPIGWEvent().should.equal(true)
    })
    it('should return a function cmq trigger', () => {
      tencentProvider.getCMQEvent().should.equal(true)
    })
    it('should return a function ckafka trigger', () => {
      tencentProvider.getCkafkaEvent().should.equal(true)
    })
    it('should return a function cos bucket name', () => {
      tencentProvider.getDeployCosBucket().should.equal(true)
    })
  })
})
