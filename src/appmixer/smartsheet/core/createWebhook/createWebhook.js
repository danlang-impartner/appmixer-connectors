'use strict';

const lib = require('../../lib');

module.exports = {

    receive: async function(context) {

        const { data } = await this.httpRequest(context);

        return context.sendJson(data, 'out');
    },

    httpRequest: async function(context) {

        // eslint-disable-next-line no-unused-vars
        const input = context.messages.in.content;

        let url = lib.getBaseUrl(context) + '/webhooks';

        const headers = {};

        const inputMapping = {
            'callbackUrl': input['callbackUrl'],
            'enabled': input['enabled'],
            'events': input['events'],
            'name': input['name'],
            'version': input['version'],
            'id': input['id'],
            'apiClientId': input['apiClientId'],
            'scopeObjectId': input['scopeObjectId'],
            'apiClientName': input['apiClientName'],
            'createdAt': input['createdAt'],
            'disabledDetails': input['disabledDetails'],
            'modifiedAt': input['modifiedAt'],
            'scope': input['scope'],
            'sharedSecret': input['sharedSecret'],
            'status': input['status'],
            'stats.lastCallbackAttempt': input['stats|lastCallbackAttempt'],
            'stats.lastCallbackAttemptRetryCount': input['stats|lastCallbackAttemptRetryCount'],
            'stats.lastSuccessfulCallback': input['stats|lastSuccessfulCallback'],
            'subscope.columnIds': input['subscope|columnIds']
        };
        let requestBody = {};
        lib.setProperties(requestBody, inputMapping);

        headers['Authorization'] = 'Bearer ' + context.auth.accessToken;

        const req = {
            url: url,
            method: 'POST',
            data: requestBody,
            headers: headers
        };

        try {
            const response = await context.httpRequest(req);
            const log = {
                step: 'http-request-success',
                request: {
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: req.data
                },
                response: {
                    data: response.data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                }
            };
            await context.log(log);
            return response;
        } catch (err) {
            const log = {
                step: 'http-request-error',
                request: {
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: req.data
                },
                response: err.response ? {
                    data: err.response.data,
                    status: err.response.status,
                    statusText: err.response.statusText,
                    headers: err.response.headers
                } : undefined
            };
            await context.log(log);
            throw err;
        }
    }

};
