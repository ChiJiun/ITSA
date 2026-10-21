// 把陣列轉成 <tr>；空陣列顯示提示
function rows(list, keys, cols, empty) {
  if (!list.length) return `<tr><td colspan="${cols}" class="text-muted">${empty}</td></tr>`;
  return list.map(t => '<tr>' + keys.map(k => `<td>${t[k] ?? ''}</td>`).join('') + '</tr>').join('');
}
