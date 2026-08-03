# Background Audio Engine

The Background Audio Engine manages ambient soundtracks. 

## Crossfading
Instead of abrupt cuts, changing the `audioUrl` triggers a 40ms interval loop that fades volume to `0`, swaps the `src`, and fades back to target volume (e.g., `0.35`).
