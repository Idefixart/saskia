// Tiny 8-bit synth on WebAudio. No audio files. Silent unless the speaker toggle is on,
// except for sounds played with { force: true } right after a user gesture (the gift intro).
const STORAGE_KEY = 'sound';
const BEAT = 0.28; // seconds per beat for the birthday tune

let context = null;

function audio() {
  if (!context) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    context = new AudioCtx();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

const midi = (note) => 440 * 2 ** ((note - 69) / 12);

function tone(ac, { freq, start, dur, type = 'square', vol = 0.06, slideTo }) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

// "Happy Birthday", first two lines, in C major: [midi note, beats].
const BIRTHDAY = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
];
const BASS = [[48, 3], [43, 3], [43, 3], [48, 3]];

const SOUNDS = {
  blip: (ac, t) => tone(ac, { freq: 880, start: t, dur: 0.07, vol: 0.04 }),
  pling: (ac, t) => {
    tone(ac, { freq: midi(84), start: t, dur: 0.1, type: 'triangle', vol: 0.09 });
    tone(ac, { freq: midi(91), start: t + 0.09, dur: 0.22, type: 'triangle', vol: 0.09 });
  },
  horn: (ac, t) => {
    for (const offset of [0, 0.24]) {
      tone(ac, { freq: 330, start: t + offset, dur: 0.2, type: 'sawtooth', vol: 0.035 });
      tone(ac, { freq: 415, start: t + offset, dur: 0.2, type: 'sawtooth', vol: 0.03 });
    }
  },
  siren: (ac, t) => {
    for (let i = 0; i < 3; i++) {
      tone(ac, { freq: 620, start: t + i * 0.56, dur: 0.28, slideTo: 880, vol: 0.035 });
      tone(ac, { freq: 880, start: t + i * 0.56 + 0.28, dur: 0.28, slideTo: 620, vol: 0.035 });
    }
  },
  birthday: (ac, t) => {
    let at = t;
    for (const [note, beats] of BIRTHDAY) {
      tone(ac, { freq: midi(note), start: at, dur: beats * BEAT * 0.92, vol: 0.06 });
      at += beats * BEAT;
    }
    let bassAt = t;
    for (const [note, beats] of BASS) {
      tone(ac, { freq: midi(note), start: bassAt, dur: beats * BEAT * 0.9, type: 'triangle', vol: 0.08 });
      bassAt += beats * BEAT;
    }
  },
};

export function isSoundOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setSoundOn(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked: the toggle still works until the page reloads.
  }
  document.documentElement.toggleAttribute('data-sound', on);
}

export function play(name, { force = false } = {}) {
  const on = force || isSoundOn() || document.documentElement.hasAttribute('data-sound');
  if (!on || !SOUNDS[name]) return;
  const ac = audio();
  if (!ac) return;
  SOUNDS[name](ac, ac.currentTime + 0.01);
}

export function initSoundToggle() {
  const button = document.querySelector('.sound-toggle');
  if (!button) return;
  const sync = () => {
    const on = document.documentElement.hasAttribute('data-sound');
    button.setAttribute('aria-pressed', String(on));
  };
  document.documentElement.toggleAttribute('data-sound', isSoundOn());
  sync();
  button.addEventListener('click', () => {
    const on = !document.documentElement.hasAttribute('data-sound');
    setSoundOn(on);
    sync();
    if (on) play('pling');
  });
}
