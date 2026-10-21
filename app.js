
"use strict";

// ============================================
// DADOS
// ============================================

let deadlines = [
    { name: "SRSA avaliação 3", date: "2026-11-02T23:59:59" },
    { name: "CRP Projeto 1", date: "2026-11-08T23:59:59" },
    { name: "ECD Projeto 1", date: "2026-11-13T23:59:59" },
    { name: "SRSA Checkpoint", date: "2026-11-16T23:59:59" },
    { name: "SRSA avaliação 4", date: "2026-11-23T23:59:59" },
    { name: "IARP Projeto", date: "2026-11-27T23:59:59" },
    { name: "SRSA avaliação 5", date: "2026-11-30T23:59:59" },
    { name: "SRSA Entrega", date: "2026-12-09T23:59:59" },
    { name: "CRP Projeto 2", date: "2026-12-13T23:59:59" },
    { name: "ECD Projeto 2", date: "2026-12-18T23:59:59" },
    { name: "AED Projeto", date: "2026-12-20T23:59:59" }
];

// ============================================
// LOCAL STORAGE
// ============================================

// Carrega os dados guardados, se existirem.
// Caso contrário, utiliza os dados iniciais.

try {
    const saved = localStorage.getItem("deadlines");

    if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
            deadlines = parsed;
        }
    }
} catch (error) {
    console.error("Não foi possível carregar os trabalhos:", error);
}

function save() {
    localStorage.setItem("deadlines", JSON.stringify(deadlines));
}

// ============================================
// FORMATAR DATA
// ============================================

function formatDate(date) {
    return new Intl.DateTimeFormat("pt-PT", {
        day: "numeric",
        month: "short"
    }).format(date);
}

function formatTime(date) {
    return date.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ============================================
// CONTADOR
// ============================================

function getRemaining(target) {
    const difference = new Date(target).getTime() - Date.now();

    if (difference <= 0) {
        return {
            expired: true,
            text: "Prazo ultrapassado"
        };
    }

    const totalSeconds = Math.floor(difference / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        expired: false,
        text: `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
    };
}

// ============================================
// IDENTIFICAR AVALIAÇÕES
// ============================================

function isEvaluation(deadline) {
    return /^SRSA avaliação(?:\s+\d+)?$/i.test(
        deadline.name.trim()
    );
}

// ============================================
// COR
// ============================================

function getStatus(deadline) {
    const remaining = new Date(deadline.date).getTime() - Date.now();
    const day = 24 * 60 * 60 * 1000;

    if (remaining <= 0) return "gray";
    if (remaining < day * 2) return "red";
    if (remaining < day * 7) return "orange";

    return "gray";
}

// ============================================
// PRÓXIMA ENTREGA
// ============================================

function renderNextDeadline() {
    const container = document.getElementById("nextDeadline");

    const upcoming = deadlines
        .filter(d => new Date(d.date).getTime() > Date.now())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="next-label">Não há prazos futuros 🎉</div>
        `;
        return;
    }

    const next = upcoming[0];
    const date = new Date(next.date);
    const remaining = getRemaining(next.date);

    container.innerHTML = `
        <div class="next-label">
            ${isEvaluation(next) ? "Próxima avaliação" : "Próxima entrega"}
        </div>

        <div class="next-name"></div>

        <div class="next-date">
            ${formatDate(date)} · ${formatTime(date)}
        </div>

        <div class="countdown">${remaining.text}</div>
    `;

    // Usa textContent para inserir o nome com segurança.
    container.querySelector(".next-name").textContent = next.name;
}

// ============================================
// LISTA DE TRABALHOS
// ============================================

function renderDeadlines() {
    const list = document.getElementById("deadlineList");

    const sorted = [...deadlines].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    const evaluations = sorted.filter(isEvaluation);
    const projects = sorted.filter(d => !isEvaluation(d));

    function createSection(title, items) {
        if (items.length === 0) return;

        const section = document.createElement("section");
        section.style.marginBottom = "28px";

        const heading = document.createElement("h2");
        heading.style.fontSize = "22px";
        heading.style.marginBottom = "12px";
        heading.textContent = title;

        section.appendChild(heading);

        items.forEach(deadline => {
            const date = new Date(deadline.date);
            const remaining = getRemaining(deadline.date);
            const status = getStatus(deadline);

            const element = document.createElement("div");
            element.className = "deadline";

            const dot = document.createElement("div");
            dot.className = `status ${status}`;

            const info = document.createElement("div");
            info.className = "deadline-info";

            const name = document.createElement("div");
            name.className = "deadline-name";
            name.textContent = deadline.name;

            const dateText = document.createElement("div");
            dateText.className = "deadline-date";
            dateText.textContent = `${formatDate(date)} · ${formatTime(date)}`;

            const time = document.createElement("div");
            time.className = "remaining";
            time.textContent = remaining.text;

            info.append(name, dateText);
            element.append(dot, info, time);
            section.appendChild(element);
        });

        list.appendChild(section);
    }

    list.innerHTML = "";

    createSection("Avaliações", evaluations);
    createSection("Projetos", projects);
}

// ============================================
// ATUALIZAÇÃO
// ============================================

function update() {
    renderNextDeadline();
    renderDeadlines();
}

update();
setInterval(update, 1000);

// ============================================
// MODAL
// ============================================

const modal = document.getElementById("modal");

document.getElementById("addButton").addEventListener("click", () => {
    modal.classList.remove("hidden");
});

document.getElementById("closeModal").addEventListener("click", () => {
    modal.classList.add("hidden");
});

// ============================================
// ADICIONAR TRABALHO
// ============================================

document.getElementById("saveButton").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim();
    const date = document.getElementById("dateInput").value;
    const time = document.getElementById("timeInput").value;

    if (!name || !date || !time) {
        alert("Preenche o nome, a data e a hora.");
        return;
    }

    const newDate = new Date(`${date}T${time}:00`);

    if (Number.isNaN(newDate.getTime())) {
        alert("A data ou a hora não são válidas.");
        return;
    }

    deadlines.push({
        name,
        date: `${date}T${time}:59`
    });

    save();
    update();

    document.getElementById("nameInput").value = "";
    document.getElementById("dateInput").value = "";
    document.getElementById("timeInput").value = "23:59";

    modal.classList.add("hidden");
});
