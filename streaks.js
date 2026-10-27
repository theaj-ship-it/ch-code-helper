"use strict";

/*
 * Local, account-free daily practice streaks.
 * A streak day is earned by finishing a Logic Sprint or explicitly logging
 * an attempted AI coding challenge. It counts at most once per local date.
 */
(() => {
  const STORAGE_KEY = "ch-code-helper-learning-streak-v1";
  const currentElement = document.getElementById("streak-current");
  const bestElement = document.getElementById("streak-best");
  const messageElement = document.getElementById("streak-message");
  const weekElement = document.getElementById("streak-week");

  const validDateKey = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function dayNumber(key) {
    if (!validDateKey(key)) return NaN;
    const parts = key.split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function defaultState() {
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null, completedDates: [] };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return defaultState();

      const completedDates = Array.isArray(saved.completedDates)
        ? saved.completedDates.filter(validDateKey).slice(-60)
        : [];
      const lastCompletedDate = validDateKey(saved.lastCompletedDate)
        ? saved.lastCompletedDate
        : null;

      if (lastCompletedDate && !completedDates.includes(lastCompletedDate)) {
        completedDates.push(lastCompletedDate);
      }

      return {
        currentStreak: Number.isInteger(saved.currentStreak) && saved.currentStreak >= 0
          ? saved.currentStreak : 0,
        bestStreak: Number.isInteger(saved.bestStreak) && saved.bestStreak >= 0
          ? saved.bestStreak : 0,
        lastCompletedDate,
        completedDates: [...new Set(completedDates)].sort().slice(-60),
      };
    } catch {
      // Storage may be unavailable in private browsing or restricted contexts.
      return defaultState();
    }
  }

  let state = loadState();

  function persistState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function visibleCurrentStreak(today) {
    if (!state.lastCompletedDate) return 0;
    const gap = dayNumber(today) - dayNumber(state.lastCompletedDate);
    return gap >= 0 && gap <= 1 ? state.currentStreak : 0;
  }

  function render() {
    const today = dateKey(new Date());
    const todayCompleted = state.completedDates.includes(today);
    const currentStreak = visibleCurrentStreak(today);

    if (currentElement) {
      currentElement.textContent = currentStreak + (currentStreak === 1 ? " day" : " days");
    }
    if (bestElement) {
      bestElement.textContent = state.bestStreak + (state.bestStreak === 1 ? " day" : " days");
    }
    if (messageElement) {
      if (todayCompleted) {
        messageElement.textContent = "Today's practice is logged. Come back tomorrow to keep it going.";
      } else if (state.lastCompletedDate && dayNumber(today) - dayNumber(state.lastCompletedDate) === 1) {
        messageElement.textContent = "Complete a Logic Sprint or coding challenge today to keep your streak alive.";
      } else {
        messageElement.textContent = "Finish a Logic Sprint or log a coding challenge to start today's streak.";
      }
    }

    if (weekElement) {
      weekElement.replaceChildren();
      const completed = new Set(state.completedDates);
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        const key = dateKey(date);
        const done = completed.has(key);
        const isToday = key === today;
        const item = document.createElement("div");
        item.className = "streak-day" + (done ? " is-complete" : "") + (isToday ? " is-today" : "");
        item.setAttribute("aria-label", date.toLocaleDateString(undefined, {
          weekday: "long", month: "short", day: "numeric",
        }) + (done ? ", practice completed" : ", no practice recorded"));

        const label = document.createElement("span");
        label.className = "streak-day-label";
        label.textContent = date.toLocaleDateString(undefined, { weekday: "short" });
        const marker = document.createElement("span");
        marker.className = "streak-day-marker";
        marker.textContent = done ? "✓" : "·";
        item.appendChild(label);
        item.appendChild(marker);
        weekElement.appendChild(item);
      }
    }
  }

  function recordPractice(source) {
    const today = dateKey(new Date());
    if (state.lastCompletedDate === today) {
      render();
      return {
        alreadyCounted: true,
        currentStreak: visibleCurrentStreak(today),
        bestStreak: state.bestStreak,
        saved: true,
      };
    }

    const gap = state.lastCompletedDate
      ? dayNumber(today) - dayNumber(state.lastCompletedDate)
      : Infinity;
    const nextStreak = gap === 1 ? state.currentStreak + 1 : 1;
    const completedDates = [...new Set([...state.completedDates, today])].sort().slice(-60);

    state = {
      currentStreak: nextStreak,
      bestStreak: Math.max(state.bestStreak, nextStreak),
      lastCompletedDate: today,
      completedDates,
    };
    const saved = persistState();
    render();

    return {
      alreadyCounted: false,
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      source: typeof source === "string" ? source : "Practice",
      saved,
    };
  }

  window.CH_STREAKS = Object.freeze({
    recordPractice,
    refresh: render,
    getSnapshot() {
      return {
        currentStreak: visibleCurrentStreak(dateKey(new Date())),
        bestStreak: state.bestStreak,
        lastCompletedDate: state.lastCompletedDate,
        completedDates: state.completedDates.slice(),
      };
    },
  });

  render();
})();
