const members_cute = ["島村卯月", "安部菜々", "五十嵐響子", "一ノ瀬志希", "緒方智絵里", "乙倉悠貴", "黒埼ちとせ", "輿水幸子",
  "小早川紗枝", "小日向美穂", "佐久間まゆ", "櫻井桃華", "椎名法子", "白菊ほたる", "白雪千夜", "関裕美", "辻野あかり", "道明寺歌鈴",
  "中野有香", "早坂美玲", "藤本里奈", "双葉杏", "前川みく", "水本ゆかり", "三村かな子", "宮本フレデリカ", "遊佐こずえ"];

const members_cool = ["渋谷凛", "アナスタシア", "神谷奈緒", "川島瑞樹", "神崎蘭子", "桐生つかさ", "鷺沢文香", "佐城雪美",
  "塩見周子", "白坂小梅", "砂塚あきら", "高垣楓", "鷹富士茄子", "多田李衣菜", "橘ありす", "新田美波", "二宮飛鳥", "速水奏",
  "久川颯", "藤原肇", "北条加蓮", "松永涼", "三船美優", "森久保乃々", "大和亜季", "結城晴", "脇山珠美"];

const members_passion = ["本田未央", "相葉夕美", "赤城みりあ", "及川雫", "大槻唯", "片桐早苗", "喜多日菜子", "木村夏樹",
  "佐藤心", "城ケ崎美嘉", "城ケ崎莉嘉", "高森藍子", "十時愛梨", "ナターリア", "難波笑美", "浜口あやめ", "久川凪", "日野茜",
  "姫川友紀", "星輝子", "堀裕子", "的場梨沙", "向井拓海", "村上巴", "諸星きらり", "夢見りあむ", "依田芳乃"];

let myHand = [];

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
  // 9つまでしか追加できない
  if (myHand.length >= 9) {
    return;
  }
  // 手札配列に追加（重複防止）
  if (!myHand.includes(name)) {
    myHand.push(name);
  }
  renderHand();
}

function getIdolImage(name) {
  return `idols/${name}.png`
}

function renderHand() {
  const output = document.getElementById("myHand_output");
  output.innerHTML = "";
  myHand.forEach(name => {
    const div = document.createElement("div");
    div.className = "idol-card";
    div.onclick = function () {
      myHand = myHand.filter(n => n !== name);
      renderHand();
    };
    const img = document.createElement("img");
    img.src = getIdolImage(name);
    img.alt = name;
    img.onerror = function () {
      img.src = "idols/noimage.png";
    };
    // const span = document.createElement("span");
    // span.textContent = name;
    div.appendChild(img);
    // div.appendChild(span);
    output.appendChild(div);
  });
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

async function searchUnits() {
  const pairs = [];
  for (let i = 0; i < myHand.length; i++) {
    for (let j = i + 1; j < myHand.length; j++) {
      pairs.push([myHand[i], myHand[j]]);
    }
  }

  let results = [];
  for (const [nameA, nameB] of pairs) {
    const query = buildQuery(nameA, nameB);
    const data = await fetchSparql(query);
    results = results.concat(data);
  }
  renderUnitTable(results);
}

// SPARQL APIからデータ取得
async function fetchSparql(query) {
  const endpoint = "https://sparql.crssnky.xyz/spql/imas/query";
  const url = endpoint + "?query=" + encodeURIComponent(query) + "&output=json";
  const res = await fetch(url);
  const json = await res.json();
  return json.results.bindings.map(b => ({
    unit: b.unitName.value,
    members: b.members.value
  }));
}

// ユニット結果を表で表示
function renderUnitTable(results) {
  const container = document.getElementById("unit_result");
  if (!container) return;
  if (results.length === 0) {
    container.innerHTML = "<div>該当ユニットはありません。</div>";
    return;
  }
  let html = `<table><thead><tr><th>ユニット名</th><th>メンバー</th></tr></thead><tbody>`;
  results.forEach(r => {
    html += `<tr><td>${r.unit}</td><td>${r.members}</td></tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function esc(s) {
  return String(s).replace(/"/g, '\\"');
}

function buildQuery(nameA, nameB) {
  const A = esc(nameA);
  const B = esc(nameB);
  return `
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX imas: <https://sparql.crssnky.xyz/imasrdf/URIs/imas-schema.ttl#>

SELECT ?unitName (GROUP_CONCAT(DISTINCT ?memberJa; separator=", ") AS ?members)
WHERE {
  # ユニット本体
  ?unit rdf:type imas:Unit ;
        schema:name ?unitName ;
        schema:member ?mAll .

  # 全メンバーのうち「日本語ラベルだけ」を採用
  ?mAll schema:name ?memberAll .
  FILTER(LANGMATCHES(LANG(?memberAll), "ja"))
  BIND(STR(?memberAll) AS ?memberJa)

  # 2人が同じユニットに含まれていることを保証
  FILTER EXISTS {
    ?unit schema:member ?mA .
    ?mA schema:name ?nA .
    FILTER(STR(?nA) = "${A}")
  }
  FILTER EXISTS {
    ?unit schema:member ?mB .
    ?mB schema:name ?nB .
    FILTER(STR(?nB) = "${B}")
  }
}
GROUP BY ?unitName
ORDER BY ?unitName
`.trim();
}