// mock of the serverless instance
class Serverless {
  constructor() {
    this.providers = {}

    this.service = {
      provider: {
        credentials: ''
      },
      service: 'test-service'
    }

    this.service.getAllFunctions = function() {
      return Object.keys(this.functions)
    }

    this.service.getFunction = function(funcName) {
      this.functions[funcName].name = `${this.service}-dev-${funcName}`
      return this.functions[funcName]
    }

    this.utils = {
      writeFileSync() {},
      readFileSync() {}
    }

    this.cli = {
      log() {},
      consoleLog() {},
      printDot() {}
    }

    this.plugins = []
    this.pluginManager = {
      addPlugin: (plugin) => this.plugins.push(plugin)
    }
  }

  setProvider(name, provider) {
    this.providers[name] = provider
  }

  getProvider(name) {
    return this.providers[name]
  }
}

module.exports = Serverless
