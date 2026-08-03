# Theme System

The Theme is inherently tied to the media. When a session changes the media to a bright video, the `AssetPackage.theme` asserts `'bright'`. The Orchestrator automatically syncs this to `document.documentElement.setAttribute('data-theme', theme)`.
