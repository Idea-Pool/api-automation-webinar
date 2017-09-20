# api-automation-webinar

[![Build Status](https://travis-ci.org/szikszail/api-automation-webinar.svg?branch=master)](https://travis-ci.org/szikszail/api-automation-webinar)

Sample API testing project

## Requirements

* Git
* NodeJS 6+

## Usage

### Install

```
$> npm install
```

### Running server

To run server separately, to manually check it:

```
$> npm start
```

Now, the server can be reached via http://localhost:7001

### Running tests

```
$> npm test
```

First it will download a fresh test [data set](./server/data.json). It will also start a server in the background and then run tests on it.

## API of the server

The server and the API of it can be found on the [json-server](https://github.com/typicode/json-server) site.