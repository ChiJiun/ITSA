const imgs = document.querySelectorAll('#gallery img');
const btns = document.querySelectorAll('#btns button');

btns.forEach(b => b.onclick = () => {
  btns.forEach(x => x.classList.toggle('on', x === b)); // 只有被點的按鈕高亮
  // hidden = true 會讓圖片從 flex 排版中消失，剩下的圖自動重新排列
  imgs.forEach(img => img.hidden = b.dataset.type !== 'all' && img.dataset.type !== b.dataset.type);
});
