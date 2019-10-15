'use strict';
const tencentcloud    = require('tencentcloud-sdk-nodejs');
const AbstractHandler = require('../../shared/handler');
const models          = tencentcloud.scf.v20180416.Models;
const _               = require('lodash');


const Constants = {
    ScfTriggerTypeTimer: 'timer',
    ScfTriggerTypeApigw: 'apigw',
    ScfTriggerTypeCos: 'cos',
    ScfTriggerTypeCmq: 'cmq',
    ScfTriggerTypeCkafka: 'ckafka',
}

class DeployTrigger extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async create(ns, oldEvents, funcObject, successFunc, failedFunc) {
       
        const triggers = funcObject.Properties.Events;
        const triggerResults = [];
        
        const len = _.size(triggers);
        for (let i = 0; i < len; i++) {
            if (_.isEmpty(triggers[i])) continue;

            const keys = Object.keys(triggers[i]);
            const trigger = triggers[i][keys[0]];
            const triggerName = keys[0];

            trigger.Type = trigger.Type.toString().toLocaleLowerCase();
            const oldEvent = _.find(oldEvents, (event) => {
                if (event.TriggerName == triggerName && event.Type == trigger.Type)
                    return event;
            });

            // trigger not changed
            if (!_.isEmpty(oldEvent) && !this._isChanged(trigger, oldEvent)) 
                continue;

            const args = {
                Type: trigger.Type,
                TriggerName: triggerName,
                FunctionName: funcObject.FuncName,
                Region: this.options.region,
                Namespace: ns
            };

            if (trigger.Properties.Enable) 
                args.Enable = 'OPEN';
            else 
                args.Enable = 'CLOSE';

            let desc;
            switch (args.Type) {
                case Constants.ScfTriggerTypeTimer:
                    args.TriggerDesc = trigger.Properties.CronExpression;
                    break;
                case Constants.ScfTriggerTypeApigw:
                    desc = {
                        api: {
                            authRequired: "FALSE",
                            requestConfig: {
                                method: trigger.Properties.HttpMethod || 'GET'
                            },
                            isIntegratedResponse: trigger.Properties.IntegratedResponse ? 'TRUE' : 'FALSE'
                        },
                        service: {
                            serviceName: "SCF_API_SERVICE"
                        },
                        release: {
                            environmentName: trigger.Properties.StageName || 'release'
                        }
                    };
                    if (trigger.Properties.ServiceId) {
                        delete desc.service.serviceName;
                        desc.service.serviceId = trigger.Properties.ServiceId;
                    }

                    args.TriggerDesc = JSON.stringify(desc);
                    break;
                case Constants.ScfTriggerTypeCkafka:
                    if (triggerName != trigger.Properties.Name) {
                        if (failedFunc && _.isFunction(failedFunc))
                            failedFunc(`create trigger ${triggerName} failed, 触发器名称不符合规范 (triggerName 应为消息队列 CKafka ID)`, trigger);
                        continue;
                    }
                    if (!(trigger.Properties.MaxMsgNum > 1 && trigger.Properties.MaxMsgNum < 1000)) {
                        if (failedFunc && _.isFunction(failedFunc))
                            failedFunc(`create trigger ${triggerName} failed, 最大批量消息数，范围1 - 1000`, trigger);
                        continue;
                    }

                    desc = {
                        maxMsgNum: trigger.Properties.MaxMsgNum.toString(),
                        offset: trigger.Properties.Offset || 'latest'
                    }
                    args.TriggerName = util.format('%s-%s', trigger.Properties.Name, trigger.Properties.Topic);
                    args.TriggerDesc = JSON.stringify(desc);
                    break;
                case Constants.ScfTriggerTypeCmq:
                    if (triggerName != trigger.Properties.Name) {
                        if (failedFunc && _.isFunction(failedFunc))
                            failedFunc(`create trigger ${triggerName} failed, 触发器名称不符合规范 (triggerName 应为CMQ名称)`, trigger);
                        continue;
                    }
                    break;
                case Constants.ScfTriggerTypeCos:
                    desc = {
                        event: trigger.Properties.Events,
                        filter: {
                            Prefix: trigger.Properties.Filter.Prefix || '',
                            Suffix: trigger.Properties.Filter.Suffix || ''
                        }
                    }
                    if (triggerName != trigger.Properties.Bucket) {
                        if (failedFunc && _.isFunction(failedFunc))
                            failedFunc(`create trigger ${triggerName} failed, 触发器名称不符合规范 (triggerName 格式应为: <BucketName-APPID>.cos.<Region>.myqcloud.com)`, trigger);
                        continue;
                    }
                    
                    args.TriggerDesc = JSON.stringify(desc);
                    break;
            }
            const respAddTrigger = await this.request(this.scfClient, 'CreateTrigger', args);
            triggerResults.push(respAddTrigger);
            if (successFunc && _.isFunction(successFunc))
                successFunc(respAddTrigger.TriggerInfo, trigger);
        }
        return triggerResults;
    }

    _isChanged(trigger, oldEvent) {
        const triggerDesc = JSON.parse(oldEvent.TriggerDesc);
        const triggerEnable = (oldEvent.Enable == 1 ? true : false);

        let changed = false;
        switch(trigger.Type.toLocaleLowerCase()) {
            case Constants.ScfTriggerTypeApigw:
                if (triggerDesc.service.serviceId && 
                    trigger.Properties.ServiceId == triggerDesc.service.serviceId && 
                    // trigger.Properties.Enable == triggerEnable &&
                    trigger.Properties.HttpMethod == triggerDesc.api.requestConfig.method) {
                    this.logger(`trigger no changed, service id ${trigger.Properties.ServiceId}, url ${triggerDesc.service.subDomain}`)
                    break;
                }
                changed = true;
                break;
            case Constants.ScfTriggerTypeTimer:
            case Constants.ScfTriggerTypeCmq:
                changed = true;
                break;

            case Constants.ScfTriggerTypeCos:
                if (trigger.Properties.Events == triggerDesc.event &&
                    trigger.Properties.Filter.Prefix == triggerDesc.filter.Prefix &&
                    trigger.Properties.Filter.Suffix == triggerDesc.filter.Suffix &&
                    trigger.Properties.Enable == triggerEnable) {
                    this.logger('trigger %s:%s not changed', oldEvent.TriggerName, oldEvent.Type);
                    break;
                }
                changed = true;
                break;
            case Constants.ScfTriggerTypeCkafka:
                // ckafka not support enable/disable
                if (trigger.Properties.Topic == triggerDesc.topicName && 
                    trigger.Properties.MaxMsgNum == triggerDesc.maxMsgNum &&
                    (trigger.Properties.Offset ? trigger.Properties.Offset == triggerDesc.offset : true)) {
                    this.logger('trigger %s:%s not changed', oldEvent.TriggerName, oldEvent.Type);
                    break;
                }
                changed = true;
                break;
        }
        return changed;
    }
}

module.exports = DeployTrigger;