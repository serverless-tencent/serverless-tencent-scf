const BbPromise = require('bluebird')
const _ = require('lodash')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const RollbackService = require('./lib/rollbackService')
const DeployFunction = require('../deploy/lib/deployFunction')
const DeployTrigger = require('../deploy/lib/deployTrigger')

class TencentRollback {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'before:rollback:rollback': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'rollback:rollback': () => BbPromise.bind(this).then(this.rollback)
    }
  }

  async rollback() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)
    const Handler = new RollbackService(this.options, this.serverless)
    const fileKeyPrefix = this.serverless.service.service + '-' + this.options.stage
    const cosBucket = this.provider.getDeployCosBucket()
    const functionList = await Handler.historyList(fileKeyPrefix, cosBucket)
    if (this.options.verbose) {
      this.serverless.cli.log(
        'Use a timestamp from the deploy list below to rollback to a specific version.\nRun `sls rollback -t YourTimeStampHere`'
      )
      if (functionList.Contents) {
        this.serverless.cli.log('Listing deployments:')
        for (
          let functionIndex = functionList.Contents.length - 1;
          functionIndex >= 0;
          functionIndex--
        ) {
          /**
           * Serverless: -------------
           * Serverless: Timestamp: 1570942070508
           * Serverless: Datetime: 2019-10-13T04:47:50.508Z
           * Serverless: Files:
           * Serverless: - compiled-cloudformation-template.json
           * Serverless: - sls-aws.zip
           */
          try {
            const thisFileKey = functionList.Contents[functionIndex].Key
            const thisFunctionJson = await Handler.getCosObject(thisFileKey, cosBucket)
            const thisFileJson = JSON.parse(thisFunctionJson.Body.toString('utf-8'))
            this.serverless.cli.log('-------------')
            this.serverless.cli.log('Timestamp: ' + thisFileJson.CreateTimestamp)
            this.serverless.cli.log('Datetime: ' + thisFileJson.CreateTime)
            this.serverless.cli.log('Files:')
            this.serverless.cli.log('- ' + thisFileJson.ServiceFileName)
            this.serverless.cli.log('- ' + thisFileJson.ServiceZipName)
          } catch (e) {}
        }
      }
    }

    if (this.options.timestamp) {
      for (let functionIndex = 0; functionIndex < functionList.Contents.length; functionIndex++) {
        try {
          const thisFileKey = functionList.Contents[functionIndex].Key
          const thisFunctionJson = await Handler.getCosObject(thisFileKey, cosBucket)
          const services = JSON.parse(thisFunctionJson.Body.toString('utf-8'))
          if (this.options.timestamp.toString() == services.CreateTimestamp.toString()) {
            const func = new DeployFunction(this.options, this.serverless)
            const trigger = new DeployTrigger(this.options, this.serverless)
            for (const funcName in services.Resources.default) {
              if (funcName == 'Type') {
                continue
              }
              const funcObject = _.cloneDeep(services.Resources.default[funcName])
              funcObject.Name = funcName
              funcObject.FuncName = this.provider.getFunctionName(funcName)

              this.serverless.cli.log(`Rollback function ${funcObject.FuncName}`)
              const oldFunc = await func.deploy('default', funcObject)
              this.serverless.cli.log(`Rollback function ${funcObject.FuncName}`)

              if ((await func.checkStatus('default', funcObject)) == false) {
                throw `Function ${funcObject.FuncName} create/update failed`
              }

              this.serverless.cli.log(`Rollback configure for function ${funcObject.FuncName}`)
              await func.updateConfiguration('default', oldFunc, funcObject)

              if ((await func.checkStatus('default', funcObject)) == false) {
                throw `Function ${funcObject.FuncName} create/update failed`
              }

              this.serverless.cli.log(`Setting tags for function ${funcObject.FuncName}`)
              await func.createTags('default', funcObject.FuncName, funcObject.Properties.Tags)

              this.serverless.cli.log(`Rollback trigger for function ${funcObject.FuncName}`)
              await trigger.create(
                'default',
                oldFunc ? oldFunc.Triggers : null,
                funcObject,
                (response, trigger) => {
                  if (trigger.Type == 'apigw') {
                    const resultDesc = JSON.parse(response.TriggerDesc)
                    this.serverless.cli.log(
                      `Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success. service id ${resultDesc.service.serviceId} url ${resultDesc.service.subDomain}`
                    )
                  } else {
                    this.serverless.cli.log(
                      `Created ${trigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success.`
                    )
                  }
                },
                (error, trigger) => {
                  this.serverless.cli.log(error)
                }
              )
              this.serverless.cli.log(`Deployed function ${funcObject.FuncName} successful`)
            }
          }
        } catch (e) {}
      }
    }
  }
}

module.exports = TencentRollback
