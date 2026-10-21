# cH Code Helper

cH is a responsive front-end prototype for a programming learning assistant. Its goal is to help learners understand logic and steps before they write code, rather than only copying a final answer.

## Features
- Responsive landing page
- Beginner and Intermediate levels
- Topic selection: Loops, Arrays, Functions, Problem solving, Variables
- Language selection: Python, Java, C, C++, JavaScript
- Step-by-step sample learning guide generated in the browser
- No installation or API key required for the demo

## Run locally
1. Download or extract this folder.
2. Open `index.html` in Chrome, Edge, or Firefox.
3. Click **Try the learning tutor** and submit a topic.

You can also open the folder in Visual Studio Code and use the Live Server extension, but it is not required.

## Important project note
This version is a front-end prototype. It uses sample lesson content in `script.js`; it does not call an AI model or save user accounts/data. To add real AI responses later, build a small backend API and store the AI API key in the backend environment, never in browser JavaScript.

## Publish with GitHub Pages
1. Create a repository on GitHub.
2. Upload `index.html`, `style.css`, `script.js`, `README.md`, and `.gitignore` to the repository root.
3. Open **Settings → Pages**.
4. Under the build/deployment section, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then save.
6. Wait for the published URL shown in the Pages section.

## Files
- `index.html` — page structure and content
- `style.css` — layout, colors, responsive styling
- `script.js` — demo tutor interactions
- `.gitignore` — ignores common local files
- `.env.example` — placeholder for a future backend; no secrets included
