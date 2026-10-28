"""AgentReach AI: safe Needle 3 tool-calling prototype.

Only allow-listed, read-only tools are exposed to the model.
No shell execution, file writes, email sending, or repository writes.
"""
from __future__ import annotations

import json
import sys
from typing import Any

import requests
import needle


@needle.tool
def get_public_github_repo(owner: str, repo: str) -> dict[str, Any]:
    """Get basic metadata for a public GitHub repository. Provide its owner and repository name."""
    # Restrict identifiers to simple GitHub path components.
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
    if not owner or not repo or any(ch not in allowed for ch in owner + repo):
        return {"ok": False, "error": "Invalid GitHub owner or repository name."}
    if owner in {".", ".."} or repo in {".", ".."}:
        return {"ok": False, "error": "Invalid GitHub owner or repository name."}

    url = f"https://api.github.com/repos/{owner}/{repo}"
    try:
        response = requests.get(
            url,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "AgentReach-Prototype"},
            timeout=10,
        )
        if response.status_code == 404:
            return {"ok": False, "error": "Public repository not found or not accessible."}
        response.raise_for_status()
        data = response.json()
        return {
            "ok": True,
            "name": data.get("full_name"),
            "description": data.get("description"),
            "url": data.get("html_url"),
            "language": data.get("language"),
            "stars": data.get("stargazers_count"),
            "default_branch": data.get("default_branch"),
            "license": (data.get("license") or {}).get("spdx_id"),
            "private": data.get("private"),
        }
    except requests.RequestException as exc:
        return {"ok": False, "error": f"GitHub request failed: {type(exc).__name__}"}


@needle.tool
def list_supported_integrations() -> dict[str, Any]:
    """List connected and planned application integrations and their current status."""
    return {
        "connected": [
            {
                "name": "Needle 3 local model",
                "status": "configured by installing cactus-needle",
            },
            {
                "name": "Public GitHub repository metadata",
                "status": "read-only demo tool; no account authentication",
            },
        ],
        "not_connected": [
            "Private GitHub repositories and write actions",
            "Gmail",
            "Google Drive",
            "Google Calendar",
            "Browser automation",
            "Local file access",
        ],
        "safety_note": "Each integration must be configured separately with least-privilege access and approval for write actions.",
    }


def main() -> int:
    print("AgentReach AI | Needle 3 local prototype")
    print("Read-only tools only. Type 'exit' to quit.")
    try:
        agent = needle.Needle(tools=[get_public_github_repo, list_supported_integrations])
    except Exception as exc:
        print(f"Could not initialize Needle: {type(exc).__name__}: {exc}", file=sys.stderr)
        print("Check the installed cactus-needle package and its official setup guide.", file=sys.stderr)
        return 1

    while True:
        try:
            prompt = input("\nYou> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            return 0
        if prompt.lower() in {"exit", "quit"}:
            print("Goodbye.")
            return 0
        if not prompt:
            continue
        try:
            result = agent.run(prompt)
            print("\nAgentReach> ")
            print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
        except Exception as exc:
            print(f"Request failed: {type(exc).__name__}: {exc}", file=sys.stderr)


if __name__ == "__main__":
    raise SystemExit(main())
