import { useEffect, useRef, useState } from 'react';

type SoundType = 'tap' | 'right' | 'wrong';

const useSound = () => {
  const [isClient, setIsClient] = useState(false);
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    tap: null,
    right: null,
    wrong: null,
  });

  useEffect(() => {
    setIsClient(true);

    const loadAudio = (type: SoundType) => {
      if (typeof window !== 'undefined' && window.Audio) {
        audioRefs.current[type] = new Audio(`/sounds/${type}.webm`);
        audioRefs.current[type]!.preload = 'auto';
        audioRefs.current[type]!.load();
      }
    };

    loadAudio('tap');
    loadAudio('right');
    loadAudio('wrong');
  }, []);

  const playSound = (type: SoundType) => {
    if (isClient && audioRefs.current[type]) {
      audioRefs.current[type]!.currentTime = 0;
      audioRefs.current[type]!.play().catch((error) =>
        console.error('Error playing sound:', error)
      );
    }
  };

  return playSound;
};

export default useSound;
