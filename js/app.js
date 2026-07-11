const i18n = {
  en: {
    htmlLang: "en",
    title: "PhishWatch – Phishing DApp Directory | Blocklist of Malicious Web3 Domains",
    tagline: "Public, searchable directory of confirmed phishing DApps and clone sites.",
    searchLabel: "Search",
    searchPlaceholder: "Search domains, e.g. fuseeta or fuseeta.com",
    filterTag: "Tag filter",
    filterStatus: "Status filter",
    allTags: "All tags",
    allStatuses: "All statuses",
    language: "Language",
    count: n => `${n} domains`,
    a2z: "A–Z filter (by domain name)",
    updated: "Last updated",
    fetching: "Loading data…",
    fetchFailed: "Could not load blocklist JSON, showing built-in fallback.",
    dataLastUpdated: d => `Data last updated: ${d}`,
    faqH: "About PhishWatch",
    faqP: "PhishWatch is a community-driven, multilingual blocklist of phishing DApps and clone sites. Use this tool to search, filter, and stay safer online.",
    copyDomain: "Copy domain",
    copied: "Copied!",
    tags: { phishing: "phishing", dapp: "DApp" },
    statuses: { active: "Active drainer", paused: "Paused", dead: "Offline" },
    metaDesc: "PhishWatch is a multilingual, searchable directory of confirmed phishing DApps and clone sites in Web3. Browse, filter by tags, and stay safer online."
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    title: "PhishWatch – 釣魚 DApp 名單 | 惡意 Web3 網域封鎖清單",
    tagline: "公開、可搜尋的已確認釣魚 DApp／克隆站清單。",
    searchLabel: "搜尋",
    searchPlaceholder: "搜尋網域，如 fuseeta 或 fuseeta.com",
    filterTag: "標籤篩選",
    filterStatus: "狀態篩選",
    allTags: "全部標籤",
    allStatuses: "全部狀態",
    language: "語言",
    count: n => `${n} 個網域`,
    a2z: "字母篩選（依網域名稱）",
    updated: "最後更新",
    fetching: "資料載入中…",
    fetchFailed: "無法載入封鎖清單 JSON，已顯示內建後備資料。",
    dataLastUpdated: d => `資料最後更新：${d}`,
    faqH: "關於 PhishWatch",
    faqP: "PhishWatch 是由社群維護的多語系釣魚 DApp／克隆站封鎖清單。用它搜尋與篩選，提高上網安全。",
    copyDomain: "複製網域",
    copied: "已複製！",
    tags: { phishing: "釣魚", dapp: "DApp" },
    statuses: { active: "運行中", paused: "已暫停", dead: "已離線" },
    metaDesc: "PhishWatch 是多語系、可搜尋的 Web3 釣魚 DApp／克隆站清單。支援標籤篩選，協助你更安全地瀏覽。"
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    title: "PhishWatch – 钓鱼 DApp 名单 | 恶意 Web3 域名拦截清单",
    tagline: "公开、可搜索的已确认钓鱼 DApp/克隆站清单。",
    searchLabel: "搜索",
    searchPlaceholder: "搜索域名，如 fuseeta 或 fuseeta.com",
    filterTag: "标签筛选",
    filterStatus: "状态筛选",
    allTags: "全部标签",
    allStatuses: "全部状态",
    language: "语言",
    count: n => `${n} 个域名`,
    a2z: "字母筛选（按域名）",
    updated: "最后更新",
    fetching: "正在载入数据…",
    fetchFailed: "无法加载封锁清单 JSON，已显示内置后备数据。",
    dataLastUpdated: d => "数据最后更新：" + d,
    faqH: "关于 PhishWatch",
    faqP: "PhishWatch 是一个由社区维护的多语言钓鱼 DApp/克隆站拦截清单。可搜索、可筛选，帮助你更安全地上网。",
    copyDomain: "复制域名",
    copied: "已复制！",
    tags: { phishing: "钓鱼", dapp: "DApp" },
    statuses: { active: "运行中", paused: "已暂停", dead: "已离线" },
    metaDesc: "PhishWatch 是多语言、可搜索的 Web3 钓鱼 DApp/克隆站清单。支持标签筛选，帮助你更安全地浏览。"
  }
};

const YEAR = new Date().getFullYear();
const FALLBACK_DATA_UPDATED = "2025-12-30";
const SEARCH_DEBOUNCE_MS = 150;
const STATUS_ORDER = { active: 0, paused: 1, dead: 2, unknown: 3, "": 4 };

const seedBases = [
  "fusehe.com", "fusehk.com", "fusehs.com", "fuseht.com", "fusehu.com", "fusehv.com", "fusehx.com",
  "fusepb.com", "fusepe.com", "fusepg.com", "fuseph.com", "fusepn.com", "fusept.com", "fusepu.com",
  "fusepw.com", "fusepy.com", "fusepz.com", "fuseua.com", "fuseun.com", "fuseuw.com", "fuseuz.com",
  "fuseeta.com", "fuseetc.com", "fuseetd.com", "fuseetf.com", "fuseeth.com", "fuseets.com"
];

function resolveLang() {
  const fromUrl = new URL(location.href).searchParams.get("lang");
  if (fromUrl && i18n[fromUrl]) return fromUrl;

  const prefs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en"];

  for (const tag of prefs) {
    const t = tag.toLowerCase();
    if (t.startsWith("zh")) {
      if (t.includes("hans") || t.includes("cn") || t.includes("sg")) return "zh-Hans";
      if (t.includes("hant") || t.includes("tw") || t.includes("hk") || t.includes("mo")) return "zh-Hant";
      return "zh-Hant";
    }
  }
  return "en";
}

function stripWWW(input) {
  return String(input || "")
    .trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function normalizeQuery(q) { return stripWWW(q); }

function toISODate10(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function domainPageHref(base) {
  return `d/${stripWWW(base)}.html`;
}

const state = {
  lang: resolveLang(),
  q: "",
  tag: "",
  status: "",
  letter: "",
  dataUpdatedISO: "",
  lastQueryHadWWW: false
};

let rawData = [];
let meta = {};
let searchTimer = null;

function uniqueByBase(items) {
  const map = new Map();
  items.forEach(it => {
    const key = it.base;
    if (!map.has(key)) {
      map.set(key, { ...it, variants: [it.base, `www.${it.base}`] });
    }
  });
  return Array.from(map.values());
}

function uniqueTags() {
  const s = new Set();
  rawData.forEach(d => d.tags?.forEach?.(t => s.add(t)));
  return Array.from(s).sort();
}

function uniqueStatuses() {
  const s = new Set();
  rawData.forEach(d => { if (d.status) s.add(d.status); });
  return Array.from(s).sort((a, b) => (STATUS_ORDER[a] ?? 9) - (STATUS_ORDER[b] ?? 9));
}

function statusCount(status) {
  return rawData.filter(d => d.status === status).length;
}

function sortItems(items) {
  return items.sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.base.localeCompare(b.base);
  });
}

function filterData() {
  const q = normalizeQuery(state.q);
  let items = uniqueByBase(rawData);
  items = items.filter(item => {
    if (state.letter && item.base[0] !== state.letter) return false;
    if (state.tag && !(item.tags || []).includes(state.tag)) return false;
    if (state.status && item.status !== state.status) return false;
    if (!q) return true;
    if (item.base.includes(q)) return true;
    return item.variants.some(v => stripWWW(v).includes(q));
  });
  return sortItems(items);
}

function renderAZ() {
  const container = document.getElementById("az");
  if (!container) return;
  container.replaceChildren();
  "abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
    const btn = document.createElement("button");
    btn.textContent = l.toUpperCase();
    if (state.letter === l) btn.className = "active";
    btn.onclick = () => { state.letter = (state.letter === l ? "" : l); render(); };
    container.appendChild(btn);
  });
  const clr = document.createElement("button");
  clr.textContent = "•";
  clr.title = "Clear";
  clr.onclick = () => { state.letter = ""; render(); };
  container.appendChild(clr);
}

function renderTags() {
  const sel = document.getElementById("tagSel");
  if (!sel) return;
  const t = i18n[state.lang];
  sel.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = t.allTags;
  sel.appendChild(all);
  uniqueTags().forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = t.tags?.[tag] || tag;
    if (state.tag === tag) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderStatuses() {
  const sel = document.getElementById("statusSel");
  if (!sel) return;
  const t = i18n[state.lang];
  sel.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = t.allStatuses;
  sel.appendChild(all);
  uniqueStatuses().forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    const count = statusCount(status);
    const label = t.statuses?.[status] || status;
    opt.textContent = count ? `${label} (${count})` : label;
    if (state.status === status) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderNotice(msg, isError = false) {
  const n = document.getElementById("notice");
  if (!n) return;
  n.textContent = msg || "";
  n.className = "notice" + (isError ? " error" : "");
  n.style.display = msg ? "block" : "none";
}

function updateFooterDates() {
  const el = document.getElementById("dataUpdated");
  if (!el) return;
  const t = i18n[state.lang];
  const text = state.dataUpdatedISO ? t.dataLastUpdated(state.dataUpdatedISO) : "";
  el.textContent = text;
  el.style.display = text ? "inline" : "none";
}

async function copyDomain(domain, button) {
  const t = i18n[state.lang];
  try {
    await navigator.clipboard.writeText(domain);
    const prev = button.textContent;
    button.textContent = t.copied;
    setTimeout(() => { button.textContent = prev; }, 1200);
  } catch (_err) {
    button.textContent = domain;
  }
}

function appendTag(parent, label, extraClass = "") {
  const tag = document.createElement("span");
  tag.className = `tag${extraClass ? ` ${extraClass}` : ""}`;
  tag.textContent = label;
  parent.appendChild(tag);
}

function renderCard(item, t) {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("role", "listitem");

  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");
  const domainEl = document.createElement("div");
  domainEl.className = "domain";
  const domainLink = document.createElement("a");
  domainLink.href = domainPageHref(item.base);
  domainLink.textContent = item.base;
  domainEl.appendChild(domainLink);
  left.appendChild(domainEl);

  if (state.lastQueryHadWWW) {
    const variants = document.createElement("div");
    variants.className = "small";
    variants.textContent = `Variants: ${item.variants.join(", ")}`;
    left.appendChild(variants);
  }

  const updated = document.createElement("div");
  updated.className = "small";
  updated.textContent = `${t.updated}: ${item.lastSeen || ""}`;
  left.appendChild(updated);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-btn";
  copyBtn.textContent = t.copyDomain;
  copyBtn.addEventListener("click", () => copyDomain(item.base, copyBtn));
  left.appendChild(copyBtn);

  const tags = document.createElement("div");
  tags.className = "tags";
  if (item.status) {
    const statusClass = item.status === "active"
      ? "status-active"
      : item.status === "paused"
        ? "status-paused"
        : item.status === "dead"
          ? "status-dead"
          : "";
    appendTag(tags, t.statuses?.[item.status] || item.status, statusClass);
  }
  (item.tags || []).forEach(tag => {
    appendTag(tags, t.tags?.[tag] || tag, tag === "phishing" ? "danger" : "");
  });

  row.appendChild(left);
  row.appendChild(tags);
  card.appendChild(row);
  return card;
}

function render() {
  const t = i18n[state.lang];
  renderAZ();
  renderTags();
  renderStatuses();

  document.title = t.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t.metaDesc);
  document.documentElement.lang = t.htmlLang || "en";

  const list = document.getElementById("list");
  const countEl = document.getElementById("count");
  if (!list || !countEl) return;

  const items = filterData();
  countEl.textContent = t.count(items.length);
  list.replaceChildren();

  if (items.length === 0) {
    const div = document.createElement("div");
    div.className = "card";
    div.style.textAlign = "center";
    div.textContent = state.lang === "zh-Hant" ? "沒有結果" : state.lang === "zh-Hans" ? "没有结果" : "No results";
    list.appendChild(div);
    updateFooterDates();
    return;
  }

  items.forEach(item => list.appendChild(renderCard(item, t)));
  updateFooterDates();
}

function setLang(lang) {
  state.lang = ["en", "zh-Hant", "zh-Hans"].includes(lang) ? lang : "en";
  const t = i18n[state.lang];

  const setText = (sel, text) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = text;
  };

  setText('[data-i="tagline"]', t.tagline);
  const searchEl = document.getElementById("search");
  if (searchEl) searchEl.placeholder = t.searchPlaceholder;
  setText('[data-i="filterLabel"]', t.filterTag);
  setText('[data-i="filterStatusLabel"]', t.filterStatus);
  setText('[data-i="langLabel"]', t.language);
  setText('[data-i="a2z"]', t.a2z);
  setText('[data-i="searchLabel"]', t.searchLabel);
  setText('[data-i="faqH"]', t.faqH);
  setText('[data-i="faqP"]', t.faqP);

  render();

  const url = new URL(location.href);
  url.searchParams.set("lang", state.lang);
  history.replaceState({}, "", url.toString());
}

function mapJsonToRaw(jsonDomains) {
  if (!Array.isArray(jsonDomains)) return [];
  return jsonDomains.map(d => {
    if (typeof d === "string") {
      const base = stripWWW(d);
      return { base, tags: ["phishing", "dapp"], lastSeen: new Date().toISOString().slice(0, 10), status: "" };
    }
    if (typeof d === "object" && d !== null) {
      const base = stripWWW(d.b || d.base || d.domain || "");
      const tags = Array.isArray(d.t) ? d.t.map(String)
        : Array.isArray(d.tags) && d.tags.length ? d.tags.map(String)
          : ["phishing", "dapp"];
      const lastSeen = toISODate10(d.s || d.lastSeen || "");
      const status = String(d.st || d.status || "").toLowerCase();
      return { base, tags, lastSeen, status };
    }
    return null;
  }).filter(x => x && x.base);
}

async function fetchBlocklistJson() {
  const url = "phishing_data.json";
  const res = await fetch(url, { cache: "no-store", credentials: "omit", redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const json = await res.json();
  const payload = Array.isArray(json) ? json : json.domains;
  const mapped = mapJsonToRaw(payload);
  if (!mapped.length) {
    throw new Error(`Empty domains in ${url}`);
  }
  return { json, mapped };
}

async function loadData() {
  renderNotice(i18n[state.lang].fetching, false);
  try {
    const { json, mapped } = await fetchBlocklistJson();

    meta = json.meta || {};
    state.dataUpdatedISO = toISODate10(meta.generatedAt);
    rawData = mapped;
    renderNotice("");
  } catch (err) {
    console.error("Failed to load blocklist JSON:", err);
    rawData = seedBases.map(b => ({
      base: stripWWW(b),
      tags: ["phishing", "dapp"],
      lastSeen: new Date().toISOString().slice(0, 10),
      status: ""
    }));
    state.dataUpdatedISO = toISODate10(FALLBACK_DATA_UPDATED);
    renderNotice(i18n[state.lang].fetchFailed, true);
  } finally {
    render();
  }
}

function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const search = document.getElementById("search");
    const raw = search?.value || "";
    state.lastQueryHadWWW = /^https?:\/\//i.test(raw) || /^www\./i.test(raw);
    state.q = raw;
    render();
  }, SEARCH_DEBOUNCE_MS);
}

function initFromQuery() {
  const params = new URL(location.href).searchParams;
  const q = params.get("q");
  if (q) {
    state.q = q;
    const search = document.getElementById("search");
    if (search) search.value = q;
  }
}

function init() {
  initFromQuery();

  const langSel = document.getElementById("langSel");
  if (langSel) {
    langSel.value = ["en", "zh-Hant", "zh-Hans"].includes(state.lang) ? state.lang : "en";
    langSel.onchange = e => { setLang(e.target.value); renderNotice(""); };
  }

  const search = document.getElementById("search");
  if (search) {
    search.oninput = scheduleSearch;
    search.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchTimer) clearTimeout(searchTimer);
        scheduleSearch();
      }
    });
  }

  const tagSel = document.getElementById("tagSel");
  if (tagSel) tagSel.onchange = e => { state.tag = e.target.value; render(); };

  const statusSel = document.getElementById("statusSel");
  if (statusSel) statusSel.onchange = e => { state.status = e.target.value; render(); };

  setLang(state.lang);

  const footBrand = document.getElementById("footBrand");
  if (footBrand) footBrand.textContent = `${YEAR} @ anti-phishing-dapps`;

  updateFooterDates();
  loadData();
}

document.addEventListener("DOMContentLoaded", init);
