function cuteBtn_clicked() {
  // メンバー候補
  const members = ["島村卯月", "小日向美穂", "五十嵐響子"];
  
  // ポップアップ用のHTML生成
  let popupHtml = `<div id="popup" style="
    position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);
    background:#fff;border:1px solid #ccc;padding:20px;z-index:1000;">
    <h3>メンバーを選択</h3>`;
  members.forEach(name => {
    popupHtml += `<div style="cursor:pointer;margin:5px 0;" onclick="addMember('${name}')">${name}</div>`;
  });
  popupHtml += `<button onclick="closePopup()">閉じる</button></div>`;

  // bodyに追加
  document.body.insertAdjacentHTML('beforeend', popupHtml);
}

// メンバー追加処理
function addMember(name) {
  const output = document.getElementById("output");
  output.innerHTML += `<div>${name}</div>`;
  closePopup();
}

// ポップアップ閉じる
function closePopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.remove();
}

function passionBtn_clicked(){
  const input = document.getElementById("input");
  const output = document.getElementById("output");

  output.innerHTML = `<b>${input.value}</b>`;
}