import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCanImportVideo,assertSingleCaptureSource} from './core.js';

test('a second video is rejected before extraction, preserving the current frames',()=>{
  const captures=[{sourceVideo:'first.mov',name:'video_0000.jpg'}];
  assert.throws(()=>assertCanImportVideo(captures),/Novo experimento/);
  assert.equal(captures.length,1);
  assert.doesNotThrow(()=>assertCanImportVideo([]));
});
test('legacy mixed captures cannot be submitted even when both videos reuse frame names',()=>{
  assert.throws(()=>assertSingleCaptureSource([
    {sourceVideo:'first.mov',name:'video_0000.jpg'},
    {sourceVideo:'second.mov',name:'video_0000.jpg'},
  ]),/origens diferentes/);
});
test('one video and manual-photo-only captures remain valid; unlabelled additions to a video are blocked',()=>{
  assert.doesNotThrow(()=>assertSingleCaptureSource([{sourceVideo:'one.mov'},{sourceVideo:'one.mov'}]));
  assert.doesNotThrow(()=>assertSingleCaptureSource([{name:'front.jpg'},{name:'side.jpg'}]));
  assert.throws(()=>assertSingleCaptureSource([{sourceVideo:'one.mov'},{name:'other.jpg'}]),/origens diferentes/);
});
