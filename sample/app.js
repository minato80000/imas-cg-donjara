const endpoint = "https://sparql.crssnky.xyz/spql/imas/query";

// 2人の名前からSPARQLを生成（両方にマッチするユニットのみ返す）
// 文字列中の " をエスケープ
// " をエスケープ
const esc = (s) => String(s).replace(/"/g, '\\"');

// 2人が所属するユニットを特定し、そのユニットの「日本語名の全メンバー」を返す
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


// フォールバック付きのfetch（Content-Type切替 + リトライ）
async function querySparql(q) {
  const tries = [
    {
      method: "POST",
      headers: {
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/sparql-query; charset=UTF-8",
      },
      body: q,
    },
    {
      method: "POST",
      headers: {
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({ query: q }),
    },
  ];

  const maxRetry = 3;
  for (let attempt = 0; attempt < maxRetry; attempt++) {
    for (const opt of tries) {
      try {
        const res = await fetch(endpoint, opt);
        if (res.ok) return await res.json();
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}\n${txt}`);
      } catch (e) {
        if (attempt === maxRetry - 1) throw e;
        await new Promise((r) => setTimeout(r, [400, 1000, 2000][attempt]));
      }
    }
  }
}

function renderTable(rows) {
  if (!rows.length) return "<p>該当なし。</p>";
  let html = `<table><thead><tr><th>ユニット</th><th>メンバー</th></tr></thead><tbody>`;
  for (const r of rows) {
    const unit = r.unitName?.value ?? "";
    const members = r.members?.value ?? "";
    html += `<tr><td>${unit}</td><td>${members}</td></tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

function toCSV(rows) {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const header = ["ユニット", "メンバー"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([r.unitName?.value ?? "", r.members?.value ?? ""].map(esc).join(","));
  }
  return lines.join("\r\n");
}

document.addEventListener("DOMContentLoaded", () => {
  const nameA = document.getElementById("nameA");
  const nameB = document.getElementById("nameB");
  const btnRun = document.getElementById("run");
  const btnCSV = document.getElementById("export");
  const note = document.getElementById("note");
  const out = document.getElementById("out");
  const err = document.getElementById("error");

  btnRun.addEventListener("click", async () => {
    err.textContent = "";
    out.innerHTML = "";
    btnCSV.disabled = true;

    const a = nameA.value.trim();
    const b = nameB.value.trim();
    if (!a || !b) {
      err.textContent = "2人分の名前を入力してください。";
      return;
    }

    const q = buildQuery(a, b);
    note.textContent = "実行中…（混雑時は数秒かかる場合があります）";
    btnRun.disabled = true;

    try {
      const json = await querySparql(q);
      const rows = json?.results?.bindings ?? [];
      out.innerHTML = renderTable(rows);

      btnCSV.disabled = rows.length === 0;
      btnCSV.onclick = () => {
        const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement("a");
        aEl.href = url;
        aEl.download = `units_${a}_${b}.csv`;
        aEl.click();
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      err.textContent = "エラーが発生しました。\n" + (e?.message ?? e);
    } finally {
      note.textContent = "";
      btnRun.disabled = false;
    }
  });
});
