const tencentcloud = require('tencentcloud-sdk-nodejs')
const AbstractHandler = require('../../shared/handler')
const models = tencentcloud.scf.v20180416.Models
const util = require('util')

class InvokeFunction extends AbstractHandler {
  async invoke(ns, funcName, context) {
    const req = new models.InvokeRequest()
    const body = {
      FunctionName: funcName,
      LogType: 'Tail',
      ClientContext: context,
      Namespace: ns
    }
    req.from_json_string(JSON.stringify(body))
    const handler = util.promisify(this.scfClient.Invoke.bind(this.scfClient))
    try {
      return await handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }
}

module.exports = InvokeFunction
