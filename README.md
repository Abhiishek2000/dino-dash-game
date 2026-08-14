# Dino Dash - Simple Proper Project

## Run

Open PowerShell in this folder:

```powershell
npm install
npm start
```

Then open:

http://localhost:3000

You do NOT need Live Server.

## Database

SQLite automatically creates:

```text
scores.db
```

The game stores:

- player name
- score
- date/time
- total games
- global highest score

## Test API

```text
http://localhost:3000/api/health
http://localhost:3000/api/stats
```

## Files

```text
index.html   frontend
style.css    design
game.js      game + API calls
server.js    Express + SQLite backend
package.json dependencies
scores.db    created automatically after npm start
```
