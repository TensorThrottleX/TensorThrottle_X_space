// ═══════════════════════════════════════════════════════════════════════
// DEV-ONLY SEED DATA — for local visual verification only.
// ───────────────────────────────────────────────────────────────────────
// Not imported anywhere in the production entry (MusicBlackhole.jsx). Wire
// this up in a Storybook story, a local /dev route, or a temporary prop
// while you're wiring the real library — then delete the wiring, not this
// file (keep it around for the next time you need to sanity-check a
// rendering change against a known-good dataset).
//
// audioUrl is left null for every track here on purpose: this is for
// checking layout, clustering and interaction, not for shipping demo
// audio. Point audioUrl at a real file under your media dir to hear it.
// ═══════════════════════════════════════════════════════════════════════

export const DEV_SEED_TRACKS = [
  { id: "t1", title: "After Dark", artist: "Mr.Kitty", album: "After Dark", genre: "Synthwave", mood: ["nocturnal", "melancholic"], year: 2014, source: "local", audioUrl: null, memory: "Late nights building without knowing where it would lead." },
  { id: "t2", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", genre: "Dream Pop", mood: ["euphoric", "nostalgic"], year: 2011, source: "local", audioUrl: null, memory: "Arriving somewhere new after a long drive." },
  { id: "t3", title: "Breathe", artist: "Télépopmusik", album: "Genetic World", genre: "Trip Hop", mood: ["meditative", "calm"], year: 2001, source: "local", audioUrl: null, memory: "The only thing playing when I finally understood." },
  { id: "t4", title: "Neon Lights", artist: "Kraftwerk", album: "The Man-Machine", genre: "Electronic", mood: ["mechanical", "hypnotic"], year: 1978, source: "local", audioUrl: null, memory: "A blueprint for every synthesizer that followed." },
  { id: "t5", title: "Blue (Da Ba Dee)", artist: "Eiffel 65", album: "Europop", genre: "Eurodance", mood: ["euphoric", "playful"], year: 1998, source: "local", audioUrl: null },
  { id: "t6", title: "Teardrop", artist: "Massive Attack", album: "Mezzanine", genre: "Trip Hop", mood: ["melancholic", "meditative"], year: 1998, source: "local", audioUrl: null, memory: "What it sounds like to hold grief quietly." },
  { id: "t7", title: "Running Up That Hill", artist: "Kate Bush", album: "Hounds of Love", genre: "Art Pop", mood: ["longing", "intense"], year: 1985, source: "local", audioUrl: null, memory: "Returned decades later and hit harder the second time." },
  { id: "t8", title: "Message from the Water", artist: "Hiroshi Yoshimura", album: "Music for Nine Post Cards", genre: "Ambient", mood: ["calm", "spatial"], year: 1982, source: "local", audioUrl: null, memory: "Architecture made audible." },
  { id: "t9", title: "Computer Love", artist: "Kraftwerk", album: "Computer World", genre: "Electronic", mood: ["mechanical", "lonely"], year: 1981, source: "local", audioUrl: null },
  { id: "t10", title: "In the Air Tonight", artist: "Phil Collins", album: "Face Value", genre: "Art Rock", mood: ["tense", "nocturnal"], year: 1981, source: "local", audioUrl: null },
  { id: "t11", title: "Space Song", artist: "Beach House", album: "Depression Cherry", genre: "Dream Pop", mood: ["dreamy", "nostalgic"], year: 2015, source: "local", audioUrl: null, memory: "Summer ending before you noticed it started." },
  { id: "t12", title: "The Chain", artist: "Fleetwood Mac", album: "Rumours", genre: "Rock", mood: ["intense", "resolute"], year: 1977, source: "local", audioUrl: null },
  { id: "t13", title: "Dissolution", artist: "Moderat", album: "III", genre: "Electronic", mood: ["melancholic", "spatial"], year: 2016, source: "local", audioUrl: null },
  { id: "t14", title: "Lonely Planet", artist: "Atoms for Peace", album: "AMOK", genre: "Art Rock", mood: ["restless", "intense"], year: 2013, source: "local", audioUrl: null },
  { id: "t15", title: "Contact", artist: "Daft Punk", album: "Random Access Memories", genre: "Electronic", mood: ["euphoric", "spatial"], year: 2013, source: "local", audioUrl: null, memory: "The last transmission." },
  { id: "t16", title: "Daydreaming", artist: "Radiohead", album: "A Moon Shaped Pool", genre: "Art Rock", mood: ["melancholic", "dreamy"], year: 2016, source: "local", audioUrl: null },
  { id: "t17", title: "Intro", artist: "The xx", album: "xx", genre: "Indie", mood: ["intimate", "calm"], year: 2009, source: "local", audioUrl: null },
  { id: "t18", title: "Oxygène IV", artist: "Jean-Michel Jarre", album: "Oxygène", genre: "Electronic", mood: ["spatial", "meditative"], year: 1976, source: "local", audioUrl: null, memory: "Before ambient had a name for itself." },
  { id: "t19", title: "Motion Picture Soundtrack", artist: "Radiohead", album: "Kid A", genre: "Art Rock", mood: ["mournful", "ethereal"], year: 2000, source: "local", audioUrl: null },
  { id: "t20", title: "Golden Hours", artist: "Brian Eno", album: "Another Green World", genre: "Ambient", mood: ["calm", "warm"], year: 1975, source: "local", audioUrl: null, memory: "Invented the category it belongs to." },
  // A couple of deliberately sparse entries — exercises the "Echoes" fallback.
  { id: "t21", title: "Untitled Fragment", artist: "Unknown" },
  { id: "t22", title: "Found on an Old Drive", artist: "Unknown", year: 2009 },
];
