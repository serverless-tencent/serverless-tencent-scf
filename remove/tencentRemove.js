const BbPromise = require('bluebird')
const _ = require('lodash')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const RemoveFunction = require('./lib/removeFunction')

class TencentRemove {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'before:remove:remove': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'remove:remove': () => BbPromise.bind(this).then(this.remove)
    }
  }

  async remove() {
    const provider = new tencentProvider(this.serverless, this.options)
    if (
      !this.options.credentials ||
      !this.options.credentials.tencent_secret_id ||
      !this.options.credentials.tencent_owneruin
    ) {
      const tencentTemp = await provider.getTempKey()
      this.options.credentials = {
        tencent_secret_id: tencentTemp.tencent_secret_id,
        tencent_secret_key: tencentTemp.tencent_secret_key,
        tencent_appid: tencentTemp.tencent_appid,
        tencent_owneruin: tencentTemp.tencent_owneruin
      }
      this.options.token = tencentTemp.token
      this.options.timestamp = tencentTemp.timestamp
    }
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)
    try {
      const handler = new RemoveFunction(this.options, this.serverless)
      const service = this.provider.getServiceResource()
      const functions = Object.keys(service.Resources.default).filter((key) => {
        if (key != 'Type') {
          return key
        }
      })

      const len = _.size(functions)
      this.serverless.cli.log(`Removing functions...`)
      for (let i = 0; i < len; i++) {
        const funcName = this.provider.getFunctionName(functions[i])
        this.serverless.cli.log(`Removing function ${funcName}`)
        const _ = await handler.remove(funcName)
        this.serverless.cli.log(`Removed function ${funcName} successful`)
      }
    } catch (e) {
      this.serverless.cli.log(e)
    }
  }
}

module.exports = TencentRemove
