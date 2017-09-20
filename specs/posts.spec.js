'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./api');

describe('Posts', () => {
    describe('Read', () => {
        it('should have posts', () => {
            const response = chakram.get(api.url('posts'));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', data => {
                expect(data).to.be.instanceof(Array);
                expect(data.length).to.be.greaterThan(0);
            });
            return chakram.wait();
        });

        it('should retrieve a post', () => {
            const response = chakram.get(api.url('posts/1'));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', post => {
                expect(post).to.be.defined;
                expect(post.id).to.equal(1);
            });
            return chakram.wait();
        });

        it('should return limited data if requested (?_limit)', () => {
            const response = chakram.get(api.url('posts', '_limit=5'));
            expect(response).to.have.status(200);
            expect(response).to.have.header('X-Total-Count', '100');
            expect(response).to.have.json('data', data => {
                expect(data).to.be.instanceof(Array);
                expect(data.length).to.equal(5);
            });
            return chakram.wait();
        });
    });
});