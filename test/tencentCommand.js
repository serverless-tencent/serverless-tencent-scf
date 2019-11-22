class TencentCommand {
  constructor(serverless, options, testSubject) {
    this.options = options
    this.serverless = serverless
    this.provider = this.serverless.getProvider('tencent')

    Object.assign(this, testSubject)
  }
}

module.exports = TencentCommand
