let videos = [];
let currentIndex = 0;

const video = document.getElementById('videoPlayer');
const centerPlay = document.getElementById('centerPlay');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progressContainer');
const authorName = document.getElementById('authorName');
const videoTitle = document.getElementById('videoTitle');
const videoTags = document.getElementById('videoTags');
const musicName = document.getElementById('musicName');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = musicToggle.querySelector('span.material-icons');
const container = document.getElementById('shortsContainer');
const videoContainer = document.getElementById('videoItem');

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());

// 加载视频数据
fetch('videos.json')
  .then(res => res.json())
  .then(data => {
    videos = data;
    const urlParams = new URLSearchParams(window.location.search);
    const videoParam = parseInt(urlParams.get('video'));
    if(videoParam && videoParam >=1 && videoParam <= videos.length){
      loadVideo(videoParam - 1);
    } else {
      loadVideo(0);
    }
  });

function updateURLParam(index){
  const url = new URL(window.location);
  url.searchParams.set('video', index+1);
  window.history.replaceState({}, '', url);
}

function loadVideo(index){
  if(videos.length===0) return;
  if(index<0) index=videos.length-1;
  if(index>=videos.length) index=0;
  currentIndex=index;
  const v = videos[index];
  video.src=v.src;
  authorName.textContent=v.author;
  videoTitle.textContent=v.title;
  videoTags.textContent=v.tags;
  musicName.textContent=v.music;
  progress.style.width='0%';
  video.currentTime=0;
  video.pause();
  video.muted = false;
  centerPlay.classList.remove('hidden');
  centerPlay.classList.add('visible');
  videoContainer.style.transition = '';
  videoContainer.style.transform = 'translate(-50%,0)';
  updateURLParam(index);
}

// 播放/暂停
function togglePlay(){
  if(video.paused){ video.play(); centerPlay.classList.remove('visible'); centerPlay.classList.add('hidden'); }
  else{ video.pause(); centerPlay.classList.remove('hidden'); centerPlay.classList.add('visible'); }
}
video.addEventListener('play',()=>{centerPlay.classList.remove('visible'); centerPlay.classList.add('hidden');});
video.addEventListener('pause',()=>{centerPlay.classList.remove('hidden'); centerPlay.classList.add('visible');});

// ---------- 鼠标点击播放/暂停 ----------
videoContainer.addEventListener('click', e=>{
  if(e.target.closest('#musicToggle') || 
     e.target.closest('#share-btn') || 
     e.target.closest('#progressContainer')) return;
  togglePlay();
});

// ---------- 进度条拖动 ----------
let isDragging=false;
function seekVideo(e){
  const rect=progressContainer.getBoundingClientRect();
  let x = e.clientX || e.touches[0].clientX;
  let pct = (x-rect.left)/rect.width;
  pct = Math.max(0, Math.min(1,pct));
  progress.style.width=pct*100+'%';
  video.currentTime=pct*video.duration;
}
progressContainer.addEventListener('mousedown',(e)=>{ isDragging=true; seekVideo(e); });
window.addEventListener('mouseup',()=>{ isDragging=false; });
window.addEventListener('mousemove',(e)=>{ if(isDragging) seekVideo(e); });
progressContainer.addEventListener('touchstart',(e)=>{ isDragging=true; seekVideo(e.touches[0]); });
window.addEventListener('touchend',()=>{ isDragging=false; });
window.addEventListener('touchmove',(e)=>{ if(isDragging) seekVideo(e.touches[0]); });

// ---------- 音乐静音 ----------
musicIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  video.muted = !video.muted;
  musicIcon.textContent = video.muted ? 'music_off' : 'music_note';
});

// ---------- 分享 ----------
document.getElementById('share-btn').addEventListener('click', async e=>{
  e.stopPropagation();
  const url = window.location.href;
  if(navigator.share){ await navigator.share({title:'短视频分享',url:url}); }
  else { prompt('复制视频链接：', url); }
});

// ---------- 移动端滑动与播放 ----------
let startY = 0, isTouching = false, currentTranslateY = 0, touchMoved = false;

container.addEventListener('touchstart', e=>{
  if(!e.target.closest('#musicToggle') && !e.target.closest('#share-btn') && !e.target.closest('#progressContainer')){
    isTouching = true;
    startY = e.touches[0].clientY;
    currentTranslateY = 0;
    touchMoved = false;
    e.preventDefault();
  }
},{passive:false});

container.addEventListener('touchmove', e=>{
  if(isTouching){
    const moveY = e.touches[0].clientY - startY;
    currentTranslateY = moveY;
    if(Math.abs(moveY) > 5) touchMoved = true;
    videoContainer.style.transform = `translate(-50%, ${moveY}px)`;
    e.preventDefault();
  }
},{passive:false});

container.addEventListener('touchend', e=>{
  if(!isTouching) return;
  isTouching = false;

  const threshold = 50;
  if(currentTranslateY < -threshold){ switchVideo((currentIndex+1)%videos.length, "up"); }
  else if(currentTranslateY > threshold){ switchVideo((currentIndex-1+videos.length)%videos.length, "down"); }
  else if(!touchMoved){ handlePlayPause(e); }

  videoContainer.style.transition = 'transform 0.25s';
  videoContainer.style.transform = 'translate(-50%,0)';
  videoContainer.addEventListener('transitionend', ()=>{
    videoContainer.style.transition = '';
  }, {once:true});

  currentTranslateY = 0;
});

// ---------- 鼠标滚轮切换 ----------
container.addEventListener('wheel', (e)=>{
  e.preventDefault();
  if(e.deltaY>0){ switchVideo((currentIndex+1)%videos.length, "up"); }
  else if(e.deltaY<0){ switchVideo((currentIndex-1+videos.length)%videos.length, "down"); }
},{passive:false});

// ---------- 切换动画 ----------
function switchVideo(newIndex, direction){
  const oldVideoContainer = videoContainer.cloneNode(true);
  oldVideoContainer.id = "oldVideoItem";
  oldVideoContainer.style.position = 'absolute';
  oldVideoContainer.style.top = '0';
  oldVideoContainer.style.left = '50%';
  oldVideoContainer.style.transform = 'translateX(-50%)';
  container.appendChild(oldVideoContainer);

  if(direction==="up"){ oldVideoContainer.classList.add('slide-out-up'); }
  else { oldVideoContainer.classList.add('slide-out-down'); }

  loadVideo(newIndex);

  if(direction==="up"){ videoContainer.classList.add('slide-in-up'); }
  else { videoContainer.classList.add('slide-in-down'); }

  videoContainer.addEventListener('animationend', () => {
    videoContainer.classList.remove('slide-in-up','slide-in-down');
  }, {once:true});

  oldVideoContainer.addEventListener('animationend', () => {
    oldVideoContainer.remove();
  }, {once:true});
}

// ---------- 触摸播放/暂停辅助 ----------
function handlePlayPause(e){
  togglePlay();
}
