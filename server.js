const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

// ================================
// DATABASE
// ================================

const dbPath = path.join(__dirname, "scores.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Database connection failed:");
        console.error(err.message);
    } else {
        console.log("✅ SQLite database connected");
        console.log("📁 Database file:", dbPath);
    }
});


// ================================
// MIDDLEWARE
// ================================

app.use(express.json());

// Serve HTML, CSS and JavaScript files
app.use(express.static(__dirname));


// ================================
// CREATE DATABASE TABLE
// ================================

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating scores table:",
                err.message
            );
        } else {
            console.log("✅ Scores table ready");
        }

    });

});


// ================================
// HOME PAGE
// ================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ================================
// HEALTH CHECK
// ================================

app.get("/api/health", (req, res) => {

    res.json({

        status: "ok",

        database: "SQLite connected",

        server: "Dino Dash API",

        time: new Date().toISOString()

    });

});


// ================================
// GET GLOBAL STATISTICS
// ================================

app.get("/api/stats", (req, res) => {

    getStats(res);

});


// ================================
// SAVE SCORE
// ================================

app.post("/api/scores", (req, res) => {

    const player =
        String(
            req.body.player || "Anonymous"
        )
        .trim()
        .slice(0, 30);


    const score =
        Math.floor(
            Number(req.body.score)
        );


    // Validate player name

    const finalPlayer =
        player || "Anonymous";


    // Validate score

    if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > 1000000
    ) {

        return res.status(400).json({

            error: "Invalid score"

        });

    }


    // Insert score

    const sql = `
        INSERT INTO scores
        (player, score)
        VALUES (?, ?)
    `;


    db.run(
        sql,
        [finalPlayer, score],
        function (err) {

            if (err) {

                console.error(
                    "❌ Error saving score:",
                    err.message
                );


                return res.status(500).json({

                    error:
                        "Could not save score"

                });

            }


            console.log(
                `🎮 Score saved: ${finalPlayer} - ${score}`
            );


            // Return updated statistics

            getStats(res);

        }
    );

});


// ================================
// DELETE ALL SCORES
// ================================
// Useful for testing.
// Do NOT expose this publicly in production.

app.delete("/api/scores", (req, res) => {

    db.run(
        "DELETE FROM scores",
        [],
        (err) => {

            if (err) {

                return res.status(500).json({

                    error:
                        "Could not delete scores"

                });

            }


            console.log(
                "🗑️ All scores deleted"
            );


            res.json({

                message:
                    "All scores deleted successfully"

            });

        }
    );

});


// ================================
// GET DATABASE STATISTICS
// ================================

function getStats(res) {

    // Get highest score and total games

    const statsSQL = `
        SELECT
            COALESCE(MAX(score), 0) AS highScore,
            COUNT(*) AS totalGames
        FROM scores
    `;


    db.get(
        statsSQL,
        [],
        (err, stats) => {

            if (err) {

                console.error(
                    "❌ Stats error:",
                    err.message
                );


                return res.status(500).json({

                    error:
                        "Could not get statistics"

                });

            }


            // Get top 20 scores

            const scoresSQL = `
                SELECT
                    player,
                    score,
                    created_at AS createdAt
                FROM scores
                ORDER BY
                    score DESC,
                    id DESC
                LIMIT 20
            `;


            db.all(
                scoresSQL,
                [],
                (err, recentScores) => {

                    if (err) {

                        console.error(
                            "❌ Score history error:",
                            err.message
                        );


                        return res.status(500).json({

                            error:
                                "Could not get score history"

                        });

                    }


                    res.json({

                        highScore:
                            stats.highScore,

                        totalGames:
                            stats.totalGames,

                        recentScores:
                            recentScores

                    });

                }
            );

        }
    );

}


// ================================
// START SERVER
// ================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "🦖 DINO DASH SERVER"
        );

        console.log(
            "================================"
        );

        console.log(
            `🌐 Game: http://localhost:${PORT}`
        );

        console.log(
            `❤️ Health: http://localhost:${PORT}/api/health`
        );

        console.log(
            `📊 Stats: http://localhost:${PORT}/api/stats`
        );

        console.log(
            `🗄️ Database: ${dbPath}`
        );

        console.log(
            "================================"
        );

        console.log(
            "✅ Server is ready!"
        );

        console.log("");

    }
);