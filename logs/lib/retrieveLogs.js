const tencentcloud = require('tencentcloud-sdk-nodejs')
const AbstractHandler = require('../../shared/handler')
const models = tencentcloud.scf.v20180416.Models
const util = require('util')

class LogsFunction extends AbstractHandler {
  async logs(funcName, startTime, endTime, filter) {
    const req = new models.GetFunctionLogsRequest()
    const body = {
      FunctionName: funcName,
      StartTime: startTime,
      EndTime: endTime,
      Namespace: 'default',
      Filter: filter,
      Offset: 0,
      Limit: 10000,
      Qualifier: '$LATEST'
    }
    req.from_json_string(JSON.stringify(body))
    const handler = util.promisify(this.scfClient.GetFunctionLogs.bind(this.scfClient))
    try {
      return await handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }
}

module.exports = LogsFunction
