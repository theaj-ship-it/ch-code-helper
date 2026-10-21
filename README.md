# cH Code Helper (fixed prototype)

A responsive static website that helps programming learners understand logic before code.

## Files
- `index.html`: page structure and tutor form
- `style.css`: visual design and responsive layout
- `script.js`: form handling and sample lesson generation

## Test locally
1. Extract this ZIP.
2. Keep all files together in the same folder.
3. Open `index.html` in a browser.
4. Enter `Explain loops` and click **Build my learning steps**.
5. The learning steps should appear in the learning guide panel.

## Publish with GitHub Pages
Upload the files in this folder to the root of your repository and commit the changes. In Settings → Pages, select **Deploy from a branch**, branch `main`, folder `/(root)`, then Save. Wait for the deployment to finish.

## Important
This is a static prototype with prepared sample guidance. It does not call a real AI model and does not save user accounts or conversation history. A real AI tutor requires a backend API; never put a private AI API key in `script.js` or any browser-visible file.
