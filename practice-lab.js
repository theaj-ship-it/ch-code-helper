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
  const streakCount = document.getElementById("practice-streak-count");
  const streakStatus = document.getElementById("practice-streak-status");
  const bestStreakLabel = document.getElementById("practice-best-streak");

  if (!topicSelect || !levelSelect || !topicLabel || !progress ||
      !questionBox || !optionsBox || !feedback || !startButton || !nextButton || !streakCount || !streakStatus || !bestStreakLabel) {
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

  const intermediateQuestionBank = {
    Loops: [
      { question: "A loop visits i = 1 through 5 and adds only even i values. What is the total?",
        options: ["6", "9", "15", "20"], answer: 0,
        explanation: "Only 2 and 4 are even, so the total is 2 + 4 = 6." },
      { question: "A counter starts at 1 and doubles while it is less than 20. Which values does it take?",
        options: ["1, 2, 4, 8, 16", "1, 2, 4, 8, 16, 32", "2, 4, 8, 16", "1, 3, 5, 7"], answer: 0,
        explanation: "The loop checks the condition before another doubling, so 16 is the last value below 20." },
      { question: "How many times does a loop run for (i = 2; i <= 10; i += 2)?",
        options: ["4", "5", "8", "9"], answer: 1,
        explanation: "The values are 2, 4, 6, 8, and 10: five iterations." }
    ],
    Arrays: [
      { question: "For values [3, 6, 9, 12], what is the sum of elements at indexes 0 and 2?",
        options: ["9", "12", "15", "18"], answer: 2,
        explanation: "Index 0 contains 3 and index 2 contains 9; their sum is 12." },
      { question: "What is the result after replacing index 1 in [5, 8, 11] with 20?",
        options: ["[20, 8, 11]", "[5, 20, 11]", "[5, 8, 20]", "[20, 5, 11]"], answer: 1,
        explanation: "With zero-based indexing, index 1 is the second element." },
      { question: "A list has n elements. How many index positions are valid with zero-based indexing?",
        options: ["1 through n", "0 through n", "0 through n - 1", "1 through n - 1"], answer: 2,
        explanation: "A list of length n uses indexes from 0 to n - 1." }
    ],
    Variables: [
      { question: "Given a = 5, b = 2, then a = a * b and b = a - b, what are a and b?",
        options: ["a=10, b=8", "a=10, b=3", "a=7, b=5", "a=5, b=2"], answer: 0,
        explanation: "First a becomes 10. Then b becomes 10 - 2 = 8." },
      { question: "A variable total starts at 0 and adds 4, then 7, then subtracts 3. What is total?",
        options: ["8", "11", "14", "4"], answer: 0,
        explanation: "Compute 0 + 4 + 7 - 3 = 8." },
      { question: "Why can changing a shared mutable variable inside a loop cause bugs?",
        options: ["Its value may depend on earlier iterations", "Variables cannot hold numbers", "Loops cannot read variables", "It always causes a syntax error"], answer: 0,
        explanation: "A mutable value carries state forward, so an unexpected update can affect later iterations." }
    ],
    Functions: [
      { question: "A function returns x * x. What is returned by f(f(2))?",
        options: ["8", "16", "4", "256"], answer: 1,
        explanation: "f(2) is 4, then f(4) is 16." },
      { question: "A function receives a list and returns its first element. What should it do for an empty list?",
        options: ["Define a safe empty-input behaviour", "Always return index 0", "Loop forever", "Assume the list has an element"], answer: 0,
        explanation: "A robust function should explicitly handle an empty list to avoid invalid access." },
      { question: "Why is returning a value different from printing it?",
        options: ["A returned value can be used by the caller", "Printing always stores a database record", "Return only works in loops", "They are identical in every context"], answer: 0,
        explanation: "Return passes a result back to the caller; printing displays output." }
    ],
    Conditions: [
      { question: "If x = 12, which condition is true?",
        options: ["x < 5 && x > 20", "x >= 10 && x < 15", "x == 10 || x == 15", "x < 0"], answer: 1,
        explanation: "12 is at least 10 and less than 15, so both parts are true." },
      { question: "A discount applies when total >= 100 OR member is true. When does it not apply?",
        options: ["total=120, member=false", "total=80, member=true", "total=80, member=false", "total=100, member=false"], answer: 2,
        explanation: "Both parts of the OR condition are false only when total is below 100 and member is false." },
      { question: "What is the value of !(false || true)?",
        options: ["true", "false", "null", "It depends on a loop"], answer: 1,
        explanation: "false OR true is true; negating true gives false." }
    ],
    "Object-Oriented Programming": [
      { question: "A subclass provides its own implementation of a parent method. What concept is this?",
        options: ["Method overriding", "Array indexing", "Looping", "Variable casting"], answer: 0,
        explanation: "Overriding lets a subclass replace inherited method behaviour." },
      { question: "Why make a field private and expose a validated method to update it?",
        options: ["To control access and preserve valid state", "To make the class impossible to use", "To remove all methods", "To guarantee zero runtime errors"], answer: 0,
        explanation: "Encapsulation allows the class to enforce rules when its internal state changes." },
      { question: "If two objects share a class, which statement is usually true?",
        options: ["They follow the same class definition but can hold different state", "They must have identical field values", "They are the same object", "Neither can call methods"], answer: 0,
        explanation: "Instances share the class blueprint, while each object can have its own field values." }
    ],
    "Data Structures": [
      { question: "A stack receives push(2), push(5), push(7), then pop(). What is removed?",
        options: ["2", "5", "7", "Nothing"], answer: 2,
        explanation: "A stack is last-in, first-out, so the most recent item, 7, is removed." },
      { question: "Which structure is most suitable for processing tasks in arrival order?",
        options: ["Queue", "Stack", "Recursive call stack only", "Unordered set"], answer: 0,
        explanation: "A queue's first-in, first-out behaviour preserves arrival order." },
      { question: "Why can a hash map be useful for repeated key lookups?",
        options: ["Average lookup is typically near constant time", "It always sorts keys", "It stores only integers", "Every lookup scans every value by definition"], answer: 0,
        explanation: "Hash maps usually provide average O(1) lookup, though worst cases can be slower." }
    ],
    Algorithms: [
      { question: "A nested loop processes n items in both loops. What is the typical time complexity?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 3,
        explanation: "Approximately n iterations inside n iterations produce n × n operations." },
      { question: "When can binary search be used correctly on a typical array?",
        options: ["When the array is sorted", "Only when it contains strings", "Only when it has two elements", "When values are random and unsorted"], answer: 0,
        explanation: "Binary search discards half the remaining range each step and relies on sorted order." },
      { question: "Why might a hash-set membership check be preferable to scanning a long list repeatedly?",
        options: ["It can reduce repeated average lookup work", "It guarantees sorted output", "It removes the need for correct data", "It always uses less memory"], answer: 0,
        explanation: "A set can provide average near-constant-time membership checks, trading additional memory for speed." }
    ],
    Other: [
      { question: "A solution works for normal input but fails on an empty list. What should you add?",
        options: ["An edge-case check and test", "A random delay", "More print statements only", "A larger font"], answer: 0,
        explanation: "Empty input is a boundary case and should be handled deliberately and tested." },
      { question: "Which test set gives the strongest basic coverage for a function?",
        options: ["Only one typical input", "Typical, boundary, and invalid inputs", "No input at all", "Only inputs that are known to pass"], answer: 1,
        explanation: "Typical, boundary, and invalid cases reveal different classes of defects." },
      { question: "A change fixes one bug but breaks an older feature. What practice helps catch this?",
        options: ["Regression testing", "Removing old tests", "Renaming variables only", "Skipping review"], answer: 0,
        explanation: "Regression tests check that previously working behaviour remains intact after changes." }
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
    const source = state.level === "Intermediate" ? intermediateQuestionBank : questionBank;
    const bank = source[state.topic] || source.Other;
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

  const STREAK_STORAGE_KEY = "ch-code-helper-logic-sprint-streak-v1";

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function readStreak() {
    const empty = { current: 0, best: 0, lastPracticeDate: "" };
    try {
      const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
      if (!raw) return empty;
      const saved = JSON.parse(raw);
      if (!saved || !Number.isInteger(saved.current) || !Number.isInteger(saved.best) ||
          typeof saved.lastPracticeDate !== "string") return empty;
      return { current: Math.max(0, saved.current), best: Math.max(0, saved.best), lastPracticeDate: saved.lastPracticeDate };
    } catch (_) {
      return empty;
    }
  }

  let streak = readStreak();

  function renderStreak() {
    const today = localDateKey();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = localDateKey(yesterdayDate);

    if (streak.lastPracticeDate !== today && streak.lastPracticeDate !== yesterday) {
      streak.current = 0;
    }
    streakCount.textContent = String(streak.current);
    bestStreakLabel.textContent = "Best: " + streak.best + (streak.best === 1 ? " day" : " days");

    if (streak.lastPracticeDate === today) {
      streakStatus.textContent = "Today's practice complete. Come back tomorrow to grow your streak.";
    } else if (streak.current > 0) {
      streakStatus.textContent = "Complete a sprint today to keep your streak alive.";
    } else {
      streakStatus.textContent = "Complete one sprint today to start your streak.";
    }
  }

  function recordPracticeDay() {
    const today = localDateKey();
    if (streak.lastPracticeDate !== today) {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = localDateKey(yesterdayDate);
      streak.current = streak.lastPracticeDate === yesterday ? streak.current + 1 : 1;
      streak.lastPracticeDate = today;
      streak.best = Math.max(streak.best, streak.current);
      try {
        window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
      } catch (_) {
        // The sprint still works if this browser blocks local storage.
      }
    }
    renderStreak();
  }

  renderStreak();

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
    recordPracticeDay();
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
