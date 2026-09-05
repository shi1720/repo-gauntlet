import assert from 'node:assert/strict';
import test from 'node:test';
import { EventBatcher } from '../event_batcher.ts';

test('drains events accepted during an active flush', async () => {
  const batches=[];let release;const gate=new Promise(resolve=>{release=resolve;});
  const batcher=new EventBatcher(async batch=>{batches.push([...batch]);if(batches.length===1)await gate;});
  batcher.add('first');const flushing=batcher.flush();await Promise.resolve();batcher.add('reentrant');release();await flushing;
  assert.deepEqual(batches,[['first'],['reentrant']]);assert.equal(batcher.pending,0);
});

test('restores a failed batch before newer events', async () => {
  let fail=true;const delivered=[];const batcher=new EventBatcher(async batch=>{if(fail){fail=false;throw new Error('temporary');}delivered.push(...batch);});
  batcher.add(1);batcher.add(2);await assert.rejects(batcher.flush());batcher.add(3);assert.equal(batcher.pending,3);await batcher.flush();assert.deepEqual(delivered,[1,2,3]);
});

