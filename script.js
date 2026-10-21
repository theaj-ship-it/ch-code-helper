const form = document.getElementById("tutorForm");
const languageSelect = document.getElementById("language");
const topicSelect = document.getElementById("topic");
const questionInput = document.getElementById("question");
const answerTitle = document.getElementById("answerTitle");
const answerContent = document.getElementById("answerContent");
const exampleBtn = document.getElementById("exampleBtn");

const lessons = {
  Loops: {
    intro: "A loop repeats a set of instructions. It saves you from writing the same statement many times.",
    steps: [
      ["Identify the repeated action", "Decide what task needs to happen more than once."],
      ["Choose the loop and range", "Use a for loop when you know what sequence to go through. A while loop is useful when repetition depends on a condition."],
      ["Trace one repetition at a time", "Follow the value on each pass and check when the loop stops."]
    ],
    code: "for number in range(1, 4):\\n    print(number)"
  },
  Arrays: {
    intro: "An array stores multiple values under one variable name. You can access each value by its position, usually called an index.",
    steps: [
      ["Choose the values", "Think about the related items you need to store, such as marks or temperatures."],
      ["Create the collection", "Put the values into an array or list using the syntax of your chosen language."],
      ["Access an item", "Use its index. In many languages, the first index is 0, not 1."]
    ],
    code: "numbers = [10, 20, 30]\\nprint(numbers[0])  # 10"
  },
  Functions: {
    intro: "A function is a reusable block of code that performs a specific task. You define it once and call it whenever needed.",
    steps: [
      ["Name the task", "Choose a clear name that describes what the function does."],
      ["Add inputs if needed", "Parameters let you pass values into the function."],
      ["Call and test it", "Run the function with a small example and check the result."]
    ],
    code: "def greet(name):\\n    return 'Hello, ' + name\\n\\nprint(greet('Ajay'))"
  },
  "Problem solving": {
    intro: "Programming problem solving means turning a big question into smaller steps that can be implemented and tested.",
    steps: [
      ["Understand the input and output", "Write down what information you receive and what result is expected."],
      ["Plan the logic", "Describe the solution in plain language or pseudocode before coding."],
      ["Test a small example", "Use a simple input, trace each step, and check edge cases."]
    ],
    code: "# Plan before coding\\n# 1. Read the input\\n# 2. Process the data\\n# 3. Display the result"
  },
  Variables: {
    intro: "A variable is a named place to keep a value so your program can use or update it.",
    steps: [
      ["Choose a meaningful name", "Use a name that describes the value, such as score or user_name."],
      ["Assign a value", "Use the assignment syntax supported by your language."],
      ["Use or update it", "Read the value in an expression, or assign a new value when the program needs to change it."]
    ],
    code: "score = 10\\nscore = score + 5\\nprint(score)  # 15"
  }
};

function selectedLevel() {
  return document.querySelector('input[name="level"]:checked').value;
}

function renderLesson(useExample = false) {
  const language = languageSelect.value;
  const topic = topicSelect.value;
  const level = selectedLevel();
  const question = questionInput.value.trim();
  const lesson = lessons[topic] || lessons.Loops;
  const title = question || `${topic} in ${language}`;
  answerTitle.textContent = title.length > 48 ? title.slice(0, 45) + "..." : title;

  const intro = level === "Beginner"
    ? lesson.intro
    : `${lesson.intro} At intermediate level, also consider readability, edge cases, and how you would test the solution.`;
  const stepsHtml = lesson.steps.map((step, index) => `
    <div class="lesson-step">
      <span class="step-number">${index + 1}</span>
      <div><strong>${step[0]}</strong><p>${step[1]}</p></div>
    </div>`).join("");

  let code = lesson.code;
  if (language !== "Python") {
    const languageExamples = {
      Java: "for (int number = 1; number < 4; number++) {\\n    System.out.println(number);\\n}",
      C: "for (int number = 1; number < 4; number++) {\\n    printf(\\"%d\\\\n\\", number);\\n}",
      "C++": "for (int number = 1; number < 4; number++) {\\n    cout << number << endl;\\n}",
      JavaScript: "for (let number = 1; number < 4; number++) {\\n    console.log(number);\\n}"
    };
    if (topic === "Loops") code = languageExamples[language] || code;
    else code = `// ${language} example\\n// Apply the steps above, then test your solution.\\n// Check your language's syntax and data types.`;
  }
  const note = useExample ? `<p class="lesson-intro"><b>Example task:</b> Print the numbers 1, 2, and 3. Predict the output before running the code.</p>` : "";
  answerContent.innerHTML = `${note}<p class="lesson-intro">${intro}</p>${stepsHtml}<div class="example-code">${escapeHtml(code.replace(/\\n/g, "\n"))}</div><p class="lesson-intro" style="margin-top:14px"><b>Your turn:</b> Explain the first step in your own words, then change the example and predict what happens.</p>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

form.addEventListener("submit", event => {
  event.preventDefault();
  renderLesson(false);
});
exampleBtn.addEventListener("click", () => {
  topicSelect.value = "Loops";
  languageSelect.value = "Python";
  questionInput.value = "How do I print numbers from 1 to 3?";
  document.querySelector('input[name="level"][value="Beginner"]').checked = true;
  renderLesson(true);
});
