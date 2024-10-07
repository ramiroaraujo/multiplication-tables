import { useEffect, useRef } from 'react';

type SoundType = 'tap' | 'right' | 'wrong';

const useSound = () => {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement>>({
    tap: new Audio(),
    right: new Audio(),
    wrong: new Audio(),
  });

  useEffect(() => {
    const loadAudio = (type: SoundType) => {
      audioRefs.current[type].src = `/sounds/${type}.webm`;
      audioRefs.current[type].preload = 'auto'; // Explicitly set preload to 'auto'

      // Start loading the audio file
      audioRefs.current[type].load();

      // Optional: You can also trigger a load event listener to ensure it's loaded
      audioRefs.current[type].addEventListener(
        'canplaythrough',
        () => {
          console.log(`${type} sound loaded`);
        },
        { once: true }
      );
    };

    loadAudio('tap');
    loadAudio('right');
    loadAudio('wrong');
  }, []);

  const playSound = (type: SoundType) => {
    audioRefs.current[type].currentTime = 0;
    audioRefs.current[type].play().catch((error) => console.error('Error playing sound:', error));
  };

  return playSound;
};

export default useSound;
