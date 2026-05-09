"""Legacy Notion-MCP module — emptied for the Crisis Manager build.

The Crisis Manager has no Notion integration. Original helpers
(`has_notion_token`, `mcp_create_comment`, etc.) are no longer wired into
any tool path. Stub remains so stale imports don't crash boot.
"""

from __future__ import annotations


def has_notion_token() -> bool:
    return False


def mcp_create_comment(*_args, **_kwargs) -> None:
    """No-op — Crisis Manager has no Notion target."""
    return None
