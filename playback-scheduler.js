// A session clock shared by audio sequences and their displays. Pausing keeps
// remaining delays intact; clearing invalidates callbacks from an old session.
// Frame tasks use requestAnimationFrame while the page is visible and a timer
// while it is hidden, so sequences keep moving with the screen off or the tab
// in the background, where browsers stop animation frames but not audio.
const HIDDEN_FRAME_MS = 250;

class PlaybackScheduler {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
    this.pausedAt = null;
    this.pausedDuration = 0;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => { if (this.hidden()) this.rearmFrames(); });
    }
  }

  hidden() {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
  }

  now() {
    return (this.pausedAt ?? performance.now()) - this.pausedDuration;
  }

  schedule(callback, delay, repeat = false, frame = false) {
    const id = this.nextId++;
    const task = { callback, delay: Math.max(0, delay), repeat, frame,
      due: this.now() + Math.max(0, delay), handle: null, viaTimer: false };
    this.tasks.set(id, task);
    this.arm(id, task);
    return id;
  }

  arm(id, task) {
    if (this.pausedAt !== null) return;
    const run = () => {
      if (!this.tasks.has(id) || this.pausedAt !== null) return;
      if (!task.repeat) this.tasks.delete(id);
      else task.due = this.now() + task.delay;
      task.callback(this.now());
      if (task.repeat && this.tasks.has(id)) this.arm(id, task);
    };
    if (task.frame && !this.hidden()) {
      task.viaTimer = false;
      task.handle = window.requestAnimationFrame(run);
    } else {
      task.viaTimer = true;
      task.handle = window.setTimeout(run, task.frame ? HIDDEN_FRAME_MS : Math.max(0, task.due - this.now()));
    }
  }

  cancel(task) {
    if (task.frame && !task.viaTimer) window.cancelAnimationFrame(task.handle);
    else window.clearTimeout(task.handle);
  }

  // Animation frames pending when the page is hidden would never fire: move them to timers.
  rearmFrames() {
    if (this.pausedAt !== null) return;
    for (const [id, task] of this.tasks) {
      if (!task.frame || task.viaTimer) continue;
      this.cancel(task);
      this.arm(id, task);
    }
  }

  setTimeout(callback, delay = 0) { return this.schedule(callback, delay); }
  setInterval(callback, delay) { return this.schedule(callback, delay, true); }
  requestAnimationFrame(callback) { return this.schedule(callback, 0, false, true); }
  clearTimeout(id) {
    const task = this.tasks.get(id);
    if (!task) return;
    this.cancel(task);
    this.tasks.delete(id);
  }
  clearInterval(id) { this.clearTimeout(id); }
  cancelAnimationFrame(id) { this.clearTimeout(id); }

  pause() {
    if (this.pausedAt !== null) return;
    this.pausedAt = performance.now();
    for (const task of this.tasks.values()) this.cancel(task);
  }

  resume() {
    if (this.pausedAt === null) return;
    this.pausedDuration += performance.now() - this.pausedAt;
    this.pausedAt = null;
    for (const [id, task] of this.tasks) this.arm(id, task);
  }

  clear() {
    for (const id of this.tasks.keys()) this.clearTimeout(id);
    this.resume();
  }
}
