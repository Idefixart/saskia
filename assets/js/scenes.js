// World scenes animate only while they are on screen (saves battery on the phone).
const VISIBLE_THRESHOLD = 0.15;

export function initScenes() {
  const scenes = document.querySelectorAll('.scene');
  if (!scenes.length) return;
  if (!('IntersectionObserver' in window)) {
    scenes.forEach((scene) => scene.classList.add('is-live'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting)),
    { threshold: VISIBLE_THRESHOLD },
  );
  scenes.forEach((scene) => observer.observe(scene));
}

// Plays a one-off reaction on a scene (e.g. the ambulance alarm) by toggling a class.
export function sceneReact(selector, className, durationMs) {
  const scene = document.querySelector(selector);
  if (!scene) return;
  scene.classList.remove(className);
  void scene.getBoundingClientRect();
  scene.classList.add(className);
  clearTimeout(scene._reactTimer);
  scene._reactTimer = setTimeout(() => scene.classList.remove(className), durationMs);
}
