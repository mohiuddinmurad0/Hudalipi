import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/videos.js';
import { channelId, loadChannelVideos, parseChannelPage, uniqueAllowed } from '../lib/youtube.js';
import { videos } from '../dist/video-catalog.js';
function page(items, id = channelId) {
  return '<script>var ytInitialData = ' + JSON.stringify({
    metadata:{channelMetadataRenderer:{externalId:id}},
    contents:{twoColumnBrowseResultsRenderer:{tabs:[{tabRenderer:{selected:true,content:{richGridRenderer:{contents:items}}}}]}}
  }) + ';</script>';
}
function upload(id,title) {
  return {lockupViewModel:{contentType:'LOCKUP_CONTENT_TYPE_VIDEO',contentId:id,
    metadata:{lockupMetadataViewModel:{title:{content:title}}},contentImage:{thumbnailViewModel:{overlays:[]}}}};
}
function short(id,title) {
  return {shortsLockupViewModel:{onTap:{innertubeCommand:{reelWatchEndpoint:{videoId:id}}},overlayMetadata:{primaryText:{content:title}}}};
}
test('New uploads and Shorts appear without editing the catalog; excluded video stays absent',async()=>{
  const result = await loadChannelVideos(async url=>({ok:true,text:async()=>url.includes('/shorts')
    ?page([short('NEWshort123','নতুন Shorts')])
    :page([upload('NEWvideo123','নতুন তিলাওয়াত'),upload('SZ15Bb2leLo','Excluded video')])}));
  assert.equal(result.source,'youtube');
  assert.deepEqual(result.videos.map(v=>v.id),['NEWvideo123','NEWshort123']);
  assert.equal(result.videos[1].format,'short');
});
test('Upstream failure retains allowed saved videos and reports saved state',async()=>{
  const result=await loadChannelVideos(async()=>{throw new Error('YouTube unavailable');});
  assert.equal(result.source,'saved');assert.equal(result.videos.length,4);
  assert(!result.videos.some(v=>v.id==='SZ15Bb2leLo'));
});
test('One failed tab does not hide new uploads from the working tab',async()=>{
  const result=await loadChannelVideos(async url=>{
    if(url.includes('/shorts'))throw new Error('Unavailable');
    return {ok:true,text:async()=>page([upload('NEWvideo123','New video')])};
  });
  assert.equal(result.source,'partial');
  assert(result.videos.some(v=>v.id==='NEWvideo123'));
  assert(result.videos.some(v=>v.format==='short'));
});
test('Reject other channels, malformed responses, duplicates and unsafe IDs',()=>{
  assert.throws(()=>parseChannelPage(page([upload('NEWvideo123','New')],'another-channel'),'video'));
  assert.throws(()=>parseChannelPage('<html>consent page</html>','video'));
  assert.deepEqual(uniqueAllowed([{id:'<script>',title:'Invalid',format:'video'},...videos,...videos]).map(v=>v.id),videos.map(v=>v.id));
});
test('API rejects mutation methods',async()=>{
  const headers={};let status;
  const response={setHeader:(k,v)=>headers[k]=v,status(code){status=code;return this;},json(data){return data;}};
  await handler({method:'POST'},response);assert.equal(status,405);assert.equal(headers.Allow,'GET, HEAD');
});

test('Hero picks a newer Short over a landscape video using publication timestamps', async()=>{
 const result=await loadChannelVideos(async url=>{
  if(url.includes('/watch?')){
   const id=new URL(url).searchParams.get('v');
   const date=id==='NEWshort123'?'2026-11-14T10:00:00Z':'2026-11-13T20:00:00Z';
   return {ok:true,text:async()=>'<script>var ytInitialPlayerResponse = '+JSON.stringify({videoDetails:{videoId:id,channelId},microformat:{playerMicroformatRenderer:{publishDate:date}}})+';</script>'};
  }
  return {ok:true,text:async()=>url.includes('/shorts')?page([short('NEWshort123','New Short')]):page([upload('NEWvideo123','New video'),upload('SZ15Bb2leLo','Excluded')])};
 });
 assert.equal(result.featuredVideoId,'NEWshort123');
 assert.equal(result.videos.find(v=>v.id==='NEWshort123').publishedAt,'2026-11-14T10:00:00.000Z');
 assert(!result.videos.some(v=>v.id==='SZ15Bb2leLo'));
});

test('Hero chooses a newer landscape upload and does not guess when dates are unavailable',async()=>{
 const {featureLatest}=await import('../lib/youtube.js');
 const candidates=[{id:'NEWvideo123',title:'Video',format:'video'},{id:'NEWshort123',title:'Short',format:'short'}];
 const dated=await featureLatest(candidates,async url=>{
  const id=new URL(url).searchParams.get('v');
  return {ok:true,text:async()=>'<script>var ytInitialPlayerResponse = '+JSON.stringify({videoDetails:{videoId:id,channelId},microformat:{playerMicroformatRenderer:{publishDate:id==='NEWvideo123'?'2026-11-15T00:00:00Z':'2026-11-14T00:00:00Z'}}})+';</script>'};
 });
 assert.equal(dated.featuredVideoId,'NEWvideo123');
 const unknown=await featureLatest(candidates,async()=>{throw new Error('Unavailable');});
 assert.equal(unknown.featuredVideoId,null);
});

test('Mixed uploads are dated and sorted newest-first, including items beyond each format’s first entry',async()=>{
 const {featureLatest}=await import('../lib/youtube.js');
 const items=[
  {id:'NEWvideo123',title:'Latest landscape',format:'video'},
  {id:'OLDvideo123',title:'Older landscape',format:'video'},
  {id:'NEWshort123',title:'Latest Short',format:'short'},
  {id:'OLDshort123',title:'Older Short',format:'short'}
 ];
 const dates={NEWvideo123:'2026-11-13T20:00:00Z',OLDvideo123:'2026-11-11T20:00:00Z',NEWshort123:'2026-11-14T20:00:00Z',OLDshort123:'2026-11-12T20:00:00Z'};
 const result=await featureLatest(items,async url=>{
  const id=new URL(url).searchParams.get('v');
  return {ok:true,text:async()=>'<script>var ytInitialPlayerResponse = '+JSON.stringify({videoDetails:{videoId:id,channelId},microformat:{playerMicroformatRenderer:{publishDate:dates[id]}}})+';</script>'};
 });
 assert.deepEqual(result.videos.map(v=>v.id),['NEWshort123','NEWvideo123','OLDshort123','OLDvideo123']);
 assert.equal(result.featuredVideoId,'NEWshort123');
 assert.deepEqual(items.map(v=>v.id),['NEWvideo123','OLDvideo123','NEWshort123','OLDshort123']);
});

test('Newest-first ordering handles time zones, ties, unknown dates and site exclusions',async()=>{
 const {newestFirst}=await import('../dist/video-policy.js');
 const input=[
  {id:'NEWvideo123',title:'Older',format:'video',publishedAt:'2026-11-14T10:00:00+06:00'},
  {id:'NEWshort123',title:'Newer',format:'short',publishedAt:'2026-11-14T05:00:00Z'},
  {id:'OLDshort123',title:'Same time',format:'short',publishedAt:'2026-11-14T05:00:00Z'},
  {id:'OLDvideo123',title:'Unknown',format:'video'},
  {id:'SZ15Bb2leLo',title:'Excluded',format:'video',publishedAt:'2027-01-01T00:00:00Z'}
 ];
 assert.deepEqual(newestFirst(input).map(v=>v.id),['NEWshort123','OLDshort123','NEWvideo123','OLDvideo123']);
});
