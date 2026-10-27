"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const topicSelect = document.getElementById("topic");
  const levelSelect = document.getElementById("level");
  const topicLabel = document.getElementById("practice-topic-label");
  const progress = document.getElementById("practice-progress");
  const questionBox = document.getElementById("practice-question");
  const optionsBox = document.getElementById("practice-options");
  const feedback = document.getElementById("practice-feedback");
  const startButton = document.getElementById("practice-start");
  const nextButton = document.getElementById("practice-next");

  if (!topicSelect || !levelSelect || !topicLabel || !progress ||
      !questionBox || !optionsBox || !feedback || !startButton || !nextButton) {
    console.error("Logic Sprint could not start: a required element is missing.");
    return;
  }

  const questionBank = {
    Loops: [
      { question: "A loop runs for i = 1, 2, 3. It adds i each time. What is the final total?",
        options: ["3", "5", "6", "123"], answer: 2,
        explanation: "Add the values: 1 + 2 + 3 = 6." },
      { question: "When is a loop most useful?",
        options: ["To repeat a task", "To rename a file only", "To style a button only", "To stop a program from starting"],
        answer: 0, explanation: "Loops repeat a block of instructions while a condition or sequence allows it." },
      { question: "A loop starts at 0 and continues while i < 3, increasing i by 1. How many times does it run?",
        options: ["2", "3", "4", "0"], answer: 1,
        explanation: "The values are 0, 1, and 2, so the loop runs three times." }
    ],
    Arrays: [
      { question: "An array contains [4, 7, 9]. Using zero-based indexing, what is at index 1?",
        options: ["4", "7", "9", "1"], answer: 1,
        explanation: "Zero-based indexing starts at index 0, so index 1 refers to the second item, 7." },
      { question: "What is the length of [2, 5, 8, 10]?",
        options: ["3", "4", "5", "10"], answer: 1,
        explanation: "There are four elements in the array." },
      { question: "Which operation usually adds an item to the end of a dynamic list?",
        options: ["Append/push", "Sort only", "Compare", "Return"], answer: 0,
        explanation: "Append or push adds an element to the end in many common languages." }
    ],
    Variables: [
      { question: "If x = 4 and then x = x + 3, what is x?",
        options: ["3", "4", "7", "12"], answer: 2,
        explanation: "The new value is the previous value 4 plus 3, which equals 7." },
      { question: "What is a variable mainly used for?",
        options: ["Store a value", "Connect to Wi-Fi automatically", "Guarantee code is bug-free", "Compile every language"],
        answer: 0, explanation: "A variable gives a name to a value that a program can use." },
      { question: "Which value is a Boolean?",
        options: ['"hello"', "17", "true", "3.14"], answer: 2,
        explanation: "A Boolean represents one of two logical states: true or false." }
    ],
    Functions: [
      { question: "Why use a function?",
        options: ["Reuse a named block of logic", "Make every program slower", "Remove all variables", "Replace the operating system"],
        answer: 0, explanation: "Functions package logic so it can be called and reused." },
      { question: "A function returns a + b. If a = 2 and b = 5, what does it return?",
        options: ["2", "5", "7", "25"], answer: 2,
        explanation: "The function returns the sum, 2 + 5 = 7." },
      { question: "What does a function parameter represent?",
        options: ["An input name in the function definition", "A guaranteed output", "A syntax error", "A comment only"],
        answer: 0, explanation: "Parameters name the inputs a function can receive." }
    ],
    Conditions: [
      { question: "If score = 80 and the condition is score >= 50, which branch runs?",
        options: ["The condition is true", "The condition is false", "Neither branch can run", "The program must stop"],
        answer: 0, explanation: "80 is greater than or equal to 50, so the condition is true." },
      { question: "What is the purpose of an if/else statement?",
        options: ["Choose between paths based on a condition", "Repeat forever by default", "Store multiple array items", "Install a package"],
        answer: 0, explanation: "A conditional selects which block to run based on whether a condition is true." },
      { question: "What is the result of (5 > 8)?",
        options: ["true", "false", "13", "5"], answer: 1,
        explanation: "Five is not greater than eight, so the expression is false." }
    ],
    "Object-Oriented Programming": [
      { question: "In object-oriented programming, what is a class?",
        options: ["A blueprint for objects", "A loop counter", "A database password", "A compiler error"],
        answer: 0, explanation: "A class defines the structure and behaviour that its objects can have." },
      { question: "An object is commonly described as:",
        options: ["An instance of a class", "A syntax rule only", "A loop condition", "A source-code comment"],
        answer: 0, explanation: "An object is an instance created from a class." },
      { question: "Which idea bundles data and related methods together?",
        options: ["Encapsulation", "Iteration", "Indexing", "Sorting"], answer: 0,
        explanation: "Encapsulation groups state and the operations that work on that state." }
    ],
    "Data Structures": [
      { question: "Which structure follows last-in, first-out (LIFO)?",
        options: ["Queue", "Stack", "Graph only", "Sorted array only"], answer: 1,
        explanation: "A stack removes the most recently added item first." },
      { question: "Which structure typically follows first-in, first-out (FIFO)?",
        options: ["Stack", "Queue", "Tree root", "Variable"], answer: 1,
        explanation: "A queue serves items in the order they arrive." },
      { question: "Which structure stores key-value pairs in many languages?",
        options: ["Map/dictionary", "Loop", "Boolean", "Comment"], answer: 0,
        explanation: "A map or dictionary associates keys with values." }
    ],
    Algorithms: [
      { question: "What is the main goal of an algorithm?",
        options: ["Describe steps to solve a problem", "Make code colourful", "Store only images", "Replace testing"],
        answer: 0, explanation: "An algorithm is a defined sequence of steps for solving a problem." },
      { question: "For a list of n items, how many items does a simple full scan inspect in the worst case?",
        options: ["1", "About n", "Always n squared", "Always zero"], answer: 1,
        explanation: "A full scan may inspect every item, giving linear work in n." },
      { question: "Why test edge cases?",
        options: ["To check unusual or boundary inputs", "To avoid reading requirements", "To hide bugs", "To remove all outputs"],
        answer: 0, explanation: "Edge cases check boundaries such as empty input, one item, or minimum/maximum values." }
    ],
    Other: [
      { question: "What should you do first when solving a coding problem?",
        options: ["Understand inputs and expected outputs", "Copy random code", "Ignore examples", "Skip testing"],
        answer: 0, explanation: "Clarify inputs, outputs, and constraints before choosing an approach." },
      { question: "What is debugging?",
        options: ["Finding and fixing problems in code", "Writing only comments", "Deleting all tests", "Changing the font"],
        answer: 0, explanation: "Debugging is the process of locating and correcting faults." },
      { question: "Why run a test after changing code?",
        options: ["To check behaviour still works", "To guarantee there are no future bugs", "To skip review", "To change the language automatically"],
        answer: 0, explanation: "Tests help confirm that expected behaviour still works after a change." }
    ]
  };

  const state = { questions: [], index: 0, score: 0, answered: false, topic: "Loops", level: "Beginner" };

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function resetFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("is-correct", "is-wrong");
  }

  function startSprint() {
    state.topic = topicSelect.value;
    state.level = levelSelect.value;
    const bank = questionBank[state.topic] || questionBank.Other;
    state.questions = shuffle(bank).slice(0, 3);
    state.index = 0;
    state.score = 0;
    state.answered = false;
    topicLabel.textContent = "Topic: " + state.topic;
    startButton.textContent = "Restart sprint";
    nextButton.disabled = true;
    renderQuestion();
  }

  function renderQuestion() {
    const item = state.questions[state.index];
    state.answered = false;
    resetFeedback();
    progress.textContent = "Question " + (state.index + 1) + " of " + state.questions.length + " · Score " + state.score;
    questionBox.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = item.question;
    questionBox.appendChild(heading);
    const levelNote = document.createElement("p");
    levelNote.textContent = state.level + " practice · " + state.topic;
    questionBox.appendChild(levelNote);
    optionsBox.replaceChildren();

    item.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "practice-option";
      button.textContent = String.fromCharCode(65 + index) + ". " + option;
      button.addEventListener("click", () => chooseAnswer(index));
      optionsBox.appendChild(button);
    });
    nextButton.disabled = true;
  }

  function chooseAnswer(selectedIndex) {
    if (state.answered) return;
    state.answered = true;
    const item = state.questions[state.index];
    const correct = selectedIndex === item.answer;
    if (correct) state.score += 1;

    Array.from(optionsBox.querySelectorAll("button")).forEach((button, index) => {
      button.disabled = true;
      if (index === item.answer) button.classList.add("is-correct");
      else if (index === selectedIndex) button.classList.add("is-wrong");
    });

    feedback.textContent = (correct ? "Correct! " : "Not quite. ") + item.explanation;
    feedback.classList.toggle("is-correct", correct);
    feedback.classList.toggle("is-wrong", !correct);
    nextButton.disabled = false;
    nextButton.textContent = state.index === state.questions.length - 1 ? "See results" : "Next question →";
  }

  function showResults() {
    questionBox.replaceChildren();
    optionsBox.replaceChildren();
    resetFeedback();
    const percent = Math.round((state.score / state.questions.length) * 100);
    const heading = document.createElement("h3");
    heading.textContent = "Sprint complete: " + state.score + "/" + state.questions.length;
    questionBox.appendChild(heading);
    const message = document.createElement("p");
    message.textContent = percent === 100
      ? "Excellent work. You got every question right."
      : percent >= 67
        ? "Good progress. Review the explanations and try another round."
        : "Keep practising. Read the explanations, then run the sprint again.";
    questionBox.appendChild(message);
    progress.textContent = "Final score: " + percent + "%";
    nextButton.disabled = true;
    nextButton.textContent = "Sprint complete";
    startButton.textContent = "Try another sprint";
  }

  startButton.addEventListener("click", startSprint);
  nextButton.addEventListener("click", () => {
    if (!state.answered) return;
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResults();
    }
  });

  topicSelect.addEventListener("change", () => {
    topicLabel.textContent = "Topic: " + topicSelect.value;
    if (state.questions.length) {
      questionBox.replaceChildren();
      const heading = document.createElement("h3");
      heading.textContent = "Topic changed";
      questionBox.appendChild(heading);
      const message = document.createElement("p");
      message.textContent = "Start a new sprint to practise " + topicSelect.value + ".";
      questionBox.appendChild(message);
      optionsBox.replaceChildren();
      resetFeedback();
      progress.textContent = "Ready for a new sprint";
      nextButton.disabled = true;
    }
  });
});
