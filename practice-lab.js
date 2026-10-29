"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const topicSelect = document.getElementById("topic");
  const levelSelect = document.getElementById("level");
  const languageSelect = document.getElementById("language");
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

  if (!topicSelect || !levelSelect || !languageSelect || !topicLabel || !progress ||
      !questionBox || !optionsBox || !feedback || !startButton || !nextButton ||
      !streakCount || !streakStatus || !bestStreakLabel) {
    console.error("Logic Sprint could not start: a required element is missing.");
    return;
  }

  const STREAK_STORAGE_KEY = "ch-code-helper-logic-sprint-streak-v1";
  const DIFFICULTY_NAMES = ["Warm-up", "Trace", "Debug", "Deep Dive"];
  const state = {
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    topic: "Loops",
    language: "Python",
    level: "Beginner",
    tier: 0,
    streakDay: 1
  };

  function localDateKey(date) {
    const value = date || new Date();
    return value.getFullYear() + "-" +
      String(value.getMonth() + 1).padStart(2, "0") + "-" +
      String(value.getDate()).padStart(2, "0");
  }

  function readStreak() {
    const empty = { current: 0, best: 0, lastPracticeDate: "" };
    try {
      const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
      if (!raw) return empty;
      const saved = JSON.parse(raw);
      if (!saved || !Number.isInteger(saved.current) || !Number.isInteger(saved.best) ||
          typeof saved.lastPracticeDate !== "string") return empty;
      return {
        current: Math.max(0, saved.current),
        best: Math.max(0, saved.best),
        lastPracticeDate: saved.lastPracticeDate
      };
    } catch (_) {
      return empty;
    }
  }

  let streak = readStreak();

  function getDateContext() {
    const today = localDateKey();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = localDateKey(yesterdayDate);
    let current = streak.current;

    if (streak.lastPracticeDate !== today && streak.lastPracticeDate !== yesterday) {
      current = 0;
    }

    const plannedDay = streak.lastPracticeDate === today ? Math.max(1, current) : current + 1;
    return { today: today, current: current, plannedDay: Math.max(1, plannedDay) };
  }

  function getDifficulty() {
    const context = getDateContext();
    let streakBonus = 0;
    if (context.plannedDay >= 14) streakBonus = 3;
    else if (context.plannedDay >= 7) streakBonus = 2;
    else if (context.plannedDay >= 3) streakBonus = 1;

    const base = levelSelect.value === "Intermediate" ? 1 : 0;
    return {
      tier: Math.min(3, base + streakBonus),
      streakDay: context.plannedDay
    };
  }

  function renderStreak() {
    const context = getDateContext();
    streakCount.textContent = String(context.current);
    bestStreakLabel.textContent = "Best: " + streak.best + (streak.best === 1 ? " day" : " days");

    if (streak.lastPracticeDate === context.today) {
      streakStatus.textContent = "Today's sprint is complete. Tomorrow unlocks the next streak day.";
    } else if (context.current > 0) {
      streakStatus.textContent = "Complete today's sprint to protect your streak and unlock tougher cases.";
    } else {
      streakStatus.textContent = "Finish one sprint today to start your streak.";
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
        // Sprint questions still work when local storage is blocked.
      }
    }
    renderStreak();
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function makeRandom(seed) {
    let value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(random, min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function shuffled(values, random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function uniqueStrings(values) {
    const result = [];
    values.forEach(function (value) {
      const text = String(value);
      if (result.indexOf(text) === -1) result.push(text);
    });
    return result;
  }

  function makeItem(question, code, correct, distractors, explanation, random) {
    const choices = uniqueStrings([correct].concat(distractors));
    let next = 1;
    while (choices.length < 4) {
      choices.push("Another possible answer " + next);
      next += 1;
    }
    const options = shuffled(choices.slice(0, 4), random);
    return {
      question: question,
      code: code,
      options: options,
      answer: options.indexOf(String(correct)),
      explanation: explanation
    };
  }

  function arrayText(values) {
    return "[" + values.join(", ") + "]";
  }

  function declareInt(language, name, value) {
    if (language === "Python") return name + " = " + value;
    if (language === "JavaScript") return "let " + name + " = " + value + ";";
    return "int " + name + " = " + value + ";";
  }

  function arrayDeclaration(language, values, name) {
    const variable = name || "values";
    if (language === "Python") return variable + " = " + arrayText(values);
    if (language === "JavaScript") return "const " + variable + " = " + arrayText(values) + ";";
    if (language === "Java") return "int[] " + variable + " = {" + values.join(", ") + "};";
    return "int " + variable + "[] = {" + values.join(", ") + "};";
  }

  function printLine(language, expression) {
    if (language === "Python") return "print(" + expression + ")";
    if (language === "JavaScript") return "console.log(" + expression + ");";
    if (language === "Java") return "System.out.println(" + expression + ");";
    if (language === "C") return "printf(\"%d\\n\", " + expression + ");";
    return "cout << " + expression + " << endl;";
  }

  function forLoop(language, variable, start, stopExclusive, step, bodyLines) {
    if (language === "Python") {
      return "for " + variable + " in range(" + start + ", " + stopExclusive + ", " + step + "):\n" +
        bodyLines.map(function (line) { return "    " + line; }).join("\n");
    }
    const variableType = language === "JavaScript" ? "let " : "int ";
    return "for (" + variableType + variable + " = " + start + "; " +
      variable + " < " + stopExclusive + "; " + variable + " += " + step + ") {\n" +
      bodyLines.map(function (line) { return "    " + line; }).join("\n") + "\n}";
  }

  function functionDefinition(language, name, parameters, expression) {
    if (language === "Python") {
      return "def " + name + "(" + parameters.join(", ") + "):\n    return " + expression;
    }
    if (language === "JavaScript") {
      return "function " + name + "(" + parameters.join(", ") + ") { return " + expression + "; }";
    }
    return "int " + name + "(" + parameters.map(function (parameter) {
      return "int " + parameter;
    }).join(", ") + ") { return " + expression + "; }";
  }

  function buildQuestion(topic, tier, variant, language, random) {
    const harder = tier >= 2;
    let code;
    let answer;
    let distractors;
    let question;
    let explanation;

    if (topic === "Loops") {
      if (variant === 0) {
        const n = randomInt(random, 2 + tier, 4 + tier);
        answer = n * (n + 1) / 2;
        code = declareInt(language, "total", 0) + "\n" +
          forLoop(language, "i", 1, n + 1, 1, ["total += i;"]) + "\n" +
          printLine(language, "total");
        return makeItem("Trace the loop. What value is printed at the end?", code, answer,
          [answer - 1, answer + n, n * n], "The loop adds every integer from 1 through " + n +
          ". The total is " + answer + ".", random);
      }
      if (variant === 1) {
        const limit = randomInt(random, 5 + tier, 8 + tier * 2);
        const evens = [];
        for (let i = 0; i < limit; i += 1) if (i % 2 === 0) evens.push(i);
        answer = evens.reduce(function (sum, value) { return sum + value; }, 0);
        if (language === "Python") {
          code = "total = 0\nfor i in range(0, " + limit + "):\n    if i % 2 == 0:\n        total += i\nprint(total)";
        } else {
          code = declareInt(language, "total", 0) + "\n" +
            forLoop(language, "i", 0, limit, 1, ["if (i % 2 == 0) { total += i; }"]) +
            "\n" + printLine(language, "total");
        }
        return makeItem("Only even counter values are added. What is the final total?", code, answer,
          [answer + 2, answer + limit, answer - 2], "The condition keeps only even values below " +
          limit + ". Adding them gives " + answer + ".", random);
      }
      const n = randomInt(random, 3 + tier, 5 + tier);
      answer = n * (n - 1) / 2;
      if (language === "Python") {
        code = "count = 0\nfor i in range(" + n + "):\n    for j in range(i):\n        count += 1\nprint(count)";
      } else {
        const type = language === "JavaScript" ? "let " : "int ";
        code = type + "count = 0;\nfor (" + type + "i = 0; i < " + n + "; i += 1) {\n" +
          "    for (" + type + "j = 0; j < i; j += 1) { count += 1; }\n}\n" + printLine(language, "count");
      }
      return makeItem("Count the inner-loop runs. How many times is count increased?", code, answer,
        [n * n, n, answer + 1], "For i values 0 through " + (n - 1) +
        ", the inner loop runs 0 + 1 + ... + " + (n - 1) + " times, which is " + answer + ".", random);
    }

    if (topic === "Arrays") {
      const values = [randomInt(random, 2, 5), randomInt(random, 7, 10),
        randomInt(random, 12, 15), randomInt(random, 17, 21)];
      if (variant === 0) {
        const index = randomInt(random, 0, values.length - 1);
        answer = values[index];
        code = arrayDeclaration(language, values) + "\n" +
          declareInt(language, "index", index) + "\n" +
          declareInt(language, "result", 0).replace("0", "values[index]") + "\n" +
          printLine(language, "result");
        return makeItem("The array uses zero-based indexing. What value is stored in result?", code, answer,
          values.filter(function (_, i) { return i !== index; }).concat([index, answer + 3]),
          "Index " + index + " points to the " + (index + 1) + "th element, which is " + answer + ".", random);
      }
      if (variant === 1) {
        const index = randomInt(random, 0, values.length - 1);
        const delta = randomInt(random, 2 + tier, 4 + tier);
        const changed = values.slice();
        changed[index] += delta;
        code = arrayDeclaration(language, values) + "\n" +
          declareInt(language, "index", index) + "\n" +
          declareInt(language, "delta", delta) + "\nvalues[index] += delta;";
        return makeItem("After the update, what does the array contain?", code, arrayText(changed),
          [arrayText(values), arrayText(values.map(function (value, i) { return value + (i === (index + 1) % values.length ? delta : 0); })),
            arrayText(values.map(function (value, i) { return value - (i === index ? delta : 0); }))],
          "Only the element at index " + index + " changes. Add " + delta + " to " + values[index] +
          " to get " + changed[index] + ".", random);
      }
      const sample = [4, 9, 14];
      if (language === "Python") {
        code = "values = [4, 9, 14]\nfor i in range(0, len(values) + 1):\n    print(values[i])";
      } else {
        code = arrayDeclaration(language, sample) + "\n" +
          declareInt(language, "length", sample.length) + "\n" +
          "for (" + (language === "JavaScript" ? "let " : "int ") + "i = 0; i <= length; i += 1) { " +
          (language === "JavaScript" ? "console.log(values[i]);" : language === "Java" ? "System.out.println(values[i]);" :
            language === "C" ? "printf(\"%d\\n\", values[i]);" : "cout << values[i] << endl;") + " }";
      }
      return makeItem("The array has three elements. What defect will appear at the end of this loop?", code,
        "The loop tries to access index 3, which is outside the array.",
        ["The loop tries to access index 3, which is outside the array.",
          "The array must be sorted first.",
          "Index 0 is not a valid index.",
          "The loop never runs."],
        "A three-element array has valid indexes 0, 1, and 2. The condition allows i to reach 3, so it goes one step too far.", random);
    }

    if (topic === "Variables") {
      if (variant === 0) {
        const x = randomInt(random, 3, 8);
        const y = randomInt(random, 1, 4);
        code = declareInt(language, "x", x) + "\n" + declareInt(language, "y", y) +
          "\nx = x + y;\ny = x - y;\nx = x - y;\n" +
          printLine(language, "x") + "\n" + printLine(language, "y");
        answer = "x = " + y + ", y = " + x;
        return makeItem("Track x and y after every assignment. What are their final values?", code, answer,
          ["x = " + x + ", y = " + y, "x = " + (x + y) + ", y = " + y,
            "x = " + y + ", y = " + (x + y)],
          "The first line stores the sum. The second recovers the original y, and the third recovers the original x. The values are swapped.", random);
      }
      if (variant === 1) {
        const start = randomInt(random, 3 + tier, 7 + tier);
        const multiplier = randomInt(random, 2, 3);
        const subtract = randomInt(random, 1, 4 + tier);
        answer = start * multiplier - subtract;
        code = declareInt(language, "value", start) + "\nvalue *= " + multiplier + ";\nvalue -= " + subtract + ";\n" +
          printLine(language, "value");
        return makeItem("Follow the updates in order. What is printed?", code, answer,
          [start + multiplier - subtract, start * multiplier + subtract, start * multiplier],
          "First multiply " + start + " by " + multiplier + ", then subtract " + subtract + ". The result is " + answer + ".", random);
      }
      const x = randomInt(random, 2, 6);
      const y = randomInt(random, 2, 5);
      code = declareInt(language, "x", x) + "\n" + declareInt(language, "y", y) +
        "\nx += y;\ny += x;\nx = y - x;\n" + printLine(language, "x") + "\n" + printLine(language, "y");
      answer = "x = " + y + ", y = " + (x + 2 * y);
      return makeItem("Assignments run top to bottom and use the latest values. What is the final pair?", code, answer,
        ["x = " + x + ", y = " + y, "x = " + (x + y) + ", y = " + (x + y),
          "x = " + (x + y) + ", y = " + (x + 2 * y)],
        "After x += y, x is " + (x + y) + ". Then y becomes " + (x + 2 * y). Finally x becomes y - the updated x, so x is " + y + ".", random);
    }

    if (topic === "Functions") {
      if (variant === 0) {
        const a = randomInt(random, 2, 7 + tier);
        const b = randomInt(random, 3, 8 + tier);
        code = functionDefinition(language, "add", ["a", "b"], "a + b") + "\n" +
          declareInt(language, "result", 0).replace("0", "add(" + a + ", " + b + ")") + "\n" +
          printLine(language, "result");
        answer = a + b;
        return makeItem("The function returns a + b. What value reaches result?", code, answer,
          [a * b, Math.abs(a - b), answer + a],
          "The call passes " + a + " and " + b + ". The function returns their sum, " + answer + ".", random);
      }
      if (variant === 1) {
        const value = randomInt(random, 2, 3 + Math.min(1, tier));
        const answerValue = Math.pow(value, 4);
        code = functionDefinition(language, "square", ["value"], "value * value") + "\n" +
          declareInt(language, "result", 0).replace("0", "square(square(" + value + "))") + "\n" +
          printLine(language, "result");
        return makeItem("The function is called inside itself once. What does square(square(" + value + ")) return?", code,
          answerValue, [value * value, value * value * value, answerValue + value],
          "The inner call squares " + value + " to get " + (value * value) +
          ". The outer call squares that result, giving " + answerValue + ".", random);
      }
      const threshold = randomInt(random, 5, 8 + tier);
      if (language === "Python") {
        code = "def score(value, cutoff):\n    if value > cutoff:\n        return 2\n    return 1\n\nthreshold = " + threshold + "\nprint(score(threshold, threshold))";
      } else if (language === "JavaScript") {
        code = "function score(value, cutoff) { if (value > cutoff) { return 2; } return 1; }\nlet threshold = " + threshold + ";\nconsole.log(score(threshold, threshold));";
      } else {
        const callLine = language === "Java"
          ? "System.out.println(score(threshold, threshold));"
          : language === "C"
            ? "printf(\\\"%d\\\\n\\\", score(threshold, threshold));"
            : "cout << score(threshold, threshold) << endl;";
        code = "int score(int value, int cutoff) { if (value > cutoff) { return 2; } return 1; }\nint threshold = " + threshold + ";\n" + callLine;
      }
      return makeItem("The input equals threshold exactly. Which return value is produced?", code, 1,
        [0, 2, threshold],
        "The condition is strictly greater than. Equal values skip the first return and reach return 1.", random);
    }

    if (topic === "Conditions") {
      if (variant === 0) {
        const value = randomInt(random, 4, 12);
        const low = value + randomInt(random, -3, 2);
        const high = low + randomInt(random, 1, 4);
        const truth = value >= low && value < high;
        const resultValue = truth ? 1 : 0;
        if (language === "Python") {
          code = "value = " + value + "\nlow = " + low + "\nhigh = " + high +
            "\nif value >= low and value < high:\n    result = 1\nelse:\n    result = 0\nprint(result)";
        } else {
          code = declareInt(language, "value", value) + "\n" + declareInt(language, "low", low) + "\n" +
            declareInt(language, "high", high) + "\n" + declareInt(language, "result", 0) + "\n" +
            "if (value >= low && value < high) { result = 1; } else { result = 0; }\n" +
            printLine(language, "result");
        }
        return makeItem("Evaluate both parts of the condition. What value is printed?", code, resultValue,
          [resultValue === 1 ? 0 : 1, 2, -1],
          "The condition requires value to be at least " + low + " and strictly below " + high +
          ". It is " + (truth ? "true" : "false") + ".", random);
      }
      if (variant === 1) {
        const cutoff = randomInt(random, 40, 80);
        if (language === "Python") {
          code = "score = " + cutoff + "\nif score > " + cutoff + ":\n    result = 2\nelse:\n    result = 1\nprint(result)";
        } else {
          code = declareInt(language, "score", cutoff) + "\n" +
            declareInt(language, "result", 0) + "\n" +
            "if (score > " + cutoff + ") { result = 2; } else { result = 1; }\n" +
            printLine(language, "result");
        }
        return makeItem("The score equals the cutoff. Does the strict greater-than branch run?", code, "No, the else branch runs.",
          ["Yes, because equality counts as greater-than.", "The code has no possible branch.", "It depends on the array length."],
          "The operator is > rather than >=. Equal values do not satisfy it, so the else branch runs.", random);
      }
      const divisor = randomInt(random, 3, 5);
      const value = randomInt(random, 2, 8) * divisor + randomInt(random, 0, divisor - 1);
      const resultValue = value % divisor === 0 ? 10 : 20;
      if (language === "Python") {
        code = "value = " + value + "\nif value % " + divisor + " == 0:\n    result = 10\nelse:\n    result = 20\nprint(result)";
      } else {
        code = declareInt(language, "value", value) + "\n" +
          declareInt(language, "result", 0) + "\n" +
          "if (value % " + divisor + " == 0) { result = 10; } else { result = 20; }\n" +
          printLine(language, "result");
      }
      return makeItem("The code checks whether value is divisible by " + divisor + ". What is printed?", code, resultValue,
        [resultValue === 10 ? 20 : 10, value, divisor],
        value + (value % divisor === 0 ? " is" : " is not") + " divisible by " + divisor + ".", random);
    }

    if (topic === "Object-Oriented Programming") {
      if (variant === 0) {
        const childValue = 2 + tier;
        if (language === "Python") {
          code = "class Parent:\n    def value(self):\n        return 1\n\nclass Child(Parent):\n    def value(self):\n        return " + childValue +
            "\n\nitem = Child()\nprint(item.value())";
        } else if (language === "JavaScript") {
          code = "class Parent { value() { return 1; } }\nclass Child extends Parent { value() { return " + childValue +
            "; } }\nconst item = new Child();\nconsole.log(item.value());";
        } else if (language === "Java") {
          code = "class Parent { int value() { return 1; } }\nclass Child extends Parent { @Override int value() { return " +
            childValue + "; } }\nParent item = new Child();\nSystem.out.println(item.value());";
        } else if (language === "C++") {
          code = "struct Parent { virtual int value() { return 1; } };\nstruct Child : Parent { int value() override { return " +
            childValue + "; } };\nChild item;\ncout << item.value() << endl;";
        } else {
          code = "struct Item { int value; };\nstruct Item item = {" + childValue + "};\nprintf(\"%d\\n\", item.value);";
        }
        return makeItem("Follow the object's actual type. What number is printed by the method or field read?", code, childValue,
          [1, childValue + 1, childValue * 2],
          language === "C" ? "The C example stores the value directly in a struct. The field contains " + childValue + "." :
            "The object uses the Child implementation, so the returned value is " + childValue + ".", random);
      }
      if (variant === 1) {
        const startingCoins = randomInt(random, 3, 8);
        const addedCoins = randomInt(random, 2, 4 + tier);
        if (language === "Python") {
          code = "class Wallet:\n    def __init__(self, coins):\n        self.__coins = coins\n    def add(self, amount):\n        if amount > 0:\n            self.__coins += amount\n    def count(self):\n        return self.__coins\n\nwallet = Wallet(" +
            startingCoins + ")\nwallet.add(" + addedCoins + ")\nprint(wallet.count())";
        } else if (language === "JavaScript") {
          code = "class Wallet {\n  constructor(coins) { this._coins = coins; }\n  add(amount) { if (amount > 0) this._coins += amount; }\n  count() { return this._coins; }\n}\nconst wallet = new Wallet(" +
            startingCoins + ");\nwallet.add(" + addedCoins + ");\nconsole.log(wallet.count());";
        } else if (language === "Java") {
          code = "class Wallet {\n  private int coins;\n  Wallet(int coins) { this.coins = coins; }\n  void add(int amount) { if (amount > 0) coins += amount; }\n  int count() { return coins; }\n}\nWallet wallet = new Wallet(" +
            startingCoins + ");\nwallet.add(" + addedCoins + ");\nSystem.out.println(wallet.count());";
        } else if (language === "C") {
          code = "struct Wallet { int coins; };\nvoid add(struct Wallet *wallet, int amount) { if (amount > 0) wallet->coins += amount; }\nstruct Wallet wallet = {" +
            startingCoins + "};\nadd(&wallet, " + addedCoins + ");\nprintf(\"%d\\n\", wallet.coins);";
        } else {
          code = "class Wallet { int coins; public: Wallet(int value) : coins(value) {} void add(int amount) { if (amount > 0) coins += amount; } int count() { return coins; } };\nWallet wallet(" +
            startingCoins + ");\nwallet.add(" + addedCoins + ");\ncout << wallet.count() << endl;";
        }
        answer = startingCoins + addedCoins;
        return makeItem("The add method ignores non-positive amounts. What count is returned here?", code, answer,
          [startingCoins, startingCoins + addedCoins + 1, addedCoins],
          "The amount is positive, so " + addedCoins + " is added to " + startingCoins + ". The count becomes " + answer + ".", random);
      }
      const first = randomInt(random, 3, 7);
      const second = randomInt(random, 8, 12);
      const delta = randomInt(random, 1, 3 + tier);
      if (language === "Python") {
        code = "class Box:\n    def __init__(self, value):\n        self.value = value\n\nfirst = Box(" + first +
          ")\nsecond = Box(" + second + ")\nfirst.value += " + delta + "\nprint(second.value)";
      } else if (language === "JavaScript") {
        code = "class Box { constructor(value) { this.value = value; } }\nconst first = new Box(" + first +
          ");\nconst second = new Box(" + second + ");\nfirst.value += " + delta + ";\nconsole.log(second.value);";
      } else if (language === "Java") {
        code = "class Box { int value; Box(int value) { this.value = value; } }\nBox first = new Box(" + first +
          ");\nBox second = new Box(" + second + ");\nfirst.value += " + delta + ";\nSystem.out.println(second.value);";
      } else if (language === "C") {
        code = "struct Box { int value; };\nstruct Box first = {" + first + "};\nstruct Box second = {" + second +
          "};\nfirst.value += " + delta + ";\nprintf(\"%d\\n\", second.value);";
      } else {
        code = "struct Box { int value; };\nBox first{" + first + "};\nBox second{" + second +
          "};\nfirst.value += " + delta + ";\ncout << second.value << endl;";
      }
      return makeItem("Two objects are created. Updating first does not update second. What is printed?", code, second,
        [first, first + delta, second + delta],
        "Each object has its own value. Only first changes, so second still contains " + second + ".", random);
    }

    if (topic === "Data Structures") {
      if (variant === 0) {
        const values = [2, 5, 8, 11];
        const count = tier >= 2 ? 4 : 3;
        const active = values.slice(0, count);
        answer = active[active.length - 1];
        if (language === "Python") {
          code = "stack = []\n" + active.map(function (value) { return "stack.append(" + value + ")"; }).join("\n") +
            "\nremoved = stack.pop()\nprint(removed)";
        } else if (language === "JavaScript") {
          code = "const stack = [];\n" + active.map(function (value) { return "stack.push(" + value + ");"; }).join("\n") +
            "\nconst removed = stack.pop();\nconsole.log(removed);";
        } else {
          const arrType = language === "Java" ? "int[] stack = new int[4];" : "int stack[4];";
          code = arrType + "\nint top = -1;\n" +
            active.map(function (value) { return "stack[++top] = " + value + ";"; }).join("\n") +
            "\nint removed = stack[top--];\n" + printLine(language, "removed");
        }
        return makeItem("A stack uses last-in, first-out. Which value is removed by pop?", code, answer,
          [active[0], active[Math.max(0, active.length - 2)], active[0] + answer],
          "A stack removes the latest value pushed. The last value added was " + answer + ".", random);
      }
      if (variant === 1) {
        const values = [randomInt(random, 2, 4), randomInt(random, 5, 7),
          randomInt(random, 8, 10), randomInt(random, 11, 14)];
        answer = values[0];
        if (language === "Python") {
          code = "queue = " + arrayText(values) + "\nremoved = queue.pop(0)\nprint(removed)";
        } else if (language === "JavaScript") {
          code = "const queue = " + arrayText(values) + ";\nconst removed = queue.shift();\nconsole.log(removed);";
        } else {
          code = arrayDeclaration(language, values, "queue") + "\nint front = 0;\nint removed = queue[front++];\n" +
            printLine(language, "removed");
        }
        return makeItem("A queue uses first-in, first-out. Which value is removed first?", code, answer,
          values.slice(1).concat([answer + 10]),
          "The front of the queue is the first item inserted, which is " + answer + ".", random);
      }
      const values = [3, 6, 9, 12, 15];
      const popCount = tier >= 2 ? 2 : 3;
      answer = values[values.length - 1 - popCount];
      if (language === "Python") {
        code = "stack = " + arrayText(values) + "\nfor _ in range(" + popCount + "):\n    stack.pop()\nprint(stack[-1])";
      } else if (language === "JavaScript") {
        code = "const stack = " + arrayText(values) + ";\nfor (let i = 0; i < " + popCount + "; i += 1) { stack.pop(); }\nconsole.log(stack[stack.length - 1]);";
      } else {
        code = arrayDeclaration(language, values, "stack") + "\nint top = 4;\ntop -= " + popCount + ";\n" +
          "int result = stack[top];\n" + printLine(language, "result");
      }
      return makeItem("Several items are removed from the top. Which value is now at the top?", code, answer,
        [values[0], values[3], values[4]],
        "After removing " + popCount + " items, the remaining top value is " + answer + ".", random);
    }

    if (topic === "Algorithms") {
      if (variant === 0) {
        const length = 5 + tier;
        const values = [];
        for (let i = 0; i < length; i += 1) values.push(2 + i * 3);
        const targetIndex = randomInt(random, 0, length - 1);
        const target = values[targetIndex];
        answer = targetIndex + 1;
        if (language === "Python") {
          code = arrayDeclaration(language, values) + "\ntarget = " + target +
            "\nchecks = 0\nfor value in values:\n    checks += 1\n    if value == target:\n        break\nprint(checks)";
        } else {
          code = arrayDeclaration(language, values) + "\n" + declareInt(language, "target", target) + "\n" +
            declareInt(language, "checks", 0) + "\n" +
            forLoop(language, "i", 0, values.length, 1, ["checks += 1;", "if (values[i] == target) { break; }"]) +
            "\n" + printLine(language, "checks");
        }
        return makeItem("A linear scan stops when it finds target. How many comparisons happen?", code, answer,
          [length, Math.max(1, answer - 1), answer + 1],
          "The target is at index " + targetIndex + ". A linear search checks each earlier item and then the target, so it makes " + answer + " comparisons.", random);
      }
      if (variant === 1) {
        const size = tier >= 2 ? 11 : tier === 1 ? 9 : 7;
        const values = [];
        for (let i = 0; i < size; i += 1) values.push((i + 1) * 2);
        const targetIndex = randomInt(random, 0, size - 1);
        const target = values[targetIndex];
        let lowValue = 0;
        let highValue = size - 1;
        let steps = 0;
        while (lowValue <= highValue) {
          steps += 1;
          const mid = Math.floor((lowValue + highValue) / 2);
          if (values[mid] === target) break;
          if (values[mid] < target) lowValue = mid + 1;
          else highValue = mid - 1;
        }
        answer = steps;
        const findLoop = language === "Python"
          ? "while low <= high:\n    steps += 1\n    mid = (low + high) // 2\n    if values[mid] == target:\n        break\n    if values[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1"
          : "while (low <= high) {\n    steps += 1;\n    int mid = (low + high) / 2;\n    if (values[mid] == target) { break; }\n    if (values[mid] < target) { low = mid + 1; } else { high = mid - 1; }\n}";
        if (language === "Python") {
          code = arrayDeclaration(language, values) + "\ntarget = " + target + "\nlow = 0\nhigh = " + (size - 1) +
            "\nsteps = 0\n" + findLoop + "\nprint(steps)";
        } else {
          code = arrayDeclaration(language, values) + "\n" + declareInt(language, "target", target) + "\n" +
            declareInt(language, "low", 0) + "\n" + declareInt(language, "high", size - 1) + "\n" +
            declareInt(language, "steps", 0) + "\n" +
            findLoop.replace("int mid", language === "JavaScript" ? "let mid" : "int mid") + "\n" +
            printLine(language, "steps");
        }
        return makeItem("Trace the sorted-array binary search. How many loop checks happen before target is found?", code, answer,
          [Math.max(1, answer - 1), answer + 1, size],
          "Binary search halves the remaining range each iteration. For this target, it reaches the match after " + answer + " checks.", random);
      }
      const n = randomInt(random, 3 + tier, 5 + tier);
      answer = "O(n²)";
      if (language === "Python") {
        code = "operations = 0\nn = " + n + "\nfor i in range(n):\n    for j in range(n):\n        operations += 1\nprint(operations)";
      } else {
        const type = language === "JavaScript" ? "let " : "int ";
        code = type + "operations = 0;\n" + declareInt(language, "n", n) + "\n" +
          "for (" + type + "i = 0; i < n; i += 1) {\n    for (" + type +
          "j = 0; j < n; j += 1) { operations += 1; }\n}\n" + printLine(language, "operations");
      }
      return makeItem("The two loops each visit n items. What is the time complexity as n grows?", code, answer,
        ["O(n)", "O(n log n)", "O(1)"],
        "The inner loop runs n times for each of the n outer-loop iterations, so the work grows like n multiplied by n.", random);
    }

    if (variant === 0) {
      if (language === "Python") {
        code = "def average(values):\n    total = 0\n    for value in values:\n        total += value\n    return total / len(values)\n\nprint(average([]))";
      } else if (language === "JavaScript") {
        code = "function average(values) {\n  let total = 0;\n  for (const value of values) { total += value; }\n  return total / values.length;\n}\nconsole.log(average([]));";
      } else if (language === "Java") {
        code = "int average(int[] values) {\n  int total = 0;\n  for (int value : values) { total += value; }\n  return total / values.length;\n}\nint[] values = new int[0];\nSystem.out.println(average(values));";
      } else {
        code = "int average(int values[], int length) {\n  int total = 0;\n  for (int i = 0; i < length; i += 1) { total += values[i]; }\n  return total / length;\n}\nint length = 0;\nint values[1] = {0};\nprintf(\"%d\\n\", average(values, length));";
        if (language === "C++") code = code.replace("printf(\"%d\\n\", average(values, length));", "cout << average(values, length) << endl;");
      }
      return makeItem("Which input exposes an edge case that this average function does not handle?", code,
        "An empty array or list, because its length is zero.",
        ["A sorted array with several values.", "A list containing only positive values.", "A list with one value."],
        "With no elements, the function divides by a length of zero. Handle empty input before calculating the average.", random);
    }
    if (variant === 1) {
      const values = [8, 2, 10, 5];
      if (language === "Python") {
        code = "values = [8, 2, 10, 5]\ntarget = 10\nlow = 0\nhigh = len(values) - 1\nwhile low <= high:\n    mid = (low + high) // 2\n    if values[mid] == target:\n        break\n    if values[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1";
      } else {
        code = arrayDeclaration(language, values) + "\n" + declareInt(language, "target", 10) + "\n" +
          declareInt(language, "low", 0) + "\n" + declareInt(language, "high", values.length - 1) + "\n" +
          "while (low <= high) {\n    int mid = (low + high) / 2;\n    if (values[mid] == target) { break; }\n    if (values[mid] < target) { low = mid + 1; } else { high = mid - 1; }\n}";
        if (language === "JavaScript") code = code.replace("int mid", "let mid");
      }
      return makeItem("This code uses binary search on [8, 2, 10, 5]. Which requirement is broken?", code,
        "Binary search requires the values to be sorted.",
        ["Binary search only works with text values.", "The target must always be the first element.", "The array must contain an even number of items."],
        "Binary search discards half of the search range based on ordering. That logic is only reliable when the data is sorted.", random);
    }
    const values = [3, 7, 11];
    if (language === "Python") {
      code = "values = [3, 7, 11]\nfor i in range(0, len(values) + 1):\n    print(values[i])";
    } else {
      code = arrayDeclaration(language, values) + "\n" +
        "for (" + (language === "JavaScript" ? "let " : "int ") + "i = 0; i <= " + values.length + "; i += 1) { " +
        (language === "JavaScript" ? "console.log(values[i]);" : language === "Java" ? "System.out.println(values[i]);" :
          language === "C" ? "printf(\"%d\\n\", values[i]);" : "cout << values[i] << endl;") + " }";
    }
    return makeItem("Which change would fix the out-of-range access in this loop?", code,
      "Change the condition so i is strictly less than the array length.",
      ["Start i at 1 and keep the same condition.", "Sort values before the loop.", "Increase the array length but keep the same condition."],
      "Array indexes begin at 0 and stop at length minus 1. Use i < length, not i <= length.", random);
  }

  function resetFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("is-correct", "is-wrong");
  }

  function updateTopicLabel() {
    topicLabel.textContent = languageSelect.value + " · " + topicSelect.value;
  }

  function startSprint() {
    state.topic = topicSelect.value;
    state.language = languageSelect.value;
    state.level = levelSelect.value;
    const difficulty = getDifficulty();
    state.tier = difficulty.tier;
    state.streakDay = difficulty.streakDay;
    const today = localDateKey();
    const seed = hashString(today + "|" + state.language + "|" + state.topic + "|" + state.tier + "|" + state.level);
    const random = makeRandom(seed);
    const variants = shuffled([0, 1, 2], random);

    state.questions = variants.map(function (variant) {
      return buildQuestion(state.topic, state.tier, variant, state.language, random);
    });
    state.index = 0;
    state.score = 0;
    state.answered = false;
    updateTopicLabel();
    startButton.textContent = "Restart today's sprint";
    nextButton.disabled = true;
    nextButton.textContent = "Next question →";
    renderQuestion();
  }

  function renderQuestion() {
    const item = state.questions[state.index];
    if (!item) return;
    state.answered = false;
    resetFeedback();
    progress.textContent = "Case " + (state.index + 1) + " of " + state.questions.length +
      " · Score " + state.score;
    questionBox.replaceChildren();

    const caseLabel = document.createElement("p");
    caseLabel.className = "practice-case-label";
    caseLabel.textContent = DIFFICULTY_NAMES[state.tier] + " · Streak day " + state.streakDay;
    questionBox.appendChild(caseLabel);

    const heading = document.createElement("h3");
    heading.textContent = item.question;
    questionBox.appendChild(heading);

    const codeLabel = document.createElement("p");
    codeLabel.className = "practice-code-label";
    codeLabel.textContent = "INSPECT THE CODE · " + state.language.toUpperCase();
    questionBox.appendChild(codeLabel);

    const pre = document.createElement("pre");
    pre.className = "practice-code";
    const code = document.createElement("code");
    code.textContent = item.code;
    pre.appendChild(code);
    questionBox.appendChild(pre);

    const levelNote = document.createElement("p");
    levelNote.className = "practice-level-note";
    levelNote.textContent = state.level + " base level · Daily cases rotate in your browser.";
    questionBox.appendChild(levelNote);

    optionsBox.replaceChildren();
    item.options.forEach(function (option, index) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "practice-option";
      button.textContent = String.fromCharCode(65 + index) + ". " + option;
      button.addEventListener("click", function () { chooseAnswer(index); });
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

    Array.from(optionsBox.querySelectorAll("button")).forEach(function (button, index) {
      button.disabled = true;
      if (index === item.answer) button.classList.add("is-correct");
      else if (index === selectedIndex) button.classList.add("is-wrong");
    });

    feedback.textContent = (correct ? "Correct. " : "Not quite. ") + item.explanation;
    feedback.classList.toggle("is-correct", correct);
    feedback.classList.toggle("is-wrong", !correct);
    nextButton.disabled = false;
    nextButton.textContent = state.index === state.questions.length - 1 ? "See results" : "Next case →";
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
      ? "Perfect trace. You followed every line correctly."
      : percent >= 67
        ? "Good investigation. Review the reasoning, then try another case."
        : "Keep investigating. Read each explanation and return for another daily set.";
    questionBox.appendChild(message);
    const milestone = document.createElement("p");
    milestone.className = "practice-case-label";
    milestone.textContent = DIFFICULTY_NAMES[state.tier] + " level · Streak day " + state.streakDay;
    questionBox.appendChild(milestone);
    progress.textContent = "Accuracy: " + percent + "%";
    recordPracticeDay();
    nextButton.disabled = true;
    nextButton.textContent = "Sprint complete";
    startButton.textContent = "Try another sprint";
  }

  startButton.addEventListener("click", startSprint);
  nextButton.addEventListener("click", function () {
    if (!state.questions.length || state.index >= state.questions.length || !state.answered) return;
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResults();
    }
  });

  function resetToReady(message) {
    state.questions = [];
    questionBox.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Setup changed";
    questionBox.appendChild(heading);
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    questionBox.appendChild(paragraph);
    optionsBox.replaceChildren();
    resetFeedback();
    progress.textContent = "Ready for a new sprint";
    nextButton.disabled = true;
    startButton.textContent = "Start today's sprint";
    updateTopicLabel();
  }

  topicSelect.addEventListener("change", function () {
    resetToReady("Start a new sprint to inspect " + topicSelect.value + " code.");
  });
  languageSelect.addEventListener("change", function () {
    resetToReady("The next cases will use " + languageSelect.value + " syntax.");
  });
  levelSelect.addEventListener("change", function () {
    resetToReady("Your selected base level is " + levelSelect.value + ". Streak milestones can raise the difficulty.");
  });

  updateTopicLabel();
  renderStreak();
});
