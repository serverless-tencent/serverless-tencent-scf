const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('../provider/tencentProvider')
const Serverless = require('../test/serverless')
const TencentDeployFunction = require('./tencentDeployFunction')

describe('TencentDeployFunction', () => {
  let serverless
  let options
  let tencentDeployFunction
  let readFileSyncStub
  let homedirStub

  beforeEach(() => {
    serverless = new Serverless()
    options = {
      stage: 'dev',
      region: 'ap-guangzhou',
      function: 'test'
    }

    readFileSyncStub = sinon.stub(fs, 'readFileSync').returns(`[default]
tencent_secret_key = PYR4a0HSZ******eVvHRe
tencent_secret_id = AKIDoM*****mxsfOirI
tencent_appid = 12561*****`)
    homedirStub = sinon.stub(os, 'homedir').returns('/root')

    serverless.setProvider('tencent', new TencentProvider(serverless, options))
    tencentDeployFunction = new TencentDeployFunction(serverless, options)
  })

  afterEach(() => {
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      tencentDeployFunction.serverless.should.equal(serverless)
    })

    it('should set options if provided', () => {
      tencentDeployFunction.options.should.equal(options)
    })

    it('should make the provider accessible', () => {
      tencentDeployFunction.provider.should.to.be.an.instanceof(TencentProvider)
    })

    describe('hooks', () => {
      let validateStub
      let setDefaultsStub
      let tencentDeployFunctionStub
      let tencentPackageFunctionStub

      beforeEach(() => {
        validateStub = sinon.stub(tencentDeployFunction, 'validate').returns(Promise.resolve())
        setDefaultsStub = sinon
          .stub(tencentDeployFunction, 'setDefaults')
          .returns(Promise.resolve())
        tencentDeployFunctionStub = sinon
          .stub(tencentDeployFunction, 'deploy')
          .returns(Promise.resolve())
        tencentPackageFunctionStub = sinon
          .stub(tencentDeployFunction, 'packageFunction')
          .returns(Promise.resolve())
      })

      afterEach(() => {
        tencentDeployFunction.validate.restore()
        tencentDeployFunction.setDefaults.restore()
        tencentDeployFunction.deploy.restore()
      })

      it('should run "deploy:function:initialize" promise chain', () =>
        tencentDeployFunction.hooks['deploy:function:initialize']().then(() => {
          validateStub.calledOnce.should.equal(true)
          setDefaultsStub.calledAfter(validateStub).should.equal(true)
        }))

      it('should run "deploy:function:packageFunction" promise chain', () =>
        tencentDeployFunction.hooks['deploy:function:packageFunction']().then(() => {
          tencentPackageFunctionStub.calledOnce.should.equal(true)
        }))

      it('should run "deploy:function:deploy" promise chain', () =>
        tencentDeployFunction.hooks['deploy:function:deploy']().then(() => {
          tencentDeployFunctionStub.calledOnce.should.equal(true)
        }))
    })
  })
})
