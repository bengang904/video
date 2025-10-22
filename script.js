let videos = []
let currentIndex = 0
const video = document.getElementById('videoPlayer')
const centerPlay = document.getElementById('centerPlay')
const progress = document.getElementById('progress')
const progressContainer = document.getElementById('progressContainer')
const authorName = document.getElementById('authorName')
const videoTitle = document.getElementById('videoTitle')
const videoTags = document.getElementById('videoTags')
const musicName = document.getElementById('musicName')
const musicToggle = document.getElementById('musicToggle')
const musicIcon = musicToggle.querySelector('span.material-icons')
const videoContainer = document.getElementById('videoItem')
const searchInput = document.getElementById('searchInput')
const searchBtn = document.getElementById('searchBtn')
const noResult = document.getElementById('noResult')

document.addEventListener('contextmenu', e => e.preventDefault())
document.addEventListener('copy', e => e.preventDefault())

fetch('videos.json').then(res => res.json()).then(data => {
  videos = data
  const params = new URLSearchParams(window.location.search)
  let videoParam = params.get('video')

  if (!videoParam) {
    videoParam = 'video.mp4'
    const url = new URL(window.location)
    url.searchParams.set('video', videoParam)
    window.history.replaceState({}, '', url)
  }

  const matchIndex = videos.findIndex(v => v.src === videoParam)
  if (matchIndex !== -1) loadVideo(matchIndex)
  else {
    noResult.style.display = 'block'
    setTimeout(() => { noResult.style.display = 'none' }, 2000)
  }
})

function loadVideo(index) {
  if (videos.length === 0) return
  if (index < 0) index = videos.length - 1
  if (index >= videos.length) index = 0
  currentIndex = index
  const v = videos[index]
  video.src = v.src
  authorName.textContent = v.author
  videoTitle.textContent = v.title
  videoTags.textContent = v.tags
  musicName.textContent = v.music
  progress.style.width = '0%'
  video.currentTime = 0
  video.pause()
  video.muted = false
  centerPlay.classList.remove('hidden')
  centerPlay.classList.add('visible')
  noResult.style.display = 'none'
  const url = new URL(window.location)
  url.searchParams.set('video', v.src)
  window.history.replaceState({}, '', url)
}

function togglePlay() {
  if (video.paused) { video.play(); centerPlay.classList.add('hidden'); centerPlay.classList.remove('visible') }
  else { video.pause(); centerPlay.classList.add('visible'); centerPlay.classList.remove('hidden') }
}

videoContainer.addEventListener('click', e => {
  if (e.target.closest('#musicToggle') || e.target.closest('#share-btn') || e.target.closest('#progressContainer')) return
  togglePlay()
})

let isDragging = false
function seekVideo(clientX) {
  const rect = progressContainer.getBoundingClientRect()
  let pct = (clientX - rect.left) / rect.width
  pct = Math.max(0, Math.min(1, pct))
  progress.style.width = pct * 100 + '%'
  video.currentTime = pct * video.duration
}

progressContainer.addEventListener('mousedown', e => { isDragging = true; seekVideo(e.clientX) })
window.addEventListener('mouseup', () => { isDragging = false })
window.addEventListener('mousemove', e => { if (isDragging) seekVideo(e.clientX) })

progressContainer.addEventListener('touchstart', e => { isDragging = true; seekVideo(e.touches[0].clientX); e.preventDefault() }, { passive: false })
progressContainer.addEventListener('touchmove', e => { if (isDragging) { seekVideo(e.touches[0].clientX); e.preventDefault() } }, { passive: false })
window.addEventListener('touchend', () => { isDragging = false })

video.addEventListener('timeupdate', () => {
  if (!isDragging) {
    const pct = (video.currentTime / video.duration) * 100
    progress.style.width = pct + '%'
  }
})

musicIcon.addEventListener('click', e => {
  e.stopPropagation()
  video.muted = !video.muted
  musicIcon.textContent = video.muted ? 'music_off' : 'music_note'
})

document.getElementById('share-btn').addEventListener('click', async e => {
  e.stopPropagation()
  const url = window.location.href
  if (navigator.share) { await navigator.share({ title: '短视频分享', url: url }) }
  else { prompt('复制视频链接：', url) }
})

function showNoResult() {
  noResult.style.display = 'block'
  setTimeout(() => { noResult.style.display = 'none' }, 2000)
}

function searchVideo() {
  const keyword = searchInput.value.trim().toLowerCase()
  if (!keyword) { noResult.style.display = 'none'; return }
  const matchIndex = videos.findIndex(v => v.title.toLowerCase().includes(keyword))
  if (matchIndex !== -1) { loadVideo(matchIndex) }
  else { showNoResult() }
}

searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') searchVideo() })
searchBtn.addEventListener('click', () => searchVideo())
