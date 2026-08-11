const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../public/media/universe/music-blackhole');
const outputJson = path.join(__dirname, '../features/music-blackhole/data/music-registry.json');

function buildRegistry() {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    // Create dummy folders
    ['inspired', 'felt', 'lifelong'].forEach(folder => {
      const folderPath = path.join(baseDir, folder);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    });
  }

  const tracks = [];
  let idCounter = 1;

  const categories = fs.readdirSync(baseDir);
  for (const category of categories) {
    const catPath = path.join(baseDir, category);
    if (!fs.statSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath);
    const songs = files.filter(f => f.endsWith('.json'));

    if (songs.length === 0) {
      // Create a dummy JSON if none exists
      const dummyFile = path.join(catPath, `example-song.json`);
      const dummyData = {
        title: `Example Song in ${category}`,
        artist: "Unknown Artist",
        album: "Unknown Album",
        genre: category,
        mood: [category],
        year: 2024,
        source: "local",
        audioUrl: `/media/universe/music-blackhole/${category}/example-song.mp3`,
        memory: `This is a placeholder description for a song in the ${category} category.`,
        meaning: `Reason for this song being here.`,
      };
      fs.writeFileSync(dummyFile, JSON.stringify(dummyData, null, 2));
      songs.push('example-song.json');
    }

    for (const song of songs) {
      const songPath = path.join(catPath, song);
      try {
        const data = JSON.parse(fs.readFileSync(songPath, 'utf8'));
        tracks.push({
          id: `music_bh_${idCounter++}`,
          cluster: category,
          ...data
        });
      } catch (e) {
        console.error(`Failed to parse ${songPath}:`, e);
      }
    }
  }

  fs.writeFileSync(outputJson, JSON.stringify(tracks, null, 2));
  console.log(`Generated music-registry.json with ${tracks.length} tracks.`);
}

buildRegistry();
