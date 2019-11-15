const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const TencentProvider = require('../provider/tencentProvider')
const Serverless = require('../test/serverless')
const TencentRollback = require('./tencentRollback')

describe('TencentRollback', () => {
  let serverless
  let options
  let tencentRollback
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
    tencentRollback = new TencentRollback(serverless, options)
  })

  afterEach(() => {
    fs.readFileSync.restore()
    os.homedir.restore()
  })

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      tencentRollback.serverless.should.equal(serverless)
    })

    it('should set options if provided', () => {
      tencentRollback.options.should.equal(options)
    })

    it('should make the provider accessible', () => {
      tencentRollback.provider.should.to.be.an.instanceof(TencentProvider)
    })

    describe('hooks', () => {
      let validateStub
      let setDefaultsStub
      let tencentRollbackStub

      beforeEach(() => {
        validateStub = sinon.stub(tencentRollback, 'validate').returns(Promise.resolve())
        setDefaultsStub = sinon.stub(tencentRollback, 'setDefaults').returns(Promise.resolve())
        tencentRollbackStub = sinon.stub(tencentRollback, 'rollback').returns(Promise.resolve())
      })

      afterEach(() => {
        tencentRollback.validate.restore()
        tencentRollback.setDefaults.restore()
        tencentRollback.rollback.restore()
      })

      it('should run "before:rollback:rollback" promise chain', () =>
        tencentRollback.hooks['before:rollback:rollback']().then(() => {
          validateStub.calledOnce.should.equal(true)
          setDefaultsStub.calledAfter(validateStub).should.equal(true)
        }))

      it('should run "rollback:rollback" promise chain', () =>
        tencentRollback.hooks['rollback:rollback']().then(() => {
          tencentRollbackStub.calledOnce.should.equal(true)
        }))
    })
  })
})
