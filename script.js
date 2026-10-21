(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("tutorForm");
    const languageSelect = document.getElementById("language");
    const topicSelect = document.getElementById("topic");
    const questionInput = document.getElementById("question");
    const answerTitle = document.getElementById("answerTitle");
    const answerContent = document.getElementById("answerContent");
    const exampleBtn = document.getElementById("exampleBtn");
    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");
    const modeTag = document.getElementById("answerModeTag");

    if (!form || !languageSelect || !topicSelect || !questionInput || !answerTitle || !answerContent) {
      console.error("cH could not start: required HTML elements are missing.");
      return;
    }

    const lessons = {
      "Loops": { intro: "A loop repeats instructions. It helps you perform the same task several times without duplicating code.", steps: [["Identify the repeated action", "Ask what should happen more than once."], ["Choose a stopping rule", "Use a for loop for a sequence or a while loop for a condition."], ["Trace each repetition", "Track the current value and check when the loop ends."]], code: { Python: "for number in range(1, 4):\n    print(number)", Java: "for (int number = 1; number < 4; number++) {\n    System.out.println(number);\n}", C: "for (int number = 1; number < 4; number++) {\n    printf(\"%d\\n\", number);\n}", "C++": "for (int number = 1; number < 4; number++) {\n    cout << number << endl;\n}", JavaScript: "for (let number = 1; number < 4; number++) {\n    console.log(number);\n}" }, output: "1\n2\n3", challenge: "Change the loop to print numbers from 1 to 5. Predict how many times it repeats." },
      "Arrays": { intro: "An array or list groups multiple values under one name. Each value can be accessed by its position, called an index.", steps: [["Choose related values", "For example, several test scores can be stored together."], ["Create the collection", "Use the array or list syntax of your chosen language."], ["Access one value", "Use an index. Many common languages start indexing at 0."]], code: { Python: "numbers = [10, 20, 30]\nprint(numbers[0])", Java: "int[] numbers = {10, 20, 30};\nSystem.out.println(numbers[0]);", C: "int numbers[] = {10, 20, 30};\nprintf(\"%d\\n\", numbers[0]);", "C++": "int numbers[] = {10, 20, 30};\ncout << numbers[0] << endl;", JavaScript: "const numbers = [10, 20, 30];\nconsole.log(numbers[0]);" }, output: "10", challenge: "Try accessing the second value. Check whether your language starts indexing at 0." },
      "Functions": { intro: "A function is a named, reusable block of instructions that helps organize a task and use it again.", steps: [["Name the task", "Choose a name that explains what the function does."], ["Identify inputs and output", "Decide what information it needs and whether it returns a result."], ["Call and test it", "Try a small example and check the result."]], code: { Python: "def greet(name):\n    return \"Hello, \" + name\n\nprint(greet(\"Ajay\"))", Java: "static String greet(String name) {\n    return \"Hello, \" + name;\n}\n// Call inside a class: greet(\"Ajay\");", C: "void greet(void) {\n    printf(\"Hello!\\n\");\n}\n/* Call it with: greet(); */", "C++": "string greet(string name) {\n    return \"Hello, \" + name;\n}\n// Example call: greet(\"Ajay\");", JavaScript: "function greet(name) {\n    return \"Hello, \" + name;\n}\nconsole.log(greet(\"Ajay\"));" }, output: "Hello, Ajay", challenge: "Change the function call to use a different name. Predict the returned message." },
      "Variables": { intro: "A variable is a name associated with a value. Programs use variables to store information that can be read or updated.", steps: [["Identify the information", "Choose a value to remember, such as a score."], ["Give it a clear name", "Use a name that explains the value's purpose."], ["Assign and use it", "Store a value, use it in an expression, and update it when needed."]], code: { Python: "score = 10\nscore = score + 5\nprint(score)", Java: "int score = 10;\nscore = score + 5;\nSystem.out.println(score);", C: "int score = 10;\nscore = score + 5;\nprintf(\"%d\\n\", score);", "C++": "int score = 10;\nscore = score + 5;\ncout << score << endl;", JavaScript: "let score = 10;\nscore = score + 5;\nconsole.log(score);" }, output: "15", challenge: "Start at 10 and increase the value by 2. Predict the final value." },
      "Problem solving": { intro: "Problem solving means turning a task into smaller, clear decisions that can be implemented and tested.", steps: [["Understand the goal", "Identify the input and the required output."], ["Plan the logic", "Write steps in plain language or pseudocode before coding."], ["Test a small case", "Trace a simple example, then consider edge cases."]], code: { Python: "# Plan before coding\n# 1. Read the input\n# 2. Process the data\n# 3. Display the result", Java: "// Plan before coding\n// 1. Read input\n// 2. Process data\n// 3. Display result", C: "/* Plan before coding:\n   1. Read input\n   2. Process data\n   3. Display result */", "C++": "// Plan before coding\n// 1. Read input\n// 2. Process data\n// 3. Display result", JavaScript: "// Plan before coding\n// 1. Read input\n// 2. Process data\n// 3. Display result" }, output: "Input → Logic → Output", challenge: "Choose an everyday task and write three plain-language steps to solve it." }
    };

    function getLevel() {
      const selected = document.querySelector('input[name="level"]:checked');
      return selected ? selected.value : "Beginner";
    }
    function inferTopic(question, selectedTopic) {
      const text = question.toLowerCase();
      const rules = [["Loops", /\b(loop|loops|for loop|while loop|iteration|repeat|repeating)\b/], ["Arrays", /\b(array|arrays|list|lists|index|indices|collection)\b/], ["Functions", /\b(function|functions|method|methods|parameter|parameters|argument|arguments)\b/], ["Variables", /\b(variable|variables|assignment|assign a value)\b/], ["Problem solving", /\b(problem solving|solve a problem|algorithm|pseudocode|logic steps)\b/]];
      for (const [topic, pattern] of rules) if (pattern.test(text)) return topic;
      return selectedTopic;
    }
    function node(tag, className, text) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }
    function renderLesson(data, meta, isAI) {
      answerTitle.textContent = meta.title || meta.question || `Let's learn ${meta.topic.toLowerCase()}`;
      answerContent.replaceChildren();
      answerContent.append(node("p", "lesson-intro", data.intro));
      const chips = node("div", "lesson-meta");
      [meta.level, meta.language, meta.topic, isAI ? "AI lesson" : "Sample lesson"].forEach(value => chips.append(node("span", "", value)));
      answerContent.append(chips);
      answerContent.append(node("h4", "subheading", "Your learning steps"));
      (data.steps || []).forEach((step, index) => {
        const wrap = node("div", "lesson-step");
        wrap.append(node("span", "step-number", String(index + 1)));
        const body = node("div");
        body.append(node("strong", "", step.title));
        body.append(node("p", "", step.details));
        wrap.append(body);
        answerContent.append(wrap);
      });
      answerContent.append(node("h4", "subheading", "Example code"));
      const codePre = node("pre", "example-code");
      codePre.append(node("code", "", data.code));
      answerContent.append(codePre);
      const output = node("div", "output-box");
      output.append(node("strong", "", "Expected output / idea"));
      output.append(node("pre", "", data.expected_output));
      answerContent.append(output);
      const practice = node("div", "practice-card");
      practice.append(node("strong", "", "Your turn"));
      practice.append(node("p", "", data.practice_challenge));
      if (data.hint) practice.append(node("p", "", `Hint: ${data.hint}`));
      answerContent.append(practice);
      if (modeTag) modeTag.textContent = isAI ? "LIVE AI" : "SAMPLE";
      answerContent.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    function renderSample(question, language, level, topic) {
      const lesson = lessons[topic] || lessons.Loops;
      const data = { intro: level === "Intermediate" ? `${lesson.intro} Also consider edge cases, readability, and testing.` : lesson.intro,
        steps: lesson.steps.map(s => ({ title: s[0], details: s[1] })),
        code: lesson.code[language] || lesson.code.Python,
        expected_output: lesson.output, practice_challenge: lesson.challenge, hint: "Trace the values one step at a time." };
      renderLesson(data, { question, language, level, topic, title: question || `Let's learn ${topic.toLowerCase()}` }, false);
    }

    async function requestAILesson(question, language, level, topic) {
      const base = (window.CH_CONFIG && window.CH_CONFIG.API_BASE_URL || "").trim().replace(/\/$/, "");
      if (!base || base.includes("YOUR-BACKEND-SERVICE")) throw new Error("The AI backend URL has not been configured yet. Follow the README setup steps.");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(`${base}/api/lesson`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, language, level, topic }), signal: controller.signal
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `The tutor request failed (${response.status}).`);
        if (!result.lesson) throw new Error("The backend returned an unexpected response. Please try again.");
        return result.lesson;
      } catch (error) {
        if (error.name === "AbortError") throw new Error("The AI tutor took too long to respond. Please try again.");
        throw error;
      } finally { clearTimeout(timeout); }
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const question = questionInput.value.trim();
      if (!question) { formStatus.textContent = "Please type a question first."; formStatus.classList.add("error"); questionInput.focus(); return; }
      if (question.length > 1500) { formStatus.textContent = "Please keep your question under 1,500 characters."; formStatus.classList.add("error"); return; }
      const language = languageSelect.value;
      const level = getLevel();
      const topic = inferTopic(question, topicSelect.value);
      submitBtn.disabled = true;
      submitBtn.textContent = "Building your lesson…";
      formStatus.classList.remove("error");
      formStatus.textContent = "Asking the AI tutor to explain the logic before the code…";
      if (modeTag) modeTag.textContent = "THINKING…";
      try {
        const lesson = await requestAILesson(question, language, level, topic);
        renderLesson(lesson, { question, language, level, topic, title: question }, true);
        formStatus.textContent = "Your AI-generated lesson is ready. Read the steps, then try the challenge yourself.";
      } catch (error) {
        console.error("cH AI tutor error:", error);
        formStatus.textContent = `${error.message} Your sample lessons are still available using “Load a sample lesson”.`;
        formStatus.classList.add("error");
        if (modeTag) modeTag.textContent = "NOT CONNECTED";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Build my learning steps <span aria-hidden="true">→</span>';
      }
    });

    exampleBtn.addEventListener("click", () => {
      topicSelect.value = "Loops"; languageSelect.value = "Python";
      questionInput.value = "Explain loops with a simple example";
      const beginner = document.querySelector('input[name="level"][value="Beginner"]');
      if (beginner) beginner.checked = true;
      renderSample(questionInput.value, "Python", "Beginner", "Loops");
      formStatus.classList.remove("error");
      formStatus.textContent = "Sample lesson loaded. This example does not use the AI API.";
    });
    document.querySelectorAll(".topic-card").forEach(card => card.addEventListener("click", () => {
      const topic = card.dataset.topic;
      topicSelect.value = topic;
      questionInput.value = `Explain ${topic.toLowerCase()} with a simple example`;
      document.getElementById("tutor").scrollIntoView({ behavior: "smooth", block: "start" });
      questionInput.focus({ preventScroll: true });
    }));
    questionInput.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); }
    });
  });
})();
