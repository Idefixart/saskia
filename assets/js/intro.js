// First-open wow: the gift dialog. Opening it plays the birthday tune, bursts confetti
// and lets the hero build itself (.hero.build in intro.css). Shown once per browser;
// "?intro" in the URL or the footer button replays it.
import { play } from './sound.js';
import { burstConfetti } from './life.js';

const STORAGE_KEY = 'opened';
const LID_OFF_MS = 450;
const BUILD_AT_MS = 1100;
const GONE_AT_MS = 1700;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function alreadyOpened() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage blocked: she'll simply get the gift again next time.
  }
}

function setBackgroundInert(inert) {
  document.querySelectorAll('body > header, body > main, body > footer').forEach((el) => {
    el.inert = inert;
  });
}

function startBuild() {
  const hero = document.querySelector('.hero');
  const topbar = document.querySelector('.topbar');
  hero.classList.remove('build');
  topbar.classList.remove('build-topbar');
  void hero.offsetWidth;
  hero.classList.add('build');
  topbar.classList.add('build-topbar');
  document.documentElement.classList.remove('intro-open');
}

function close(gift) {
  gift.hidden = true;
  gift.classList.remove('is-opening', 'is-leaving');
  setBackgroundInert(false);
  document.documentElement.classList.remove('intro-open');
  document.querySelector('.hero')?.focus({ preventScroll: true });
}

function open(gift) {
  if (gift.classList.contains('is-opening')) return;
  remember();
  if (reduceMotion()) {
    close(gift);
    return;
  }
  play('birthday', { force: true });
  gift.classList.add('is-opening');
  const box = gift.querySelector('.gift-art');
  setTimeout(() => {
    burstConfetti(box, { count: 90, spread: 1.4 });
    burstConfetti(box, { count: 60, spread: 0.8 });
  }, LID_OFF_MS);
  setTimeout(() => {
    gift.classList.add('is-leaving');
    startBuild();
  }, BUILD_AT_MS);
  setTimeout(() => close(gift), GONE_AT_MS);
}

function skip(gift) {
  remember();
  close(gift);
}

function show(gift) {
  window.scrollTo(0, 0);
  document.documentElement.classList.add('intro-open');
  gift.hidden = false;
  setBackgroundInert(true);
  // Focus the dialog itself (no ring); Tab then reaches the gift button.
  gift.focus({ preventScroll: true });
}

export function initIntro() {
  const gift = document.getElementById('gift');
  if (!gift) return;
  gift.querySelector('.gift-open').addEventListener('click', () => open(gift));
  gift.querySelector('.gift-skip').addEventListener('click', () => skip(gift));
  gift.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') skip(gift);
  });
  document.querySelector('.replay')?.addEventListener('click', () => show(gift));

  const forced = new URLSearchParams(window.location.search).has('intro');
  if (forced || !alreadyOpened()) show(gift);
}
