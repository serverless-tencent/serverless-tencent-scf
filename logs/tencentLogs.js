const BbPromise = require('bluebird')
const _ = require('lodash')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const LogsFunction = require('./lib/retrieveLogs')

class TencentLogs {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider, LogsFunction)

    this.hooks = {
      'before:logs:logs': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'logs:logs': () => BbPromise.bind(this).then(this.logs)
    }
  }

  getTimeFunction(fmt, difTime) {
    var currentTime = new Date(new Date().getTime() - difTime)
    var o = {
      'M+': currentTime.getMonth() + 1,
      'd+': currentTime.getDate(),
      'h+': currentTime.getHours(),
      'm+': currentTime.getMinutes(),
      's+': currentTime.getSeconds(),
      'q+': Math.floor((currentTime.getMonth() + 3) / 3),
      S: currentTime.getMilliseconds()
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (currentTime.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  }

  async logs() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)
    try {
      const timeFormat = 'yyyy-MM-dd hh:mm:ss'
      this.serverless.cli.log(`Get function logs...`)
      const functionName = this.provider.getFunctionName(this.options.function)
      const interval = this.options.interval || 1000
      if (this.options.tail) {
        const logsList = new Array()
        const startTime = this.options.startTime || this.getTimeFunction(timeFormat, interval)
        for (let times = 0; times < 100000; times++) {
          await utils.sleep(interval)
          const handler = new LogsFunction(this.options, this.serverless)
          const endTime = this.getTimeFunction('yyyy-MM-dd hh:mm:ss', 0)
          const result = await handler.logs(
            functionName,
            startTime,
            endTime,
            this.options.filter || {}
          )
          const totalData = result.Data || []
          for (var eveLogIndex = 0; eveLogIndex < totalData.length; eveLogIndex++) {
            if (logsList.indexOf(totalData[eveLogIndex]['RequestId']) == -1) {
              logsList.push(totalData[eveLogIndex]['RequestId'])
              const outputStr =
                '\nStartTime: ' +
                totalData[eveLogIndex].StartTime +
                '\nRetMsg: ' +
                totalData[eveLogIndex].RetMsg +
                '\nRequestId: ' +
                totalData[eveLogIndex].RequestId +
                '\n\nDuration: ' +
                totalData[eveLogIndex].Duration +
                '\nBillDuration: ' +
                totalData[eveLogIndex].BillDuration +
                '\nMemUsage: ' +
                totalData[eveLogIndex].MemUsage +
                '\n\nLog: ' +
                totalData[eveLogIndex].Log +
                '\n\n'
              this.serverless.cli.log(outputStr)
            }
          }
        }
      } else {
        const handler = new LogsFunction(this.options, this.serverless)
        const result = await handler.logs(
          functionName,
          this.options.startTime || this.getTimeFunction(timeFormat, 1 * 60 * 60 * 1000),
          this.getTimeFunction(timeFormat, 0),
          this.options.filter || {}
        )
        const totalData = result.Data || []
        for (let eveLogIndex = 0; eveLogIndex < totalData.length; eveLogIndex++) {
          this.serverless.cli.log(JSON.stringify(totalData[eveLogIndex], null, 2))
        }
      }
    } catch (e) {
      this.serverless.cli.log(e)
    }
  }
}

module.exports = TencentLogs
