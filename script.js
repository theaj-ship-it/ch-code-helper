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

    if (!form || !languageSelect || !topicSelect || !questionInput || !answerTitle || !answerContent) {
      console.error("cH could not start: one or more required HTML elements are missing.");
      return;
    }

    const lessons = {
      "Loops": {
        intro: "A loop repeats instructions. It helps you perform the same kind of task several times without writing the same statement over and over.",
        steps: [
          ["1. Identify the repeated action", "Ask yourself: what task should happen more than once? For example, displaying each number in a list."],
          ["2. Decide when repetition stops", "A for loop is useful when going through a sequence. A while loop repeats while a condition remains true."],
          ["3. Trace each repetition", "Follow the current value on every pass. Check the condition and identify when the loop ends."]
        ],
        code: {
          Python: "for number in range(1, 4):\n    print(number)",
          Java: "for (int number = 1; number < 4; number++) {\n    System.out.println(number);\n}",
          C: "for (int number = 1; number < 4; number++) {\n    printf(\"%d\\n\", number);\n}",
          "C++": "for (int number = 1; number < 4; number++) {\n    cout << number << endl;\n}",
          JavaScript: "for (let number = 1; number < 4; number++) {\n    console.log(number);\n}"
        },
        output: "1\n2\n3",
        challenge: "Change the loop so it prints numbers from 1 to 5. Before running it, predict how many times the loop repeats."
      },
      "Arrays": {
        intro: "An array or list groups multiple values under one name. Each value can be accessed using its position, often called an index.",
        steps: [
          ["1. Decide what values belong together", "For example, three test scores can be stored in one collection instead of separate variables."],
          ["2. Create the collection", "Use the syntax of your chosen language to place the values inside an array or list."],
          ["3. Access one value", "Use an index to select an item. In many common languages, the first index is 0."]
        ],
        code: {
          Python: "numbers = [10, 20, 30]\nprint(numbers[0])",
          Java: "int[] numbers = {10, 20, 30};\nSystem.out.println(numbers[0]);",
          C: "int numbers[] = {10, 20, 30};\nprintf(\"%d\\n\", numbers[0]);",
          "C++": "int numbers[] = {10, 20, 30};\ncout << numbers[0] << endl;",
          JavaScript: "const numbers = [10, 20, 30];\nconsole.log(numbers[0]);"
        },
        output: "10",
        challenge: "Try accessing the second value. Remember to check whether your language starts array indexing at 0."
      },
      "Functions": {
        intro: "A function is a named, reusable block of instructions. It helps you organize a task and use it again without repeating all its steps.",
        steps: [
          ["1. Name the task", "Choose a name that clearly describes what the function should do."],
          ["2. Identify inputs and output", "Decide whether the function needs information and whether it should return a result."],
          ["3. Call and test it", "Run the function with a small example and check whether the result is what you expected."]
        ],
        code: {
          Python: "def greet(name):\n    return \"Hello, \" + name\n\nprint(greet(\"Ajay\"))",
          Java: "static String greet(String name) {\n    return \"Hello, \" + name;\n}\n// Call inside a class: greet(\"Ajay\");",
          C: "/* Example function */\nvoid greet(void) {\n    printf(\"Hello!\\n\");\n}\n/* Call it with: greet(); */",
          "C++": "string greet(string name) {\n    return \"Hello, \" + name;\n}\n// Example call: greet(\"Ajay\");",
          JavaScript: "function greet(name) {\n    return \"Hello, \" + name;\n}\nconsole.log(greet(\"Ajay\"));"
        },
        output: "Hello, Ajay",
        challenge: "Change the function so it accepts a different name. Predict the returned message before running it."
      },
      "Variables": {
        intro: "A variable is a name associated with a value. Programs use variables to keep information that can be read or updated.",
        steps: [
          ["1. Identify the information", "Decide what value your program needs to remember, such as a score or a person's name."],
          ["2. Give it a meaningful name", "Use a name that makes the value's purpose clear."],
          ["3. Assign and use a value", "Store a value, use it in an expression, and update it when your logic requires a change."]
        ],
        code: {
          Python: "score = 10\nscore = score + 5\nprint(score)",
          Java: "int score = 10;\nscore = score + 5;\nSystem.out.println(score);",
          C: "int score = 10;\nscore = score + 5;\nprintf(\"%d\\n\", score);",
          "C++": "int score = 10;\nscore = score + 5;\ncout << score << endl;",
          JavaScript: "let score = 10;\nscore = score + 5;\nconsole.log(score);"
        },
        output: "15",
        challenge: "Start with a value of 10 and increase it by 2. Predict the final value before running the program."
      },
      "Problem solving": {
        intro: "Programming problem solving means turning a large task into smaller, clear decisions that can be implemented and tested.",
        steps: [
          ["1. Understand the goal", "Identify the input you receive and the output you need to produce."],
          ["2. Plan the logic first", "Write the steps in everyday language or pseudocode before choosing code syntax."],
          ["3. Test a small case", "Use a simple example, trace the steps, then consider unusual or boundary inputs."]
        ],
        code: {
          Python: "# Plan before coding\n# 1. Read the input\n# 2. Process the data\n# 3. Display the result",
          Java: "// Plan before coding\n// 1. Read the input\n// 2. Process the data\n// 3. Display the result",
          C: "/* Plan before coding:\n   1. Read input\n   2. Process data\n   3. Display result */",
          "C++": "// Plan before coding\n// 1. Read the input\n// 2. Process the data\n// 3. Display the result",
          JavaScript: "// Plan before coding\n// 1. Read the input\n// 2. Process the data\n// 3. Display the result"
        },
        output: "Input → Logic → Output",
        challenge: "Choose a small everyday task and write three plain-language steps that would solve it."
      }
    };

    function getLevel() {
      const selected = document.querySelector('input[name="level"]:checked');
      return selected ? selected.value : "Beginner";
    }

    function inferTopic(question, selectedTopic) {
      const text = question.toLowerCase();
      const rules = [
        ["Loops", /\b(loop|loops|for loop|while loop|iteration|repeat|repeating)\b/],
        ["Arrays", /\b(array|arrays|list|lists|index|indices|collection)\b/],
        ["Functions", /\b(function|functions|method|methods|parameter|parameters|argument|arguments)\b/],
        ["Variables", /\b(variable|variables|assignment|assign a value)\b/],
        ["Problem solving", /\b(problem solving|solve a problem|algorithm|pseudocode|logic steps)\b/]
      ];
      for (const [topic, pattern] of rules) {
        if (pattern.test(text)) return topic;
      }
      return selectedTopic;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character]);
    }

    function renderLesson({ example = false } = {}) {
      const question = questionInput.value.trim();
      if (!question && !example) {
        formStatus.textContent = "Please type a question first, such as “Explain loops”.";
        formStatus.classList.add("error");
        questionInput.focus();
        return;
      }

      const language = languageSelect.value;
      const level = getLevel();
      const topic = inferTopic(question, topicSelect.value);
      const lesson = lessons[topic] || lessons["Loops"];
      const title = question || `Let's learn ${topic.toLowerCase()}`;
      const intro = level === "Intermediate"
        ? `${lesson.intro} At intermediate level, also think about edge cases, readability, and how you would test the solution.`
        : lesson.intro;
      const code = lesson.code[language] || lesson.code.Python;
      const stepsHtml = lesson.steps.map((step, index) =>
        `<div class="lesson-step"><span class="step-number">${index + 1}</span><div><strong>${escapeHtml(step[0])}</strong><p>${escapeHtml(step[1])}</p></div></div>`
      ).join("");

      answerTitle.textContent = title.length > 64 ? title.slice(0, 61) + "..." : title;
      answerContent.innerHTML =
        `<p class="lesson-intro">${escapeHtml(intro)}</p>` +
        `<div class="lesson-meta"><span>${escapeHtml(level)}</span><span>${escapeHtml(language)}</span><span>${escapeHtml(topic)}</span></div>` +
        `<h4 class="subheading">Your learning steps</h4>${stepsHtml}` +
        `<h4 class="subheading">Example code</h4><pre class="example-code"><code>${escapeHtml(code)}</code></pre>` +
        `<div class="output-box"><strong>Expected output / idea</strong><pre>${escapeHtml(lesson.output)}</pre></div>` +
        `<div class="practice-card"><strong>Your turn</strong><p>${escapeHtml(lesson.challenge)}</p></div>`;

      formStatus.classList.remove("error");
      formStatus.textContent = "Your learning steps are ready below. Start with the logic, then study the example.";
      answerContent.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Building your steps…";
        renderLesson();
      } catch (error) {
        console.error("cH tutor error:", error);
        formStatus.textContent = "Something went wrong while building the lesson. Refresh the page and try again.";
        formStatus.classList.add("error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Build my learning steps <span aria-hidden="true">→</span>';
      }
    });

    exampleBtn.addEventListener("click", () => {
      topicSelect.value = "Loops";
      languageSelect.value = "Python";
      questionInput.value = "Explain loops with a simple example";
      const beginner = document.querySelector('input[name="level"][value="Beginner"]');
      if (beginner) beginner.checked = true;
      renderLesson({ example: true });
    });

    document.querySelectorAll(".topic-card").forEach(card => {
      card.addEventListener("click", () => {
        const chosenTopic = card.dataset.topic;
        topicSelect.value = chosenTopic;
        questionInput.value = `Explain ${chosenTopic.toLowerCase()} with a simple example`;
        document.getElementById("tutor").scrollIntoView({ behavior: "smooth", block: "start" });
        questionInput.focus({ preventScroll: true });
      });
    });

    // Allow Enter to submit only when the user is not inserting a new line in the textarea.
    questionInput.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  });
})();
