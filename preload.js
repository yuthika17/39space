const {
    contextBridge,
    ipcRenderer
} = require("electron");


contextBridge.exposeInMainWorld(
    "studyApp",
    {

        getNote: (date) =>
            ipcRenderer.invoke(
                "get-note",
                date
            ),

        saveNote: (date, content) =>
            ipcRenderer.invoke(
                "save-note",
                date,
                content
            ),

        getTasks: (date) =>
            ipcRenderer.invoke(
                "get-tasks",
                date
            ),

        addTask: (date, title) =>
            ipcRenderer.invoke(
                "add-task",
                date,
                title
            ),

        updateTask: (id, completed) =>
            ipcRenderer.invoke(
                "update-task",
                id,
                completed
            ),

        deleteTask: (id) =>
            ipcRenderer.invoke(
                "delete-task",
                id
            ),

        getDates: () =>
            ipcRenderer.invoke(
                "get-dates"
            )
    }
);