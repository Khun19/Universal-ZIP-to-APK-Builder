# Automatic pull-request review

## Policy

The `.github/workflows/auto-copilot-review.yml` workflow requests GitHub Copilot as a formal pull-request reviewer whenever a PR is opened, reopened, updated with new commits, or marked ready for review.

- Reviewer API identity: `copilot-pull-request-reviewer[bot]`.
- The workflow does not check out or execute pull-request code. It uses `pull_request_target` only to call GitHub's review-request API with the PR number supplied by GitHub.
- If the request fails, the workflow fails with an actionable message. Check Copilot code-review availability, repository/account policy, and token permissions.
- Copilot's default review is normally a formal **Comment** review, not an approval. Do not treat it as a human approval or as proof that CI passes.
- New pushes trigger a fresh request; whether Copilot performs a new review is subject to GitHub Copilot's configuration and availability.

## Repository setting for stronger coverage

If the repository owner has access to Copilot code-review automatic-review settings, also enable automatic reviews for all pull requests and **Review new pushes** in GitHub's Copilot code-review ruleset/settings. This setting is controlled by GitHub and cannot be guaranteed solely by a repository workflow.

## Merge policy

AI review is an additional review signal. Merge only after required CI checks pass and all substantive findings are resolved. Do not manufacture an approval review with a bot token or label an AI comment as human approval.

## References

- [GitHub: Using Copilot code review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review)
- [GitHub: About Copilot code review and automatic reviews](https://docs.github.com/en/copilot/concepts/agents/code-review)
