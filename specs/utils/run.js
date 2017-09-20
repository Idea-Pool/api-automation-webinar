'use strict';

const fetch = require('node-fetch');
const api = require('./api');
const chakram = require('chakram');

chakram.initialize(require('chai-sorted'));


const POLL_TIMEOUT = 2000;
const polling = setInterval(() => {
    fetch(api.BASE_URL).then(res => {
        if (res.status === 200) {
            clearInterval(polling);
            clearTimeout(waitTimeout);
            run();
        }
    }, e => {
        console.log('Waiting for server...');
    });
}, POLL_TIMEOUT);
const waitTimeout = setTimeout(() =>  {
    console.error('Server is not available!');
    clearInterval(polling);
    process.exit(1);
}, POLL_TIMEOUT * 10.5);