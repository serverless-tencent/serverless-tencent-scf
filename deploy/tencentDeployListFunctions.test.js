const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('../provider/tencentProvider')
const Serverless = require('../test/serverless')
const TencentDeployListFunctions = require('./tencentDeployListFunctions')

describe('TencentDeployListFunctions', () => {
  let serverless
  let options
  let tencentDeployListFunctions
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
    tencentDeployListFunctions = new TencentDeployListFunctions(serverless, options)
  })

  afterEach(() => {
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      tencentDeployListFunctions.serverless.should.equal(serverless)
    })

    it('should set options if provided', () => {
      tencentDeployListFunctions.options.should.equal(options)
    })

    it('should make the provider accessible', () => {
      tencentDeployListFunctions.provider.should.to.be.an.instanceof(TencentProvider)
    })

    describe('hooks', () => {
      let validateStub
      let setDefaultsStub
      let tencentDeployListFunctionsStub

      beforeEach(() => {
        validateStub = sinon.stub(tencentDeployListFunctions, 'validate').returns(Promise.resolve())
        setDefaultsStub = sinon
          .stub(tencentDeployListFunctions, 'setDefaults')
          .returns(Promise.resolve())
        tencentDeployListFunctionsStub = sinon
          .stub(tencentDeployListFunctions, 'functionList')
          .returns(Promise.resolve())
      })

      afterEach(() => {
        tencentDeployListFunctions.validate.restore()
        tencentDeployListFunctions.setDefaults.restore()
        tencentDeployListFunctions.functionList.restore()
      })

      it('should run "before:deploy:list:functions:log" promise chain', () =>
        tencentDeployListFunctions.hooks['before:deploy:list:functions:log']().then(() => {
          validateStub.calledOnce.should.equal(true)
          setDefaultsStub.calledAfter(validateStub).should.equal(true)
        }))

      it('should run "deploy:list:functions:log" promise chain', () =>
        tencentDeployListFunctions.hooks['deploy:list:functions:log']().then(() => {
          tencentDeployListFunctionsStub.calledOnce.should.equal(true)
        }))
    })
  })
})
