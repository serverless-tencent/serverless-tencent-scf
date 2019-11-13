'use strict';
const url = require('url')
const http = require('http')

const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Server': 'cws',
}


const HttpCode = {
    Ok: 200,
    NotFound: 404,
    ErrInternal: 500
}

class EasyHttpServer {
    // private host: string;
    // private port: number;
    // private routes: any|null;
    // private handler: any|null;
    // private isStop: boolean;
    constructor(host, port) {
        this.host = host || '127.0.0.1';
        this.port = port || 19527;
        this.handler = null;
        this.routes = {};
        this.isStop = true;
    }

    stop() {
        this.isStop = true;
        this.handler.close();
    }

    run() {
        const self = this;
        if (!this.isStop) 
            return
        this.isStop = false;
        this.handler = http.createServer(function (request, response) {
            self.routine(request, response);
        }).listen(this.port, this.host);
        
    }

    async routine(request, response) {
        let urlPath = request.url;
        let httpCode = HttpCode.Ok;
        const idx = request.url.indexOf('?');
        if (idx != -1)
            urlPath = urlPath.substr(0, idx);
        request.query = url.parse(request.url, true).query;
        const cb = this.routes[request.method + urlPath];
        let result;
        try {
            if (cb){
                result = await cb(request, response, this);
                httpCode = result ? result.code : httpCode;
            }
            else { 
                httpCode = HttpCode.NotFound;
                result = {
                    body: 'Not found'
                };
            }
        } catch (e) {
            console.error(e.message);
            httpCode = HttpCode.ErrInternal;
            result = {
                body: e.message,
                code: httpCode,
            }
            // this.stop();
        }

        let body;
        let headers = {
            'Content-Type': 'text/plain',
        };
        for (let key in defaultHeaders) {
            headers[key] = defaultHeaders[key];
        }
        if (result && result.body) {   
            if (typeof(result.body) == 'object') {  
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(result.body);
            } else 
                body = result.body;
            response.writeHead(httpCode, headers);
            response.end(body);
        }
    }

    addRoute(method, url, cb) {
        if (typeof(cb) != 'function') 
            return false;
        this.routes[method + url] = cb;
        return true;
    }
}

module.exports = EasyHttpServer;