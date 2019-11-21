const tencentcloud = require('tencentcloud-sdk-nodejs')
const AbstractHandler = require('../../shared/handler')
const scf_models = tencentcloud.scf.v20180416.Models
const monitor_models = tencentcloud.monitor.v20180724.Models
const util = require('util')

class MetricsFunction extends AbstractHandler {
  async functionList(service, stage) {
    const req = new scf_models.ListFunctionsRequest()
    const body = {
      Namespace: 'default',
      Filters: [
        {
          Name: 'tag-Application',
          Values: [service]
        },
        {
          Name: 'tag-Stage',
          Values: [stage]
        }
      ]
    }
    req.from_json_string(JSON.stringify(body))
    const handler = util.promisify(this.scfClient.ListFunctions.bind(this.scfClient))
    try {
      return await handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }

  async getMonitor(functionName, metricName, startTime, endTime) {
    const req = new monitor_models.GetMonitorDataRequest()
    const body = {
      Namespace: 'QCE/SCF_V2',
      MetricName: metricName,
      StartTime: startTime,
      EndTime: endTime,
      Instances: [
        {
          Dimensions: [
            {
              Name: 'functionName',
              Value: functionName
            },
            {
              Name: 'namespace',
              Value: 'default'
            },
            {
              Name: 'version',
              Value: '$LATEST'
            }
          ]
        }
      ]
    }
    req.from_json_string(JSON.stringify(body))
    const handler = util.promisify(this.monitorClient.GetMonitorData.bind(this.monitorClient))
    try {
      return await handler(req)
    } catch (e) {
      this.serverless.cli.log('ErrorCode: ' + e.code + ' RequestId: ' + e.requestId)
      throw e
    }
  }
}

module.exports = MetricsFunction
