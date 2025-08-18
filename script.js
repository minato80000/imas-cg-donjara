const members_cute = ["島村卯月", "安部菜々", "五十嵐響子", "一ノ瀬志希", "緒方智絵里", "乙倉悠貴", "黒埼ちとせ", "輿水幸子",
  "小早川紗枝", "小日向美穂", "佐久間まゆ", "櫻井桃華", "椎名法子", "白菊ほたる", "白雪千夜", "関裕美", "辻野あかり", "道明寺歌鈴",
  "中野有香", "早坂美玲", "藤本里奈", "双葉杏", "前川みく", "水本ゆかり", "三村かな子", "宮本フレデリカ", "遊佐こずえ"];

const members_cool = ["渋谷凛", "アナスタシア", "神谷奈緒", "川島瑞樹", "神崎蘭子", "桐生つかさ", "鷺沢文香", "佐城雪美",
  "塩見周子", "白坂小梅", "砂塚あきら", "高垣楓", "鷹富士茄子", "多田李衣菜", "橘ありす", "新田美波", "二宮飛鳥", "速水奏",
  "久川颯", "藤原肇", "北条加蓮", "松永涼", "三船美優", "森久保乃々", "大和亜季", "結城晴", "脇山珠美"];

const members_passion = ["本田未央", "相葉夕美", "赤城みりあ", "及川雫", "大槻唯", "片桐早苗", "喜多日菜子", "木村夏樹",
  "佐藤心", "城ケ崎美嘉", "城ケ崎莉嘉", "高森藍子", "十時愛梨", "ナターリア", "難波笑美", "浜口あやめ", "久川凪", "日野茜",
  "姫川友紀", "星輝子", "堀裕子", "的場梨沙", "向井拓海", "村上巴", "諸星きらり", "夢見りあむ", "依田芳乃"];

myHand = [];

function cuteBtn_clicked() {
  const popup = document.getElementById("popup");
  const popupMembers = document.getElementById("popup-members");
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

function coolBtn_clicked() {
  const popupMembers = document.getElementById("popup-members");
  popupMembers.innerHTML = "";
  members_cool.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.style.cursor = "pointer";
    div.style.margin = "5px 0";
    div.onclick = () => addMember(name);
    popupMembers.appendChild(div);
  });
  popup.style.display = "block";
}

function passionBtn_clicked() {
  const popup = document.getElementById("popup");
  const popupMembers = document.getElementById("popup-members");
  popupMembers.innerHTML = "";
  members_passion.forEach(name => {
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
  const div = document.createElement("div");
  div.textContent = name;
  div.onclick = function () {
    div.remove();
    // 手札からも削除
    myHand = myHand.filter(n => n !== name);
  };
  output.appendChild(div);

  // 手札配列に追加（重複防止）
  if (!myHand.includes(name)) {
    myHand.push(name);
  }
  renderHand();
}

function renderHand() {
  const output = document.getElementById("output");
  output.innerHTML = "";
  myHand.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.onclick = function() {
      div.remove();
      myHand = myHand.filter(n => n !== name);
      renderHand();
    };
    output.appendChild(div);
  });
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}