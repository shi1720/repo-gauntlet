import assert from 'node:assert/strict';
import test from 'node:test';
import { EventBatcher } from '../event_batcher.ts';

test('delivers a normal batch in order', async () => {
  const delivered=[]; const batcher=new EventBatcher(async batch=>{delivered.push(...batch);});
  batcher.add('a');batcher.add('b');await batcher.flush();assert.deepEqual(delivered,['a','b']);assert.equal(batcher.pending,0);
});

test('shares concurrent flush completion', async () => {
  let release; const gate=new Promise(resolve=>{release=resolve;}); let calls=0;
  const batcher=new EventBatcher(async()=>{calls++;await gate;});batcher.add(1);
  const first=batcher.flush();const second=batcher.flush();release();await Promise.all([first,second]);assert.equal(calls,1);
});

test('empty flush is harmless', async () => {
  let calls=0;const batcher=new EventBatcher(async()=>{calls++;});await batcher.flush();assert.equal(calls,0);assert.equal(batcher.pending,0);
});
