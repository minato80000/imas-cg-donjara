const endpoint = "https://sparql.crssnky.xyz/spql/imas/query";
const esc = (s) => String(s).replace(/"/g, '\\"');

let CURRENT_POOL = [];

/* ========== UI ヘルパ ========== */
function parsePool(text) {
  // 1行1名推奨。カンマ区切りも許可（改行とカンマで分割）、空行除去＆重複排除。
  const arr = text
    .split(/\r?\n|,|、/)
    .map(s => s.trim())
    .filter(Boolean);
  return Array.from(new Set(arr));
}

function renderPoolCheckboxes(pool) {
  const wrap = document.getElementById("poolList");
  wrap.innerHTML = "";
  pool.forEach((name, i) => {
    const id = `cand_${i}`;
    wrap.insertAdjacentHTML(
      "beforeend",
      `<label class="chip" for="${id}">
         <input type="checkbox" id="${id}" data-name="${name}"/>
         <span>${name}</span>
       </label>`
    );
  });
  document.getElementById("poolNote").textContent = `${pool.length}人の候補`;
}

function getSelectedFromUI() {
  return Array.from(document.querySelectorAll("#poolList input:checked"))
    .map(el => el.dataset.name);
}

/* ========== SPARQL ========== */
/**
 * 候補プール内のメンバーだけで構成され、かつ selected 全員を含むユニットを返す。
 * 表示するメンバー名は日本語ラベルのみ（LANG=ja）。
 */
function buildQueryFromCandidates(pool, selected) {
  const poolVals = pool.map(n => `"${esc(n)}"`).join(" ");

  // 必須メンバー（選択した人）を全て含むことを保証
  const requireBlocks = selected.map(n => `
  FILTER EXISTS {
    ?unit schema:member ?m_req .
    ?m_req schema:name ?n_req .
    FILTER(STR(?n_req) = "${esc(n)}")
  }`).join("\n");

  return `
PREFIX schema: <http://schema.org/>
PREFIX rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX imas:  <https://sparql.crssnky.xyz/imasrdf/URIs/imas-schema.ttl#>

SELECT ?unitName (GROUP_CONCAT(DISTINCT ?memberJa; separator=", ") AS ?members)
WHERE {
  ?unit rdf:type imas:Unit ;
        schema:name ?unitName ;
        schema:member ?mAll .

  # 表示するのは日本語ラベルのみ
  ?mAll schema:name ?memberAll .
  FILTER(LANGMATCHES(LANG(?memberAll), "ja"))
  BIND(STR(?memberAll) AS ?memberJa)

  # このユニットの全メンバーが候補プール内に収まる（= 候補外メンバーが1人もいない）
  FILTER NOT EXISTS {
    ?unit schema:member ?mX .
    ?mX schema:name ?nX .
    FILTER NOT EXISTS {
      VALUES ?pool { ${poolVals} }
      FILTER(STR(?nX) = ?pool)
    }
  }

  # 選択した人たちを全員含む
  ${requireBlocks}
}
GROUP BY ?unitName
ORDER BY ?unitName
`.trim();
}

/* ========== fetch with fallback & retry ========== */
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
        await new Promise(r => setTimeout(r, [400, 1000, 2000][attempt]));
      }
    }
  }
}

/* ========== 表示/CSV ========== */
function renderTable(rows) {
  if (!rows.length) return "<p>該当なし。</p>";
  let html = `<table><thead><tr><th>ユニット</th><th>メンバー（日本語）</th></tr></thead><tbody>`;
  for (const r of rows) {
    const unit = r.unitName?.value ?? "";
    const members = r.members?.value ?? "";
    html += `<tr><td>${unit}</td><td>${members}</td></tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

function toCSV(rows) {
  const escCSV = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const header = ["ユニット", "メンバー"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([r.unitName?.value ?? "", r.members?.value ?? ""].map(escCSV).join(","));
  }
  return lines.join("\r\n");
}

/* ========== イベント ========== */
document.addEventListener("DOMContentLoaded", () => {
  const taPool = document.getElementById("pool");
  const btnReflect = document.getElementById("reflect");
  const btnRun = document.getElementById("run");
  const btnCSV = document.getElementById("export");
  const note = document.getElementById("note");
  const out = document.getElementById("out");
  const err = document.getElementById("error");

  btnReflect.addEventListener("click", () => {
    const pool = parsePool(taPool.value);
    if (pool.length === 0) {
      document.getElementById("poolList").innerHTML = "";
      document.getElementById("poolNote").textContent = "候補が空です";
      CURRENT_POOL = [];
      return;
    }
    CURRENT_POOL = pool;
    renderPoolCheckboxes(pool);
  });

  btnRun.addEventListener("click", async () => {
    err.textContent = "";
    out.innerHTML = "";
    btnCSV.disabled = true;

    if (CURRENT_POOL.length === 0) {
      err.textContent = "まず候補リストを入力して「候補を反映」を押してください。";
      return;
    }
    const selected = getSelectedFromUI();
    if (selected.length === 0) {
      err.textContent = "必ず含めたいメンバーに少なくとも1人チェックしてください。";
      return;
    }

    // SPARQL生成
    const q = buildQueryFromCandidates(CURRENT_POOL, selected);
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
        aEl.download = `units_candidates.csv`;
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
