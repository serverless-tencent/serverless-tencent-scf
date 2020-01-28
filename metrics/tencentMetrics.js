const BbPromise = require('bluebird')
const _ = require('lodash')
const validate = require('../shared/validate')
const utils = require('../shared/utils')
const tencentProvider = require('../provider/tencentProvider')
const MetricsFunction = require('./lib/displayMetrics')

class TencentInfo {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, validate, utils, tencentProvider)

    this.hooks = {
      'before:metrics:metrics': () =>
        BbPromise.bind(this)
          .then(this.validate)
          .then(this.setDefaults),

      'metrics:metrics': () => BbPromise.bind(this).then(this.metrics)
    }
  }

  frontOneHour(fmt, difTime) {
    var currentTime = new Date(new Date().getTime() - difTime)
    var o = {
      'M+': currentTime.getMonth() + 1, // 月份
      'd+': currentTime.getDate(), // 日
      'h+': currentTime.getHours(), // 小时
      'm+': currentTime.getMinutes(), // 分
      's+': currentTime.getSeconds(), // 秒
      'q+': Math.floor((currentTime.getMonth() + 3) / 3), // 季度
      S: currentTime.getMilliseconds() // 毫秒
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

  getSum(arrayData) {
    let sum = 0
    for (let i = 0; i < arrayData.length; i++) {
      sum += arrayData[i]
    }
    return sum
  }

  async metrics() {
    const provider = new tencentProvider(this.serverless, this.options)
    this.options = await provider.getUserCred(this.options)
    await provider.getUserAuth(this.options.credentials.tencent_owneruin)
    try {
      const Handler = new MetricsFunction(this.options, this.serverless)
      const functionList = await Handler.functionList(
        this.serverless.service.service,
        this.options.stage
      )
      const functionListData = functionList.Functions || []
      const timeFormat = 'yyyy-MM-dd hh:mm:ss'

      const startTime = this.options.startTime || this.frontOneHour(timeFormat, 24 * 60 * 60 * 1000)
      const endTime = this.options.endTime || this.frontOneHour(timeFormat, 0)
      const functionInformation = {}
      let output = 'Service wide metrics\n' + startTime + ' - ' + endTime + '\n'
      if (functionListData.length > 0) {
        for (
          let eveFunctionIndex = 0;
          eveFunctionIndex < functionListData.length;
          eveFunctionIndex++
        ) {
          const functionInvocation = await Handler.getMonitor(
            functionListData[eveFunctionIndex].FunctionName,
            'Invocation',
            startTime,
            endTime
          )
          const functionError = await Handler.getMonitor(
            functionListData[eveFunctionIndex].FunctionName,
            'Error',
            startTime,
            endTime
          )
          const functionOutFlow = await Handler.getMonitor(
            functionListData[eveFunctionIndex].FunctionName,
            'OutFlow',
            startTime,
            endTime
          )
          const functionDuration = await Handler.getMonitor(
            functionListData[eveFunctionIndex].FunctionName,
            'Duration',
            startTime,
            endTime
          )
          const duration =
            this.getSum(functionDuration.DataPoints[0].Values) /
            this.getSum(functionInvocation.DataPoints[0].Values)
          functionInformation[functionListData[eveFunctionIndex].FunctionName] = {
            Invocation: this.getSum(functionInvocation.DataPoints[0].Values),
            Error: this.getSum(functionError.DataPoints[0].Values),
            OutFlow: this.getSum(functionOutFlow.DataPoints[0].Values),
            Duration: duration ? duration : 0
          }
        }
        let serviceInvocation = 0
        let serviceError = 0
        let serviceOutFlow = 0
        let serviceDuration = 0
        let functionStr = ''
        for (const key in functionInformation) {
          serviceInvocation = serviceInvocation + functionInformation[key]['Invocation']
          serviceError = serviceError + functionInformation[key]['Error']
          serviceOutFlow = serviceOutFlow + functionInformation[key]['OutFlow']
          serviceDuration = serviceDuration + functionInformation[key]['Duration']
          functionStr =
            functionStr +
            '  ' +
            key +
            ': ' +
            '\n    Invocations: ' +
            functionInformation[key]['Invocation'] +
            '\n' +
            '    Outflows: ' +
            functionInformation[key]['OutFlow'] +
            '\n' +
            '    Errors: ' +
            functionInformation[key]['Error'] +
            '\n' +
            '    Duration(avg.): ' +
            functionInformation[key]['Duration'] +
            ' ms\n\n'
        }
        output =
          output +
          '\nService:\n  Invocations: ' +
          serviceInvocation +
          '\n' +
          '  Outflows: ' +
          serviceOutFlow +
          '\n' +
          '  Errors: ' +
          serviceError +
          '\n' +
          '  Duration(avg.): ' +
          serviceDuration +
          ' ms\n\nFunctions: \n' +
          functionStr
      } else {
        ;('There are no functions undeployed yet\n')
      }
      this.serverless.cli.log(output)
    } catch (e) {
      this.serverless.cli.log(e)
    }
  }
}

module.exports = TencentInfo
