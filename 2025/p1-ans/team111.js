const pegs = document.querySelectorAll('.peg');
const $ = id => document.getElementById(id);
let n, moves, dragging;

// 下拉選單放 3~9
for (let i = 3; i <= 9; i++) $('n').add(new Option(i, i));

function start() {
  n = Number($('n').value);
  moves = 0;
  $('moves').textContent = 0;
  $('min').textContent = 2 ** n - 1; // 最少步數公式 2^n - 1
  pegs.forEach(p => p.innerHTML = '');
  for (let size = n; size >= 1; size--) { // 大的先放（在下面）
    const d = document.createElement('div');
    d.className = 'disk';
    d.dataset.size = size;
    d.draggable = true;
    d.style.width = size * 25 + 20 + 'px';
    d.style.background = `hsl(${size * 40}, 70%, 55%)`;
    pegs[0].appendChild(d);
  }
}

// 拖曳開始：只有柱子最上面那塊可以拿
document.addEventListener('dragstart', e => {
  dragging = e.target;
  if (dragging !== dragging.parentElement.lastElementChild) e.preventDefault();
});

pegs.forEach(peg => {
  peg.addEventListener('dragover', e => e.preventDefault()); // 不擋預設就無法 drop
  peg.addEventListener('drop', () => {
    const top = peg.lastElementChild;
    if (top === dragging || !dragging) return; // 放回原柱不算一步
    if (top && Number(top.dataset.size) < Number(dragging.dataset.size)) return alert('不能把大圓盤放在小圓盤上！');
    peg.appendChild(dragging);
    $('moves').textContent = ++moves;
    if (pegs[2].children.length === n)
      setTimeout(() => alert(`完成！共 ${moves} 步（最少 ${2 ** n - 1} 步）`), 50);
  });
});

start();
