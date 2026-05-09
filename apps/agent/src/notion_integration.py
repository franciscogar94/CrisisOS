"""Legacy Notion-integration module — emptied for the Crisis Manager build.

The Crisis Manager has no external integration to health-check at boot.
Original helper `health_check(database_id)` is preserved as a stub that
returns a benign payload so stale callers don't crash.
"""

from __future__ import annotations

from typing import Any, Dict


def health_check(_database_id: str = "") -> Dict[str, Any]:
    """Return a benign health payload — Crisis Manager has no DB to verify."""
    return {
        "user_id": None,
        "db_title": "(none)",
        "row_count": 0,
        "expected_props": [],
        "actual_props": [],
        "missing_props": [],
        "error": None,
    }
