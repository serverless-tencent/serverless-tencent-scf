'use strict';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AbstractHandler = require('../../shared/handler');
const scf_models = tencentcloud.scf.v20180416.Models;
const monitor_models = tencentcloud.monitor.v20180724.Models;

class MetricsFunction extends AbstractHandler {
    constructor(appid, secret_id, secret_key, options) {
        super(appid, secret_id, secret_key, options);
    }

    async functionList(service, stage) {
        return new Promise((done) => {
            const req = new scf_models.ListFunctionsRequest();
            let filters = {
                Namespace: "default",
                Filters: [
                    {
                        Name: "tag-Application",
                        Values: [service,]
                    },
                    {
                        Name: "tag-Stage",
                        Values: [stage,]
                    }
                ]
            };
            req.from_json_string(JSON.stringify(filters));
            this.scfClient.ListFunctions(req, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }

    async getMonitor(functionName, metricName, startTime, endTime) {
        return new Promise((done) => {
            const req = new monitor_models.GetMonitorDataRequest();
            let body = {
                "Namespace": "QCE/SCF_V2",
                "MetricName": metricName,
                "StartTime": startTime,
                "EndTime": endTime,
                "Instances": [{
                    "Dimensions": [
                        {
                            "Name": "functionName",
                            "Value": functionName
                        },
                        {
                            "Name": "namespace",
                            "Value": "default"
                        },
                        {
                            "Name": "version",
                            "Value": "$LATEST"
                        }]
                }]
            };
            req.from_json_string(JSON.stringify(body));
            this.monitorClient.GetMonitorData(req, (err, response) => {
                if (err)
                    throw err;
                done(response);
            });
        });
    }
}

module.exports = MetricsFunction;
