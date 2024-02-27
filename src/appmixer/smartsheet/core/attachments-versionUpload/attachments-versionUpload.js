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

        let url = lib.getBaseUrl(context) + `/sheets/${input['sheetId']}/attachments/${input['attachmentId']}/versions`;

        const headers = {};

        const inputMapping = {
            'name': input['name'],
            'filename': input['filename']
        };
        let requestBody = {};
        lib.setProperties(requestBody, inputMapping);

        // Request media type is multipart/form-data. Convert body to FormData object.

        const fileUploadProperties = {
            'name': false,
            'filename': true
        };

        const form = new lib.FormData;
        for (const propertyName of Object.keys(requestBody || {})) {
            const propertyValue = requestBody[propertyName];

            if (fileUploadProperties[propertyName]) {
                const fileInfo = await context.getFileInfo(propertyValue);
                const fileStream = await context.getFileReadStream(propertyValue);
                // Note that since we're uploading using the GridFSBucketReadStream, we need to provide additional
                // info such as the `filename` to the FormData library. Otherwise, we would get back "MultipartFile content must be provided" error.
                form.append(propertyName, fileStream, { type: 'application/octet-stream', filename: fileInfo.filename });
            } else {
                form.append(propertyName, propertyValue);
            }
        }
        headers['Content-Type'] = `multipart/form-data; boundary=${form.getBoundary()}`;
        requestBody = form;

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
                    headers: req.headers
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
                    headers: req.headers
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
