const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const dirs = ['features/music-blackhole', 'app/universe/music'];
let files = [];
dirs.forEach(d => {
  files = files.concat(walkSync(d));
});
if (fs.existsSync('components/navigation/TopFloatingBar.tsx')) {
    files.push('components/navigation/TopFloatingBar.tsx');
}
if (fs.existsSync('app/universe/layout.tsx')) {
    files.push('app/universe/layout.tsx');
}
if (fs.existsSync('src/data/universe.ts')) {
    files.push('src/data/universe.ts');
}

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace terms
    content = content.replace(/MusicNebula/g, 'MusicBlackhole');
    content = content.replace(/musicNebula/g, 'musicBlackhole');
    content = content.replace(/music-nebula/g, 'music-blackhole');
    content = content.replace(/NebulaHUD/g, 'BlackholeHUD');
    content = content.replace(/nebulaHUD/g, 'blackholeHUD');
    content = content.replace(/NebulaBackdrop/g, 'BlackholeCore'); // if it exists
    content = content.replace(/buildNebula/g, 'buildBlackhole');
    content = content.replace(/EMPTY_NEBULA/g, 'EMPTY_BLACKHOLE');
    content = content.replace(/NebulaBackground/g, 'BlackholeBackground');
    content = content.replace(/Nebula/g, 'Blackhole');
    content = content.replace(/nebula/g, 'blackhole');
    content = content.replace(/NEBULA/g, 'BLACKHOLE');
    
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log("Renaming completed.");
