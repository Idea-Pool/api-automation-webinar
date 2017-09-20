'use strict';

const args = require('yargs')
    .option('port', {
        alias: 'p',
        type: 'number',
        default: 7001
    }).argv;

const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('server/data.json');
const middlewares = jsonServer.defaults();

router.render = (req, res) => {
    res.jsonp({
        data: res.locals.data
    })
};

server.use(middlewares);
server.use('/api', router);
server.listen(args.port, () => {
    console.log(`Server is running on ${args.port} port...`);
});