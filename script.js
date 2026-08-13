// ============================
// DATE
// ============================

let selectedDate =
    new Date();


function formatDate(date) {

    return date.toISOString()
        .split("T")[0];

}


function formatPrettyDate(dateString) {

    const date =
        new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


function changeDay(amount) {

    selectedDate.setDate(
        selectedDate.getDate() + amount
    );

    loadDay();

}


function goToday() {

    selectedDate = new Date();

    loadDay();

}


document
    .getElementById("previousDay")
    .addEventListener(
        "click",
        () => changeDay(-1)
    );


document
    .getElementById("nextDay")
    .addEventListener(
        "click",
        () => changeDay(1)
    );


document
    .getElementById("todayButton")
    .addEventListener(
        "click",
        goToday
    );


// ============================
// PAGE NAVIGATION
// ============================

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    );


const pages =
    document.querySelectorAll(
        ".page"
    );


function openPage(pageName) {

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });


    document
        .getElementById(pageName)
        .classList.add(
            "active-page"
        );


    navButtons.forEach(button => {

        button.classList.remove(
            "active"
        );

    });


    const button =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (button) {
        button.classList.add("active");
    }


    if (pageName === "history") {
        loadHistory();
    }

}


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => openPage(
            button.dataset.page
        )
    );

});


// ============================
// NOTES
// ============================

const notesArea =
    document.getElementById(
        "notesArea"
    );


let noteSaveTimeout = null;


async function loadNote(date) {

    const note =
        await window.studyApp.getNote(
            date
        );


    notesArea.value =
        note.content;


    document.getElementById(
        "noteStatus"
    ).textContent =
        note.content.trim()
            ? "Saved"
            : "Empty";


    document.getElementById(
        "homeNote"
    ).textContent =
        note.content.trim()
            ? note.content
            : "No note yet.";

}


notesArea.addEventListener(
    "input",
    () => {

        clearTimeout(
            noteSaveTimeout
        );


        noteSaveTimeout =
            setTimeout(
                async () => {

                    const date =
                        formatDate(
                            selectedDate
                        );


                    await window.studyApp.saveNote(
                        date,
                        notesArea.value
                    );


                    document.getElementById(
                        "noteStatus"
                    ).textContent =
                        notesArea.value.trim()
                            ? "Saved"
                            : "Empty";


                    document.getElementById(
                        "homeNote"
                    ).textContent =
                        notesArea.value.trim()
                            ? notesArea.value
                            : "No note yet.";

                },
                400
            );

    }
);


// ============================
// TASKS
// ============================

const taskInput =
    document.getElementById(
        "taskInput"
    );


const taskList =
    document.getElementById(
        "taskList"
    );


const homeTasks =
    document.getElementById(
        "homeTasks"
    );


async function loadTasks(date) {

    const tasks =
        await window.studyApp.getTasks(
            date
        );


    renderTasks(
        tasks
    );


    updateStats(
        tasks
    );

}


function renderTasks(tasks) {

    taskList.innerHTML = "";

    homeTasks.innerHTML = "";


    if (tasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty">
                🌱 No tasks for this day yet.
            </div>
        `;

        homeTasks.innerHTML = `
            <div class="empty">
                No tasks yet 🌷
            </div>
        `;

        return;
    }


    tasks.forEach(task => {

        const element =
            createTaskElement(
                task
            );


        taskList.appendChild(
            element
        );


        const homeElement =
            createTaskElement(
                task,
                true
            );


        homeTasks.appendChild(
            homeElement
        );

    });

}


function createTaskElement(
    task,
    compact = false
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "task";


    if (task.completed) {
        element.classList.add(
            "completed"
        );
    }


    element.innerHTML = `

        <input
            type="checkbox"
            ${task.completed ? "checked" : ""}
        >

        <span>
            ${escapeHtml(task.title)}
        </span>

        ${
            compact
                ? ""
                : `
                    <button
                        class="delete-task"
                        title="Delete"
                    >
                        ×
                    </button>
                  `
        }

    `;


    const checkbox =
        element.querySelector(
            "input"
        );


    checkbox.addEventListener(
        "change",
        async () => {

            await window.studyApp.updateTask(
                task.id,
                checkbox.checked
            );


            loadTasks(
                formatDate(
                    selectedDate
                )
            );

        }
    );


    if (!compact) {

        const deleteButton =
            element.querySelector(
                ".delete-task"
            );


        deleteButton.addEventListener(
            "click",
            async () => {

                await window.studyApp.deleteTask(
                    task.id
                );


                loadTasks(
                    formatDate(
                        selectedDate
                    )
                );

            }
        );

    }


    return element;

}


document
    .getElementById("addTask")
    .addEventListener(
        "click",
        addTask
    );


taskInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            addTask();
        }

    }
);


async function addTask() {

    const title =
        taskInput.value.trim();


    if (!title) return;


    await window.studyApp.addTask(
        formatDate(selectedDate),
        title
    );


    taskInput.value = "";


    loadTasks(
        formatDate(
            selectedDate
        )
    );

}


function updateStats(tasks) {

    document.getElementById(
        "taskCount"
    ).textContent =
        tasks.length;


    document.getElementById(
        "completedCount"
    ).textContent =
        tasks.filter(
            task => task.completed
        ).length;

}


// ============================
// HISTORY
// ============================

async function loadHistory() {

    const historyList =
        document.getElementById(
            "historyList"
        );


    const dates =
        await window.studyApp.getDates();


    historyList.innerHTML = "";


    if (dates.length === 0) {

        historyList.innerHTML = `
            <div class="empty">
                🌱 Nothing here yet.
            </div>
        `;

        return;
    }


    dates.forEach(item => {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "history-item";


        button.innerHTML = `
            📅
            <span>
                ${formatPrettyDate(item.date)}
            </span>
            →
        `;


        button.addEventListener(
            "click",
            () => {

                selectedDate =
                    new Date(
                        item.date +
                        "T00:00:00"
                    );


                loadDay();

                openPage("home");

            }
        );


        historyList.appendChild(
            button
        );

    });

}


// ============================
// DAY LOADING
// ============================

async function loadDay() {

    const date =
        formatDate(
            selectedDate
        );


    document.getElementById(
        "selectedDate"
    ).textContent =
        formatPrettyDate(
            date
        );


    document.getElementById(
        "taskPageDate"
    ).textContent =
        formatPrettyDate(
            date
        );


    document.getElementById(
        "notePageDate"
    ).textContent =
        formatPrettyDate(
            date
        );


    await loadNote(date);

    await loadTasks(date);

}


// ============================
// HTML SAFETY
// ============================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent = text;


    return div.innerHTML;

}


// ============================
// DARK MODE
// ============================

const themeButton =
    document.getElementById(
        "themeButton"
    );


let darkMode =
    localStorage.getItem(
        "darkMode"
    ) === "true";


function updateTheme() {

    document.body.classList.toggle(
        "dark",
        darkMode
    );


    themeButton.textContent =
        darkMode
            ? "☀️ Light mode"
            : "🌙 Dark mode";

}


themeButton.addEventListener(
    "click",
    () => {

        darkMode = !darkMode;


        localStorage.setItem(
            "darkMode",
            darkMode
        );


        updateTheme();

    }
);


updateTheme();


// ============================
// TIMER
// ============================

let timeLeft =
    25 * 60;


let timerRunning =
    false;


let timerInterval = null;


const timerDisplay =
    document.getElementById(
        "timerDisplay"
    );


const startButton =
    document.getElementById(
        "startTimer"
    );


const resetButton =
    document.getElementById(
        "resetTimer"
    );


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timeLeft / 60
        );


    const seconds =
        timeLeft % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


startButton.addEventListener(
    "click",
    () => {

        if (timerRunning) {

            clearInterval(
                timerInterval
            );


            timerRunning = false;


            startButton.textContent =
                "▶ Start";


            return;

        }


        timerRunning = true;


        startButton.textContent =
            "⏸ Pause";


        timerInterval =
            setInterval(
                () => {

                    timeLeft--;


                    updateTimerDisplay();


                    if (
                        timeLeft <= 0
                    ) {

                        clearInterval(
                            timerInterval
                        );


                        timerRunning =
                            false;


                        startButton.textContent =
                            "▶ Start";


                        alert(
                            "🌸 Wonderful! You finished a focus session!"
                        );


                        timeLeft =
                            25 * 60;


                        updateTimerDisplay();

                    }

                },
                1000
            );

    }
);


resetButton.addEventListener(
    "click",
    () => {

        clearInterval(
            timerInterval
        );


        timerRunning =
            false;


        timeLeft =
            25 * 60;


        startButton.textContent =
            "▶ Start";


        updateTimerDisplay();

    }
);


updateTimerDisplay();


// ============================
// START
// ============================

loadDay();