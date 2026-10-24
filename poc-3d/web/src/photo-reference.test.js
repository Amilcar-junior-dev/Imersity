import test from 'node:test';import assert from 'node:assert/strict';
import {photoReferenceSpec} from './photo-reference.js';
const fixture=()=>({referenceDataURL:'data:image/jpeg;base64,/9j/AA==',referenceCrop:[650,1000,1250,1220],photoSize:[2160,3840]});
test('reference photos accept only bounded embedded JPEG data, without fetching a URL',()=>{
 const t=fixture();assert.deepEqual(photoReferenceSpec(t),{src:t.referenceDataURL,crop:t.referenceCrop,size:t.photoSize});
 for(const src of ['https://example.com/private.jpg','data:image/svg+xml;base64,PHN2Zz4=','file:///private/photo.jpg'])assert.equal(photoReferenceSpec({...t,referenceDataURL:src}),null);
});
test('reference crop must be finite and contained in the original image',()=>{
 for(const crop of [[-1,0,100,100],[0,0,0,100],[2000,0,1000,100],[0,0,Infinity,100]])assert.equal(photoReferenceSpec({...fixture(),referenceCrop:crop}),null);
 assert.equal(photoReferenceSpec(null),null);
});
