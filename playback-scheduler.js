// A session clock shared by audio sequences and their displays. Pausing keeps
// remaining delays intact; clearing invalidates callbacks from an old session.
class PlaybackScheduler {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
    this.pausedAt = null;
    this.pausedDuration = 0;
  }

  now() {
    return (this.pausedAt ?? performance.now()) - this.pausedDuration;
  }

  schedule(callback, delay, repeat = false, frame = false) {
    const id = this.nextId++;
    const task = { callback, delay: Math.max(0, delay), repeat, frame,
      due: this.now() + Math.max(0, delay), handle: null };
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
    task.handle = task.frame ? window.requestAnimationFrame(run)
      : window.setTimeout(run, Math.max(0, task.due - this.now()));
  }

  setTimeout(callback, delay = 0) { return this.schedule(callback, delay); }
  setInterval(callback, delay) { return this.schedule(callback, delay, true); }
  requestAnimationFrame(callback) { return this.schedule(callback, 0, false, true); }
  clearTimeout(id) {
    const task = this.tasks.get(id);
    if (!task) return;
    if (task.frame) window.cancelAnimationFrame(task.handle);
    else window.clearTimeout(task.handle);
    this.tasks.delete(id);
  }
  clearInterval(id) { this.clearTimeout(id); }
  cancelAnimationFrame(id) { this.clearTimeout(id); }

  pause() {
    if (this.pausedAt !== null) return;
    this.pausedAt = performance.now();
    for (const task of this.tasks.values()) {
      if (task.frame) window.cancelAnimationFrame(task.handle);
      else window.clearTimeout(task.handle);
    }
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
