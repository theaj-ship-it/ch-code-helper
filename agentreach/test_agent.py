"""Unit tests for AgentReach's read-only starter tools."""
import unittest
from unittest.mock import Mock, patch

import agent


class PublicGitHubRepoTests(unittest.TestCase):
    def test_rejects_invalid_owner_or_repo_without_network_call(self):
        with patch.object(agent.requests, "get") as get:
            result = agent.get_public_github_repo("../bad", "repo")
        self.assertFalse(result["ok"])
        get.assert_not_called()

    @patch.object(agent.requests, "get")
    def test_returns_allowlisted_public_metadata(self, get):
        response = Mock()
        response.status_code = 200
        response.json.return_value = {
            "full_name": "octocat/Hello-World",
            "description": "Example",
            "html_url": "https://github.com/octocat/Hello-World",
            "language": "Python",
            "stargazers_count": 12,
            "default_branch": "main",
            "license": {"spdx_id": "MIT"},
            "private": False,
            "owner": {"email": "should-not-leak@example.com"},
        }
        get.return_value = response

        result = agent.get_public_github_repo("octocat", "Hello-World")

        self.assertTrue(result["ok"])
        self.assertEqual(result["name"], "octocat/Hello-World")
        self.assertEqual(result["stars"], 12)
        self.assertNotIn("owner", result)
        self.assertNotIn("email", result)
        get.assert_called_once()
        self.assertEqual(get.call_args.kwargs["timeout"], 10)

    @patch.object(agent.requests, "get")
    def test_404_is_a_safe_not_found_result(self, get):
        response = Mock()
        response.status_code = 404
        get.return_value = response
        result = agent.get_public_github_repo("octocat", "missing-repo")
        self.assertFalse(result["ok"])
        self.assertIn("not found", result["error"].lower())

    def test_integration_status_does_not_claim_gmail_or_drive_connected(self):
        result = agent.list_supported_integrations()
        self.assertIn("Gmail", result["not_connected"])
        self.assertIn("Google Drive", result["not_connected"])
        self.assertTrue(any(x["name"] == "Public GitHub repository metadata" for x in result["connected"]))


if __name__ == "__main__":
    unittest.main()
