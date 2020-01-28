const BbPromise = require('bluebird')
const _ = require('lodash')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const InfoFunction = require('./lib/displayServiceInfo')

class TencentInfo {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'before:info:info': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'info:info': () => BbPromise.bind(this).then(this.info)
    }
  }

  async info() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)
    try {
      const region = this.options.region
      const handler = new InfoFunction(this.options, this.serverless)

      var output =
        `\n\nService Information\n` +
        `service: ${this.serverless.service.service}\n` +
        `stage: ${this.options.stage}\n` +
        `region: ${region}\n`

      const result = await handler.info(this.serverless.service.service, this.options.stage)
      const totalData = result.Functions || []
      output = output + `\nDeployed functions: \n`
      const deployedFunction = new Array()
      if (totalData.length > 0) {
        for (let eveFunctionIndex = 0; eveFunctionIndex < totalData.length; eveFunctionIndex++) {
          output = output + '  ' + totalData[eveFunctionIndex].FunctionName + '\n'
          deployedFunction.push(totalData[eveFunctionIndex].FunctionName)
        }
      } else {
        output = output + 'There are no functions deployed yet\n'
      }

      output = output + '\nUndeployed function: \n'
      const functions = Object.keys(this.serverless.service.functions)
      if (functions.length > 0) {
        for (let eveFunctionIndex = 0; eveFunctionIndex < functions.length; eveFunctionIndex++) {
          const functionName = this.provider.getFunctionName(functions[eveFunctionIndex])
          if (deployedFunction.indexOf(functionName) == -1) {
            output = output + '  ' + functions[eveFunctionIndex] + '\n'
          }
        }
      } else {
        output = output + 'There are no functions undeployed yet\n'
      }

      if (this.options.verbose) {
        output = output + '\nServerlessDeploymentBucketName: ' + this.provider.getDeployCosBucket()
      }

      this.serverless.cli.log(output)
    } catch (e) {
      this.serverless.cli.log(e)
    }
  }
}

module.exports = TencentInfo
