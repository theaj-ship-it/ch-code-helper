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

  const mediumQuestionBank = {
    Loops: [
      { question: "An outer loop runs 3 times and an inner loop runs 2 times per outer iteration. How many times does the inner body run?",
        options: ["5", "6", "8", "9"], answer: 1,
        explanation: "The inner body runs 3 × 2 = 6 times in total." },
      { question: "A loop adds every even number from 2 through 10. What is the total?",
        options: ["20", "25", "30", "35"], answer: 2,
        explanation: "Add 2 + 4 + 6 + 8 + 10 to get 30." },
      { question: "A loop repeatedly halves n using integer division while n > 1. Starting at 16, how many iterations run?",
        options: ["2", "3", "4", "5"], answer: 2,
        explanation: "The values are 16, 8, 4, 2, then 1, so the body runs four times." }
    ],
    Arrays: [
      { question: "A left rotation moves every element one position left and moves the first element to the end. What does [1, 2, 3, 4] become?",
        options: ["[4, 1, 2, 3]", "[2, 3, 4, 1]", "[2, 1, 4, 3]", "[1, 2, 3, 4]"], answer: 1,
        explanation: "Each item shifts one position left and the first item wraps to the end." },
      { question: "In [2, 7, 11, 15], which zero-based index pair has values that add to 9?",
        options: ["[0, 1]", "[1, 2]", "[0, 3]", "[2, 3]"], answer: 0,
        explanation: "The values at indexes 0 and 1 are 2 and 7, and 2 + 7 = 9." },
      { question: "You need to find the largest value in an unsorted array. Which approach is best?",
        options: ["Sort the array repeatedly", "Scan once while tracking the largest so far", "Only inspect the first value", "Check the array length only"], answer: 1,
        explanation: "One pass tracks the maximum and takes O(n) time without requiring a sort." }
    ],
    Variables: [
      { question: "Given x = 3, y = x * 2, then x = y - 1, what is the final value of x?",
        options: ["3", "5", "6", "2"], answer: 1,
        explanation: "First y becomes 6, then x becomes 6 - 1 = 5." },
      { question: "A program runs x = 2, y = 5, x = y, y = x. What are the final values?",
        options: ["x = 2, y = 5", "x = 5, y = 2", "x = 5, y = 5", "x = 2, y = 2"], answer: 2,
        explanation: "After x = y, x is 5; the following y = x also assigns 5. The original x value is overwritten." },
      { question: "In languages that support integer division and remainder, what are 17 / 5 and 17 % 5 for integers?",
        options: ["3 and 2", "3.4 and 0", "2 and 3", "5 and 17"], answer: 0,
        explanation: "Five fits into seventeen three whole times, leaving a remainder of two." }
    ],
    Functions: [
      { question: "A function returns double(n) + 1, where double(n) returns n * 2. What does the outer function return for n = 4?",
        options: ["5", "8", "9", "10"], answer: 2,
        explanation: "double(4) returns 8, then the outer function adds 1 to return 9." },
      { question: "Why is returning a value from a function useful?",
        options: ["It lets the caller use the computed result", "It automatically prints every variable", "It prevents all runtime errors", "It makes parameters unnecessary"], answer: 0,
        explanation: "A returned value can be assigned, compared, printed, or passed to another function by the caller." },
      { question: "A function receives an array and returns its length. Which edge case should be tested?",
        options: ["Only arrays of length 100", "An empty array", "Only arrays with positive numbers", "Only sorted arrays"], answer: 1,
        explanation: "An empty array checks whether the function correctly handles the smallest valid input." }
    ],
    Conditions: [
      { question: "For x = 12, which statement is true: (x > 10) AND (x % 2 == 0)?",
        options: ["True", "False because 12 is odd", "False because x equals 10", "The expression has no Boolean result"], answer: 0,
        explanation: "12 is greater than 10 and is divisible by 2, so both conditions are true." },
      { question: "A grading rule checks score >= 50 before score >= 80. Why can this be wrong for a score of 85?",
        options: ["The first condition captures 85 before the higher grade is checked", "85 is always below 50", "Conditions cannot compare numbers", "The order never matters"], answer: 0,
        explanation: "Check the more specific higher threshold first, or the broad passing condition can capture the score early." },
      { question: "A feature should run only when loggedIn is true and isAdmin is true. Which condition matches that rule?",
        options: ["loggedIn OR isAdmin", "NOT loggedIn AND isAdmin", "loggedIn AND isAdmin", "loggedIn XOR isAdmin"], answer: 2,
        explanation: "AND requires both conditions to be true." }
    ],
    "Object-Oriented Programming": [
      { question: "A subclass defines a method with the same signature as a parent class method. What is this commonly called?",
        options: ["Method overriding", "Array indexing", "Loop nesting", "Method deletion"], answer: 0,
        explanation: "Overriding lets a subclass provide its own implementation of an inherited method." },
      { question: "Which example best demonstrates encapsulation?",
        options: ["Allowing every part of the program to change internal fields directly", "Keeping internal state controlled through methods", "Repeating a statement in a loop", "Sorting values in an array"], answer: 1,
        explanation: "Encapsulation protects internal state and provides controlled ways to interact with it." },
      { question: "What is a constructor typically responsible for?",
        options: ["Initializing a new object's state", "Destroying every object in a program", "Sorting all collections", "Handling every network request"], answer: 0,
        explanation: "A constructor establishes initial values and invariants when an object is created." }
    ],
    "Data Structures": [
      { question: "A stack starts empty: push 2, push 4, pop, push 6. What is on top?",
        options: ["2", "4", "6", "The stack is empty"], answer: 2,
        explanation: "After 4 is popped, 2 remains; pushing 6 places 6 on top." },
      { question: "A queue contains 5, 8. Dequeue once, then enqueue 3. What is at the front?",
        options: ["5", "8", "3", "The queue is empty"], answer: 1,
        explanation: "Dequeuing removes 5, leaving 8 at the front; 3 joins the back." },
      { question: "Which result best describes converting [2, 2, 3, 3, 3] to a set?",
        options: ["[2, 2, 3, 3, 3]", "The distinct values 2 and 3", "Only the value 3", "The array length becomes five"], answer: 1,
        explanation: "A set keeps unique values, so duplicates are removed." }
    ],
    Algorithms: [
      { question: "Binary search looks for 7 in [1, 3, 5, 7, 9]. Using the middle item first, how many comparisons are needed?",
        options: ["1", "2", "3", "5"], answer: 1,
        explanation: "It first compares with 5, then compares with 7 in the right half: two comparisons." },
      { question: "An algorithm has two nested loops that each run about n times. What is its usual time complexity?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 3,
        explanation: "About n iterations in each of two nested loops produce roughly n × n operations." },
      { question: "An algorithm halves the remaining search space after each step. Which time complexity is typical?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 1,
        explanation: "The number of halvings needed to reduce n to 1 grows logarithmically." }
    ],
    Other: [
      { question: "A function works for non-empty lists but fails for []. What should you add first?",
        options: ["A test and expected behaviour for empty input", "More random print statements only", "A faster computer", "A different font"], answer: 0,
        explanation: "Define and test the expected behaviour for empty input; this is a common boundary case." },
      { question: "A program is slow only when input grows from 100 to 10,000 records. What should you examine first?",
        options: ["The algorithm's time complexity and repeated work", "The colour of the UI", "Variable names only", "The source file extension"], answer: 0,
        explanation: "Look for unnecessary repeated scans, nested loops, or expensive operations that scale with input size." },
      { question: "After changing a helper function, which test strategy gives the most confidence?",
        options: ["Test only the one exact example that passed earlier", "Run relevant unit tests and tests for nearby behaviour", "Delete the old tests", "Skip testing because the code compiles"], answer: 1,
        explanation: "Related unit and regression tests help catch unintended effects beyond a single example." }
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
    const activeQuestionBank = state.level === "Intermediate"
      ? mediumQuestionBank
      : questionBank;
    const bank = activeQuestionBank[state.topic] || activeQuestionBank.Other;
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
    const difficulty = state.level === "Intermediate" ? "Medium" : "Easy";
    levelNote.textContent = difficulty + " · " + state.level + " practice · " + state.topic;
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

    const streakResult = globalThis.CH_STREAKS?.recordPractice("Logic Sprint");
    const streakNote = document.createElement("p");
    streakNote.className = "streak-result-note";
    streakNote.textContent = !streakResult
      ? "Sprint complete. Start another session tomorrow to build consistency."
      : streakResult.alreadyCounted
        ? "Sprint complete. Today's practice already counts toward your streak."
        : "Daily streak updated: " + streakResult.currentStreak +
          " " + (streakResult.currentStreak === 1 ? "day" : "days") + " in a row.";
    questionBox.appendChild(streakNote);
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
