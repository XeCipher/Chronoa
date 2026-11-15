// frontend/lib/timerSound.ts
export const TIMER_END_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/586/586-preview.mp3";

const playFallbackChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const playSine = (freq: number, duration: number, vol: number, delay: number = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    playSine(523.25, 4, 0.4, 0);
    playSine(1046.5, 3, 0.15, 0.05);
    playSine(1569.75, 2, 0.05, 0.1);
  } catch (e) {
    console.error("Audio API not supported", e);
  }
};

export const playTimerEndSound = () => {
  try {
    if (TIMER_END_SOUND_URL) {
      const audio = new Audio(TIMER_END_SOUND_URL);
      audio.volume = 0.75;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playFallbackChime();
        });
      }
      return;
    }
  } catch {
    // Fallback to synthesized chime below
  }
  playFallbackChime();
};