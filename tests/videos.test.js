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
