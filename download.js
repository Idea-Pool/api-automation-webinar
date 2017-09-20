'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const {join} = require('path');

fetch('https://github.com/typicode/jsonplaceholder/raw/master/data.json')
    .then(res => res.json())
    .then(json => fs.writeFileSync(join(__dirname, 'server', 'data.json'), JSON.stringify(json, null, 2), 'utf8'));