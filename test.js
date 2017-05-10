const {createConnection} = require("./index.js")
let server = createConnection("./me.db")
server.Start(6598)