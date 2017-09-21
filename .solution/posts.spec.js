'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./utils/api');
const data = require('../server/data.json');

describe('Posts', () => {
    describe('Create', () => {
        let addedId;

        it('should add a new post', () => {
            return chakram.post(api.url('posts'), {
                title: 'title',
                body: 'body',
                userId: 1
            }).then(response => {
                expect(response.response.statusCode).to.match(/^20/);
                expect(response.body.data.id).to.be.defined;

                addedId = response.body.data.id;

                const post = chakram.get(api.url('posts/' + addedId));
                expect(post).to.have.status(200);
                expect(post).to.have.json('data.id', addedId);
                expect(post).to.have.json('data.title', 'title');
                expect(post).to.have.json('data.body', 'body');
                expect(post).to.have.json('data.userId', 1);
                return chakram.wait();
            });
        });

        it('should not add a new row with existing ID', () => {
            const response = chakram.post(api.url('posts'), {
                id: 50,
                title: 'title',
                body: 'body',
                userId: 1
            });
            expect(response).to.have.status(500);
            return chakram.wait();
        });

        after(() => {
            if (addedId) {
                return chakram.delete(api.url('posts/' + addedId));
            }
        });
    });

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

        it('should return a post by ID', () => {
            const expectedPost = data.posts[0];

            const response = chakram.get(api.url('posts/' + expectedPost.id));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', post => {
                expect(post).to.be.defined;
                expect(post.id).to.equal(expectedPost.id);
                expect(post.userId).to.equal(expectedPost.userId);
                expect(post.title).to.equal(expectedPost.title);
                expect(post.body).to.equal(expectedPost.body);
            });
            return chakram.wait();
        });

        it('should not return post for invalid ID', () => {
            const response = chakram.get(api.url('posts/no-id-like-this'));
            return expect(response).to.have.status(404);
        });

        describe('Filtering', () => {
            it('should return a post by title', () => {
                const expectedPost = data.posts[0];

                const response = chakram.get(api.url('posts/?title=' + encodeURIComponent(expectedPost.title)));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.be.instanceof(Array);
                    expect(posts.length).to.equal(1);
                    expect(posts[0]).to.eql(expectedPost);
                });
                return chakram.wait();
            });

            it('should ignore filtering in invalid field passed', () => {
                const response = chakram.get(api.url('posts', 'noField=noValue'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts.length).to.equal(100);
                });
                return chakram.wait();
            });

            it('should not return anything if impossible filter passed', () => {
                const response = chakram.get(api.url('posts', 'title=no-title-like-this'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.eql([]);
                });
                return chakram.wait();
            });
        });

        describe('Paginate', () => {
            it('should return paginated data if requested', () => {
                const response = chakram.get(api.url('posts', '_limit=5&_page=10'));
                expect(response).to.have.status(200);
                expect(response).to.have.header('X-Total-Count', '100');
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.equal(5);
                    [46, 47, 48, 49, 50].forEach((id, i) => {
                        expect(data[i].id).to.equal(id);
                    });
                });
                return chakram.wait();
            });

            it('should return 10 results if no limit specified', () => {
                const response = chakram.get(api.url('posts', '_page=5'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(10);
                });
                return chakram.wait();
            });

            it('should not return anything for invalid limit value', () => {
                const response = chakram.get(api.url('posts', '_limit=invalid'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(0);
                });
                return chakram.wait();
            });

            it('should return the first page if invalid page requested', () => {
                const response = chakram.get(api.url('posts', '_limit=11&_page=invalid'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(11);
                });
                return chakram.wait();
            });

            it('should not return anything for page above the last', () => {
                const response = chakram.get(api.url('posts', '_limit=11&_page=1000'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(0);
                });
                return chakram.wait();
            });
        });

        describe('Sort', () => {
            it('should sort results by any field', () => {
                const response = chakram.get(api.url('posts', '_sort=title&_order=desc'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    const titles = posts.map(post => post.title);
                    expect(titles).to.be.descending;
                });
                return chakram.wait();
            });

            it('should not sort results if invalid field passed', () => {
                const response = chakram.get(api.url('posts', '_sort=no-field-like-this'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(100);
                    const ids = posts.map(post => post.id);
                    expect(ids).to.be.ascending;
                });
                return chakram.wait();
            });

            it('should sort results by ascending if invalid order passed', () => {
                const response = chakram.get(api.url('posts', '_sort=title&_order=no-order-like-this'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.have.lengthOf(100);
                    const titles = posts.map(post => post.title);
                    expect(titles).to.be.ascending;
                });
                return chakram.wait();
            });
        });

        describe('Slice', () => {
            it('should return a slice of the whole data set', () => {
                const response = chakram.get(api.url('posts', '_start=5&_end=10'));
                expect(response).to.have.status(200);
                expect(response).to.have.header('X-Total-Count', '100');
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.equal(5);
                    [6, 7, 8, 9, 10].forEach((id, i) => {
                        expect(data[i].id).to.equal(id);
                    });
                });
                return chakram.wait();
            });

            it('should not return results if start is not valid', () => {
                const response = chakram.get(api.url('posts', '_start=-5&_end=10'));
                expect(response).to.have.status(200);
                expect(response).to.have.header('X-Total-Count', '100');
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });

            it('should limit end of slicing to the last item', () => {
                const response = chakram.get(api.url('posts', '_start=95&_end=1100'));
                expect(response).to.have.status(200);
                expect(response).to.have.header('X-Total-Count', '100');
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.equal(5);
                    [96, 97, 98, 99, 100].forEach((id, i) => {
                        expect(data[i].id).to.equal(id);
                    });
                });
                return chakram.wait();
            });

            it('should not return any result if limits are reversed', () => {
                const response = chakram.get(api.url('posts', '_start=10&_end=1'));
                expect(response).to.have.status(200);
                expect(response).to.have.header('X-Total-Count', '100');
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });
        });

        describe('Operators', () => {
            describe('Greater Than', () => {
                it('should return proper posts using _gte operator', () => {
                    const response = chakram.get(api.url('posts', 'id_gte=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(51);
                        const minId = Math.min.apply(Math, posts.map(post => post.id));
                        expect(minId).to.be.least(50);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _gte used with invalid field', () => {
                    const response = chakram.get(api.url('posts', 'noField_gte=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Less Than', () => {
                it('should return proper posts using _lte operator', () => {
                    const response = chakram.get(api.url('posts', 'id_lte=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(50);
                        const minId = Math.max.apply(Math, posts.map(post => post.id));
                        expect(minId).to.be.most(50);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _lte used with invalid field', () => {
                    const response = chakram.get(api.url('posts', 'noField_lte=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Not equal', () => {
                it('should return proper posts using _ne operator', () => {
                    const response = chakram.get(api.url('posts', 'id_ne=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(99);
                        const ids = posts.map(post => post.id);
                        expect(ids).to.not.include(50);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _ne used with invalid field', () => {
                    const response = chakram.get(api.url('posts', 'noField_ne=50'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Like', () => {
                it('should return proper posts using _like operator', () => {
                    const expectedPost = data.posts.filter(post => {
                        return post.title.indexOf('est') > -1;
                    });

                    const response = chakram.get(api.url('posts', 'title_like=est'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(expectedPost.length);
                        expect(posts).to.eql(expectedPost);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _like used with invalid field', () => {
                    const response = chakram.get(api.url('posts', 'noField_like=there-is-no-title-like-this'));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json('data', posts => {
                        expect(posts).to.be.instanceof(Array);
                        expect(posts).to.have.lengthOf(0);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Full-text search', () => {
            it('should return post matching to the given text', () => {
                const expectedPost = data.posts.filter(post => JSON.stringify(post).indexOf('est') > -1);

                const response = chakram.get(api.url('posts', 'q=est'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.be.instanceof(Array);
                    expect(posts).to.have.lengthOf(expectedPost.length);
                    expect(posts).to.eql(expectedPost);
                });
                return chakram.wait();
            });

            it('should not return any post for impossible text', () => {
                const response = chakram.get(api.url('posts', 'q=there-is-no-title-like-this'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.be.instanceof(Array);
                    expect(posts).to.have.lengthOf(0);
                });
                return chakram.wait();
            });
        });

        describe('Relationships', () => {
            it('should embed comments for multiple posts', () => {
                const response = chakram.get(api.url('posts', '_embed=comments'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.be.instanceof(Array);
                    expect(posts).to.have.lengthOf(100);
                    posts.forEach(post => {
                        expect(post.comments).to.be.instanceof(Array);
                        post.comments.forEach(comment => {
                            expect(comment.postId).to.equal(post.id);
                        });
                    });
                });
                return chakram.wait();
            });

            it('should embed comment for a given post', () => {
                const response = chakram.get(api.url('posts/1', '_embed=comments'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', post => {
                    expect(post.comments).to.be.instanceof(Array);
                    post.comments.forEach(comment => {
                        expect(comment.postId).to.equal(post.id);
                    });
                });
                return chakram.wait();
            });

            it('should return comments of a post', () => {
                const response = chakram.get(api.url('posts/1/comments'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', comments => {
                    expect(comments).to.be.instanceof(Array);
                    comments.forEach(comment => {
                        expect(comment.postId).to.equal(1);
                    });
                });
                return chakram.wait();
            });

            it('should handle embedding request for invalid type', () => {
                const response = chakram.get(api.url('posts', '_embed=noTypeLikeThis'));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', posts => {
                    expect(posts).to.be.instanceof(Array);
                    expect(posts).to.have.lengthOf(100);
                    posts.forEach(post => {
                        expect(post.noTypeLikeThis).to.be.instanceof(Array);
                        expect(post.noTypeLikeThis).to.have.lengthOf(0);
                    });
                });
                return chakram.wait();
            });
        });
    });

    describe('Update', () => {
        it('should update existing post with given data', () => {
            const response = chakram.put(api.url('posts/50'), {
                title: 'title',
                body: 'body',
                userId: 111
            });
            expect(response).to.have.status(200);
            return response.then(data => {
                const post = chakram.get(api.url('posts/50'));
                expect(post).to.have.json('data', data => {
                    expect(data.title).to.equal('title');
                    expect(data.body).to.equal('body');
                    expect(data.userId).to.equal(111);
                });
                return chakram.wait();
            });
        });

        it('should throw error if the post does not exist', () => {
            const response = chakram.put(api.url('posts/111'), {
                title: 'title',
                body: 'body',
                userId: 111
            });
            expect(response).to.have.status(404);
            return chakram.wait();
        });
    });

    describe('Delete', () => {
        it('should delete post by ID', () => {
            const response = chakram.delete(api.url('posts/50'));
            expect(response).to.have.status(200);
            return response.then(data => {
                const post = chakram.get(api.url('posts/50'));
                expect(post).to.have.status(404);
                return chakram.wait();
            });
        });

        it('should throw error if the post does not exist', () => {
            const response = chakram.delete(api.url('posts/111'));
            expect(response).to.have.status(404);
            return chakram.wait();
        });
    });
});