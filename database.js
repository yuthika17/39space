const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

const databasePath = path.join(
    app.getPath("userData"),
    "study.db"
);

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");


// ============================
// CREATE TABLES
// ============================

db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS study_time (
        date TEXT PRIMARY KEY,
        seconds INTEGER NOT NULL DEFAULT 0
    );
`);


// ============================
// NOTES
// ============================

function getNote(date) {

    const note = db
        .prepare(`
            SELECT *
            FROM notes
            WHERE date = ?
        `)
        .get(date);

    return note || {
        date,
        content: ""
    };
}


function saveNote(date, content) {

    db.prepare(`
        INSERT INTO notes (date, content)
        VALUES (?, ?)

        ON CONFLICT(date)
        DO UPDATE SET content = excluded.content
    `).run(date, content);
}


// ============================
// TASKS
// ============================

function getTasks(date) {

    return db
        .prepare(`
            SELECT *
            FROM tasks
            WHERE date = ?
            ORDER BY id ASC
        `)
        .all(date);
}


function addTask(date, title) {

    const result = db.prepare(`
        INSERT INTO tasks (date, title)
        VALUES (?, ?)
    `).run(date, title);

    return {
        id: result.lastInsertRowid,
        date,
        title,
        completed: 0
    };
}


function updateTask(id, completed) {

    db.prepare(`
        UPDATE tasks
        SET completed = ?
        WHERE id = ?
    `).run(completed ? 1 : 0, id);
}


function deleteTask(id) {

    db.prepare(`
        DELETE FROM tasks
        WHERE id = ?
    `).run(id);
}


// ============================
// STUDY TIME
// ============================

function getStudyTime(date) {

    const row = db
        .prepare(`
            SELECT seconds
            FROM study_time
            WHERE date = ?
        `)
        .get(date);

    return row ? row.seconds : 0;
}


function addStudyTime(date, seconds) {

    db.prepare(`
        INSERT INTO study_time (date, seconds)
        VALUES (?, ?)

        ON CONFLICT(date)
        DO UPDATE SET seconds = seconds + excluded.seconds
    `).run(date, seconds);
}


// ============================
// HISTORY
// ============================

function getDates() {

    return db.prepare(`
        SELECT date
        FROM notes
        WHERE content != ''

        UNION

        SELECT date
        FROM tasks

        UNION

        SELECT date
        FROM study_time
        WHERE seconds > 0

        ORDER BY date DESC
    `).all();
}


module.exports = {
    getNote,
    saveNote,
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    getStudyTime,
    addStudyTime,
    getDates
};