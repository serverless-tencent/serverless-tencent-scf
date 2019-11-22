const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('../provider/tencentProvider')
const Serverless = require('../test/serverless')
const TencentDeploy = require('./tencentDeploy')

describe('TencentDeploy', () => {
  let serverless
  let options
  let tencentDeploy
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
    tencentDeploy = new TencentDeploy(serverless, options)
  })

  afterEach(() => {
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      tencentDeploy.serverless.should.equal(serverless)
    })

    it('should set options if provided', () => {
      tencentDeploy.options.should.equal(options)
    })

    it('should make the provider accessible', () => {
      tencentDeploy.provider.should.to.be.an.instanceof(TencentProvider)
    })

    describe('hooks', () => {
      let validateStub
      let setDefaultsStub
      let tencentDeployStub

      beforeEach(() => {
        validateStub = sinon.stub(tencentDeploy, 'validate').returns(Promise.resolve())
        setDefaultsStub = sinon.stub(tencentDeploy, 'setDefaults').returns(Promise.resolve())
        tencentDeployStub = sinon.stub(tencentDeploy, 'deploy').returns(Promise.resolve())
      })

      afterEach(() => {
        tencentDeploy.validate.restore()
        tencentDeploy.setDefaults.restore()
        tencentDeploy.deploy.restore()
      })

      it('should run "before:deploy:deploy" promise chain', () =>
        tencentDeploy.hooks['before:deploy:deploy']().then(() => {
          validateStub.calledOnce.should.equal(true)
          setDefaultsStub.calledAfter(validateStub).should.equal(true)
        }))

      it('should run "deploy:deploy" promise chain', () =>
        tencentDeploy.hooks['deploy:deploy']().then(() => {
          tencentDeployStub.calledOnce.should.equal(true)
        }))
    })
  })
})
