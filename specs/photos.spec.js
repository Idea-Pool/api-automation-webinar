"use strict";

const chakram = require("chakram");
const expect = chakram.expect;
const api = require("./utils/api");
const data = require("../server/data.json");

describe("Photos", () => {
  describe("Create", () => {
    let addedId;

    it("should add a new photo", () => {
      return chakram
        .post(api.url("photos"), {
          albumId: 11,
          id: 5001,
          title:
            "asperiores exercitationem voluptates qui amet quae necessitatibus facere",
          url: "https://via.placeholder.com/600/cda4c0",
          thumbnailUrl: "https://via.placeholder.com/150/cda4c0",
        })
        .then((response) => {
          expect(response.response.statusCode).to.match(/^20/);
          expect(response.body.data.id).to.be.defined;

          addedId = response.body.data.id;

          const todo = chakram.get(api.url("photos/" + addedId));
          expect(todo).to.have.status(200);
          expect(todo).to.have.json("data.albumId", 11);
          expect(todo).to.have.json("data.id", 5001);
          expect(todo).to.have.json(
            "data.title",
            "asperiores exercitationem voluptates qui amet quae necessitatibus facere"
          );
          expect(todo).to.have.json(
            "data.url",
            "https://via.placeholder.com/600/cda4c0"
          );
          expect(todo).to.have.json(
            "data.thumbnailUrl",
            "https://via.placeholder.com/150/cda4c0"
          );
          return chakram.wait();
        });
    });

    it("should not add a new photo with existing ID", () => {
      const response = chakram.post(api.url("photos"), {
        albumId: 11,
        id: 551,
        title:
          "asperiores exercitationem voluptates qui amet quae necessitatibus facere",
        url: "https://via.placeholder.com/600/cda4c0",
        thumbnailUrl: "https://via.placeholder.com/150/cda4c0",
      });
      expect(response).to.have.status(500);
      return chakram.wait();
    });

    after(() => {
      if (addedId) {
        return chakram.delete(api.url("photos/" + addedId));
      }
    });
  });

  describe("Read", () => {
    it("should have photos", () => {
      const response = chakram.get(api.url("photos"));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (data) => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.be.greaterThan(0);
      });
      return chakram.wait();
    });

    it("should return a photo by ID", () => {
      const expectedPhoto = data.photos[0];

      const response = chakram.get(api.url("photos/" + expectedPhoto.id));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (photo) => {
        expect(photo).to.be.defined;
        expect(photo.albumId).to.equal(expectedPhoto.albumId);
        expect(photo.id).to.equal(expectedPhoto.id);
        expect(photo.title).to.equal(expectedPhoto.title);
        expect(photo.url).to.equal(expectedPhoto.url);
        expect(photo.thumbnailUrl).to.equal(expectedPhoto.thumbnailUrl);
      });
      return chakram.wait();
    });

    it("should not return photo for invalid ID", () => {
      const response = chakram.get(api.url("photos/no-id-like-this"));
      return expect(response).to.have.status(404);
    });
  });

  describe("Update", () => {
    it("should update existing photo with given data", () => {
      const response = chakram.put(api.url("photos/551"), {
        albumId: 11,
        id: 551,
        title:
          "asperiores exercitationem voluptates qui aamet quae necessitatibus facere",
        url: "https://via.placeholder.com/600/cda4c0",
        thumbnailUrl: "https://via.placeholder.com/150/cda4c0",
      });
      expect(response).to.have.status(200);
      return response.then((data) => {
        const todo = chakram.get(api.url("photos/551"));
        expect(todo).to.have.json("data", (data) => {
          expect(data.albumId).to.equal(11);
          expect(data.id).to.equal(551);
          expect(data.title).to.equal(
            "asperiores exercitationem voluptates qui aamet quae necessitatibus facere"
          );
        });
        return chakram.wait();
      });
    });

    it("should throw error if the photo does not exist", () => {
      const response = chakram.put(api.url("photos/5001"), {
        albumId: 11,
        id: 5001,
        title:
          "asperiores exercitationem voluptates qui aamet quae necessitatibus facere",
        url: "https://via.placeholder.com/600/cda4c0",
        thumbnailUrl: "https://via.placeholder.com/150/cda4c0",
      });
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });

  describe("Delete", () => {
    it("should delete photo by ID", () => {
      const response = chakram.delete(api.url("photos/553"));
      expect(response).to.have.status(200);
      return response.then((data) => {
        const user = chakram.get(api.url("photos/553"));
        expect(user).to.have.status(404);
        return chakram.wait();
      });
    });

    it("should throw error if the photos does not exist", () => {
      const response = chakram.delete(api.url("photos/5004"));
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });
});
