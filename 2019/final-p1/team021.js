const ctx = document.getElementById('c').getContext('2d');
const O = 250; // 圓心 x = y = 250（canvas 正中央）

// 角度用「一圈的比例」(0~1) 表示；0 在 12 點鐘方向，順時針增加
// 套用提示公式：x = O + len*sin(2π*f)，y = O - len*cos(2π*f)
const pos = (f, len) => [O + len * Math.sin(2 * Math.PI * f), O - len * Math.cos(2 * Math.PI * f)];

// 畫線：從半徑 from 到半徑 to（指針 from=0；刻度則是外框上的一小段）
function line(f, from, to, width, color) {
  ctx.beginPath();
  ctx.moveTo(...pos(f, from));
  ctx.lineTo(...pos(f, to));
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// 實心圓
function dot(r, color) {
  ctx.beginPath();
  ctx.arc(O, O, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  const d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  ctx.clearRect(0, 0, 500, 500);

  // 錶面：黃底、橘框（線寬 20）
  ctx.beginPath();
  ctx.arc(O, O, 240, 0, 2 * Math.PI);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.lineWidth = 20;
  ctx.strokeStyle = 'orange';
  ctx.stroke();

  // 每個小時刻度：棕色短線（跨在橘框上）＋紅色數字，角度每次差 1/12 圈
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'red';
  for (let i = 1; i <= 12; i++) {
    line(i / 12, 230, 250, 4, 'saddlebrown');
    ctx.fillText(i, ...pos(i / 12, 200));
  }

  // 數字時間：補零成 20 : 28 : 08
  ctx.fillStyle = 'black';
  ctx.font = '26px Arial';
  ctx.fillText([h, m, s].map(n => String(n).padStart(2, '0')).join(' : '), O, 130);

  // 由下而上疊：時針 → 分針 → 藍圓 → 紅圓 → 秒針（後畫的蓋在上面）
  // 時針要加上分鐘與秒的進度，不然 3:59 時針會停在 3 的位置
  line(((h % 12) + m / 60 + s / 3600) / 12, 0, 120, 12, 'black');
  line((m + s / 60) / 60, 0, 170, 8, 'purple');
  dot(12, 'blue');
  dot(5, 'red');
  line(s / 60, 0, 200, 5, 'red');
}

draw();
setInterval(draw, 1000); // 每秒重畫一次
