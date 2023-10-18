"use strict";

const chakram = require("chakram");
const expect = chakram.expect;
const api = require("./utils/api");
const data = require("../server/data.json");

describe("Posts", () => {
  describe("Create", () => {
    let addedId;

    it("should add a new post", () => {
      return chakram
        .post(api.url("posts"), {
          title: "title",
          body: "body",
          userId: 1,
        })
        .then((response) => {
          expect(response.response.statusCode).to.match(/^20/);
          expect(response.body.data.id).to.be.defined;

          addedId = response.body.data.id;

          const post = chakram.get(api.url("posts/" + addedId));
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
        return chakram.delete(api.url("posts/" + addedId));
      }
    });
  });

  describe("Read", () => {
    it("should have posts", () => {
      const response = chakram.get(api.url("posts"));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (data) => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.be.greaterThan(0);
      });
      return chakram.wait();
    });

    it("should return a post by ID", () => {
      const expectedPost = data.posts[0];

      const response = chakram.get(api.url("posts/" + expectedPost.id));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (post) => {
        expect(post).to.be.defined;
        expect(post.id).to.equal(expectedPost.id);
        expect(post.userId).to.equal(expectedPost.userId);
        expect(post.title).to.equal(expectedPost.title);
        expect(post.body).to.equal(expectedPost.body);
      });
      return chakram.wait();
    });

    it("should not return post for invalid ID", () => {
      const response = chakram.get(api.url("posts/no-id-like-this"));
      return expect(response).to.have.status(404);
    });
  });

  describe("Update", () => {
    it("should update existing post with given data", () => {
      const response = chakram.put(api.url("posts/50"), {
        title: "title",
        body: "body",
        userId: 111,
      });
      expect(response).to.have.status(200);
      return response.then((data) => {
        const post = chakram.get(api.url("posts/50"));
        expect(post).to.have.json("data", (data) => {
          expect(data.title).to.equal("title");
          expect(data.body).to.equal("body");
          expect(data.userId).to.equal(111);
        });
        return chakram.wait();
      });
    });

    it("should throw error if the post does not exist", () => {
      const response = chakram.put(api.url("posts/111"), {
        title: "title",
        body: "body",
        userId: 111,
      });
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });

  describe("Delete", () => {
    it("should delete post by ID", () => {
      const response = chakram.delete(api.url("posts/50"));
      expect(response).to.have.status(200);
      return response.then((data) => {
        const post = chakram.get(api.url("posts/50"));
        expect(post).to.have.status(404);
        return chakram.wait();
      });
    });

    it("should throw error if the post does not exist", () => {
      const response = chakram.delete(api.url("posts/111"));
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });
});
