# ADR-003: Universal Asset Registry
**Status:** Accepted

**Decision:** All asset paths are resolved via a deterministic factory `assetRegistry.resolve(dimension, id)` rather than hardcoding `/media/universe/.../`.
