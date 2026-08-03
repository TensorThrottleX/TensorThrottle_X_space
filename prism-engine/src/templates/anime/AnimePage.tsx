import React, { useState, useRef, useCallback } from 'react';
import { Prism } from '../../prism/components/Prism';
import { PrismItem } from '../../prism/types/Item';
import { AssetResolver } from '../../media/AssetResolver';
import { animeItems } from './data';
import { BackgroundVideoEngine } from '@/components/media/BackgroundVideoEngine';

const resolver = new AssetResolver({
  covers: '/templates/anime/covers',
  videos: '/templates/anime/videos',
  audio: '/templates/anime/audio',
  metadata: '/templates/anime/metadata',
});

function AnimeStage() {
  const [active, setActive] = useState<ReturnType<typeof resolver.resolve> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleActiveChange = useCallback((item: PrismItem) => {
    const resolved = resolver.resolve(item);
    setActive(resolved);

    if (audioRef.current && resolved.audio) {
      audioRef.current.src = resolved.audio;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="anime-page-stage">
      <BackgroundVideoEngine
        src={active?.video}
        cinematic
        opacity={0.45}
      />
      <audio ref={audioRef} className="page-background-audio" loop />

      {active?.cover && (
        <img className="page-background-cover" src={active.cover} alt="" />
      )}

      <Prism items={animeItems} events={{ onActiveChange: handleActiveChange }} />
    </div>
  );
}

export default function AnimePage() {
  return <AnimeStage />;
}