const TencentProvider = require('./provider/tencentProvider')
const TencentDeploy = require('./deploy/tencentDeploy')
const TencentDeployFunction = require('./deploy/tencentDeployFunction')
const TencentDeployList = require('./deploy/tencentDeployList')
const TencentMetrics = require('./metrics/tencentMetrics')
const TencentRemove = require('./remove/tencentRemove')
const TencentRollback = require('./rollback/tencentRollback')
const TencentInvoke = require('./invoke/tencentInvoke')
const TencentInfo = require('./info/tencentInfo')
const TencentLogs = require('./logs/tencentLogs')
const TencentDeployListFunctions = require('./deploy/tencentDeployListFunctions')

class TencentIndex {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.serverless.pluginManager.addPlugin(TencentProvider)
    this.serverless.pluginManager.addPlugin(TencentDeploy)
    this.serverless.pluginManager.addPlugin(TencentDeployFunction)
    this.serverless.pluginManager.addPlugin(TencentDeployList)
    this.serverless.pluginManager.addPlugin(TencentDeployListFunctions)
    this.serverless.pluginManager.addPlugin(TencentMetrics)
    this.serverless.pluginManager.addPlugin(TencentRemove)
    this.serverless.pluginManager.addPlugin(TencentRollback)
    this.serverless.pluginManager.addPlugin(TencentInvoke)
    this.serverless.pluginManager.addPlugin(TencentInfo)
    this.serverless.pluginManager.addPlugin(TencentLogs)
  }

}

module.exports = TencentIndex
