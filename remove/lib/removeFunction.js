const tencentcloud = require('tencentcloud-sdk-nodejs')
const AbstractHandler = require('../../shared/handler')
const models = tencentcloud.scf.v20180416.Models
const util = require('util')

class RemoveFunction extends AbstractHandler {
  async remove(funcName) {
    const req = new models.DeleteFunctionRequest()
    const body = {
      FunctionName: funcName
    }
    req.from_json_string(JSON.stringify(body))
    const handler = util.promisify(this.scfClient.DeleteFunction.bind(this.scfClient))
    try {
      return await handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }
}

module.exports = RemoveFunction
