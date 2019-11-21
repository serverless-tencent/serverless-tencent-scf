const _ = require('lodash')

module.exports = {
  validate() {
    this.validateServicePath()
    this.validateServiceName()
    this.validateEventsProperty()
  },

  validateServicePath() {
    if (!this.serverless.config.servicePath) {
      throw new Error('This command can only be run inside a service directory')
    }
    return
  },

  validateServiceName() {
    const serviceName = this.serverless.service.service
    if (!/^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(serviceName)) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
          ' name should consist only of letters, digits, underscores and' +
          ' dashes, and it can not start with digits or underscores'
      )
    }
    if (serviceName.length > 128) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
          ' name should not be longer than 128 characters'
      )
    }
    return
  },

  validateEventsProperty() {
    const { functions } = this.serverless.service
    _.forEach(functions, (funcObject, funcKey) => {
      const supportedEvents = ['apigw', 'cos', 'cmq', 'timer', 'ckafka']

      for (var eventIndex = 0; eventIndex < funcObject.events.length; eventIndex++) {
        const eventType = Object.keys(funcObject.events[eventIndex])[0]
        if (supportedEvents.indexOf(eventType) === -1) {
          const errorMessage = [
            `Event type "${eventType}" of function "${funcKey}" not supported.`,
            ` supported event types are: ${supportedEvents.join(', ')}`
          ].join('')
          throw new Error(errorMessage)
        }
      }
    })
  }
}
