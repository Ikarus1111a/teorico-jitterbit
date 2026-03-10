const http = require('http');
const {handleRequest} = require('./routes');
const PORT = 3000;

const server = http.createServer((req, res) => {
    handleRequest(req, res);
}) ;

/*
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('All quiet, nothing to report.');
});
*/


server.listen(PORT, () => {
    console.log("Servidor rodando em http://localhost:" + PORT);
}); 