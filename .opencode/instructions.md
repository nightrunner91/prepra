# User preferences

## No automatic browser / visual verification

Unless the user explicitly asks for it, do **NOT**:

- Start a browser, Playwright, or any visual verification tool.
- Take screenshots or generate visual previews.
- Start a dev server, static server, or any local server just to look at the UI.
- Use `browser_*` tools for visual checks.

When the user says things like "I will check it myself", "don't verify visually", or expresses frustration about browser automation, stop all browser/visual attempts immediately and do not resume them in the current task.

If visual verification is genuinely needed, ask the user for permission first. Default to trusting the user to verify the result themselves.

## Temporary artifacts location

When browser_* tools or other MCP servers generate artifacts (logs, snapshots, screenshots, downloads), save them under `.tmp/playwright-mcp/` or another appropriate subdirectory of `.tmp/` instead of the project root. Do not leave transient files in the workspace root. Both `.playwright-mcp/` and `.tmp/` are ignored by Git.
