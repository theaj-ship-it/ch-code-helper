"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Get page elements
  const form = document.getElementById("question-form");
  const levelSelect = document.getElementById("level");
  const languageSelect = document.getElementById("language");
  const topicSelect = document.getElementById("topic");
  const questionInput = document.getElementById("question");

  const submitButton = document.getElementById("submit-button");
  const sampleButton = document.getElementById("sample-button");

  const connectionStatus = document.getElementById("connection-status");
  const connectionBadge = document.getElementById("connection-badge");
  const lessonOutput = document.getElementById("lesson-output");
  const lessonTitle = document.getElementById("lesson-title");

  const ideaBulb = document.getElementById("idea-bulb");
  const cursorBee = document.getElementById("cursor-bee");

  // 2. Read backend configuration
  const apiBaseUrl = String(
    window.CH_CONFIG?.API_BASE_URL || ""
  ).trim().replace(/\/+$/, "");

  // 3. Display connection status
  function setConnectionStatus(message, badge) {
    if (connectionStatus) {
      connectionStatus.textContent = message;
    }

    if (connectionBadge) {
      connectionBadge.textContent = badge;
    }
  }

  // 4. Display messages safely
  function showMessage(message) {
    if (!lessonOutput) return;

    lessonOutput.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    lessonOutput.appendChild(paragraph);
  }

  // 5. Display AI lessons without interpreting HTML from the AI
  function showLesson(title, answer) {
    if (!lessonOutput || !lessonTitle) return;

    lessonTitle.textContent = title;
    lessonOutput.replaceChildren();

    const lines = answer.split(/\r?\n/);
    let codeLines = [];
    let insideCode = false;

    function addCodeBlock() {
      const pre = document.createElement("pre");
      const code = document.createElement("code");

      code.textContent = codeLines.join("\n");
      pre.appendChild(code);
      lessonOutput.appendChild(pre);
      codeLines = [];
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith("```")) {
        if (insideCode) {
          addCodeBlock();
          insideCode = false;
        } else {
          insideCode = true;
          codeLines = [];
        }
        continue;
      }

      if (insideCode) {
        codeLines.push(rawLine);
        continue;
      }

      if (!line) continue;

      const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
      const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
      const bulletMatch = line.match(/^[-*]\s+(.+)$/);

      let element;
      let content = line;

      if (headingMatch) {
        element = document.createElement("h3");
        content = headingMatch[1];
      } else if (numberedMatch || bulletMatch) {
        element = document.createElement("p");
        content = numberedMatch
          ? `${line.match(/^\d+[.)]/)[0]} ${numberedMatch[1]}`
          : `• ${bulletMatch[1]}`;
      } else {
        element = document.createElement("p");
      }

      // Support basic **bold** markers using safe text nodes.
      const parts = content.split(/(\*\*[^*]+\*\*)/g);

      for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
          const strong = document.createElement("strong");
          strong.textContent = part.slice(2, -2);
          element.appendChild(strong);
        } else {
          element.appendChild(document.createTextNode(part));
        }
      }

      lessonOutput.appendChild(element);
    }

    // Recover gracefully if the AI response has an unclosed code fence.
    if (insideCode && codeLines.length) {
      addCodeBlock();
    }
  }

  // 6. Check the backend with a timeout
  async function checkBackend() {
    if (!apiBaseUrl) {
      setConnectionStatus(
        "Backend URL missing. Check api-config.js.",
        "NOT CONNECTED"
      );
      return;
    }

    setConnectionStatus("Connecting to backend...", "CHECKING");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Health check returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "ok" && data.configured === true) {
        setConnectionStatus(
          "Backend connected. You can ask a question.",
          "CONNECTED"
        );
      } else {
        setConnectionStatus(
          "Backend is online, but AI configuration needs checking.",
          "CHECK CONFIG"
        );
      }
    } catch (error) {
      console.error("Backend health check failed:", error);

      setConnectionStatus(
        error.name === "AbortError"
          ? "Backend check timed out. Check your connection."
          : "Could not connect. Check network or CORS settings.",
        "NOT CONNECTED"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 7. Submit a programming question
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!apiBaseUrl) {
        showMessage(
          "The backend URL is missing. Check api-config.js."
        );
        setConnectionStatus("Backend URL is missing.", "NOT CONNECTED");
        return;
      }

      const question = questionInput?.value.trim() || "";

      if (!question) {
        showMessage("Please enter a programming question first.");
        questionInput?.focus();
        return;
      }

      if (question.length > 4000) {
        showMessage("Please keep your question under 4000 characters.");
        return;
      }

      const level = levelSelect?.value || "Beginner";
      const language = languageSelect?.value || "Python";
      const topic = topicSelect?.value || "Other";

      const fullQuestion =
        `Topic: ${topic}\nStudent question: ${question}`;

      submitButton.disabled = true;
      submitButton.textContent = "Building your lesson...";

      if (ideaBulb) {
        ideaBulb.classList.add("is-glowing");
      }

      if (lessonTitle) {
        lessonTitle.textContent = "Preparing your lesson";
      }

      showMessage("Sending your question to cH Code Helper. Please wait...");
      setConnectionStatus("Generating your lesson...", "WORKING");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(`${apiBaseUrl}/api/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: fullQuestion,
            language,
            level
          }),
          signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || `Request failed with HTTP ${response.status}.`
          );
        }

        if (typeof data.answer !== "string" || !data.answer.trim()) {
          throw new Error("The AI returned an empty lesson. Please try again.");
        }

        showLesson("Your learning steps", data.answer);
        setConnectionStatus("Your lesson was generated successfully.", "CONNECTED");
      } catch (error) {
        console.error("Lesson request failed:", error);

        const message = error.name === "AbortError"
          ? "The request timed out. Please try again."
          : error.message === "Failed to fetch"
            ? "The browser could not reach the AI service. Check your connection and backend CORS settings."
            : error.message || "An unexpected error occurred.";

        showMessage(`Your lesson could not be generated. ${message}`);

        if (lessonTitle) {
          lessonTitle.textContent = "Let's try again";
        }

        setConnectionStatus("The AI request failed. Check the error and retry.", "REQUEST FAILED");
      } finally {
        clearTimeout(timeoutId);
        submitButton.disabled = false;
        submitButton.textContent = "Build my learning steps →";

        if (ideaBulb) {
          ideaBulb.classList.remove("is-glowing");
        }
      }
    });
  }

  // 8. Load a sample lesson without calling the AI
  if (sampleButton) {
    sampleButton.addEventListener("click", () => {
      const sample = [
        "1. Concept",
        "A loop repeats a block of instructions so you do not have to write the same code many times.",
        "",
        "2. Logic and steps",
        "Step 1: Decide what action should repeat.",
        "Step 2: Decide how many times it should repeat.",
        "Step 3: Use a loop to repeat the action.",
        "",
        "3. Example — Python",
        "```python",
        "for i in range(1, 4):",
        "    print(i)",
        "```",
        "Output: 1, 2, 3",
        "",
        "4. Practice task",
        "Change the loop so it prints numbers from 1 to 5. What should you change in range()?"
      ].join("\n");

      showLesson("Sample lesson: Loops", sample);
    });
  }

  // 9. Optional animated bee cursor for pointer devices
  if (cursorBee) {
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;

      cursorBee.style.transform =
        `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`;

      cursorBee.classList.add("is-visible", "is-flying");
    });

    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) {
        cursorBee.classList.remove("is-visible", "is-flying");
      }
    });
  }

  // 10. Start the backend check
  checkBackend();
});
