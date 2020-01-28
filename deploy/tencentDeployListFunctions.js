const BbPromise = require('bluebird')

const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const ListFunctions = require('./lib/deployListFunctions')
const InfoFunction = require('../info/lib/displayServiceInfo')

class TencentDeployListFunction {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'before:deploy:list:functions:log': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'deploy:list:functions:log': () => BbPromise.bind(this).then(this.functionList)
    }
  }

  async functionList() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)

    try {
      const infoHandler = new InfoFunction(this.options, this.serverless)
      const deployHandler = new ListFunctions(this.options, this.serverless)
      const functionList = await infoHandler.info(
        this.serverless.service.service,
        this.options.stage
      )
      const totalData = functionList.Functions || []
      if (totalData.length > 0) {
        this.serverless.cli.log('Listing functions:')
        this.serverless.cli.log('-------------')
        let eveFunctionVersion
        for (let eveFunctionIndex = 0; eveFunctionIndex < totalData.length; eveFunctionIndex++) {
          eveFunctionVersion = await deployHandler.functionsList(
            totalData[eveFunctionIndex].FunctionName
          )
          let thisVersionString = totalData[eveFunctionIndex].FunctionName + ': '
          if (eveFunctionVersion.Versions) {
            for (
              let eveVersion = 0;
              eveVersion < eveFunctionVersion.Versions.length;
              eveVersion++
            ) {
              thisVersionString =
                thisVersionString + eveFunctionVersion.Versions[eveVersion].Version
              if (eveVersion < eveFunctionVersion.Versions.length - 1) {
                thisVersionString = thisVersionString + ', '
              }
            }
            this.serverless.cli.log(thisVersionString)
          }
        }
      }
    } catch (e) {
      this.serverless.cli.log(e)
    }
  }
}

module.exports = TencentDeployListFunction
