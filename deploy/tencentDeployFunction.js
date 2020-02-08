const BbPromise = require('bluebird')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const util = require('util')
const _ = require('lodash')
const tencentProvider = require('../provider/tencentProvider')
const DeployFunction = require('./lib/deployFunction')
const DeployTrigger = require('./lib/deployTrigger')
const MetricsFunction = require('../metrics/lib/displayMetrics')

class TencentDeployFunction {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'deploy:function:initialize': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),
      'deploy:function:packageFunction': () => BbPromise.bind(this).then(this.packageFunction),
      'deploy:function:deploy': () => BbPromise.bind(this).then(this.deploy)
    }
  }

  packageFunction() {
    return this.serverless.pluginManager.spawn('package:function')
  }

  async deploy() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)

    const services = this.provider.getServiceResource()

    const func = new DeployFunction(this.options, this.serverless)
    const trigger = new DeployTrigger(this.options, this.serverless)
    const MetricsHandler = new MetricsFunction(this.options, this.serverless)

    let result
    if (_.isEmpty(services.Resources.default[this.options.function])) {
      throw new Error(`Function ${this.options.function} doesn't exists`)
    }

    const funcObject = _.cloneDeep(services.Resources.default[this.options.function])
    funcObject.Name = this.options.function
    funcObject.FuncName = this.provider.getFunctionName(this.options.function)

    const artifactPath = util.format(
      '%s/.serverless/%s.zip',
      this.serverless.service.serverless.config.servicePath,
      this.options.function
    )

    // upload file to cos
    this.serverless.cli.log(
      `Uploading function ${funcObject.FuncName} package to cos[${funcObject.Properties.CodeUri.Bucket}]. ${artifactPath}`
    )
    await func.uploadPackage2Cos(
      funcObject.Properties.CodeUri.Bucket,
      funcObject.Properties.CodeUri.Key,
      artifactPath
    )
    this.serverless.cli.log(`Uploaded package successful`)

    this.serverless.cli.log(`Uploading service to cos[${funcObject.Properties.CodeUri.Bucket}].`)
    result = await func.uploadService2Cos(
      funcObject.Properties.CodeUri.Bucket,
      services.ServiceFileName,
      services
    )
    this.serverless.cli.log(`Uploaded service successful ${result.Location}`)

    this.serverless.cli.log(`Creating function ${funcObject.FuncName}`)
    const oldFunc = await func.deploy('default', funcObject)
    this.serverless.cli.log(`Created function ${funcObject.FuncName}`)

    if ((await func.checkStatus('default', funcObject)) == false) {
      throw `Function ${funcObject.FuncName} create/update failed`
    }

    this.serverless.cli.log(`Updating configure for function ${funcObject.FuncName}`)
    await func.updateConfiguration('default', oldFunc, funcObject)

    this.serverless.cli.log(`Setting tags for function ${funcObject.FuncName}`)
    await func.createTags('default', funcObject.FuncName, funcObject.Properties.Tags)

    if ((await func.checkStatus('default', funcObject)) == false) {
      throw `Function ${funcObject.FuncName} create/update failed`
    }

    this.serverless.cli.log(`Creating trigger for function ${funcObject.FuncName}`)
    result = await trigger.create(
      'default',
      oldFunc ? oldFunc.Triggers : null,
      funcObject,
      (response, thisTrigger) => {
        if (thisTrigger.Type == 'apigw') {
          const resultDesc = JSON.parse(response.TriggerDesc)
          this.serverless.cli.log(
            `Created ${thisTrigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success. service id ${resultDesc.service.serviceId} url ${resultDesc.service.subDomain}`
          )
        } else {
          this.serverless.cli.log(
            `Created ${thisTrigger.Type} trigger ${response.TriggerName} for function ${funcObject.FuncName} success.`
          )
        }
      },
      (error) => {
        this.serverless.cli.log(error)
      }
    )
    this.serverless.cli.log(`Deployed function ${funcObject.FuncName} successful`)

    let outputInformation = `Service Information\nservice: ${this.serverless.service.service} \nstage: ${this.provider.options.stage} \nregion: ${this.provider.options.region} \nstack: ${this.serverless.service.service}-${this.provider.options.stage}\n`

    const functionList = await MetricsHandler.functionList(
      this.serverless.service.service,
      this.options.stage
    )
    const functionListData = functionList.Functions || []
    outputInformation =
      outputInformation + 'resources: ' + functionListData.length + '\nfunctions: '
    const deployFunctionName = this.provider.getFunctionName(this.options.function)
    outputInformation = outputInformation + `  ${this.options.function}: ${deployFunctionName}\n`
    const functionInformation = await func.getFunction('default', deployFunctionName, false)
    if (functionInformation.Triggers && functionInformation.Triggers.length > 0) {
      for (let i = 0; i <= functionInformation.Triggers.length; i++) {
        if ((await func.checkStatus('default', funcObject)) == false) {
          throw `Function ${funcObject.FuncName} create/update failed`
        }
        const thisTrigger = functionInformation.Triggers[i]
        try {
          if (thisTrigger.Type == 'apigw') {
            const triggerDesc = JSON.parse(thisTrigger.TriggerDesc)
            outputInformation =
              outputInformation +
              `    ${triggerDesc.api.requestConfig.method} - ${triggerDesc.service.subDomain}\n`
          }
        } catch (e) {}
      }
    }

    this.serverless.cli.log(outputInformation)
  }
}

module.exports = TencentDeployFunction
