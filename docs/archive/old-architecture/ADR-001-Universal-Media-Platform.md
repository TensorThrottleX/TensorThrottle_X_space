# ADR-001: Universal Media Platform
**Status:** Accepted

**Context:** Multiple pages (Anime, Timeline, Glob) were implementing their own video players, causing audio overlapping and memory leaks.

**Decision:** We will extract all media logic into a centralized Orchestrator that sits at the root of the app. Pages will no longer render media players; they will request media via sessions.

**Consequences:** Easier maintenance, better performance, but requires wrapping new routes in a `useMediaSession` hook.
