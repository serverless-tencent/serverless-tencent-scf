const tencentcloud = require('tencentcloud-sdk-nodejs')
const AbstractHandler = require('../../shared/handler')
const models = tencentcloud.scf.v20180416.Models
const util = require('util')

class InvokeFunction extends AbstractHandler {
  functionsList(funcName) {
    const req = new models.ListVersionByFunctionRequest()
    req.FunctionName = funcName
    req.Namespace = 'default'
    const handler = util.promisify(this.scfClient.ListVersionByFunction.bind(this.scfClient))
    try {
      return handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }
}

module.exports = InvokeFunction
