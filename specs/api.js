'use strict';

const HOST = 'http://localhost:7001';

module.exports.BASE_URL = HOST;
module.exports.url = (path, query) => [HOST, 'api', path].join('/') + (query ? '?' + query : '');