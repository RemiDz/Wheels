const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

test('pause freezes timeouts, intervals and animation time until resumed', async t => {
  const env = createApp(); t.after(() => env.close());
  const scheduler = new env.window.PlaybackScheduler();
  const events = [];
  scheduler.setTimeout(() => events.push('timeout'), 1000);
  scheduler.setInterval(() => events.push('interval'), 500);
  await env.tick(300); scheduler.pause();
  const pausedTime = scheduler.now();
  scheduler.requestAnimationFrame(time => events.push(time));
  await env.tick(5000);
  assert.equal(scheduler.now(), pausedTime); assert.equal(events.length, 0);
  scheduler.resume(); await env.tick(100);
  assert.equal(events[0], 400);
  await env.tick(100); assert.deepEqual(events, [400, 'interval']);
  await env.tick(500); assert.ok(events.includes('timeout'));
});

test('clear invalidates old tasks, including a repeating callback clearing itself', async t => {
  const env = createApp(); t.after(() => env.close());
  const scheduler = new env.window.PlaybackScheduler(); let count = 0;
  scheduler.setInterval(() => { count++; scheduler.clear(); }, 100);
  scheduler.setTimeout(() => count++, 200);
  await env.tick(1000); assert.equal(count, 1); assert.equal(scheduler.tasks.size, 0);
  scheduler.pause(); scheduler.setTimeout(() => count++, 100); scheduler.clear();
  await env.tick(1000); assert.equal(count, 1);
});
