const fs = require('fs');
const path = require('path');

// ── CONFIGS & RESOLVERS ──
const COVER_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

const DIRS = {
  data: '/media/universe/anime/data',
  cover: '/media/universe/anime/cover',
  video: '/media/universe/anime/video',
  audio: '/media/universe/anime/audio',
};

function coverPath(animeId, filename) {
  return encodeURI(`${DIRS.cover}/${animeId}/${filename}`);
}
function videoPath(animeId, filename) {
  return encodeURI(`${DIRS.video}/${animeId}/${filename}`);
}
function audioPath(animeId, filename) {
  return encodeURI(`${DIRS.audio}/${animeId}/${filename}`);
}

function isMatch(id1, id2) {
  const norm1 = id1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm2 = id2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm1 || !norm2) return false;
  return norm1 === norm2 || norm1.startsWith(norm2) || norm2.startsWith(norm1);
}

function findAsset(dir, id, extensions) {
  if (!fs.existsSync(dir)) return null;
  try {
    const folders = fs.readdirSync(dir, { withFileTypes: true });
    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      if (isMatch(folder.name, id)) {
        const assetDir = path.join(dir, folder.name);
        const files = fs.readdirSync(assetDir);
        for (const file of files) {
          if (extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()))) {
            return { dirName: folder.name, filename: file };
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function findAssets(dir, id, extensions) {
  if (!fs.existsSync(dir)) return [];
  try {
    const folders = fs.readdirSync(dir, { withFileTypes: true });
    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      if (isMatch(folder.name, id)) {
        const assetDir = path.join(dir, folder.name);
        const files = fs.readdirSync(assetDir);
        const matchedFiles = files.filter(file => extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase())));
        matchedFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        return matchedFiles.map(filename => ({ dirName: folder.name, filename }));
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

// Defensive readers
function asString(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function asStringList(v) {
  if (!Array.isArray(v)) return undefined;
  const list = v.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  return list.length ? list : undefined;
}
function asStringRecord(v, keys) {
  if (!v || typeof v !== 'object') return null;
  const rec = v;
  const out = {};
  for (const k of keys) {
    const val = rec[k];
    out[k] = typeof val === 'string' ? val.trim() : '';
  }
  return keys.some((k) => out[k]) ? out : null;
}

function getMTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const PUBLIC_DIR = path.join(__dirname, '../public');
const ANIME_DATA_DIR = path.join(PUBLIC_DIR, 'media/universe/anime/data');
const COVER_DIR = path.join(PUBLIC_DIR, 'media/universe/anime/cover');
const VIDEO_DIR = path.join(PUBLIC_DIR, 'media/universe/anime/video');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'media/universe/anime/audio');

// 1. Generate Anime Registry
const animeList = [];
if (fs.existsSync(ANIME_DATA_DIR)) {
  const entries = fs.readdirSync(ANIME_DATA_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());

  for (const folder of folders) {
    const id = folder.name;
    const jsonPath = path.join(ANIME_DATA_DIR, id, `${id}.json`);
    if (!fs.existsSync(jsonPath)) continue;

    let parsed;
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const coverAsset = findAsset(COVER_DIR, id, COVER_EXTENSIONS);
    const videoAsset = findAsset(VIDEO_DIR, id, VIDEO_EXTENSIONS);
    const audioAssets = findAssets(AUDIO_DIR, id, AUDIO_EXTENSIONS);
    const updatedAt = getMTime(jsonPath);

    animeList.push({
      id,
      index: Number.isFinite(parsed.index) ? Number(parsed.index) : Number.MAX_SAFE_INTEGER,
      title: String(parsed.title ?? id),
      subtitle: asString(parsed.subtitle) ?? '',
      description: asString(parsed.description) ?? '',
      accentColor: asString(parsed.accentColor) ?? '#22d3ee',
      quotes: asStringList(parsed.quotes) ?? [],
      characters: Array.isArray(parsed.characters)
        ? parsed.characters
            .map((c) => {
              const rec = asStringRecord(c, ['name', 'role']);
              return rec ? { name: rec.name, role: rec.role } : null;
            })
            .filter((c) => c !== null)
        : [],
      coverImage: coverAsset ? coverPath(coverAsset.dirName, coverAsset.filename) : (asString(parsed.poster) || null),
      videoUrl: videoAsset ? videoPath(videoAsset.dirName, videoAsset.filename) : null,
      audioTracks: audioAssets.map(asset => audioPath(asset.dirName, asset.filename)),
      updatedAt,
      narrativeData: parsed,
    });
  }

  animeList.sort((a, b) => a.index - b.index);
  const defaultIdx = animeList.findIndex((a) => a.id === 'default');
  if (defaultIdx > 0) {
    const [def] = animeList.splice(defaultIdx, 1);
    animeList.unshift(def);
  }
}

// 2. Generate Universe Activities
const activities = [];
const UNIVERSE_DIR = path.join(PUBLIC_DIR, 'media/universe');

if (fs.existsSync(UNIVERSE_DIR)) {
  try {
    const sections = fs.readdirSync(UNIVERSE_DIR, { withFileTypes: true }).filter(e => e.isDirectory());
    for (const section of sections) {
      const sectionName = section.name;
      const dataDir = path.join(UNIVERSE_DIR, sectionName, 'data');
      if (!fs.existsSync(dataDir)) continue;

      const entities = fs.readdirSync(dataDir, { withFileTypes: true }).filter(e => e.isDirectory());
      for (const entity of entities) {
        const entityId = entity.name;
        const jsonPath = path.join(dataDir, entityId, `${entityId}.json`);
        if (!fs.existsSync(jsonPath)) continue;

        try {
          const raw = fs.readFileSync(jsonPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const updatedAt = getMTime(jsonPath);

          let icon = 'Globe';
          if (sectionName.toLowerCase() === 'anime') icon = 'Clapperboard';
          if (sectionName.toLowerCase() === 'music') icon = 'Music';

          activities.push({
            id: `universe-${sectionName}-${entityId}`,
            source: `Universe: ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`,
            entityType: 'card',
            entityId,
            action: 'Updated',
            title: String(parsed.title ?? entityId),
            description: String(parsed.subtitle ?? parsed.description ?? ''),
            url: `/universe/${sectionName}`,
            icon,
            priority: 2,
            visibility: 'public',
            createdAt: updatedAt,
            updatedAt,
            metadata: { section: sectionName }
          });
        } catch (err) {
          // skip
        }
      }
    }
  } catch (err) {
    console.error('Universe Activities generation error:', err);
  }
}

// Write outputs
const outputDir = path.join(__dirname, '../features/anime-universe/assets');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(path.join(outputDir, 'registry.json'), JSON.stringify(animeList, null, 2));
fs.writeFileSync(path.join(outputDir, 'activities-universe.json'), JSON.stringify(activities, null, 2));
console.log(`Generated manifest assets successfully!`);
console.log(`- Anime Registry: ${animeList.length} items`);
console.log(`- Universe Activities: ${activities.length} items`);
