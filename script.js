// ============================
// DATE
// ============================

let selectedDate =
    new Date();


function formatDate(date) {

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

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
    flushPendingNote();

    selectedDate.setDate(
        selectedDate.getDate() + amount
    );

    loadDay();

}


function goToday() {
    flushPendingNote();

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
// AUTO-REFRESH TO TODAY
// ============================

let trackedToday =
    formatDate(new Date());


function checkDateChange() {

    const now =
        formatDate(new Date());


    if (now === trackedToday) return;


    const wasOnToday =
        formatDate(selectedDate) === trackedToday;


    trackedToday = now;


    if (wasOnToday) {
        goToday();
    }

}


window.addEventListener(
    "focus",
    checkDateChange
);


setInterval(
    checkDateChange,
    60 * 1000
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
    if (pageName === "statistics") {
        loadStatistics();
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
let pendingNote = null;
function flushPendingNote() {
    if (!pendingNote) return;
    clearTimeout(noteSaveTimeout);
    const {date, content} = pendingNote;
    pendingNote = null;
    window.studyApp.saveNote(date, content);
}


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


        pendingNote = {date: formatDate(selectedDate), content: notesArea.value};
        noteSaveTimeout =
            setTimeout(
                async () => {

                    const { date, content } = pendingNote;
                    pendingNote = null;
                    await window.studyApp.saveNote(date, content);


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
                No tasks for this day yet ∩(︶▽︶)∩ .
            </div>
        `;

        homeTasks.innerHTML = `
            <div class="empty">
                No tasks yet ∩(︶▽︶)∩ 
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
// STUDY TIME
// ============================

function formatStudyTime(seconds) {

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;

}


async function loadStudyTime(date) {

    const seconds =
        await window.studyApp.getStudyTime(
            date
        );


    document.getElementById(
        "studyTimeDisplay"
    ).textContent =
        formatStudyTime(seconds);

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
                Nothing here yet ∩(︶▽︶)∩ .
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
            
            <span>
                ${formatPrettyDate(item.date)}
            </span>
            →
        `;


        button.addEventListener(
            "click",
            () => {

                flushPendingNote();
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
// STATISTICS
// ============================

function localDateDaysAgo(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
}

async function loadStatistics() {
    const records = await window.studyApp.getStatistics();
    const today = formatDate(new Date());
    const visible = records.filter(row => row.date <= today);
    const byDate = new Map(visible.map(row => [row.date, row]));
    // Calendar week: Monday 00:00 through Sunday 23:59 (local time).
    const weekStartDate = new Date();
    weekStartDate.setHours(12, 0, 0, 0);
    weekStartDate.setDate(weekStartDate.getDate() - ((weekStartDate.getDay() + 6) % 7));
    const monday = formatDate(weekStartDate);
    const totalSeconds = visible.filter(row => row.date >= monday)
        .reduce((sum, row) => sum + row.seconds, 0);
    const totalTasks = visible.reduce((sum, row) => sum + row.tasks, 0);
    const completed = visible.reduce((sum, row) => sum + row.completed, 0);

    document.getElementById("totalFocus").textContent = formatStudyTime(totalSeconds);
    document.getElementById("activeDays").textContent = visible.length;
    document.getElementById("taskProgress").textContent = `${completed} / ${totalTasks}`;
    let dayOffset = byDate.has(today) ? 0 : 1;
    let streak = 0;
    while (byDate.has(formatDate(localDateDaysAgo(dayOffset)))) {
        streak++;
        dayOffset++;
    }
    document.getElementById("currentStreak").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
    document.getElementById("statsEmpty").textContent = visible.length ? "" : "Start a timer, write a note, or add a task to begin tracking your progress 🌸";

    // 53 columns: full weeks, Sunday through Saturday, ending this week.
    const calendar = document.getElementById("activityCalendar");
    calendar.replaceChildren();
    const end = localDateDaysAgo(0);
    const weekStart = new Date(end);
    weekStart.setDate(end.getDate() - end.getDay() - 52 * 7);
    for (let week = 0; week < 53; week++) {
        const column = document.createElement("div");
        column.className = "activity-week";
        for (let day = 0; day < 7; day++) {
            const current = new Date(weekStart);
            current.setDate(weekStart.getDate() + week * 7 + day);
            const key = formatDate(current);
            const row = byDate.get(key);
            const square = document.createElement("button");
            square.type = "button";
            square.className = "activity-square";
            const points = row ? row.seconds / 1800 + row.completed * 2 + row.tasks + row.hasNote : 0;
            const level = points === 0 ? 0 : points < 2 ? 1 : points < 5 ? 2 : points < 9 ? 3 : 4;
            square.classList.add(`level-${level}`);
            square.disabled = key > today;
            square.title = `${key}: ${row ? `${formatStudyTime(row.seconds)} focused, ${row.completed}/${row.tasks} tasks, ${row.hasNote ? "note" : "no note"}` : "No activity"}`;
            square.setAttribute("aria-label", square.title);
            square.addEventListener("click", () => {
                flushPendingNote();
                selectedDate = new Date(key + "T12:00:00");
                loadDay();
                openPage("home");
            });
            column.appendChild(square);
        }
        calendar.appendChild(column);
    }

    const weeklyChart = document.getElementById("weeklyChart");
    weeklyChart.replaceChildren();
    const weekData = Array.from({length: 7}, (_, index) => {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + index);
        return {date, seconds: byDate.get(formatDate(date))?.seconds || 0};
    });
    const maxSeconds = Math.max(3600, ...weekData.map(d => d.seconds));
    for (const {date, seconds} of weekData) {
        const item = document.createElement("div");
        item.className = "weekly-day";
        const value = document.createElement("span");
        value.textContent = formatStudyTime(seconds);
        const track = document.createElement("div");
        track.className = "weekly-track";
        const bar = document.createElement("div");
        bar.className = "weekly-bar";
        bar.style.height = `${seconds / maxSeconds * 100}%`;
        track.appendChild(bar);
        const label = document.createElement("span");
        label.textContent = date.toLocaleDateString(undefined, {weekday: "short"});
        item.append(value, track, label);
        weeklyChart.appendChild(item);
    }
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

    await loadStudyTime(date);

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


let sessionSeconds = 0;


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


async function saveStudySession() {

    if (sessionSeconds <= 0) return;


    const today =
        formatDate(new Date());


    await window.studyApp.addStudyTime(
        today,
        sessionSeconds
    );


    sessionSeconds = 0;


    if (formatDate(selectedDate) === today) {
        loadStudyTime(today);
    }

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


            saveStudySession();


            return;

        }


        timerRunning = true;


        startButton.textContent =
            "⏸ Pause";


        timerInterval =
            setInterval(
                () => {

                    timeLeft--;

                    sessionSeconds++;


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


                        saveStudySession();


                        alert(
                            "🌸 Wonderful! You finished a focus session! (๑・ω-)～♥”  "
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


        saveStudySession();

    }
);


updateTimerDisplay();


// ============================
// START
// ============================

loadDay();