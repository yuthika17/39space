"use strict";
const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

// Same userData path as existing app. Never recreate or overwrite study.db.
const db = new Database(path.join(app.getPath("userData"), "study.db"));
db.pragma("journal_mode = WAL");
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

const getNoteStmt = db.prepare("SELECT * FROM notes WHERE date = ?");
const upsertNoteStmt = db.prepare(`
    INSERT INTO notes(date,content) VALUES(?,?)
    ON CONFLICT(date) DO UPDATE SET content = excluded.content
`);
const deleteNoteStmt = db.prepare("DELETE FROM notes WHERE date = ?");
const getTasksStmt = db.prepare("SELECT * FROM tasks WHERE date = ? ORDER BY id ASC");
const addTaskStmt = db.prepare("INSERT INTO tasks(date,title) VALUES(?,?)");
const updateTaskStmt = db.prepare("UPDATE tasks SET completed = ? WHERE id = ?");
const deleteTaskStmt = db.prepare("DELETE FROM tasks WHERE id = ?");
const getTimeStmt = db.prepare("SELECT seconds FROM study_time WHERE date = ?");
const addTimeStmt = db.prepare(`
    INSERT INTO study_time(date,seconds) VALUES(?,?)
    ON CONFLICT(date) DO UPDATE SET seconds = study_time.seconds + excluded.seconds
`);
const datesStmt = db.prepare(`
    SELECT date FROM notes WHERE TRIM(content) <> ''
    UNION SELECT date FROM tasks
    UNION SELECT date FROM study_time WHERE seconds > 0
    ORDER BY date DESC
`);
const statisticsStmt = db.prepare(`
    WITH active_dates AS (
        SELECT date FROM notes WHERE TRIM(content) <> ''
        UNION SELECT date FROM tasks
        UNION SELECT date FROM study_time WHERE seconds > 0
    ), task_summary AS (
        SELECT date, COUNT(*) AS tasks, SUM(CASE WHEN completed <> 0 THEN 1 ELSE 0 END) AS completed
        FROM tasks GROUP BY date
    )
    SELECT a.date,
           COALESCE(s.seconds, 0) AS seconds,
           COALESCE(t.tasks, 0) AS tasks,
           COALESCE(t.completed, 0) AS completed,
           CASE WHEN n.date IS NOT NULL AND TRIM(n.content) <> '' THEN 1 ELSE 0 END AS hasNote
    FROM active_dates a
    LEFT JOIN study_time s ON s.date = a.date
    LEFT JOIN task_summary t ON t.date = a.date
    LEFT JOIN notes n ON n.date = a.date
    ORDER BY a.date ASC
`);

function getNote(date) { return getNoteStmt.get(date) || { date, content: "" }; }
function saveNote(date, content) {
    const value = String(content ?? "");
    if (!value.trim()) deleteNoteStmt.run(date);
    else upsertNoteStmt.run(date, value);
}
function getTasks(date) { return getTasksStmt.all(date); }
function addTask(date, title) {
    const value = String(title ?? "").trim();
    if (!value) return null;
    const result = addTaskStmt.run(date, value);
    return { id: Number(result.lastInsertRowid), date, title: value, completed: 0 };
}
function updateTask(id, completed) { updateTaskStmt.run(completed ? 1 : 0, id); }
function deleteTask(id) { deleteTaskStmt.run(id); }
function getStudyTime(date) { return getTimeStmt.get(date)?.seconds ?? 0; }
function addStudyTime(date, seconds) {
    const value = Math.floor(Number(seconds));
    if (Number.isFinite(value) && value > 0) addTimeStmt.run(date, value);
}
function getDates() { return datesStmt.all(); }
function getStatistics() { return statisticsStmt.all(); }

module.exports = {
    getNote, saveNote, getTasks, addTask, updateTask, deleteTask,
    getStudyTime, addStudyTime, getDates, getStatistics
};
