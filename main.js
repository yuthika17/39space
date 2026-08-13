const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");

const path = require("path");

const database = require("./database");


function createWindow() {

    const win = new BrowserWindow({

        width: 1100,
        height: 700,

        minWidth: 850,
        minHeight: 550,

        title: "My Study Space",

        webPreferences: {

            preload: path.join(
                __dirname,
                "preload.js"
            ),

            contextIsolation: true,

            nodeIntegration: false
        }
    });


    win.loadFile("index.html");
}


// ============================
// DATABASE IPC
// ============================

ipcMain.handle(
    "get-note",
    (_, date) => database.getNote(date)
);


ipcMain.handle(
    "save-note",
    (_, date, content) =>
        database.saveNote(date, content)
);


ipcMain.handle(
    "get-tasks",
    (_, date) =>
        database.getTasks(date)
);


ipcMain.handle(
    "add-task",
    (_, date, title) =>
        database.addTask(date, title)
);


ipcMain.handle(
    "update-task",
    (_, id, completed) =>
        database.updateTask(id, completed)
);


ipcMain.handle(
    "delete-task",
    (_, id) =>
        database.deleteTask(id)
);


ipcMain.handle(
    "get-study-time",
    (_, date) =>
        database.getStudyTime(date)
);


ipcMain.handle(
    "add-study-time",
    (_, date, seconds) =>
        database.addStudyTime(date, seconds)
);


ipcMain.handle(
    "get-dates",
    () =>
        database.getDates()
);


// ============================
// ELECTRON
// ============================

app.whenReady().then(() => {

    createWindow();


    app.on("activate", () => {

        if (
            BrowserWindow.getAllWindows().length === 0
        ) {
            createWindow();
        }

    });

});


app.on("window-all-closed", () => {

    if (process.platform !== "darwin") {
        app.quit();
    }

});