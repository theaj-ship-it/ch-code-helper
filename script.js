"use strict";

// cH Code Helper — Frontend application

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("question-form");
  const levelSelect = document.getElementById("level");
  const languageSelect = document.getElementById("language");
  const topicSelect = document.getElementById("topic");
  const questionInput = document.getElementById("question");

  const submitButton = document.getElementById("submit-button");
  const sampleButton = document.getElementById("sample-button");

  const connectionStatus =
    document.getElementById("connection-status");
  const connectionBadge =
    document.getElementById("connection-badge");
  const lessonOutput =
    document.getElementById("lesson-output");
  const lessonTitle =
    document.getElementById("lesson-title");

  // Read the backend URL from api-config.js.
  const apiBaseUrl = (
    window.CH_CONFIG?.API_BASE_URL || ""
  ).trim().replace(/\/+$/, "");

  function setConnectionStatus(message, badge) {
    if (connectionStatus) {
      connectionStatus.textContent = message;
    }

    if (connectionBadge) {
      connectionBadge.textContent = badge;
    }
  }

  function showMessage(message) {
    lessonOutput.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    lessonOutput.appendChild(paragraph);
  }

  function showLesson(title, answer) {
    lessonTitle.textContent = title;
    lessonOutput.replaceChildren();

    // Display the AI response as readable paragraphs.
    // textContent prevents returned text from being treated as HTML.
    const sections = answer
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    sections.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      lessonOutput.appendChild(paragraph);
    });
  }

  async function checkBackend() {
    if (!apiBaseUrl) {
      setConnectionStatus(
        "Backend URL is missing. Check api-config.js.",
        "NOT CONNECTED"
      );
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/health`
      );

      if (!response.ok) {
        throw new Error("Backend health check failed.");
      }

      const data = await response.json();

      if (data.status === "ok" && data.configured === true) {
        setConnectionStatus(
          "Backend is ready. You can ask a question.",
          "CONNECTED"
        );
      } else {
        setConnectionStatus(
          "Backend is online, but AI configuration needs checking.",
          "CHECK CONFIG"
        );
      }
    } catch (error) {
      console.error("Backend check failed:", error);

      setConnectionStatus(
        "Could not reach the backend. Please try again later.",
        "NOT CONNECTED"
      );
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      showMessage(
        "The backend URL is missing. Check api-config.js before submitting."
      );
      setConnectionStatus(
        "Backend URL is missing.",
        "NOT CONNECTED"
      );
      return;
    }

    const level = levelSelect.value;
    const language = languageSelect.value;
    const topic = topicSelect.value;
    const question = questionInput.value.trim();

    if (!question) {
      showMessage("Please enter a programming question first.");
      questionInput.focus();
      return;
    }

    // Include the selected topic in the question sent to Gemini.
    const fullQuestion =
      `Topic: ${topic}\nStudent question: ${question}`;

    submitButton.disabled = true;
    submitButton.textContent = "Building your lesson...";

    showMessage(
      "Your question is being sent to cH Code Helper. Please wait..."
    );

    lessonTitle.textContent = "Preparing your lesson";

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: fullQuestion,
            language: language,
            level: level
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          `Request failed with status ${response.status}.`
        );
      }

      if (!data.answer || typeof data.answer !== "string") {
        throw new Error(
          "The AI returned no lesson. Please try again."
        );
      }

      showLesson("Your learning steps", data.answer);

      setConnectionStatus(
        "Your lesson was generated successfully.",
        "CONNECTED"
      );
    } catch (error) {
      console.error("Lesson request failed:", error);

      showMessage(
        `Sorry, your lesson could not be generated. ${error.message} Check your connection and try again.`
      );

      lessonTitle.textContent = "Let's try again";

      setConnectionStatus(
        "The AI request failed. The backend may need checking.",
        "REQUEST FAILED"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Build my learning steps →";
    }
  });

  // Sample lesson works without calling the AI backend.
  sampleButton.addEventListener("click", () => {
    lessonTitle.textContent = "Sample lesson: Loops";

    const sample = [
      "1. Concept",
      "A loop repeats a block of instructions. It helps you avoid writing the same code many times.",
      "2. Logic and steps",
      "Step 1: Decide what action should repeat.",
      "Step 2: Decide how many times it should repeat.",
      "Step 3: Use a loop to repeat the action.",
      "3. Example — Python",
      "for i in range(1, 4):",
      "    print(i)",
      "Output: 1, 2, 3",
      "4. Practice task",
      "Try changing the loop so it prints numbers from 1 to 5. Think about what range() needs."
    ].join("\n");

    showLesson("Sample lesson: Loops", sample);
  });

  // Check the backend when the website opens.
  checkBackend();
});
