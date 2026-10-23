const $ = id => document.getElementById(id);
const v = $('v');
let w = 480; // 影片目前寬度

// (1)(2) 本機檔案不用上傳，產生暫時網址直接給 video 播放
$('file').onchange = e => v.src = URL.createObjectURL(e.target.files[0]);

// (3) 播放／暫停：呼叫 video 內建方法，並更新狀態文字
// 狀態文字跟著 video 自己的事件更新，播完也會觸發 pause；沒選影片時不呼叫 play()（否則會先觸發 play 事件）
$('play').onclick = () => v.src && v.play();
$('pause').onclick = () => v.pause();
v.onplay = () => $('state').textContent = '播放';
v.onpause = () => $('state').textContent = '暫停';

// (4) 放大／縮小：改寬度；0 代表回到正常
function size(k) {
  w = k ? Math.round(w * k) : 480;
  v.width = w;
}

// (5) 音量：volume 範圍 0~1
$('vol').oninput = () => {
  v.volume = $('vol').value;
  $('volText').textContent = Math.round(v.volume * 100);
};

// (6) timeupdate 在播放位置改變時觸發；秒數轉成 mm:ss
const mmss = t => {
  t = Math.floor(t || 0); // 未載入影片時 duration 是 NaN
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};
const showTime = () => $('time').textContent = mmss(v.currentTime) + ' / ' + mmss(v.duration);
v.ontimeupdate = showTime;
v.onloadedmetadata = showTime; // 載入後立刻顯示總長度
