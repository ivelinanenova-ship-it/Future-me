const STORAGE_KEY = "future-me-letters-v1";
const THEME_KEY = "future-me-theme";

const form = document.querySelector("#letter-form");
const nameInput = document.querySelector("#sender-name");
const messageInput = document.querySelector("#letter-message");
const dateInput = document.querySelector("#unlock-date");
const characterCount = document.querySelector("#character-count");
const messageList = document.querySelector("#message-list");
const messageTotal = document.querySelector("#message-total");
const feedback = document.querySelector("#form-feedback");
const themeToggle = document.querySelector("#theme-toggle");

const quotes = [
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C. S. Lewis" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" }
];

let quoteIndex = Math.floor(Math.random() * quotes.length);
let letters = loadLetters();

function loadLetters() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((letter) =>
      letter && typeof letter.id === "string" && typeof letter.name === "string" &&
      typeof letter.message === "string" && Number.isFinite(Date.parse(letter.unlockAt))
    ) : [];
  } catch {
    return [];
  }
}

function saveLetters() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
    return true;
  } catch {
    feedback.textContent = "Your browser couldn't save this letter. Check available storage and try again.";
    return false;
  }
}

function localDateTimeValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function setDateBounds() {
  const now = new Date();
  dateInput.min = localDateTimeValue(new Date(now.getTime() + 60_000));
  if (!dateInput.value) {
    dateInput.value = localDateTimeValue(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderMessages() {
  messageList.replaceChildren();
  const sortedLetters = [...letters].sort((a, b) => Date.parse(a.unlockAt) - Date.parse(b.unlockAt));
  messageTotal.textContent = String(letters.length).padStart(2, "0");
  messageTotal.setAttribute("aria-label", `${letters.length} ${letters.length === 1 ? "letter" : "letters"}`);

  if (sortedLetters.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const mark = document.createElement("span");
    mark.className = "empty-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "✳";
    const title = document.createElement("p");
    title.textContent = "Nothing in the time capsule. Yet.";
    const detail = document.createElement("span");
    detail.textContent = "Your first letter is one small thought away.";
    empty.append(mark, title, detail);
    messageList.append(empty);
    return;
  }

  for (const letter of sortedLetters) {
    messageList.append(createLetterCard(letter));
  }
  updateCountdowns();
}

function createLetterCard(letter) {
  const card = document.createElement("article");
  card.className = "letter-card";
  card.dataset.letterId = letter.id;

  const main = document.createElement("div");
  main.className = "card-main";

  const topline = document.createElement("div");
  topline.className = "card-topline";
  const date = document.createElement("span");
  date.className = "letter-date";
  date.textContent = formatDate(letter.unlockAt);
  const status = document.createElement("span");
  status.className = "status-pill";
  status.dataset.status = "";
  topline.append(date, status);

  const title = document.createElement("h3");
  title.className = "card-name";
  title.textContent = `A note for ${letter.name}`;

  const countdown = document.createElement("div");
  countdown.className = "countdown";
  countdown.dataset.countdown = "";
  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-label", `Time until ${letter.name}'s letter unlocks`);
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progressFill.dataset.progress = "";
  progressTrack.append(progressFill);

  const content = document.createElement("p");
  content.className = "letter-content";
  content.textContent = letter.message;

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";
  const caption = document.createElement("span");
  caption.className = "card-caption";
  const removeButton = document.createElement("button");
  removeButton.className = "delete-letter";
  removeButton.type = "button";
  removeButton.dataset.delete = letter.id;
  removeButton.setAttribute("aria-label", `Delete letter for ${letter.name}`);
  removeButton.title = "Delete letter";
  removeButton.textContent = "×";
  bottom.append(caption, removeButton);

  main.append(topline, title, countdown, progressTrack, content, bottom);
  card.append(main);
  return card;
}

function updateCountdowns() {
  const now = Date.now();

  for (const card of messageList.querySelectorAll(".letter-card")) {
    const letter = letters.find((item) => item.id === card.dataset.letterId);
    if (!letter) continue;

    const unlockAt = Date.parse(letter.unlockAt);
    const remaining = unlockAt - now;
    const status = card.querySelector("[data-status]");
    const countdown = card.querySelector("[data-countdown]");
    const caption = card.querySelector(".card-caption");
    const fill = card.querySelector("[data-progress]");
    const track = card.querySelector("[role='progressbar']");

    if (remaining <= 0) {
      card.classList.add("is-unlocked");
      status.textContent = "UNLOCKED";
      countdown.textContent = "The moment is here.";
      caption.textContent = "A message from your past self";
      fill.style.width = "100%";
      track.setAttribute("aria-valuenow", "100");
      continue;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${String(hours).padStart(2, "0")}h`, `${String(minutes).padStart(2, "0")}m`, `${String(seconds).padStart(2, "0")}s`);
    status.textContent = "SEALED";
    countdown.textContent = parts.join("  ");
    caption.textContent = "until this letter opens";

    const createdAt = Date.parse(letter.createdAt) || now;
    const duration = Math.max(unlockAt - createdAt, 1);
    const progress = Math.min(100, Math.max(0, ((now - createdAt) / duration) * 100));
    fill.style.width = `${progress}%`;
    track.setAttribute("aria-valuenow", String(Math.round(progress)));
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "☼" : "☾";
  document.querySelector("meta[name='theme-color']").content = isDark ? "#1d211e" : "#f3f2ec";
}

function showQuote() {
  const quote = quotes[quoteIndex];
  document.querySelector("#quote-text").textContent = quote.text;
  document.querySelector("#quote-author").textContent = `— ${quote.author}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent = "";
  const unlockDate = new Date(dateInput.value);

  if (!Number.isFinite(unlockDate.getTime()) || unlockDate.getTime() <= Date.now()) {
    feedback.textContent = "Choose a date and time in the future to seal your letter.";
    dateInput.focus();
    return;
  }

  const now = new Date();
  const letter = {
    id: globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    name: nameInput.value.trim(),
    message: messageInput.value.trim(),
    createdAt: now.toISOString(),
    unlockAt: unlockDate.toISOString()
  };

  if (!letter.name || !letter.message) {
    feedback.textContent = "Add your name and a message before sealing.";
    return;
  }

  letters.push(letter);
  if (!saveLetters()) {
    letters.pop();
    return;
  }

  renderMessages();
  form.reset();
  setDateBounds();
  characterCount.textContent = "0 / 1000";
  feedback.textContent = "Sealed. Future you has something to look forward to.";
});

messageInput.addEventListener("input", () => {
  characterCount.textContent = `${messageInput.value.length} / 1000`;
});

messageList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  letters = letters.filter((letter) => letter.id !== button.dataset.delete);
  if (saveLetters()) renderMessages();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
  }
});

document.querySelector("#quote-refresh").addEventListener("click", () => {
  quoteIndex = (quoteIndex + 1 + Math.floor(Math.random() * (quotes.length - 1))) % quotes.length;
  showQuote();
});

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
}).format(new Date());

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem(THEME_KEY) || "light";
} catch {
  savedTheme = "light";
}
applyTheme(savedTheme);
setDateBounds();
showQuote();
renderMessages();
window.setInterval(updateCountdowns, 1000);