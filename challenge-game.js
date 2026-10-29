"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("code-detective-start");
  const languageSelect = document.getElementById("language");
  const levelSelect = document.getElementById("level");
  const topicSelect = document.getElementById("topic");
  const lessonOutput = document.getElementById("lesson-output");
  const lessonTitle = document.getElementById("lesson-title");
  const connectionStatus = document.getElementById("connection-status");
  const connectionBadge = document.getElementById("connection-badge");

  if (!startButton || !languageSelect || !levelSelect || !topicSelect || !lessonOutput || !lessonTitle) {
    console.error("Code Detective could not start: a required element is missing.");
    return;
  }

  const apiBaseUrl = String(window.CH_CONFIG && window.CH_CONFIG.API_BASE_URL || "").trim().replace(/\/+$/, "");
  const XP_STORAGE_KEY = "ch-code-helper-detective-xp-v1";
  const codeFence = String.fromCharCode(96).repeat(3);
  let currentCaseNumber = 0;

  function setStatus(message, badge) {
    if (connectionStatus) connectionStatus.textContent = message;
    if (connectionBadge) connectionBadge.textContent = badge;
  }

  function addElement(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function readXP() {
    try {
      const value = Number(window.localStorage.getItem(XP_STORAGE_KEY) || 0);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function saveXP(value) {
    try {
      window.localStorage.setItem(XP_STORAGE_KEY, String(value));
    } catch (_) {
      // The case still works if local storage is unavailable.
    }
  }

  function normaliseOption(value) {
    return String(value || "")
      .replace(/^\s*(?:(?:option\s*)?[A-D]\s*[\).:\-]\s*)/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getCorrectIndex(options, expected) {
    const target = normaliseOption(expected);
    if (target) {
      const found = options.findIndex(function (option) {
        const candidate = normaliseOption(option);
        return candidate === target || candidate.indexOf(target) === 0 || target.indexOf(candidate) === 0;
      });
      if (found >= 0) return found;
    }
    const label = String(expected || "").match(/^\s*(?:option\s*)?([A-D])(?:\s|[\).:\-]|$)/i);
    if (label) return label[1].toUpperCase().charCodeAt(0) - 65;
    return -1;
  }

  function parseProblem(problem) {
    const raw = String(problem || "").trim();
    const codeSplit = raw.split("---CODE---");
    if (codeSplit.length < 2) {
      return {
        scenario: raw.replace(/^SCENARIO:\s*/i, ""),
        code: "",
        question: "Read the case and decide what the code should do. If a code panel is missing, use the clues to identify the requested concept."
      };
    }

    const scenario = codeSplit[0].replace(/^SCENARIO:\s*/i, "").trim();
    const remainder = codeSplit.slice(1).join("---CODE---");
    const questionSplit = remainder.split("---QUESTION---");
    let code = questionSplit[0].trim();
    const question = questionSplit.length > 1
      ? questionSplit.slice(1).join("---QUESTION---").trim()
      : "Inspect the code. What is the correct observation?";
    code = code.replace(new RegExp("^" + codeFence + "[A-Za-z0-9+#.-]*\\s*"), "");
    code = code.replace(new RegExp("\\s*" + codeFence + "$"), "");
    return { scenario: scenario, code: code, question: question };
  }

  async function requestCase() {
    if (!apiBaseUrl) {
      setStatus("Backend URL is missing. Check api-config.js.", "NOT CONNECTED");
      renderError("The Code Detective needs the cH backend. Check api-config.js and try again.");
      return;
    }

    const language = languageSelect.value || "Python";
    const level = levelSelect.value || "Beginner";
    const topic = topicSelect.value || "Other";

    startButton.disabled = true;
    startButton.textContent = "Preparing investigation...";
    if (connectionStatus) setStatus("Preparing a code investigation...", "WORKING");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(function () { controller.abort(); }, 150000);

    try {
      const response = await fetch(apiBaseUrl + "/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: language, level: level, topic: topic }),
        signal: controller.signal
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        throw new Error(data.error || "Request failed with HTTP " + response.status + ".");
      }
      if (!data.challenge) throw new Error("The backend returned no case.");

      const challenge = data.challenge;
      if (typeof challenge.title !== "string" ||
          typeof challenge.problem !== "string" ||
          !Array.isArray(challenge.requirements) ||
          challenge.requirements.length < 4 ||
          !Array.isArray(challenge.hints) ||
          challenge.hints.length < 2 ||
          typeof challenge.solution !== "string" ||
          typeof challenge.explanation !== "string") {
        throw new Error("This case is missing the code, four choices, clues, or explanation. Start another case.");
      }

      currentCaseNumber += 1;
      renderCase(challenge, language, level, topic);
      setStatus("Case ready. Inspect the code before choosing an answer.", "CASE READY");
    } catch (error) {
      console.error("Code Detective request failed:", error);
      renderError(error.name === "AbortError"
        ? "The investigation took too long. Check the connection and start another case."
        : "Could not prepare the investigation. " + error.message);
      setStatus("Challenge request failed. Check and retry.", "REQUEST FAILED");
    } finally {
      window.clearTimeout(timeoutId);
      startButton.disabled = false;
      startButton.textContent = "Start a new investigation";
    }
  }

  function renderError(message) {
    lessonTitle.textContent = "Code Detective needs another try";
    lessonOutput.replaceChildren();
    const panel = addElement(lessonOutput, "section", "detective-panel");
    addElement(panel, "p", "detective-instruction", message);
    const retry = addElement(panel, "button", "detective-action", "Try again");
    retry.type = "button";
    retry.addEventListener("click", requestCase);
  }

  function renderCase(challenge, language, level, topic) {
    const parsed = parseProblem(challenge.problem);
    const options = challenge.requirements.slice(0, 4).map(function (item) { return String(item); });
    const correctIndex = getCorrectIndex(options, challenge.exampleOutput);
    const xpBefore = readXP();
    const caseState = {
      answered: false,
      attempts: [],
      hintsUsed: 0,
      xpAwarded: false,
      solutionShown: false,
      reasoningShown: false
    };

    lessonTitle.textContent = "Code Detective: " + challenge.title;
    lessonOutput.replaceChildren();

    const panel = addElement(lessonOutput, "section", "detective-panel");
    const header = addElement(panel, "div", "detective-topline");
    addElement(header, "span", "detective-case-chip", "CASE " + String(currentCaseNumber).padStart(2, "0"));
    addElement(header, "span", "detective-xp", "XP bank: " + xpBefore);

    addElement(panel, "h3", "detective-mission-title", challenge.title);
    addElement(panel, "p", "detective-instruction",
      parsed.scenario || "A fresh code investigation is ready. Inspect the snippet and answer the question.");
    addElement(panel, "p", "detective-level",
      level + " · " + language + " · " + topic + " · +100 XP for a clean solve");

    if (challenge.exampleInput && String(challenge.exampleInput).trim()) {
      const dataBox = addElement(panel, "div", "detective-input-box");
      addElement(dataBox, "strong", "", "Test data / starting state");
      addElement(dataBox, "p", "", String(challenge.exampleInput).trim());
    }

    if (parsed.code) {
      addElement(panel, "p", "detective-code-label", "INSPECT THE CODE");
      const pre = addElement(panel, "pre", "detective-code");
      const codeText = parsed.code.split(/\r?\n/).map(function (line, index) {
        return String(index + 1).padStart(2, "0") + "  " + line;
      }).join("\n");
      const code = addElement(pre, "code", "", codeText);
      code.setAttribute("aria-label", "Code snippet with line numbers");
    } else {
      addElement(panel, "p", "detective-missing-code",
        "This generated case did not separate its code snippet into a code block. You can still investigate the prompt and clues.");
    }

    addElement(panel, "h3", "detective-question-title", "Your investigation");
    addElement(panel, "p", "detective-question", parsed.question);
    addElement(panel, "p", "detective-instruction",
      "Choose the best observation. A wrong guess does not end the case. Use clues, inspect the lines again, and try another option.");

    const choices = addElement(panel, "div", "detective-options");
    const answerFeedback = addElement(panel, "p", "detective-feedback", "");
    answerFeedback.setAttribute("role", "status");
    answerFeedback.setAttribute("aria-live", "polite");

    const actionRow = addElement(panel, "div", "detective-actions");
    const clueButton = addElement(actionRow, "button", "detective-action detective-secondary", "Reveal clue 1");
    clueButton.type = "button";

    const clueArea = addElement(panel, "div", "detective-clues");
    const reasoningArea = addElement(panel, "div", "detective-reasoning");
    const solutionArea = addElement(panel, "div", "detective-solution-area");

    function showXP() {
      const xpNow = readXP();
      const xpLabel = header.querySelector(".detective-xp");
      if (xpLabel) xpLabel.textContent = "XP bank: " + xpNow;
    }

    function addXP(points) {
      if (caseState.xpAwarded) return;
      caseState.xpAwarded = true;
      saveXP(xpBefore + points);
      showXP();
    }

    function revealReasoning() {
      if (caseState.reasoningShown) return;
      caseState.reasoningShown = true;
      reasoningArea.replaceChildren();
      addElement(reasoningArea, "h3", "detective-section-title", "How to reason through it");
      addElement(reasoningArea, "p", "", challenge.explanation);
      if (challenge.complexity && String(challenge.complexity).trim()) {
        addElement(reasoningArea, "p", "detective-complexity", "Efficiency note: " + challenge.complexity);
      }
    }

    function revealSolution() {
      if (caseState.solutionShown) return;
      if (!caseState.answered && caseState.hintsUsed < 2) {
        answerFeedback.textContent = "Try an answer or reveal both clues before opening the full solution.";
        return;
      }
      caseState.solutionShown = true;
      solutionArea.replaceChildren();
      addElement(solutionArea, "h3", "detective-section-title", "Solution unlocked");
      const pre = addElement(solutionArea, "pre", "detective-code detective-solution-code");
      addElement(pre, "code", "", challenge.solution);
      revealReasoning();
      addElement(solutionArea, "p", "detective-complete",
        "Case reviewed. Read the code once more, then start a new investigation to practise a different pattern.");
    }

    options.forEach(function (option, index) {
      const button = addElement(choices, "button", "detective-option", String.fromCharCode(65 + index) + ". " + option);
      button.type = "button";
      button.addEventListener("click", function () {
        if (caseState.answered || caseState.attempts.indexOf(index) !== -1) return;
        caseState.attempts.push(index);
        if (index === correctIndex) {
          caseState.answered = true;
          const cleanSolve = caseState.hintsUsed === 0 && caseState.attempts.length === 1;
          const points = Math.max(25, 100 - caseState.hintsUsed * 20 - (caseState.attempts.length - 1) * 10);
          addXP(points);
          answerFeedback.className = "detective-feedback is-correct";
          answerFeedback.textContent = "Case solved. +" + points + " XP. " +
            (cleanSolve ? "Clean solve, no clues needed." : "Good work using the clues and code evidence.") +
            " Your observation: " + option.replace(/^\s*[A-D]\s*[\).:\-]\s*/i, "");
          choices.querySelectorAll("button").forEach(function (choiceButton) {
            choiceButton.disabled = true;
            choiceButton.classList.toggle("is-correct", choiceButton === button);
          });
          revealReasoningButton.hidden = false;
          solutionButton.hidden = false;
          clueButton.disabled = true;
        } else {
          button.disabled = true;
          button.classList.add("is-wrong");
          answerFeedback.className = "detective-feedback is-wrong";
          answerFeedback.textContent = "Not that one. Recheck the line order or boundary condition, then try another option or reveal a clue.";
          if (caseState.attempts.length >= options.length) {
            caseState.answered = true;
            answerFeedback.textContent = "Investigation complete. Correct observation: " +
              (correctIndex >= 0 ? options[correctIndex].replace(/^\s*[A-D]\s*[\).:\-]\s*/i, "") :
                "The answer key was missing, so use the explanation below.") +
              ". Read the reasoning and solution to learn the pattern.";
            addXP(15);
            revealReasoningButton.hidden = false;
            solutionButton.hidden = false;
            clueButton.disabled = true;
          }
        }
      });
    });

    const revealReasoningButton = addElement(actionRow, "button", "detective-action detective-secondary", "Explain the reasoning");
    revealReasoningButton.type = "button";
    revealReasoningButton.hidden = true;
    revealReasoningButton.addEventListener("click", function () {
      revealReasoning();
      revealReasoningButton.disabled = true;
      revealReasoningButton.textContent = "Reasoning reviewed";
    });

    const solutionButton = addElement(actionRow, "button", "detective-action", "Unlock solution");
    solutionButton.type = "button";
    solutionButton.hidden = true;
    solutionButton.addEventListener("click", function () {
      revealSolution();
      solutionButton.disabled = true;
      solutionButton.textContent = "Solution reviewed";
    });

    clueButton.addEventListener("click", function () {
      if (caseState.hintsUsed >= 2) return;
      const hint = String(challenge.hints[caseState.hintsUsed] || "");
      caseState.hintsUsed += 1;
      const clue = addElement(clueArea, "div", "detective-clue");
      addElement(clue, "strong", "", "Clue " + caseState.hintsUsed);
      addElement(clue, "p", "", hint);
      if (caseState.hintsUsed < 2) {
        clueButton.textContent = "Reveal clue 2";
      } else {
        clueButton.textContent = "Both clues revealed";
        clueButton.disabled = true;
        if (!caseState.answered) {
          solutionButton.hidden = false;
          revealReasoningButton.hidden = false;
        }
      }
    });

    const footer = addElement(panel, "div", "detective-footer");
    addElement(footer, "p", "", "Think first. Inspect the evidence. Use clues only when you need them.");
    const nextCase = addElement(footer, "button", "detective-action detective-secondary", "Start another case");
    nextCase.type = "button";
    nextCase.addEventListener("click", requestCase);
  }

  startButton.addEventListener("click", requestCase);
});
