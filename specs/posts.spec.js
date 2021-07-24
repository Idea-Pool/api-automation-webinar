"use strict";

const chakram = require("chakram");
const expect = chakram.expect;
const api = require("./utils/api");
const data = require("../server/data.json");

describe("POSTS", () => {
  describe("CREATE", () => {
    let addedId;
    it("should add a new post", () => {
      return chakram
        .post(api.url("posts"), {
          title: "title",
          body: "body",
          userId: 1,
        })
        .then(response => {
          expect(response.response.statusCode).to.match(/^20/);
          expect(response.body.data.id).to.be.defined;
          addedId = response.body.data.id;
          const post = chakram.get(api.url(`posts/${addedId}`));
          expect(post).to.have.status(200);
          expect(post).to.have.json("data.id", addedId);
          expect(post).to.have.json("data.title", "title");
          expect(post).to.have.json("data.body", "body");
          expect(post).to.have.json("data.userId", 1);
          return chakram.wait();
        });
    });

    it("should not add a new row with existing ID", () => {
      const response = chakram.post(api.url("posts"), {
        id: 50,
        title: "title",
        body: "body",
        userId: 1,
      });
      expect(response).to.have.status(500);
      return chakram.wait();
    });

    after(() => {
      if (addedId) {
        return chakram.delete(api.url(`posts/${addedId}`));
      }
    });
  });
  describe("READ", () => {
    it("should return all posts", () => {
      const response = chakram.get(api.url("posts"));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", posts => {
        expect(posts).to.be.instanceOf(Array);
        expect(posts.length).to.equal(data.posts.length);
      });
      return chakram.wait();
    });

    it("should return a given post", () => {
      const expectedPost = data.posts[0];
      const response = chakram.get(api.url(`posts/${expectedPost.id}`));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", post => {
        expect(post).to.be.defined;
        expect(post).to.deep.equal(expectedPost);
      });
      return chakram.wait();
    });

    it("should not return a post with non-existing ID", () => {
      const response = chakram.get(api.url("posts/1234567"));
      expect(response).to.have.status(404);
      return chakram.wait();
    });

    describe("FILTER", () => {
      it("should return posts by title", () => {
        const expectedPost = data.posts[0];
        const response = chakram.get(api.url("posts", `title=${expectedPost.title}`));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts[0]).to.deep.equal(expectedPost);
        });
        return chakram.wait();
      });

      it("should not return anything in case of impossible filter", () => {
        const response = chakram.get(api.url("posts/impossible-filter"));
        expect(response).to.have.status(404);
        return chakram.wait();
      });

      it("should ignore filtering if invalid filter", () => {
        const response = chakram.get(api.url("posts", "noField=noValue"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts.length).to.equal(100);
        });
        return chakram.wait();
      });
    });

    describe("PAGINATE", () => {
      it("should return 10 post by default", () => {
        const response = chakram.get(api.url("posts", "_page=2"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(10);
        });
        return chakram.wait();
      });

      it("should not return anything if the given page number is bigger than the last page", () => {
        const response = chakram.get(api.url("posts", `_page=${9999}`));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(0);
        });
        return chakram.wait();
      });

      it("should return as many posts as we specified in the _limit filter", () => {
        const response = chakram.get(api.url("posts", "_page=6&_limit=3"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(3);
          const arrayOfIds = [16, 17, 18];
          arrayOfIds.forEach((current, indexOfCurrent) => {
            expect(posts[indexOfCurrent].id).to.equal(current);
          });
        });
        return chakram.wait();
      });

      it("should return 10 posts per page if the filters are not correctly specified", () => {
        const response = chakram.get(api.url("posts", "_page=incorrect-page&_limit=incorrect-limit"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(10);
          for (let currentIndex = 0; currentIndex < 10; currentIndex++) {
            expect(posts[currentIndex].id).to.equal(currentIndex + 1);
          }
        });
        return chakram.wait();
      });
    });
    describe("SORT", () => {
      it("should return the sorted posts", () => {
        const response = chakram.get(api.url("posts", "_sort=title&_order=desc&_page=1"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.map(post => post.title)).to.be.descending;
        });
        return chakram.wait();
      });

      it("should sort the results by ascending order if incorrect value passed to the _order", () => {
        const response = chakram.get(api.url("posts", "_sort=body&_order=incorrectOrder"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.map(post => post.body)).to.be.ascending;
        });
        return chakram.wait();
      });

      it("should return the posts by default in case of incorrect _sort or _order", () => {
        const response = chakram.get(api.url("posts", "_sort=incorrectSort&_order=incorrectOrder&_page=1"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          for (let currentIndex = 0; currentIndex < 10; currentIndex++) {
            expect(posts[currentIndex].id).to.equal(data.posts[currentIndex].id);
          }
        });
        return chakram.wait();
      });
    });
    describe("SLICE", () => {
      it("should return the correct posts started from _start to _end", () => {
        const response = chakram.get(api.url("posts", "_start=5&_end=8"));
        expect(response).to.have.status(200);
        expect(response).to.have.header("X-Total-Count", "100");
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(3);
          const ids = [6, 7, 8];
          ids.forEach((currentId, index) => {
            expect(posts[index].id).to.equal(currentId);
          });
        });
        return chakram.wait();
      });

      it("should return all posts if the _start or the _end is not defined", () => {
        const response = chakram.get(api.url("posts", "_start=18"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(100);
        });
        return chakram.wait();
      });

      it("should return posts counted from the end of all posts, if the _start value is a negative number", () => {
        const response = chakram.get(api.url("posts", "_start=-10&_end=95"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(5);
          expect(posts[0].id).to.equal(91);
          expect(posts[4].id).to.equal(95);
        });
        return chakram.wait();
      });
    });
    describe("OPERATORS", () => {
      describe("LESS THAN", () => {
        it("should return posts that has _lte (Less Than or Equal) value or smaller id", () => {
          const response = chakram.get(api.url("posts", "userId_lte=18"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            posts.forEach(post => {
              expect(post.userId).to.be.below(19);
            });
          });
          return chakram.wait();
        });

        it("should not return any posts if the _lte value is not valid", () => {
          const response = chakram.get(api.url("posts", "userId_lte=-999"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            expect(posts.length).to.equal(0);
          });
          return chakram.wait();
        });
      });
      describe("GREATHER THAN", () => {
        it("should return posts that has _gte (Greater Than or Equal) value or bigger id", () => {
          const response = chakram.get(api.url("posts?userId_gte=18"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            posts.forEach(post => {
              expect(post.userId).to.be.above(17);
            });
          });
          return chakram.wait();
        });

        it("should not return any posts if the _gte value is not valid", () => {
          const response = chakram.get(api.url("posts", "userId_gte=9999"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            expect(posts.length).to.equal(0);
          });
          return chakram.wait();
        });
      });

      describe("NOT EQUAL", () => {
        it("should return all the posts, except the posts that does not have the _ne value for the specified field", () => {
          const response = chakram.get(api.url("posts", "id_ne=1"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            const notExpectedPosts = posts.filter(post => post.id === "1");
            expect(notExpectedPosts.length).to.equal(0);
          });
          return chakram.wait();
        });
      });

      describe("GREATHER THAN AND LESS THAN", () => {
        it("should return posts for _gte and _lte specified for two or more field", () => {
          const response = chakram.get(api.url("posts", "userId_gte=18&userId_lte=1"));
          expect(response).to.have.status(200);
          expect(response).to.have.json("data", posts => {
            expect(posts).to.be.instanceof(Array);
            expect(posts.length).to.equal(0);
          });
          return chakram.wait();
        });
      });
    });
    describe("LIKE", () => {
      it("should return all posts that include the specified value for _like", () => {
        const response = chakram.get(api.url("posts", "title_like=sunt"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          posts.forEach(post => {
            expect(post.title).to.include("sunt");
          });
        });
        return chakram.wait();
      });

      it("should not return a post if the specified value for _like not suitable for any post", () => {
        const response = chakram.get(api.url("posts", "title_like=unlikely-string-value"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(0);
        });
        return chakram.wait();
      });
    });

    describe("RELATIONSHIPS", () => {
      it("should return all comments for all posts", () => {
        const response = chakram.get(api.url("posts", "_embed=comments"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          posts.forEach(post => {
            post.comments.forEach(comment => {
              expect(comment.postId).to.equal(post.id);
            });
          });
        });
        return chakram.wait();
      });

      it("should return all comments for a given post", () => {
        const response = chakram.get(api.url("posts/3", "_embed=comments"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", post => {
          expect(post).to.be.defined;
          post.comments.forEach(comment => {
            expect(comment.postId).to.equal(3);
          });
        });
        return chakram.wait();
      });

      it("should return all the posts with an extra field based on the _embed value", () => {
        const response = chakram.get(api.url("posts", "_embed=NotCorrectValue"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(100);
          posts.forEach(post => {
            expect(post).to.have.property("NotCorrectValue");
          });
        });
        return chakram.wait();
      });
    });

    describe("FULL-TEXT SEARCH", () => {
      it("should not return any post if that does not have an exact match for the specified value of q", () => {
        const response = chakram.get(api.url("posts", "q=invalid-value"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          expect(posts.length).to.equal(0);
        });
        return chakram.wait();
      });

      it("should return the posts that have exact match for the specified value of q", () => {
        const response = chakram.get(api.url("posts", "q=lorem"));
        expect(response).to.have.status(200);
        expect(response).to.have.json("data", posts => {
          expect(posts).to.be.instanceof(Array);
          posts.forEach(post => {
            const titleAndBody = post.title + " " + post.body;
            expect(titleAndBody).to.include("lorem");
          });
        });
        return chakram.wait();
      });
    });
  });

  describe("UPDATE", () => {
    it("should update az existing post", () => {
      const postUpdate = {
        userId: 2,
        title: "updated title",
        body: "updated body",
      };
      const postId = 18;
      const response = chakram.put(api.url(`posts/${postId}`), postUpdate);
      expect(response).to.have.status(200);
      const updatedPost = chakram.get(api.url(`posts/${postId}`));

      expect(updatedPost).have.json("data", post => {
        expect(post).to.be.defined;
        expect(post.userId).to.equal(postUpdate.userId);
        expect(post.body).to.equal(postUpdate.body);
        expect(post.title).to.equal(postUpdate.title);
      });
      return chakram.wait();
    });
    it("should not update a post which does not exist", () => {
      const postUpdate = {
        userId: 1,
        title: "updated title",
        body: "updated body",
      };
      const response = chakram.put(api.url("posts/180"), postUpdate);
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });
  describe("DELETE", () => {
    it("should delete an existing post", () => {
      const response = chakram.delete(api.url("posts/89"));
      expect(response).to.have.status(200);
      const notExistingPost = chakram.get(api.url("posts/89"));
      expect(notExistingPost).to.have.status(404);
      return chakram.wait();
    });

    it("should not delete a post which does not exist", () => {
      const response = chakram.delete(api.url("posts/12345"));
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });
});
