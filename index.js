"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify_1 = require("restify");
const SQL = require("better-sqlite3");
const Path = (route = "") => `/api${route}`;
class Connection {
    constructor(filename) {
        this.db = null;
        this.Statements = null;
        this.GetAllCards = (req, res, next) => this.Cards(req, res, next, this.Statements.GetCards);
        this.GetMyCards = (req, res, next) => this.Cards(req, res, next, this.Statements.GetCollection);
        this.AddCard = (req, res, next) => {
            const { id } = req.body;
            if (!id) {
                res.send(new restify_1.BadRequestError("No ID is present."));
            }
            this.Statements.AddCard.run(id);
            res.send(200, { msg: "Card was successfully added." });
        };
        this.UpdateCard = (req, res, next) => {
            const { id, foils, normals } = req.body;
            if (!id && !foils && !normals) {
                res.send(new restify_1.BadRequestError("Please send the ID, foil count, and normal count."));
            }
            this.Statements.UpdateCard.run(foils, normals, id);
            res.send(200, { msg: "Card was successfully updated." });
        };
        this.FindOrCreateDB(filename);
        this.server = restify_1.createServer({
            name: "Magic Keeper API",
            version: "0.0.1"
        })
            .use(restify_1.bodyParser())
            .use(restify_1.queryParser())
            .use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            return next();
        });
        const s = this.server;
        s.post(Path("/cards/mine"), this.AddCard);
        s.put(Path("/cards/mine"), this.UpdateCard);
        s.get(Path(), this.GetInformation);
        s.get(Path("/cards/all"), this.GetAllCards);
        s.get(Path("/cards/mine"), this.GetMyCards);
    }
    /** The function used to start the server on a specified port.
     * @param port the port for the server to listen for connections on.
     */
    Start(port) {
        this.server.listen(port, function () {
            console.log(`Server is listening on port ${port}`);
        });
    }
    /** The function used to find or create the database.
     * @param filename the filename of the database.
     */
    FindOrCreateDB(filename) {
        this.db = new SQL(filename, {});
        try {
            this.db.prepare("select * from cards limit 1"); // Check to see if the database contains an appropriate format
        }
        catch (err) {
            console.log("The database is not formatted correctly!");
            const { readFileSync, writeFileSync } = require("fs");
            const data = readFileSync("./cards/original.db");
            writeFileSync(filename, data);
            console.log(`The database is now formatted correctly.`);
        }
        finally {
            this.Statements = {
                GetCards: this.db.prepare("select * from CARDS_VIEW where name like ? order by name asc limit ? "),
                GetCollection: this.db.prepare("select * from COLLECTIONS_VIEW where name like ? order by name asc limit ?"),
                AddCard: this.db.prepare("insert into collection values (?, 0, 0)"),
                UpdateCard: this.db.prepare("update collection set foils = ?, normals = ? where id = ?")
            };
        }
    }
    GetInformation(req, res, next) {
        res.json(200, { msg: "everything is working as intended." });
    }
    Cards(req, res, next, statement) {
        const { limit = 20, name = "" } = req.query;
        res.json(statement.all(`%${name}%`, limit));
    }
}
function createConnection(filename) {
    return new Connection(filename);
}
exports.createConnection = createConnection;
