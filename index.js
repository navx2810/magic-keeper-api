"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var restify_1 = require("restify");
var SQL = require("better-sqlite3");
var Path = function (route) {
    if (route === void 0) { route = ""; }
    return "/api" + route;
};
var Connection = (function () {
    function Connection(filename) {
        var _this = this;
        this.db = null;
        this.Statements = null;
        this.GetAllCards = function (req, res, next) { return _this.Cards(req, res, next, _this.Statements.GetCards); };
        this.GetMyCards = function (req, res, next) { return _this.Cards(req, res, next, _this.Statements.GetCollection); };
        this.AddCard = function (req, res, next) {
            var id = req.body.id;
            if (!id) {
                res.send(new restify_1.BadRequestError("No ID is present."));
            }
            _this.Statements.AddCard.run(id);
            res.send(200, { msg: "Card was successfully added." });
        };
        this.UpdateCard = function (req, res, next) {
            var _a = req.body, id = _a.id, foils = _a.foils, normals = _a.normals;
            if (!id && !foils && !normals) {
                res.send(new restify_1.BadRequestError("Please send the ID, foil count, and normal count."));
            }
            _this.Statements.UpdateCard.run(foils, normals, id);
            res.send(200, { msg: "Card was successfully updated." });
        };
        this.FindOrCreateDB(filename);
        this.server = restify_1.createServer({
            name: "Magic Keeper API",
            version: "0.0.1"
        })
            .use(restify_1.bodyParser())
            .use(restify_1.queryParser());
        var s = this.server;
        s.post(Path("/cards/mine"), this.AddCard);
        s.put(Path("/cards/mine"), this.UpdateCard);
        s.get(Path(), this.GetInformation);
        s.get(Path("/cards/all"), this.GetAllCards);
        s.get(Path("/cards/mine"), this.GetMyCards);
    }
    /** The function used to start the server on a specified port.
     * @param port the port for the server to listen for connections on.
     */
    Connection.prototype.Start = function (port) {
        this.server.listen(port, function () {
            console.log("Server is listening on port " + port);
        });
    };
    /** The function used to find or create the database.
     * @param filename the filename of the database.
     */
    Connection.prototype.FindOrCreateDB = function (filename) {
        this.db = new SQL(filename, {});
        try {
            this.db.prepare("select * from cards limit 1"); // Check to see if the database contains an appropriate format
        }
        catch (err) {
            console.log("The database is not formatted correctly!");
            var _a = require("fs"), readFileSync = _a.readFileSync, writeFileSync = _a.writeFileSync;
            var data = readFileSync("./cards/original.db");
            writeFileSync(filename, data);
            console.log("The database is now formatted correctly.");
        }
        finally {
            this.Statements = {
                GetCards: this.db.prepare("select * from CARDS_VIEW where name like ? order by name asc limit ? "),
                GetCollection: this.db.prepare("select * from COLLECTIONS_VIEW where name like ? order by name asc limit ?"),
                AddCard: this.db.prepare("insert into collection values (?, 0, 0)"),
                UpdateCard: this.db.prepare("update collection set foils = ?, normals = ? where id = ?")
            };
        }
    };
    Connection.prototype.GetInformation = function (req, res, next) {
        res.json(200, { msg: "everything is working as intended." });
    };
    Connection.prototype.Cards = function (req, res, next, statement) {
        var _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.name, name = _c === void 0 ? "" : _c;
        res.json(statement.all("%" + name + "%", limit));
    };
    return Connection;
}());
function createConnection(filename) {
    return new Connection(filename);
}
exports.createConnection = createConnection;
