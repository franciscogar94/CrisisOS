"""Legacy lead-store module — kept as a no-op stub for the Crisis Manager build.

The Crisis Manager has no external lead store. The original starter kit
shipped a Notion / local-JSON adapter here; the Crisis Manager doesn't
need either. The functions below exist only so any stale imports during
the rewrite don't crash the boot path.

Safe to delete entirely once `main.py` and friends have all migrated off
the legacy surface.
"""

from __future__ import annotations

from typing import Any, Optional


def boot_status() -> str:
    """Return a benign status string (no integration to check)."""
    return "source=none — Crisis Manager has no external store"


def get_store() -> Optional[Any]:
    """No store. Always None."""
    return None


def reset_store() -> None:
    """No-op."""
    return None
