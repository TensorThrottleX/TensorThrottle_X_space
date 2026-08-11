const srOnly = {
  position: "absolute", width: 1, height: 1, overflow: "hidden",
  clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap",
};

// Not a visual affordance — a parallel path into the same selection state
// the mouse/touch picking uses, for anyone tabbing through the page
// instead of pointing at stars in 3D space.
export default function KeyboardStarList({ tracks, selectedId, onFocusTrack }) {
  if (!tracks.length) return null;
  return (
    <div style={srOnly}>
      <div role="listbox" aria-label="Songs in the blackhole">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            role="option"
            aria-selected={t.id === selectedId}
            onFocus={() => onFocusTrack(t)}
            onClick={() => onFocusTrack(t)}
          >
            {t.title} by {t.artist}
          </button>
        ))}
      </div>
    </div>
  );
}
