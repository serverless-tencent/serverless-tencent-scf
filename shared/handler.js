const tencentcloudCos = require('cos-nodejs-sdk-v5')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const ClientProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/client_profile.js')
const HttpProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/http_profile.js')
const assert = require('assert')
const { Credential } = tencentcloud.common
const ScfClient = tencentcloud.scf.v20180416.Client
const TagClient = tencentcloud.tag.v20180813.Client
const CamClient = tencentcloud.cam.v20190116.Client
const MonitorClinet = tencentcloud.monitor.v20180724.Client

class AbstractHandler {
  constructor(options, serverless) {
    const { credentials, region } = options
    const { tencent_appid, tencent_secret_id, tencent_secret_key } = credentials
    this.options = options
    this.serverless = serverless
    this.appid = tencent_appid
    this.secret_id = tencent_secret_id
    this.secret_key = tencent_secret_key

    assert(options, 'Options should not is empty')

    this._scfClient = AbstractHandler.createScfClient(
      tencent_secret_id,
      tencent_secret_key,
      options
    )
    this._camClient = AbstractHandler.createCamClient(
      tencent_secret_id,
      tencent_secret_key,
      options
    )
    this._cosClient = AbstractHandler.createCosClient(
      tencent_secret_id,
      tencent_secret_key,
      options
    )
    this._tagClient = AbstractHandler.createTagClient(
      tencent_secret_id,
      tencent_secret_key,
      options
    )
    this._monitorClient = AbstractHandler.createMonitorClient(
      tencent_secret_id,
      tencent_secret_key,
      options
    )
  }

  static getClientInfo(secret_id, secret_key, options) {
    const cred = options.token
      ? new Credential(secret_id, secret_key, options.token)
      : new Credential(secret_id, secret_key)
    const httpProfile = new HttpProfile()
    httpProfile.reqTimeout = 60
    const clientProfile = new ClientProfile('HmacSHA256', httpProfile)
    assert(options.region, 'Region should not is empty')
    return {
      cred: cred,
      region: options.region,
      clientProfile: clientProfile
    }
  }

  static createTagClient(secret_id, secret_key, options) {
    const info = this.getClientInfo(secret_id, secret_key, options)
    const tagCli = new TagClient(info.cred, info.region, info.clientProfile)
    tagCli.sdkVersion = 'ServerlessFramework'
    return tagCli
  }

  static createScfClient(secret_id, secret_key, options) {
    const info = this.getClientInfo(secret_id, secret_key, options)
    const scfCli = new ScfClient(info.cred, info.region, info.clientProfile)
    scfCli.sdkVersion = 'ServerlessFramework'
    return scfCli
  }

  static createCamClient(secret_id, secret_key, options) {
    const info = this.getClientInfo(secret_id, secret_key, options)
    const camCli = new CamClient(info.cred, info.region, info.clientProfile)
    camCli.sdkVersion = 'ServerlessFramework'
    return camCli
  }

  static createMonitorClient(secret_id, secret_key, options) {
    const info = this.getClientInfo(secret_id, secret_key, options)
    const monitorCli = new MonitorClinet(info.cred, info.region, info.clientProfile)
    monitorCli.sdkVersion = 'ServerlessFramework'
    return monitorCli
  }

  static createCosClient(secret_id, secret_key, options) {
    const fileParallelLimit = options.fileParallelLimit || 5
    const chunkParallelLimit = options.chunkParallelLimit || 8
    const chunkSize = options.chunkSize || 1024 * 1024 * 8
    const timeout = options.timeout || 120

    return new tencentcloudCos({
      SecretId: secret_id,
      SecretKey: secret_key,
      FileParallelLimit: fileParallelLimit,
      ChunkParallelLimit: chunkParallelLimit,
      ChunkSize: chunkSize,
      Timeout: timeout * 1000,
      TmpSecretId: secret_id,
      TmpSecretKey: secret_key,
      XCosSecurityToken: options.token,
      ExpiredTime: options.timestamp
    })
  }

  get monitorClient() {
    return this._monitorClient
  }

  get cosClient() {
    return this._cosClient
  }

  get tagClient() {
    return this._tagClient
  }

  get scfClient() {
    return this._scfClient
  }

  get camClient() {
    return this._camClient
  }
}

module.exports = AbstractHandler
