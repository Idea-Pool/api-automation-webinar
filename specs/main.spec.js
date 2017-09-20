'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./api');

describe('JSON Server', () => {
    it('should run', () => {
        const response = chakram.get(api.BASE_URL);
        return expect(response).to.have.status(200);
    });

    it('should return data', () => {
        const response = chakram.get(api.url('db'));
        expect(response).to.have.status(200);
        expect(response).to.have.json('posts', posts => {
            expect(posts.length).to.be.greaterThan(0);
        });
        return chakram.wait();
    })
});

setTimeout(run, 3000);