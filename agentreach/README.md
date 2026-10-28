# AgentReach AI (Needle 3 prototype)

An isolated starter for a personal AI agent using Cactus Compute's Needle 3 tool-calling model. This is added on a separate feature branch so it does not change the existing cH Code Helper website.

## What works in this first prototype

- Uses the `cactus-needle` Python package and the documented `needle.Needle(tools=[...])` interface.
- Exposes only read-only/demo tools: look up a public GitHub repository and list planned integrations.
- Keeps tools allow-listed. The model cannot run arbitrary shell commands, write files, or make changes to GitHub.
- Makes the integration status explicit. Gmail, Drive, Calendar, and private GitHub access are not connected yet.

## Requirements

- Python 3.10 or newer
- Internet access for package/model download and public GitHub repository lookups
- A laptop that can run the Needle runtime

No paid AI inference API key is required by this local prototype. First-time installation may download model/runtime assets and therefore needs internet and disk space.

## Run on Windows

Open PowerShell in this folder:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python agent.py
```

If PowerShell blocks activation, use the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe agent.py
```

On macOS/Linux, create a virtual environment with `python3 -m venv .venv`, activate it, install `requirements.txt`, then run `python agent.py`.

## Example prompts

- `Look up the public GitHub repository karpathy/nanochat`
- `Show me which integrations are available`

The GitHub lookup uses the public GitHub API and does not need a token for public repository metadata. Rate limits apply.

## Safety and current limitations

- Do not paste passwords, personal access tokens, or OAuth secrets into prompts.
- Do not add arbitrary shell, file deletion, email sending, or write-access tools to the model's tool list.
- Model confidence and tool selection can be wrong. Validate outputs.
- A real integration needs explicit OAuth/API setup, minimal scopes, secret storage, and a human confirmation step before sending messages, editing repositories, deleting data, or creating calendar events.
- This prototype does not claim to connect Gmail, Google Drive, Calendar, or all apps automatically.
- The root cH Code Helper website and its backend are unchanged by this branch.

## Google Colab prototypes

### Phase 1: Needle 3 smoke test

Open [AgentReach_Needle3_Colab.ipynb](https://colab.research.google.com/github/theaj-ship-it/ch-code-helper/blob/feature/agentreach-needle3-prototype/agentreach/AgentReach_Needle3_Colab.ipynb) and run the cells from top to bottom. It tests package setup, the public GitHub API, Needle initialization, and tool calling.

### Phase 2: Google Drive filename search (read-only)

Open [AgentReach_Needle3_Phase2_GoogleDrive.ipynb](https://colab.research.google.com/github/theaj-ship-it/ch-code-helper/blob/feature/agentreach-needle3-prototype/agentreach/AgentReach_Needle3_Phase2_GoogleDrive.ipynb) and run the cells in order. The notebook asks the user to authorize Google access in Colab and then enables a limited Drive tool that searches a filename substring and returns at most ten metadata records. It does not read file contents or perform writes.

Google authorization can give notebook code access to account data beyond what one tool function uses. Review the notebook and authorization prompt before approving. Do not execute untrusted code in the same authenticated session. This phase deliberately avoids Drive writes and content reads.

## Next milestones

1. Run the local prototype and verify Needle 3 loads.
2. Add authenticated GitHub read-only access using a fine-grained token stored only in local environment variables.
3. Add Google OAuth for read-only Gmail/Calendar/Drive scopes, then test one integration at a time.
4. Add an approval screen for any write/action tools.
5. Add a small web UI only after the tool loop is stable.
