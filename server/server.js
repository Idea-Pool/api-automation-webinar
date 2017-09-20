'use strict';

const args = require('yargs')
    .option('port', {
        alias: 'p',
        type: 'number',
        default: 7001
    }).argv;

const jsonServer = require('json-server');
const app = jsonServer.create();
const router = jsonServer.router('server/data.json');
const middlewares = jsonServer.defaults();

router.render = (req, res) => {
    res.jsonp({
        data: res.locals.data
    });
};

app.use(middlewares);
app.use('/api', router);
const server = app.listen(args.port, () => {
    console.log(`Server is running on ${args.port} port...`);
});

const exit = () => {
    server.close(() => {
        process.exit(0);
    });
};
process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('exit', exit);
process.on('uncaughtException', exit);