const _ = require('lodash')
const util = require('util')
const BbPromise = require('bluebird')
const crypto = require('crypto')

module.exports = {
  setDefaults() {
    this.options.stage = this.provider.getStage()
    this.options.region = this.provider.getRegion()
    return BbPromise.resolve()
  },

  TC3HMACSHA256(service, req, secretId, secretKey) {
    // const ApiService       = 'scf';
    const ApiVersion = '2018-04-16'
    const ApiTc3Request = 'tc3_request'
    const ApiSignedHeaders = 'content-type;host'

    const hosts = {
      scf: 'scf.tencentcloudapi.com'
    }

    const PrefixInteger = function(num, length) {
      return (Array(length).join('0') + num).slice(-length)
    }

    const sign = function(key, msg, hex) {
      if (hex) {
        return crypto
          .createHmac('sha256', key)
          .update(msg, 'utf8')
          .digest('hex')
      }
      return crypto.createHmac('sha256', key).update(msg, 'utf8')
    }

    const newDate = new Date()
    const timestamp = Math.ceil(newDate.getTime() / 1000)
    const ctype = 'application/json'
    const algorithm = 'TC3-HMAC-SHA256'
    const payload = JSON.stringify(req)
    const canonical_headers = util.format('content-type:%s\nhost:%s\n', ctype, hosts[service])
    const http_request_method = 'POST'
    const canonical_uri = '/'
    const canonical_querystring = ''
    const date = util.format(
      '%s-%s-%s',
      newDate.getFullYear(),
      PrefixInteger(newDate.getMonth() + 1, 2),
      PrefixInteger(newDate.getUTCDate(), 2)
    )

    const hashed_request_payload = crypto
      .createHash('sha256')
      .update(payload, 'utf8')
      .digest()
    const canonical_request =
      http_request_method +
      '\n' +
      canonical_uri +
      '\n' +
      canonical_querystring +
      '\n' +
      canonical_headers +
      '\n' +
      ApiSignedHeaders +
      '\n' +
      hashed_request_payload.toString('hex')

    const credential_scope = date + '/' + service + '/' + ApiTc3Request
    const hashed_canonical_request = crypto
      .createHash('sha256')
      .update(canonical_request, 'utf8')
      .digest()
    const string_to_sign =
      algorithm +
      '\n' +
      timestamp +
      '\n' +
      credential_scope +
      '\n' +
      hashed_canonical_request.toString('hex')

    const secret_date = sign('TC3' + secretKey, date, false)
    const secret_service = sign(new Buffer(secret_date.digest('hex'), 'hex'), service, false)
    const secret_signing = sign(
      new Buffer(secret_service.digest('hex'), 'hex'),
      ApiTc3Request,
      false
    )
    const signature = sign(new Buffer(secret_signing.digest('hex'), 'hex'), string_to_sign, true)

    return {
      host: hosts[service],
      version: ApiVersion,
      timestamp: timestamp,
      sign: util.format(
        '%s Credential=%s/%s, SignedHeaders=%s, Signature=%s',
        algorithm,
        secretId,
        credential_scope,
        ApiSignedHeaders,
        signature
      )
    }
  },

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
