import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeDestination} from '../dist/youtube-links.js';
const video={id:'2vePBCwxYo8',format:'video'};
const short={id:'EzDW_gOlnCc',format:'short'};
const android={userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36'};
test('Android Chrome opens YouTube app with the exact video and encoded web fallback',()=>{
 const result=youtubeDestination(video,android);
 assert(result.href.startsWith('intent://www.youtube.com/watch?v=2vePBCwxYo8#Intent;'));
 assert(result.href.includes('package=com.google.android.youtube;'));
 assert.equal(decodeURIComponent(result.href.split('S.browser_fallback_url=')[1].split(';')[0]),result.webUrl);
 assert.equal(result.target,'_self');
});
test('Android Shorts keep their actual shorts URL in the app and web fallback',()=>{
 const result=youtubeDestination(short,android);
 assert(result.href.startsWith('intent://www.youtube.com/shorts/EzDW_gOlnCc#Intent;'));
 assert.equal(result.webUrl,'https://www.youtube.com/shorts/EzDW_gOlnCc');
});
test('iPhone and desktop-mode iPad use HTTPS Universal Links in the same context',()=>{
 for(const device of [{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'},{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',platform:'MacIntel',maxTouchPoints:5}]){
  assert.equal(youtubeDestination(video,device).href,'https://www.youtube.com/watch?v=2vePBCwxYo8');
  assert.equal(youtubeDestination(video,device).target,'_self');
 }
});
test('Desktop retains native new-tab links; Android webviews and non-Chromium use HTTPS fallback',()=>{
 assert.equal(youtubeDestination(video,{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/131.0.0.0'}).target,'_blank');
 for(const ua of ['Mozilla/5.0 (Linux; Android 14; wv) Chrome/131.0.0.0','Mozilla/5.0 (Android 14) Firefox/131.0','Mozilla/5.0 (Android 14) Chrome/131.0 FBAV/123']){
  const result=youtubeDestination(video,{userAgent:ua});assert.equal(result.href,result.webUrl);assert.equal(result.target,'_self');
 }
});
test('Reject video IDs that could inject intent parameters',()=>{
 assert.throws(()=>youtubeDestination({id:'bad;package=other',format:'video'},android));
});
