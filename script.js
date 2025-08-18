function cuteBtn_clicked() {
  const members_cute = ["島村卯月", "安部菜々", "五十嵐響子","一ノ瀬志希","緒方智絵里","乙倉悠貴","黒埼ちとせ","輿水幸子",
    "小早川紗枝","小日向美穂","佐久間まゆ","櫻井桃華","椎名法子","白菊ほたる","白雪千夜","関裕美","辻野あかり","道明寺歌鈴",
    "中野有香","早坂美玲","藤本里奈","双葉杏","前川みく","水本ゆかり","三村かな子","宮本フレデリカ","遊佐こずえ"];
  const popup = document.getElementById("popup_cute");
  const popupMembers = document.getElementById("popup-members_cute");
  popupMembers.innerHTML = "";
  members_cute.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.style.cursor = "pointer";
    div.style.margin = "5px 0";
    div.onclick = () => addMember(name);
    popupMembers.appendChild(div);
  });
  popup.style.display = "block";
}

function addMember(name) {
  const output = document.getElementById("output");
  output.innerHTML += `<div>${name}</div>`;
}

function closePopup() {
  document.getElementById("popup_cute").style.display = "none";
}
function passionBtn_clicked(){
  const input = document.getElementById("input");
  const output = document.getElementById("output");

  output.innerHTML = `<b>${input.value}</b>`;
}