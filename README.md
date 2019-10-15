# Serverless Framework

## 功能支持进度

| 指令              | 开发进度    |  备注      | 
| --------         | -----:   | :----:       | 
| Conf             | -        |   -          |
| Create           | 100%     |   增加PHP、Go、Python、Nodejs语言的模版    |
| Install          | 50%       |   优质例子添加 |
| Package          | 100%     |   本期沿用原生，未进行额外修改    |
| Deploy           |  100%      |   一期开发    |
| Deploy Function  | 100%       |   一期开发    |
| Deploy List      | 100%       |   一期开发    |
| Deploy List Functions      | 100%       |   一期增量开发    |
| Invoke           | 100%     |   一期开发    |
| Invoke Local     | 0%       |   一期增量开发 |
| Logs             | 100%     |   一期开发    |
| Login            | -        |   -    |
| Metrics          | 100%       |   一期增量开发 |
| Info             | 100%     |   一期开发    |
| Rollback         | 100%      |   一期增量开发 |
| Rollback Function| 0%       |   一期增量开发 |
| Remove           | 100%     |   一期开发    |
| Plugin List      | 100%     |   可以使用    |
| Plugin Search    | 100%     |   可以使用    |
| Plugin Install   | 100%     |   可以使用    |
| Plugin Uninstall | 100%     |   可以使用    |
| Print            | 100%     |   可以使用    |
| Serverless Stats | -        |   -    |

## 相关说明
* 目前部署函数只支持函数上传到COS，不支持非COS上传函数代码
* 所有重复设计：Options（传参）> 函数本身 > 全局变量
* Trigger部署说明：
```text
唯一标识：
Timer： TriggerName
APIGW: ServiceId + StageName + HttpMethod
COS: Bucket + Events + Filter
Ckafka : Name + Topic
CMQ: Name
Deploy Trigger逻辑：
判断现在的唯一表识和线上的是否一致：
不一致：创建触发器
一致：
    判断其他信息是否一致：
    一致：跳过
    不一致：删除现有的触发器，重新建立（修改逻辑）
```

## 测试版使用方法
* 新建文件夹（服务名为mytest）:```mkdir mytest```
* 进入文件夹：```cd mytest```
* 创建yaml文件：```vim serverless.yaml```
内容为：
```yaml
# Welcome to Serverless!
#
# This file is the main config file for your service.
# It's very minimal at this point and uses default values.
# You can always add more config options for more control.
# We've included some commented out config examples here.
# Just uncomment any of them to get that config option.
#
# For full config options, check the docs:
#    docs.serverless.com
#
# Happy Coding!

service: my-service # service name

provider: # provider information
  name: tencent
  runtime: python3.6
  credentials: ~/credentials

# you can overwrite defaults here
#  stage: dev
#  cosBucket: DEFAULT
#  role: QCS_SCFExcuteRole
#  memorySize: 256
#  timeout: 10
#  region: ap-shanghai
#  environment:
#    variables:
#      ENV_FIRST: env1
#      ENV_SECOND: env2

plugins:
  - serverless-tencent-cloudfunction

# you can add packaging information here
#package:
#  include:
#    - include-me.py
#    - include-me-dir/**
#  exclude:
#    - exclude-me.py
#    - exclude-me-dir/**


functions:
  function_one:
    handler: index.main_handler
#    description: Tencent Serverless Cloud Function
#    runtime: python3.6
#    memorySize: 256
#    timeout: 10
#    environment:
#      variables:
#        ENV_FIRST: env1
#        ENV_Third: env2
#    events:
#      - timer:
#          name: timer
#          parameters:
#            cronExpression: '*/5 * * * *'
#            enable: true
#      - cos:
#          name: cli-appid.cos.ap-beijing.myqcloud.com
#          parameters:
#            bucket: cli-appid.cos.ap-beijing.myqcloud.com
#            filter:
#              prefix: filterdir/
#              suffix: .jpg
#            events: cos:ObjectCreated:*
#            enable: true
#      - apigw:
#          name: hello_world_apigw
#          parameters:
#            stageName: release
#            serviceId:
#            httpMethod: ANY
#      - cmq:
#          name: cmq_trigger
#          parameters:
#            name: test-topic-queue
#            enable: true
#      - ckafka:
#          name: ckafka_trigger
#          parameters:
#            name: ckafka-2o10hua5
#            topic: test
#            maxMsgNum: 999
#            offset: latest
#            enable: true

```
* 建立index.py文件：```vim index.py```，内容为：
```python
# -*- coding: utf8 -*-


def main_handler(event, context):
    print(str(event))
    return "hello world"
```
* 建立node_modules文件夹，并将本项目放入其中
* 建立腾讯云鉴权文件，```vim ~/credentials```，内容为：
```txt
[default]
tencent_appid = appid
tencent_secret_id = secretid
tencent_secret_key = secretkey
```
* 然后就可以使用sls的基本功能了。

## 支持资源
### Runtime
* tencent-go1
* tencent-nodejs6
* tencent-nodejs8
* tencent-php5
* tencent-php7
* tencent-python2
* tencent-python3
### 支持触发器
* Timer
* APIGW
* COS
* CKAFKA
* CMQ


## 功能描述
### Deploy功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls deploy
Serverless: Packaging service...
Serverless: Uploading function my-service-dev-function_one package to cos[sls-cloudfunction-ap-guangzhou]. /Users/dfounderliu/Desktop/project/.serverless/my-service.zip
Serverless: Uploaded package successful /Users/dfounderliu/Desktop/project/.serverless/my-service.zip
Serverless: Uploading service to cos[sls-cloudfunction-ap-guangzhou].
Serverless: Uploaded service successful sls-cloudfunction-ap-guangzhou-1256773370.cos.ap-guangzhou.myqcloud.com/my-service-dev-HHRmZW-2019-10-14-20-10-29.json
Serverless: Creating function my-service-dev-function_one
Serverless: Created function my-service-dev-function_one
Serverless: Updating configure for function my-service-dev-function_one
Serverless: Setting tags for function my-service-dev-function_one
Serverless: Creating trigger for function my-service-dev-function_one
Serverless: Deployed function my-service-dev-function_one successful
Serverless: Uploading function my-service-dev-function_two package to cos[sls-cloudfunction-ap-guangzhou]. /Users/dfounderliu/Desktop/project/.serverless/my-service.zip
Serverless: Uploaded package successful /Users/dfounderliu/Desktop/project/.serverless/my-service.zip
Serverless: Uploading service to cos[sls-cloudfunction-ap-guangzhou].
Serverless: Uploaded service successful sls-cloudfunction-ap-guangzhou-1256773370.cos.ap-guangzhou.myqcloud.com/my-service-dev-HHRmZW-2019-10-14-20-10-29.json
Serverless: Creating function my-service-dev-function_two
Serverless: Created function my-service-dev-function_two
Serverless: Updating configure for function my-service-dev-function_two
Serverless: Setting tags for function my-service-dev-function_two
Serverless: Creating trigger for function my-service-dev-function_two
Serverless: Deployed function my-service-dev-function_two successful

```

### Deploy List功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls deploy list
Serverless: Listing deployments:
Serverless: -------------
Serverless: Timestamp: 1571083829
Serverless: Datetime: 2019-10-14T20:10:29.003Z
Serverless: Files:
Serverless: - my-service-dev-HHRmZW-2019-10-14-20-10-29.json
Serverless: - my-service-dev-HHRmZW-2019-10-14-20-10-29.zip

```
### Deploy List Functions功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls deploy list functions
Serverless: Listing functions:
Serverless: -------------
Serverless: my-service-dev-function_two: $LATEST
Serverless: my-service-dev-function_one: $LATEST
```
### print功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls print
service: mytest
provider:
  stage: dev
  region: ap-guangzhou
  name: tencent
  credentials: ~/credentials
  runtime: nodejs8.9
  cosBucket: DEFAULT
  role: QCS_SCFExcuteRole
  memorySize: 256
  timeout: 10
  apiGateway:
    serviceId: tapi-sadasd
  environment:
    variables:
      ENV_FIRST: env1
      ENV_SECOND: env2
  vpcConfig:
    vpcId: test
    subnetId: test
plugins:
  - serverless-tencent-cloudfunction
package:
  exclude:
    - package-lock.json
    - .gitignore
    - .git/**
    - node_modules/**
  include:
    - node_modules/moment/**
  excludeDevDependencies: false
functions:
  function_one:
    handler: index.main_handler
    description: Tencent Serverless Cloud Function
    runtime: python3.6
    memorySize: 256
    timeout: 10
```
### logs功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls logs -f hello_world -s dev
Serverless: Get function logs...
DFOUNDERLIU-MB0:project dfounderliu$ sls logs -f hello_world -s dev -t
Serverless: Get function logs...
Serverless: 
StartTime: 2019-10-14 17:05:08
RetMsg: "Hello World"
RequestId: b883ca3a-ee61-11e9-8f0c-5254008a4f10

Duration: 0.38
BillDuration: 100
MemUsage: 8777728

Log: START RequestId: b883ca3a-ee61-11e9-8f0c-5254008a4f10
Event RequestId: b883ca3a-ee61-11e9-8f0c-5254008a4f10
Received event: {
  "key1": "test value 1",
  "key2": "test value 2"
}
Received context: {'memory_limit_in_mb': 128, 'time_limit_in_ms': 3000, 'request_id': 'b883ca3a-ee61-11e9-8f0c-5254008a4f10', 'environ': 'TENCENTCLOUD_SECRETID=AKID-RJSKA34pPHerQNPb2-030cE_caXpMtfjM1kqs09yKQ_2oAWr5a_GBw-1A26xBjt;TENCENTCLOUD_SECRETKEY=9lKBQCWaVAMGdkh30LoM7eteHNSrpUul5aO4PWCZ7fA=;TENCENTCLOUD_SESSIONTOKEN=OiPtzs0X8hKr6zADUv8xasUtHu5vvacm9fe468ae112cff1a37c710db52817d13IziSvAcb9U0Tv-ODKJn7wMdVDZ3LgWQAZKWuV2wvSalMToEbwaDf_-E2AYc6ISD908AsQeIgUpeqSIIXA0twi146PyIH1e7WMzSrsvn3VeKlHU062mOC02wEEspf1E8UID4LpdvHwrR7cJSCO2_H6_wpwV1JKyzXF0cKVaRO5pZtMOq7goDu3kffLfFpHem5RNMRI3eHokkJBBjuklGPQuQTVC4lV0DfDFqwXjuW5MDfJsc0S-p64h50x6_FaDSnoyAwpydy68OQX3KX1FY0QeOKMt8JGdJ7woD2IkJIJPu1C6w5I-Szrg9Bg3Hb2BNU11iLkk8YdxebxehCalEM0UvJophDbg14ZfL_LTVci1Y;SCF_NAMESPACE=default', 'function_version': '$LATEST', 'function_name': 'my-service-dev-hello_world', 'namespace': 'default', 'get_remaining_time_in_millis': <function main.<locals>.<lambda> at 0x7f0918e87d90>}
Hello world

END RequestId: b883ca3a-ee61-11e9-8f0c-5254008a4f10
Report RequestId: b883ca3a-ee61-11e9-8f0c-5254008a4f10 Duration:0ms Memory:128MB MaxMemoryUsed:8.371094MB

```
### Metrics功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls metrics
Serverless: Service wide metrics
2019-10-13 16:47:44 - 2019-10-14 16:47:44

Service:
  Invocations: 11
  Outflows: 0
  Errors: 0
  Duration(avg.): 0.07390909090909091 ms

Functions: 
  my-service-dev-hello_world: 
    Invocations: 11
    Outflows: 0
    Errors: 0
    Duration(avg.): 0.07390909090909091 ms

  hello_world_test: 
    Invocations: 0
    Outflows: 0
    Errors: 0
    Duration(avg.): 0 ms

```
### Rollback功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls rollback -v
Serverless: Use a timestamp from the deploy list below to rollback to a specific version.
Run `sls rollback -t YourTimeStampHere`
Serverless: Listing deployments:
Serverless: -------------
Serverless: Timestamp: 1571083829
Serverless: Datetime: 2019-10-14T20:10:29.003Z
Serverless: Files:
Serverless: - my-service-dev-HHRmZW-2019-10-14-20-10-29.json
Serverless: - my-service-dev-HHRmZW-2019-10-14-20-10-29.zip
DFOUNDERLIU-MB0:project dfounderliu$ sls rollback -t 1571083829
Serverless: Rollback function my-service-dev-function_one
Serverless: Rollback function my-service-dev-function_one
Serverless: Rollback configure for function my-service-dev-function_one
Serverless: Setting tags for function my-service-dev-function_one
Serverless: Rollback trigger for function my-service-dev-function_one
Serverless: Deployed function my-service-dev-function_one successful
Serverless: Rollback function my-service-dev-function_two
Serverless: Rollback function my-service-dev-function_two
Serverless: Rollback configure for function my-service-dev-function_two
Serverless: Setting tags for function my-service-dev-function_two
Serverless: Rollback trigger for function my-service-dev-function_two
Serverless: Deployed function my-service-dev-function_two successful

```

### Invoke功能
```text
DFOUNDERLIU-MB0:project dfounderliu$ sls invoke -f hello_world
Serverless: 

"Hello World"

----------
Log: 
START RequestId: 954572f6-ee63-11e9-9103-5254008a4f10
Event RequestId: 954572f6-ee63-11e9-9103-5254008a4f10
Received event: {}
Received context: {'memory_limit_in_mb': 128, 'time_limit_in_ms': 3000, 'request_id': '954572f6-ee63-11e9-9103-5254008a4f10', 'environ': 'TENCENTCLOUD_SECRETID=AKID-RJSKA34pPHerQNPb2-030cE_caXpMtfjM1kqs09yKQ_2oAWr5a_GBw-1A26xBjt;TENCENTCLOUD_SECRETKEY=9lKBQCWaVAMGdkh30LoM7eteHNSrpUul5aO4PWCZ7fA=;TENCENTCLOUD_SESSIONTOKEN=OiPtzs0X8hKr6zADUv8xasUtHu5vvacm9fe468ae112cff1a37c710db52817d13IziSvAcb9U0Tv-ODKJn7wMdVDZ3LgWQAZKWuV2wvSalMToEbwaDf_-E2AYc6ISD908AsQeIgUpeqSIIXA0twi146PyIH1e7WMzSrsvn3VeKlHU062mOC02wEEspf1E8UID4LpdvHwrR7cJSCO2_H6_wpwV1JKyzXF0cKVaRO5pZtMOq7goDu3kffLfFpHem5RNMRI3eHokkJBBjuklGPQuQTVC4lV0DfDFqwXjuW5MDfJsc0S-p64h50x6_FaDSnoyAwpydy68OQX3KX1FY0QeOKMt8JGdJ7woD2IkJIJPu1C6w5I-Szrg9Bg3Hb2BNU11iLkk8YdxebxehCalEM0UvJophDbg14ZfL_LTVci1Y;SCF_NAMESPACE=default', 'function_version': '$LATEST', 'function_name': 'my-service-dev-hello_world', 'namespace': 'default', 'get_remaining_time_in_millis': <function main.<locals>.<lambda> at 0x7f0918e897b8>}
Hello world

END RequestId: 954572f6-ee63-11e9-9103-5254008a4f10
Report RequestId: 954572f6-ee63-11e9-9103-5254008a4f10 Duration:0.34ms Memory:128MB MaxMemoryUsed:8.375MB
```

## 相关资源获取

建立鉴权文件（配置文件）：
绝对地址，默认为 ~/credentials：
```text
[default]
tencent_appid = appid
tencent_secret_id = secretid
tencent_secret_key = secretkey
```

Serverless Framwork Yaml的完整内容（仅针对腾讯云）:
```yaml
service: mytest

provider:
  name: tencent
  credentials: ~/credentials # 绝对地址，默认为 ~/credentials
  stage: dev # 阶段，默认为 dev
  runtime: nodejs8.9 # 可以指定腾讯云Serverless Cloud Function支持的Runtime， 默认nodejs8.9
  cosBucket: DEFAULT # 可以指定，默认为DEFAULT: sls-cloudfunction-{region}
  role: QCS_SCFExcuteRole # 可以指定，默认是QCS_SCFExcuteRole
  memorySize: 256 # 默认256M，优先级：函数设置>全局设置>默认设置
  timeout: 10 # 默认10s，优先级：函数设置>全局设置>默认设置
  region: ap-guangzhou # 默认sp-guangzhou，优先级：函数设置>全局设置>默认设置
  apiGateway:
    serviceId: tapi-sadasd # 全局API网关serviceId
  environment: # 公共环境变量
    variables:
      ENV_FIRST: env1
      ENV_SECOND: env2
  vpcConfig:
    vpcId: test
    subnetId: test

plugins:
  - serverless-tencent-cloudfunction

package:
  exclude:
    - package-lock.json
    - .gitignore
    - .git/**
    - node_modules/** # exclude all node_modules....
  include:
    - node_modules/moment/** # except necessary ones
  excludeDevDependencies: false


functions:
  function_one:
    handler: index.main_handler
    description: Tencent Serverless Cloud Function
    runtime: python3.6
    memorySize: 256
    timeout: 10
    environment:
      variables:
        ENV_FIRST: env1
        ENV_Third: env2
    vpcConfig:
      vpcId: test
      subnetId: test
    events:
      - timer:
          name: timer
          parameters:
            cronExpression: '*/5 * * * *'
            enable: true
      - cos:
          name: cli-appid.cos.ap-beijing.myqcloud.com
          parameters:
            bucket: cli-appid.cos.ap-beijing.myqcloud.com
            filter:
              prefix: filterdir/
              suffix: .jpg
            events: cos:ObjectCreated:*
            enable: true
      - apigw:
          name: hello_world_apigw
          parameters:
            stageName: release
            serviceId:
            httpMethod: ANY
      - cmq:
          name: cmq_trigger
          parameters:
            name: test-topic-queue
            enable: true
      - ckafka:
          name: ckafka_trigger
          parameters:
            name: ckafka-2o10hua5
            topic: test
            maxMsgNum: 999
            offset: latest
            enable: true
  function_two:
    handler: index.main_handler
    description: Tencent Serverless Cloud Function
    runtime: python3.6
    memorySize: 256
    timeout: 10

```

转换方法：provider/tencentProvider/getServiceResource()
转换后的TSAM为：
```json
{
	"Service": "mytest",
	"Stage": "dev",
	"ServiceFileName": "mytest-dev-a3m7y8-2019-10-14-10-49-21.json",
	"CreateTime": "2019-10-14T10:49:21.415Z",
	"CreateTimestamp": 1571050161000,
	"Resources": {
		"default": {
			"Type": "TencentCloud::Serverless::Namespace",
			"function_one": {
				"Type": "TencentCloud::Serverless::Function",
				"Properties": {
					"CodeUri": {
						"Bucket": "sls-cloudfunction-ap-guangzhou-1256773370",
						"Key": "mytest-dev-a3m7y8-2019-10-14-10-49-21.zip"
					},
					"Type": "Event",
					"Description": "Tencent Serverless Cloud Function",
					"Role": "QCS_SCFExcuteRole",
					"Handler": "index.main_handler",
					"MemorySize": 256,
					"Timeout": 10,
					"Region": "ap-guangzhou",
					"Runtime": "python3.6",
					"Tags": {
						"CLI": "Serverless",
						"Application": "mytest",
						"Stage": "dev"
					},
					"Events": [{
						"timer": {
							"Type": "Timer",
							"Properties": {
								"CronExpression": "*/5 * * * *",
								"Enable": true
							}
						}
					}, {
						"cli-appid.cos.ap-beijing.myqcloud.com": {
							"Type": "COS",
							"Properties": {
								"Bucket": "cli-appid.cos.ap-beijing.myqcloud.com",
								"Events": "cos:ObjectCreated:*",
								"Enable": true,
								"Filter": {
									"Prefix": "filterdir/",
									"Suffix": ".jpg"
								}
							}
						}
					}, {
						"hello_world_apigw": {
							"Type": "APIGW",
							"Properties": {
								"StageName": "release",
								"HttpMethod": "ANY",
								"ServiceId": "",
								"Enable": true
							}
						}
					}, {
						"cmq_trigger": {
							"Type": "CMQ",
							"Properties": {
								"Name": "test-topic-queue",
								"Enable": true
							}
						}
					}, {
						"ckafka_trigger": {
							"Type": "Ckafka",
							"Properties": {
								"MaxMsgNum": 999,
								"Offset": "latest",
								"Enable": true
							}
						}
					}]
				},
				"VpcConfig": {
					"VpcId": "test",
					"SubnetId": "test"
				},
				"Environment": {
					"Variables": {
						"ENV_FIRST": "env1",
						"ENV_SECOND": "env2",
						"ENV_Third": "env2"
					}
				}
			},
			"function_two": {
				"Type": "TencentCloud::Serverless::Function",
				"Properties": {
					"CodeUri": {
						"Bucket": "sls-cloudfunction-ap-guangzhou-1256773370",
						"Key": "mytest-dev-a3m7y8-2019-10-14-10-49-21.zip"
					},
					"Type": "Event",
					"Description": "Tencent Serverless Cloud Function",
					"Role": "QCS_SCFExcuteRole",
					"Handler": "index.main_handler",
					"MemorySize": 256,
					"Timeout": 10,
					"Region": "ap-guangzhou",
					"Runtime": "python3.6",
					"Tags": {
						"CLI": "Serverless",
						"Application": "mytest",
						"Stage": "dev"
					}
				},
				"VpcConfig": {
					"VpcId": "test",
					"SubnetId": "test"
				},
				"Environment": {
					"Variables": {
						"ENV_FIRST": "env1",
						"ENV_SECOND": "env2",
						"ENV_Third": "env2"
					}
				}
			}
		}
	}
}
```
