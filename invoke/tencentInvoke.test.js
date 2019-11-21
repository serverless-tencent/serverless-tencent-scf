const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('../provider/tencentProvider')
const TencentInvoke = require('./tencentInvoke')
const Serverless = require('../test/serverless')

describe('TencentInvoke', () => {
  let serverless
  let options
  let tencentInvoke
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
    tencentInvoke = new TencentInvoke(serverless, options)
  })

  afterEach(() => {
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      tencentInvoke.serverless.should.equal(serverless)
    })

    it('should set options if provided', () => {
      tencentInvoke.options.should.equal(options)
    })

    it('should make the provider accessible', () => {
      tencentInvoke.provider.should.to.be.an.instanceof(TencentProvider)
    })

    describe('hooks', () => {
      let validateStub
      let setDefaultsStub
      let invokeFunctionStub

      beforeEach(() => {
        validateStub = sinon.stub(tencentInvoke, 'validate').returns(Promise.resolve())
        setDefaultsStub = sinon.stub(tencentInvoke, 'setDefaults').returns(Promise.resolve())
        invokeFunctionStub = sinon.stub(tencentInvoke, 'invoke').returns(Promise.resolve())
      })

      afterEach(() => {
        tencentInvoke.validate.restore()
        tencentInvoke.setDefaults.restore()
        tencentInvoke.invoke.restore()
      })

      it('should run "before:invoke:invoke" promise chain', () =>
        tencentInvoke.hooks['before:invoke:invoke']().then(() => {
          validateStub.calledOnce.should.equal(true)
          setDefaultsStub.calledAfter(validateStub).should.equal(true)
        }))

      it('should run "invoke:invoke" promise chain', () =>
        tencentInvoke.hooks['invoke:invoke']().then(() => {
          invokeFunctionStub.calledOnce.should.equal(true)
        }))
    })
  })
})
