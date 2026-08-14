const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./scores.db");

db.all(
    "SELECT * FROM scores ORDER BY score DESC",
    [],
    (err, rows) => {

        if (err) {
            console.error(err);
            return;
        }

        console.table(rows);

        db.close();
    }
);