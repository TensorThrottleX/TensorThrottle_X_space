# ADR-002: Session-Based Media
**Status:** Accepted

**Context:** Navigating between immersive pages required complex state tracking to pause/resume background videos.

**Decision:** Implement a priority-based session stack. Components "own" a session. Unmounting automatically restores previous sessions.
