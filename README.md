[![npm version](https://badge.fury.io/js/serverless-tencent-scf.svg)](https://badge.fury.io/js/serverless-tencent-scf)
[![Build Status](https://api.travis-ci.org/serverless-tencent/serverless-tencent-scf.svg?branch=testing)](https://api.travis-ci.org/serverless-tencent/serverless-tencent-scf)

[![Serverless Framework Tencent Cloud Plugin](https://s3.amazonaws.com/assets.github.serverless/github_readme_serverless_plugin_tencent.png)](http://serverless.com)

Serverless Framework 是业界最受欢迎的无服务器应用框架，开发者无需关心底层资源即可部署完整可用的 Serverless 应用架构。Serverless Framework 具有资源编排、自动伸缩、事件驱动等能力，覆盖编码 - 调试 - 测试 - 部署等全生命周期。帮助开发者通过联动云资源，迅速地构建 serverless 应用。



# 目录
* [主要功能](#主要功能)
* [环境准备](#环境准备)
* [配置账号](#配置账号)
* [新建项目](#新建项目)
* [打包服务](#打包服务)
* [服务部署](#服务部署)
* [函数部署](#函数部署)
* [部署列表](#部署列表)
* [回滚服务](#回滚服务)
* [获取详情](#获取详情)
* [云端调用](#云端调用)
* [数据统计](#数据统计)
* [常见问题](#常见问题)



## 主要功能

### 应用级框架
Serverless Framework 提供贴合应用场景的框架，开发者根据实际需求选择对应框架后，只需专注于业务逻辑的开发，无需关注底层资源。

### 便捷部署
开发者部署应用时，Serverless Framework 会根据应用特性，自动完成云函数，API 网关，COS 等基础资源的部署和配置。开发者无需再手动部署配置每一项基础资源。



# 环境准备

- 已安装 `npm`  ，如果未安装，可前往[Node.js官网](https://nodejs.org/)下载对应平台的安装程序，版本要求 ： Node6 +。安装完成后，执行 `npm -v` 确认是否安装成功。



## 安装 CLI

执行以下命令安装/更新 CLI ：

```
# 安装 CLI
npm install -g serverless
```



## 升级 CLI

如果已安装过 CLI ，则可以执行以下命令更新：

```
npm update -g serverless
```

# 配置账号

如果您是首次使用云函数产品，需要前往控制台配置角色授权。

## 前提条件

- 已注册腾讯云账户。若未注册腾讯云账户，可 [点此](https://cloud.tencent.com/register) 进入注册页面。

- 已登录 [云函数控制台](https://console.cloud.tencent.com/scf)。



## 配置文件

- APPID。通过访问控制台中的【账号中心】>【[账号信息](https://console.cloud.tencent.com/developer)】，可以查询到您的账号 ID。
- SecretID 及 SecretKey：指云 API 的密钥 ID 和密钥 Key。您可以通过登录【[访问管理控制台](https://console.cloud.tencent.com/cam/overview)】，选择【云 API 密钥】>【[API 密钥管理](https://console.cloud.tencent.com/cam/capi)】，获取相关密钥或创建相关密钥。

新建文件将账号信息写入 ：

```ini
[default]
tencent_appid = appid
tencent_secret_id = secretid
tencent_secret_key = secretkey
```

如，我们将该文件命名为`credentials` ，并放入 `~`目录。



## 使用配置

如果已经在本地创建了 serverless 示例模板，则打开模板项目里的 `serverless.yml` 文件，引用配置文件：

```
provider: 
  name: tencent
  runtime: python3.6
  credentials: ~/credentials
```


# 新建项目

项目模板： 

https://github.com/serverless-tencent/serverless-tencent-scf/tree/master/create/template

# 打包服务

## 简介

您可以使用`sls package`命令将您的项目代码打包成部署包，会默认生成到项目目录下的 .serverless 目录。您可以通过追加`--package`参数指定打包目录。

```
serverless package
```



## 参数说明

- `--stage` 或`-s`  目标部署环境，您可以自定义指定诸如`dev`，`pro` 等环境参数，默认为`dev`。部署后，环境参数将追加至云函数名之后，且会作为云函数的标签。
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`
- `--package`或`-p` 自定义部署包目录



## 示例

### 默认打包

```
serverless package
```

执行以上命令，将会默认指定目标部署 stage (dev) 和 region（ap-guangzhou），部署包会生成在您项目下的 .serverless 目录。



### 指定区域和环境

```
serverless package --stage pro --region ap-shanghai
```

执行以上命令，将会指定目标部署stage (pro) 和 region（ap-shanghai），部署包会生成在您项目下的 .serverless 目录。



### 指定目录

```
serverless package --package /path/to/package/directory
```

执行以上命令，将会指定目标部署stage (dev) 和 region（ap-guangzhou），部署包会生成在目录`/path/to/package/directory` 。



# 服务部署

## 简介

您可以使用`sls deploy`命令部署您的整个服务，当您的服务架构有更新时（如，您修改了 serverless.yaml）您可执行该命令。如果您的云函数代码有变更，您想快速上传或者您想更新云函数配置，您可以使用`serverless deploy function -f myFunction` 命令。

```
serverless deploy
```



## 参数说明

- `--config` 或`-c`  自定义配置文件名（除`serverless.yml.yaml|.js|.json`之外）
- `--stage`或 `-s`目标部署环境，默认为`dev`
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`
- `--package`或`-p` 自定义部署包路径，指定后将跳过打包步骤
- `--force`强制部署，升级情况下，默认升级代码和配置，触发器默认不升级。加了--force参数会进行触发器的升级
- `--function`或 `-f` 执行 `deploy function`（见上方描述），不可以和`--package`共用



## 说明

执行`serverless deploy`后，Serverless Framework 会先执行 `serverless package` 然后进行部署。

部署时，会在您的账号下自动生成 [COS bucket](https://console.cloud.tencent.com/cos5/bucket) 并存储部署包。

## 示例

### 默认部署

```
serverless deploy
```

执行以上命令，将会部署至 stage (dev) 和 region（ap-guangzhou）。



### 指定区域和环境

```
serverless deploy --stage pro --region ap-shanghai
```

执行以上命令，将会部署至 stage (pro) 和 region（ap-shanghai）。



### 指定部署包

```
serverless deploy --package /path/to/package/directory
```

执行以上命令，将会跳过打包步骤，使用`/path/to/package/directory` 下的部署包进行部署。

# 函数部署

## 简介

您可以使用`sls deploy function`命令部署您的某个云函数，当您的云函数代码有变更，您想快速上传或者您想更新云函数配置，您可以使用该命令。

```
serverless deploy function -f functionName
```



## 参数说明

- `--function`或 `-f` 部署函数名
- `--stage`或 `-s`目标部署环境，默认为`dev`
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`



## 示例

### 默认部署

```
serverless deploy function --function helloWorld
```

执行以上命令，将会部署函数至 stage (dev) 和 region（ap-guangzhou）。



### 指定区域和环境

```
serverless deploy function --function helloWorld --stage pro --region ap-shanghai
```

执行以上命令，将会部署至 stage (pro) 和 region（ap-shanghai）。

# 部署列表

## 简介

您可以使用`sls deploy list [function]`命令查询您的部署信息。

如果想要查看您 COS bucket 里的部署包信息，您可以执行 `serverless deploy list`；

如果您想要查看已经部署的云函数信息，您可以执行`serverless deploy list functions`.

这些展示信息在您想要使用回滚功能`serverless rollback`时会用到。




## 参数说明

- `--stage`或 `-s`目标部署环境，默认为`dev`
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`



## 示例

### 部署列表

```
serverless deploy list
```



### 部署函数列表

```
serverless deploy list functions
```

执行上述命令，您可以获取已部署的函数名和版本信息。


# 回滚服务

## 简介

回滚已部署的服务版本。

```
serverless rollback --timestamp timestamp
```

执行回滚前可以通过`sls rollback -v` 获取已部署的历史版本时间戳。

## 参数说明

- `--timestamp` 或 `-t` 已部署的历史版本时间戳。
- `--verbose`或 `-v` 获取历史部署版本



## 示例

您可以先执行`sls rollback -v` 获取您在 COS 里的历史部署版本，然后指定某一版本进行回滚。

```
$ sls rollback -v
$ sls rollback -t 1571240207
```

# 获取详情

## 简介

查看云端已部署服务的详细信息: 环境，区域，函数列表

```
serverless info
```



## 参数说明

- `--stage`或 `-s`目标部署环境，如果未指定，则会读取 `serverless.yaml` 里的 `stage` 信息，如果没有，则默认为`dev`
- `--region`或`-r` 目标部署区域，如果未指定，则会读取 `serverless.yaml` 里的 `region` 信息，如果没有，默认为 `ap-guangzhou`



## 示例

**注意：函数调用和运行数据生成之间会有一些延时，函数调用之后几秒才能获取对应数据。**



### 获取默认运行数据

```
serverless metrics
```

执行上述命令，获取服务最近 24 小时运行数据统计。

### 获取指定时段运行数据

```
serverless metrics --startTime 2019-01-01 --endTime 2019-01-02
```

执行上述命令，获取 2019-01-01 至 2019-01-02 的服务运行数据。

### 获取函数运行数据

```
serverless metrics --function hello
```

执行上述命令，获取最近 24 小时的函数 `hello` 运行数据。

### 获取指定时段函数运行数据

```
serverless metrics --function hello --startTime 2019-01-01 --endTime 2019-01-02
```

执行上述命令，获取 2019-01-01 至 2019-01-02 的函数 `hello` 运行数据。

# 日志查看

## 简介

查看云端函数运行日志。

```
serverless logs -f hello

# 查看实时最新日志可以追加参数 -t
serverless logs -f hello -t
```



## 参数说明

- `--function` 或 `-f` 已部署的云函数名。 【必填】
- `--stage`或 `-s`目标部署环境，如果未指定，则会读取 `serverless.yaml` 里的 `stage` 信息，如果没有，则默认为`dev`
- `--region`或`-r` 目标部署区域，如果未指定，则会读取 `serverless.yaml` 里的 `region` 信息，如果没有，默认为 `ap-guangzhou`

- `--startTime`  日志开始时间 ，如`"2019-7-12 00:00:00"`
- `--tail` 或 `-t`  实时获取最新日志
- `--interval`  日志输出间隔，当您启用了 tail 功能，您可以控制日志输出频率，默认是 1000 ms 。


## 示例

### 获取默认日志

```
serverless logs -f hello
```

执行上述命令，获取云函数`hello`最近十分钟的调用日志。

### 实时日志

```
serverless logs -f hello -t
```

执行上述命令，获取 10 秒前的日志，并每 10 秒更新一次日志。

# 删除服务

## 简介

您可以使用`sls remove`命令删除您部署的服务。

```
serverless remove
```



## 参数说明

- `--stage`或 `-s`目标部署环境，默认为`dev`
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`



## 示例

### 删除指定环境和区域的服务

```
serverless remove --stage dev --region ap-guangzhou
```

执行上述命令，删除当前工作区定义的已部署至 stage (dev) 和 region（ap-guangzhou）的服务。

# 云端调用

## 简介

调用已部署的云函数，支持发送测试数据到云函数，返回函数日志并展示其他调用关键信息。

```
serverless invoke --function functionName
```



## 参数说明

- `--function` 或 `-f` 已部署到云函数名。 【必填】
- `--stage`或 `-s`目标部署环境，默认为`dev`
- `--region`或`-r` 目标部署区域，默认为 `ap-guangzhou`




## 示例

### 调用指定函数

```
serverless invoke --function functionName --stage dev --region ap-guangzhou
```

执行上述命令，调用已部署至广州区域的 `dev` 环境下的 `functionName` 函数，调用结果将输出至终端。

# 数据统计

## 简介

查看云端函数运行数据。

```
serverless metrics
```



## 参数说明

- `--function` 或 `-f` 已部署到云函数名。 【必填】
- `--stage`或 `-s`目标部署环境，如果未指定，则会读取 `serverless.yaml` 里的 `stage` 信息，如果没有，则默认为`dev`
- `--region`或`-r` 目标部署区域，如果未指定，则会读取 `serverless.yaml` 里的 `region` 信息，如果没有，默认为 `ap-guangzhou`

- `--startTime`  函数运行开始时间 ，如`"2019-7-12 00:00:00"`
- `--endTime`  函数运行结束时间 ，如`"2019-7-12 00:10:00"`



## 示例

**注意：函数调用和运行数据生成之间会有一些延时，函数调用之后几秒才能获取对应数据。**



### 获取默认运行数据

```
serverless metrics
```

执行上述命令，获取服务最近 24 小时运行数据统计。

### 获取指定时段运行数据

```
serverless metrics --startTime 2019-01-01 --endTime 2019-01-02
```

执行上述命令，获取 2019-01-01 至 2019-01-02 的服务运行数据。

### 获取函数运行数据

```
serverless metrics --function hello
```

执行上述命令，获取最近 24 小时的函数 `hello` 运行数据。

### 获取指定时段函数运行数据

```
serverless metrics --function hello --startTime 2019-01-01 --endTime 2019-01-02
```

执行上述命令，获取 2019-01-01 至 2019-01-02 的函数 `hello` 运行数据。











# 常见问题

### Serverless Framework 和 云函数 SCF 的区别
云函数（Serverless Cloud Function，SCF）是腾讯云为企业和开发者们提供的无服务器执行环境，帮助您在无需购买和管理服务器的情况下运行代码 。
Serverless Framework 是无服务器应用框架，提供将云函数 SCF ，API 网关，DB 等资源组合的业务框架，开发者可以直接基于框架编写业务逻辑，而无需关注底层资源的配置和管理。

### Serverless Framework 提供了哪些应用框架
目前已提供 REST API 和 基础 website ，更多贴合实际应用场景的框架在持续输出中。

### 云函数执行超时怎么处理？

超时客户端会直接断开连接并报错，建议控制函数执行时间，尽量不要把耗时长的操作放在客户端直接调用的云函数内。

### 云函数内置模块怎么使用？

云函数内置模块已经集成于运行环境，可以直接使用。
如果内置模块的版本不能满足需求，可以自行安装模块到云函数内，默认会被优先使用。
目前已支持的内置模块为 request 2.87.1 。

### 云函数测试时，部分日志丢失了？

- 云函数测试时，如果以同步调用的方式（超时时间小于 20 秒），返回的日志最多为 4k，超过 4k 的日志不显示。
- 如果以异步调用的方式（超时时间大于或等于 20 秒），返回的日志最多为 6M，超过 6M 的日志不显示。



