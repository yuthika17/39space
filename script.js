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


async function changeDay(amount) {
    await flushPendingNote();

    selectedDate.setDate(selectedDate.getDate() + amount);

    loadDay();

}


async function goToday() {
    await flushPendingNote();

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


async function openPage(pageName) {
    await flushPendingNote();

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
let noteWriteQueue = Promise.resolve();

function renderNote(content) {
    const nonempty = content.trim().length > 0;
    document.getElementById("noteStatus").textContent = nonempty ? "Saved" : "Empty";
    document.getElementById("homeNote").textContent = nonempty ? content : "No note yet.";
}

function saveNoteInOrder(note) {
    noteWriteQueue = noteWriteQueue.catch(console.error).then(() =>
        window.studyApp.saveNote(note.date, note.content)
    );
    return noteWriteQueue;
}

async function flushPendingNote() {
    clearTimeout(noteSaveTimeout);
    const note = pendingNote;
    pendingNote = null;
    if (note) await saveNoteInOrder(note);
    await noteWriteQueue;
}

async function loadNote(date) {
    const note = await window.studyApp.getNote(date);
    if (date !== formatDate(selectedDate)) return;
    notesArea.value = note.content || "";
    renderNote(notesArea.value);
}

notesArea.addEventListener("input", () => {
    clearTimeout(noteSaveTimeout);
    pendingNote = {date: formatDate(selectedDate), content: notesArea.value};
    renderNote(notesArea.value);
    noteSaveTimeout = setTimeout(() => {
        const note = pendingNote;
        pendingNote = null;
        if (note) saveNoteInOrder(note).catch(console.error);
    }, 400);
});

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
    document.getElementById("overviewTasks").textContent = tasks.length;
    document.getElementById("overviewDone").textContent = tasks.filter(task => task.completed).length;


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
    document.getElementById("overviewFocus").textContent = formatStudyTime(seconds);

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
            async () => {

                await flushPendingNote();
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
function statsDate(daysAgo) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - daysAgo); return d;
}
async function loadStatistics() {
    const records = await window.studyApp.getStatistics();
    const today = formatDate(new Date());
    const byDate = new Map(records.filter(r => r.date <= today).map(r => [r.date, r]));
    const start = statsDate(0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const monday = formatDate(start);
    const all = [...byDate.values()];
    const weekSeconds = all.filter(r => r.date >= monday).reduce((n,r) => n+r.seconds,0);
    document.getElementById("totalFocus").textContent = formatStudyTime(weekSeconds);
    document.getElementById("activeDays").textContent = byDate.size;
    const totalTasks = all.reduce((n,r) => n+r.tasks,0);
    const completed = all.reduce((n,r) => n+r.completed,0);
    document.getElementById("taskProgress").textContent = `${completed} / ${totalTasks}`;
    let offset = byDate.has(today) ? 0 : 1, streak = 0;
    while(byDate.has(formatDate(statsDate(offset)))) { streak++; offset++; }
    document.getElementById("currentStreak").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
    document.getElementById("statsEmpty").textContent = all.length ? "" : "Add a task, note or study time to start tracking your progress ✦";
    const calendar = document.getElementById("activityCalendar"); calendar.replaceChildren();
    const first = statsDate(0); first.setDate(first.getDate() - first.getDay() - 52*7);
    for(let week = 0;week < 53;week++) {
        const column = document.createElement("div"); column.className="activity-week";
        for(let day=0;day<7;day++) {
            const d=new Date(first); d.setDate(first.getDate()+week*7+day);
            const key=formatDate(d),row=byDate.get(key),points=row?(row.seconds/1800+row.completed*2+row.tasks+row.hasNote):0;
            const level=points===0?0:points<2?1:points<5?2:points<9?3:4;
            const square=document.createElement("button"); square.type="button";
            square.className=`activity-square level-${level}`;square.disabled=key>today;
            square.title=`${key}: ${row?`${formatStudyTime(row.seconds)}, ${row.completed}/${row.tasks} tasks, ${row.hasNote?"note":"no note"}`:"No activity"}`;
            square.setAttribute("aria-label",square.title);
            square.addEventListener("click",async()=>{await flushPendingNote();selectedDate=new Date(key+"T12:00:00");await loadDay();openPage("home");});
            column.appendChild(square);
        }
        calendar.appendChild(column);
    }
    const chart=document.getElementById("weeklyChart");chart.replaceChildren();
    const week=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return {d,seconds:byDate.get(formatDate(d))?.seconds||0};});
    const max=Math.max(3600,...week.map(v=>v.seconds));
    for (const {d,seconds} of week){
       const col=document.createElement("div");col.className="weekly-day";
       const value=document.createElement("span");value.textContent=formatStudyTime(seconds);
       const track=document.createElement("div");track.className="weekly-track";
       const bar=document.createElement("div");bar.className="weekly-bar";bar.style.height=`${seconds/max*100}%`;track.append(bar);
       const label=document.createElement("span");label.textContent=d.toLocaleDateString(undefined,{weekday:"short"});
       col.append(value,track,label);chart.append(col);
    }
}

// ============================
// DAY LOADING
// ============================

async function loadDay() {
    await flushPendingNote();

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
// TIMER — uses real wall-clock elapsed time
// ============================
const FOCUS_DURATION = 25 * 60;
let timeLeft = FOCUS_DURATION;
let timerRunning = false;
let timerInterval = null;
let timerStartedAt = 0;
let timerStartedWith = FOCUS_DURATION;
let sessionSeconds = 0;
let sessionWriteQueue = Promise.resolve();
const timerDisplay = document.getElementById("timerDisplay");
const startButton = document.getElementById("startTimer");
const resetButton = document.getElementById("resetTimer");

function updateTimerDisplay() {
    const seconds = Math.max(0, Math.ceil(timeLeft));
    const minutes = Math.floor(seconds / 60);

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

    // Progress from 1 (full) to 0 (empty)
    const progress = Math.max(
        0,
        Math.min(1, timeLeft / FOCUS_DURATION)
    );

    const radius = 100;
    const circumference = 2 * Math.PI * radius;

    const circle = document.getElementById("timerProgress");

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset =
        circumference * (1 - progress);

    // Position the star at the end of the progress line
    const angle = (-90 + 360 * progress) * Math.PI / 180;

    const starX = 120 + radius * Math.cos(angle);
    const starY = 120 + radius * Math.sin(angle);

    document.getElementById("timerStar")
        .setAttribute(
            "transform",
            `translate(${starX}, ${starY})`
        );
}


function captureElapsed() {
    if (!timerRunning) return;
    const elapsed = Math.min(timerStartedWith, Math.max(0, (Date.now() - timerStartedAt) / 1000));
    timeLeft = Math.max(0, timerStartedWith - elapsed);
    updateTimerDisplay();
}

function stopRunningTimer() {
    if (!timerRunning) return;
    captureElapsed();
    const elapsed = Math.max(0, timerStartedWith - timeLeft);
    sessionSeconds += elapsed;
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartedAt = 0;
    startButton.textContent = "▶ Start";
}

function saveStudySession() {
    const wholeSeconds = Math.floor(sessionSeconds);
    if (!wholeSeconds) return sessionWriteQueue;
    sessionSeconds -= wholeSeconds;
    const date = formatDate(new Date());
    sessionWriteQueue = sessionWriteQueue.catch(console.error).then(async () => {
        await window.studyApp.addStudyTime(date, wholeSeconds);
        if (formatDate(selectedDate) === date) await loadStudyTime(date);
    });
    return sessionWriteQueue;
}

function finishTimer() {
    stopRunningTimer();
    saveStudySession().catch(console.error);
    timeLeft = FOCUS_DURATION;
    updateTimerDisplay();
    alert("🌸 Wonderful! You finished a focus session!");
}

function updateTimer() {
    if (!timerRunning) return;
    captureElapsed();
    if (timeLeft <= 0) finishTimer();
}

startButton.addEventListener("click", () => {
    if (timerRunning) {
        updateTimer();
        if (!timerRunning) return;
        stopRunningTimer();
        saveStudySession().catch(console.error);
    } else {
        timerRunning = true;
        timerStartedAt = Date.now();
        timerStartedWith = timeLeft;
        startButton.textContent = "⏸ Pause";
        timerInterval = setInterval(updateTimer, 250);
        updateTimerDisplay();
    }
});

resetButton.addEventListener("click", () => {
    stopRunningTimer();
    saveStudySession().catch(console.error);
    timeLeft = FOCUS_DURATION;
    updateTimerDisplay();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateTimer();
});
window.addEventListener("focus", updateTimer);
updateTimerDisplay();

// ============================
// START
// ============================

loadDay();