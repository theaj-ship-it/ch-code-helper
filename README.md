# cH Code Helper · Stage 3 (Live AI Tutor)

This package keeps the existing cH GitHub Pages frontend and adds a separate Node.js API backend. The browser sends a lesson request to the backend; the backend calls the OpenAI Responses API and returns a structured lesson. **The OpenAI API key is never placed in the frontend.**

## What's included

- `index.html`, `style.css`, `script.js`: the existing cH design with the tutor form connected to the live API.
- `api-config.js`: public frontend setting where you enter the deployed backend URL. It is safe to commit; it must never contain an API key.
- `backend/`: Express API, input validation, CORS allow-list, rate limiting, security headers, health endpoint, and AI lesson generation.
- `render.yaml`: optional Render Blueprint deployment configuration.
- `.gitignore` and `backend/.gitignore`: ignore environment files and dependencies.

## Before you begin

1. Keep your existing repository: https://github.com/theaj-ship-it/ch-code-helper
2. You need an OpenAI API key and API billing/credits enabled. ChatGPT subscriptions and API usage are billed separately.
3. Create a separate API key for this project. Never share it in chat, a screenshot, GitHub, `script.js`, `index.html`, or `api-config.js`.
4. This public prototype does not have user accounts. Rate limiting reduces casual abuse but is not full authentication. Set a small provider spending limit/alert and monitor usage before sharing widely.

## Part A: Deploy the backend on Render

1. Upload the `backend` folder and `render.yaml` to your GitHub repository, or keep them in a separate private/public repository. The backend can be deployed from the same repository because it is a separate service.
2. In Render, choose **New → Blueprint** and select the repository containing `render.yaml`. If you prefer a manual Web Service, set **Root Directory** to `backend`, **Build Command** to `npm install`, and **Start Command** to `npm start`.
3. In the service's **Environment** settings, add:
   - `OPENAI_API_KEY` = your secret API key (secret value only in Render)
   - `OPENAI_MODEL` = `gpt-6-astra` (change only if you intentionally choose another model available to your API project)
   - `CORS_ORIGINS` = `https://theaj-ship-it.github.io`
4. Deploy the service. Copy its public HTTPS origin, such as `https://your-service-name.onrender.com`. Do not include `/api/lesson` in the base URL.
5. Open `https://YOUR-SERVICE.onrender.com/health`. A configured backend should return JSON containing `"status":"ok"` and `"configured":true`. If it says `false`, fix the environment variable and redeploy.

Note: free hosting tiers may sleep, have usage limits, or be unsuitable for reliability-sensitive production. For the reliability-first preference, choose a hosting plan with uptime/resources appropriate to your expected traffic and check its current pricing before deploying.

## Part B: Connect the existing GitHub Pages site

1. In `api-config.js`, replace `https://YOUR-BACKEND-SERVICE.onrender.com` with the real backend origin. Keep the quotes and do not add a trailing slash.
2. In your existing GitHub repository root, update these files from this package: `index.html`, `script.js`, and `style.css`.
3. Add `api-config.js`, the `backend/` folder, `render.yaml`, and the root `.gitignore` if they are not already present. Do not remove unrelated files from your existing repository.
4. Commit the changes to the branch/folder used by GitHub Pages. Your current website URL stays the same: https://theaj-ship-it.github.io/ch-code-helper/
5. Wait for the GitHub Pages deployment to finish, then open the site and refresh it. If the old script remains cached, refresh again or open the page in a private tab.

**Important:** Only the backend needs `OPENAI_API_KEY`. The public `api-config.js` contains only the backend URL.

## Part C: Test Stage 3

1. Open the live cH site.
2. Choose `Beginner`, `Python`, and `Loops`.
3. Ask: `Explain a for loop with a simple example. Show the logic before the code.`
4. Tap **Build my learning steps**. You should see an AI-generated introduction, steps, code, expected output, a practice challenge, and a hint. The answer panel should show `LIVE AI`.
5. Test Java or C++ and an Intermediate question.
6. Test the sample button too. Sample lessons work locally and do not call the API.
7. If it fails, open the backend `/health` URL first, then check the Render service logs and browser status message.

## Common errors

- **Backend URL has not been configured:** replace the placeholder in `api-config.js` and commit it.
- **Origin is not allowed:** `CORS_ORIGINS` must exactly include `https://theaj-ship-it.github.io` (no path or trailing slash). If you later use a custom domain, add that origin too, separated by a comma, then redeploy.
- **503 / not configured:** add `OPENAI_API_KEY` in the backend host's environment settings. Never put it in frontend files.
- **429 / quota / rate limit:** check API billing, project usage limits, and request rate limits. Wait before retrying.
- **502 / AI tutor could not generate:** inspect backend logs, confirm the selected model is available to your API project, and try again.
- **First request is slow:** some hosting tiers sleep while idle. Use an always-on plan if startup delay is unacceptable.

## Security and operating limits

- The backend accepts only known language/level/topic values and limits questions to 1,500 characters.
- It limits requests to 12 per IP per 15 minutes per running backend instance. This in-memory limit resets on restart and is not a substitute for authentication or a shared rate-limit store at scale.
- Browser CORS is not authentication. Anyone can inspect a public website and attempt to call its public API, so set provider budget alerts/limits, monitor traffic, and add authentication or stronger abuse controls before wider public launch.
- Do not ask students to submit passwords, personal identifiers, or confidential code.
- AI output can contain mistakes. Verify code and expected output before relying on it for coursework or production.
- This API generates explanations and code text; it does not compile or execute the submitted code.

## Local backend test (optional)

Requires Node.js 20 or newer.

```bash
cd backend
npm install
```

Set environment variables in your terminal or a local `.env` file (the `.env` file is ignored by Git). If using a local `.env`, install `dotenv` and add `import "dotenv/config";` at the top of `server.js`, or export variables directly in your shell. Then run:

```bash
npm start
```

Check `http://localhost:3000/health`. For local browser testing, set `CORS_ORIGINS` to the exact local frontend origin as well. Do not commit `.env`.

## Official reference

- OpenAI API documentation: https://platform.openai.com/docs/api-reference/responses
- OpenAI model documentation: https://platform.openai.com/docs/models


## Logic Sprint (new practice feature)

The **Logic Sprint** panel adds a small, browser-based practice round alongside the existing AI tutor:

- Three multiple-choice questions for the selected topic.
- Instant correct/incorrect feedback with explanations.
- Score tracking, next-question flow, and restart support.
- Topic coverage for loops, arrays, variables, functions, conditions, OOP, data structures, algorithms, and general problem-solving.
- Runs locally in the browser and does not call the AI API or execute submitted code.

The feature is being developed on the `feature/logic-sprint-practice` branch. The existing lesson form and backend endpoints are left unchanged.
