
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("question-form");
  const levelSelect = document.getElementById("level");
  const languageSelect = document.getElementById("language");
  const topicSelect = document.getElementById("topic");
  const questionInput = document.getElementById("question");
  const attachmentsInput = document.getElementById("attachments");
  const attachmentList = document.getElementById("attachment-list");

  const submitButton = document.getElementById("submit-button");
  const sampleButton = document.getElementById("sample-button");

  const connectionStatus = document.getElementById("connection-status");
  const connectionBadge = document.getElementById("connection-badge");
  const lessonOutput = document.getElementById("lesson-output");
  const lessonTitle = document.getElementById("lesson-title");

  const ideaBulb = document.getElementById("idea-bulb");
  const cursorBee = document.getElementById("cursor-bee");

  const apiBaseUrl = String(
    window.CH_CONFIG?.API_BASE_URL || ""
  ).trim().replace(/\/+$/, "");

  function setConnectionStatus(message, badge) {
    if (connectionStatus) connectionStatus.textContent = message;
    if (connectionBadge) connectionBadge.textContent = badge;
  }

  function showMessage(message) {
    if (!lessonOutput) return;

    lessonOutput.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    lessonOutput.appendChild(paragraph);
  }

  function addTextElement(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  // Existing lesson renderer, with safe text rendering.
  function showLesson(title, answer) {
    if (!lessonOutput || !lessonTitle) return;

    lessonTitle.textContent = title;
    lessonOutput.replaceChildren();

    const lines = answer.split(/\r?\n/);
    let insideCode = false;
    let codeLines = [];

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

      const heading = line.match(/^#{1,4}\s+(.+)$/);
      const numbered = line.match(/^(\d+[.)])\s+(.+)$/);
      const bullet = line.match(/^[-*]\s+(.+)$/);

      let element;
      let content = line;

      if (heading) {
        element = document.createElement("h3");
        content = heading[1];
      } else {
        element = document.createElement("p");
        if (numbered) {
          content = `${numbered[1]} ${numbered[2]}`;
        } else if (bullet) {
          content = `• ${bullet[1]}`;
        }
      }

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

    if (insideCode && codeLines.length > 0) addCodeBlock();
  }

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
          "Backend online, but AI configuration needs checking.",
          "CHECK CONFIG"
        );
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
      setConnectionStatus(
        error.name === "AbortError"
          ? "Backend check timed out. Check your connection."
          : "Connection failed. Check network or CORS settings.",
        "NOT CONNECTED"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Shared request helper.
  async function postJSON(path, body, timeout = 45000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed with HTTP ${response.status}.`
        );
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const MAX_ATTACHMENTS = 3;
  const MAX_TEXT_BYTES = 40 * 1024;
  const MAX_TOTAL_BINARY_BYTES = 7 * 1024 * 1024;
  const MAX_BINARY_FILE_BYTES = 5 * 1024 * 1024;
  const TEXT_FILE_EXTENSIONS = new Set([
    "txt", "md", "py", "js", "ts", "jsx", "tsx", "java", "c", "cpp",
    "h", "html", "css", "json", "csv", "sql", "xml", "yaml", "yml", "log"
  ]);
  const IMAGE_MIME_BY_EXTENSION = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp"
  };

  function fileExtension(filename) {
    const parts = String(filename || "").toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
  }

  function showSelectedFiles() {
    if (!attachmentList || !attachmentsInput) return;
    const files = Array.from(attachmentsInput.files || []);
    attachmentList.replaceChildren();

    if (!files.length) {
      attachmentList.textContent = "No files attached.";
      return;
    }

    const list = document.createElement("ul");
    list.className = "attachment-items";
    files.forEach((file) => {
      const item = document.createElement("li");
      const sizeKB = Math.max(1, Math.ceil(file.size / 1024));
      item.textContent = `${file.name} · ${sizeKB} KB`;
      list.appendChild(item);
    });
    attachmentList.appendChild(list);
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error(`Could not read ${file.name}.`));
          return;
        }
        const comma = reader.result.indexOf(",");
        if (comma < 0) {
          reject(new Error(`Could not prepare ${file.name} for upload.`));
          return;
        }
        resolve(reader.result.slice(comma + 1));
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function prepareAttachments(files) {
    if (files.length > MAX_ATTACHMENTS) {
      throw new Error("Please attach no more than 3 files at a time.");
    }

    const prepared = [];
    let binaryBytes = 0;
    let textCharacters = 0;

    for (const file of files) {
      const ext = fileExtension(file.name);

      if (TEXT_FILE_EXTENSIONS.has(ext)) {
        if (file.size > MAX_TEXT_BYTES) {
          throw new Error(`${file.name} is too large. Text and code files must be 40 KB or smaller.`);
        }

        const text = await file.text();
        if (text.length > 40000) {
          throw new Error(`${file.name} contains too much text. Keep each text/code file under 40,000 characters.`);
        }
        textCharacters += text.length;
        if (textCharacters > 60000) {
          throw new Error("Please keep the combined text/code attachments under 60,000 characters.");
        }

        prepared.push({ name: file.name, kind: "text", text });
        continue;
      }

      const mimeType = ext === "pdf"
        ? "application/pdf"
        : IMAGE_MIME_BY_EXTENSION[ext];

      if (!mimeType) {
        throw new Error(`${file.name} is not a supported file type. Choose a code/text file, PDF, PNG, JPG, or WebP image.`);
      }
      if (file.size > MAX_BINARY_FILE_BYTES) {
        throw new Error(`${file.name} is too large. PDFs and images must be 5 MB or smaller.`);
      }

      binaryBytes += file.size;
      if (binaryBytes > MAX_TOTAL_BINARY_BYTES) {
        throw new Error("Please keep the combined PDF/image attachments under 7 MB.");
      }

      const data = await readFileAsBase64(file);
      prepared.push({ name: file.name, kind: "binary", mimeType, data });
    }

    return prepared;
  }

  if (attachmentsInput) {
    attachmentsInput.addEventListener("change", showSelectedFiles);
  }

  // Normal question form remains available.
  if (form && submitButton) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!apiBaseUrl) {
        showMessage("Backend URL is missing. Check api-config.js.");
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

      let attachments = [];
      try {
        attachments = await prepareAttachments(Array.from(attachmentsInput?.files || []));
      } catch (error) {
        showMessage(error.message);
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Building your lesson...";

      if (ideaBulb) ideaBulb.classList.add("is-glowing");
      if (lessonTitle) lessonTitle.textContent = "Preparing your lesson";

      showMessage(
        attachments.length
          ? `Sending your question and ${attachments.length} attachment(s) to cH Code Helper. Please wait...`
          : "Sending your question to cH Code Helper. Please wait..."
      );
      setConnectionStatus("Generating your lesson...", "WORKING");

      try {
        const data = await postJSON("/api/ask", {
          question: `Topic: ${topic}\nStudent question: ${question}`,
          language,
          level,
          attachments
        }, attachments.length ? 90000 : 45000);

        if (typeof data.answer !== "string" || !data.answer.trim()) {
          throw new Error("The AI returned an empty lesson. Please try again.");
        }

        showLesson("Your learning steps", data.answer);
        if (attachmentsInput) {
          attachmentsInput.value = "";
          showSelectedFiles();
        }
        setConnectionStatus("Your lesson was generated successfully.", "CONNECTED");
      } catch (error) {
        console.error("Lesson request failed:", error);

        showMessage(
          error.name === "AbortError"
            ? "The request timed out. Please try again."
            : `Your lesson could not be generated. ${error.message}`
        );

        if (lessonTitle) lessonTitle.textContent = "Let's try again";
        setConnectionStatus("The AI request failed. Check and retry.", "REQUEST FAILED");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Build my learning steps →";
        if (ideaBulb) ideaBulb.classList.remove("is-glowing");
      }
    });
  } else {
    console.error("Required question form or submit button is missing.");
    setConnectionStatus("Question form not found. Check index.html.", "PAGE ERROR");
  }

  // Challenge mode: reveal two hints, then offer the solution.
  function renderChallenge(challenge, language, level) {
    if (!lessonOutput || !lessonTitle) return;

    lessonTitle.textContent = `Challenge: ${challenge.title}`;
    lessonOutput.replaceChildren();

    addTextElement(lessonOutput, "h3", `${level} · ${language}`);
    addTextElement(lessonOutput, "p", challenge.problem);

    if (Array.isArray(challenge.requirements) && challenge.requirements.length) {
      addTextElement(lessonOutput, "h3", "Your requirements");

      const list = document.createElement("ul");
      challenge.requirements.forEach((item) => {
        addTextElement(list, "li", String(item));
      });
      lessonOutput.appendChild(list);
    }

    if (challenge.exampleInput) {
      addTextElement(lessonOutput, "h3", "Example input");
      addTextElement(lessonOutput, "p", challenge.exampleInput);
    }

    if (challenge.exampleOutput) {
      addTextElement(lessonOutput, "h3", "Expected output");
      addTextElement(lessonOutput, "p", challenge.exampleOutput);
    }

    const hintArea = document.createElement("section");
    hintArea.className = "challenge-hints";
    lessonOutput.appendChild(hintArea);

    const hintButton = document.createElement("button");
    hintButton.type = "button";
    hintButton.textContent = "Reveal hint 1";
    hintArea.appendChild(hintButton);

    const revealedHints = new Set();

    function revealHint(index) {
      if (revealedHints.has(index)) return;
      revealedHints.add(index);

      const heading = document.createElement("h3");
      heading.textContent = `Hint ${index + 1}`;
      hintArea.insertBefore(heading, hintButton);

      const hintText = document.createElement("p");
      hintText.textContent = challenge.hints[index];
      hintArea.insertBefore(hintText, hintButton);

      if (index === 0) {
        hintButton.textContent = "Reveal hint 2";
      } else {
        hintButton.remove();
        addTextElement(
          hintArea,
          "p",
          "You've tried both hints. You can now reveal the solution when you're ready."
        );

        const solutionButton = document.createElement("button");
        solutionButton.type = "button";
        solutionButton.textContent = "Show solution and explanation";
        hintArea.appendChild(solutionButton);

        solutionButton.addEventListener("click", () => {
          solutionButton.disabled = true;
          solutionButton.textContent = "Solution revealed";

          addTextElement(lessonOutput, "h3", "Solution");

          const pre = document.createElement("pre");
          const code = document.createElement("code");
          code.textContent = challenge.solution;
          pre.appendChild(code);
          lessonOutput.appendChild(pre);

          addTextElement(lessonOutput, "h3", "How it works");
          addTextElement(lessonOutput, "p", challenge.explanation);

          addTextElement(lessonOutput, "h3", "Complexity");
          addTextElement(lessonOutput, "p", challenge.complexity);
        });
      }
    }

    hintButton.addEventListener("click", () => {
      const nextHint = revealedHints.size;
      if (nextHint < 2) revealHint(nextHint);
    });
  }

  if (sampleButton) {
    sampleButton.textContent = "Give me a challenge";

    sampleButton.addEventListener("click", async () => {
      if (!apiBaseUrl) {
        showMessage("Backend URL is missing. Check api-config.js.");
        setConnectionStatus("Backend URL is missing.", "NOT CONNECTED");
        return;
      }

      const level = levelSelect?.value || "Beginner";
      const language = languageSelect?.value || "Python";
      const topic = topicSelect?.value || "Other";

      sampleButton.disabled = true;
      sampleButton.textContent = "Creating challenge...";

      if (ideaBulb) ideaBulb.classList.add("is-glowing");
      if (lessonTitle) lessonTitle.textContent = "Creating your challenge";

      showMessage(
        `Creating a ${level} challenge in ${language} about ${topic}...`
      );
      setConnectionStatus("Generating challenge...", "WORKING");

      try {
        const data = await postJSON("/api/challenge", {
          language,
          level,
          topic
        });

        if (!data.challenge) {
          throw new Error("The server returned no challenge.");
        }

        const challenge = data.challenge;

        if (
          typeof challenge.title !== "string" ||
          typeof challenge.problem !== "string" ||
          !Array.isArray(challenge.hints) ||
          challenge.hints.length < 2 ||
          typeof challenge.solution !== "string" ||
          typeof challenge.explanation !== "string"
        ) {
          throw new Error("The challenge response is incomplete.");
        }

        renderChallenge(challenge, language, level);
        setConnectionStatus("Challenge ready. Try solving it!", "CONNECTED");
      } catch (error) {
        console.error("Challenge request failed:", error);

        showMessage(
          error.name === "AbortError"
            ? "Challenge generation timed out. Please try again."
            : `Could not create the challenge. ${error.message}`
        );

        if (lessonTitle) lessonTitle.textContent = "Let's try again";
        setConnectionStatus("Challenge request failed.", "REQUEST FAILED");
      } finally {
        sampleButton.disabled = false;
        sampleButton.textContent = "Give me a challenge";
        if (ideaBulb) ideaBulb.classList.remove("is-glowing");
      }
    });
  }

  // Existing bee cursor animation.
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

  checkBackend();
});
