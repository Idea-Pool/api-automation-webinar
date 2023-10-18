"use strict";

const chakram = require("chakram");
const expect = chakram.expect;
const api = require("./utils/api");
const data = require("../server/data.json");

describe("Todos", () => {
  //"userId": 2,
  // "id": 21,
  // "title": "suscipit repellat esse quibusdam voluptatem incidunt",
  // "completed": false
  describe("Create", () => {
    let addedId;

    it("should add a new todo", () => {
      return chakram
        .post(api.url("todos"), {
          userId: 1,
          id: 201,
          title: "title",
          completed: false,
        })
        .then((response) => {
          expect(response.response.statusCode).to.match(/^20/);
          expect(response.body.data.id).to.be.defined;

          addedId = response.body.data.id;

          const todo = chakram.get(api.url("todos/" + addedId));
          expect(todo).to.have.status(200);
          expect(todo).to.have.json("data.userId", 1);
          expect(todo).to.have.json("data.id", 201);
          expect(todo).to.have.json("data.title", "title");
          expect(todo).to.have.json("data.completed", false);
          return chakram.wait();
        });
    });

    it("should not add a new todo with existing ID", () => {
      const response = chakram.post(api.url("todos"), {
        userId: 2,
        id: 21,
        title: "title",
        completed: true,
      });
      expect(response).to.have.status(500);
      return chakram.wait();
    });

    after(() => {
      if (addedId) {
        return chakram.delete(api.url("todos/" + addedId));
      }
    });
  });

  describe("Read", () => {
    it("should have todos", () => {
      const response = chakram.get(api.url("todos"));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (data) => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.be.greaterThan(0);
      });
      return chakram.wait();
    });

    it("should return a todo by ID", () => {
      const expectedTodo = data.todos[0];

      const response = chakram.get(api.url("todos/" + expectedTodo.id));
      expect(response).to.have.status(200);
      expect(response).to.have.json("data", (todo) => {
        expect(todo).to.be.defined;
        expect(todo.userId).to.equal(expectedTodo.userId);
        expect(todo.id).to.equal(expectedTodo.id);
        expect(todo.title).to.equal(expectedTodo.title);
        expect(todo.completed).to.equal(expectedTodo.completed);
      });
      return chakram.wait();
    });

    it("should not return todo for invalid ID", () => {
      const response = chakram.get(api.url("todos/no-id-like-this"));
      return expect(response).to.have.status(404);
    });
  });

  describe("Update", () => {
    it("should update existing todo with given data", () => {
      const response = chakram.put(api.url("todos/27"), {
        userId: 2,
        id: 27,
        title: "veritatis pariatur delectus",
        completed: false,
      });
      expect(response).to.have.status(200);
      return response.then((data) => {
        const todo = chakram.get(api.url("todos/27"));
        expect(todo).to.have.json("data", (data) => {
          expect(data.userId).to.equal(2);
          expect(data.id).to.equal(27);
          expect(data.title).to.equal("veritatis pariatur delectus");
          expect(data.completed).to.equal(false);
        });
        return chakram.wait();
      });
    });

    it("should throw error if the todo does not exist", () => {
      const response = chakram.put(api.url("todos/201"), {
        userId: 2,
        id: 201,
        title: "title",
        completed: true,
      });
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });

  describe("Delete", () => {
    it("should delete todo by ID", () => {
      const response = chakram.delete(api.url("todos/1"));
      expect(response).to.have.status(200);
      return response.then((data) => {
        const user = chakram.get(api.url("todos/1"));
        expect(user).to.have.status(404);
        return chakram.wait();
      });
    });

    it("should throw error if the todo does not exist", () => {
      const response = chakram.delete(api.url("todos/501"));
      expect(response).to.have.status(404);
      return chakram.wait();
    });
  });
});
