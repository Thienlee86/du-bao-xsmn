/* =========================================================================
   Dự Báo XSMN - Thống Kê & Xác Suất
   Toàn bộ logic chạy offline trên máy người dùng. Không gửi dữ liệu đi đâu.
   ========================================================================= */

/* ---------- 1. DỮ LIỆU TỈNH & CƠ CẤU GIẢI ---------- */

const DAY_INDEX = {
  'Chủ Nhật': 0, 'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3,
  'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6
};

const PROVINCES = [
  { slug: 'tp-hcm',      name: 'TP. HCM',     days: ['Thứ Hai', 'Thứ Bảy'] },
  { slug: 'dong-thap',   name: 'Đồng Tháp',   days: ['Thứ Hai'] },
  { slug: 'ca-mau',      name: 'Cà Mau',      days: ['Thứ Hai'] },
  { slug: 'ben-tre',     name: 'Bến Tre',     days: ['Thứ Ba'] },
  { slug: 'vung-tau',    name: 'Vũng Tàu',    days: ['Thứ Ba'] },
  { slug: 'bac-lieu',    name: 'Bạc Liêu',    days: ['Thứ Ba'] },
  { slug: 'dong-nai',    name: 'Đồng Nai',    days: ['Thứ Tư'] },
  { slug: 'can-tho',     name: 'Cần Thơ',     days: ['Thứ Tư'] },
  { slug: 'soc-trang',   name: 'Sóc Trăng',   days: ['Thứ Tư'] },
  { slug: 'tay-ninh',    name: 'Tây Ninh',    days: ['Thứ Năm'] },
  { slug: 'an-giang',    name: 'An Giang',    days: ['Thứ Năm'] },
  { slug: 'binh-thuan',  name: 'Bình Thuận',  days: ['Thứ Năm'] },
  { slug: 'vinh-long',   name: 'Vĩnh Long',   days: ['Thứ Sáu'] },
  { slug: 'binh-duong',  name: 'Bình Dương',  days: ['Thứ Sáu'] },
  { slug: 'tra-vinh',    name: 'Trà Vinh',    days: ['Thứ Sáu'] },
  { slug: 'long-an',     name: 'Long An',     days: ['Thứ Bảy'] },
  { slug: 'binh-phuoc',  name: 'Bình Phước',  days: ['Thứ Bảy'] },
  { slug: 'hau-giang',   name: 'Hậu Giang',   days: ['Thứ Bảy'] },
  { slug: 'tien-giang',  name: 'Tiền Giang',  days: ['Chủ Nhật'] },
  { slug: 'kien-giang',  name: 'Kiên Giang',  days: ['Chủ Nhật'] },
  { slug: 'da-lat',      name: 'Đà Lạt',      days: ['Chủ Nhật'] },
];

function provinceBySlug(slug) { return PROVINCES.find(p => p.slug === slug); }

// key, nhãn hiển thị, số lượng con số trong giải, số chữ số mỗi con số
const PRIZE_META = [
  { key: 'db', label: 'Giải Đặc Biệt', count: 1, digits: 6 },
  { key: 'g1', label: 'Giải Nhất',     count: 1, digits: 5 },
  { key: 'g2', label: 'Giải Nhì',      count: 1, digits: 5 },
  { key: 'g3', label: 'Giải Ba',       count: 2, digits: 5 },
  { key: 'g4', label: 'Giải Tư',       count: 7, digits: 5 },
  { key: 'g5', label: 'Giải Năm',      count: 1, digits: 4 },
  { key: 'g6', label: 'Giải Sáu',      count: 3, digits: 4 },
  { key: 'g7', label: 'Giải Bảy',      count: 1, digits: 3 },
  { key: 'g8', label: 'Giải Tám',      count: 1, digits: 2 },
];
function prizeMetaOf(key) { return PRIZE_META.find(p => p.key === key); }

/* ---------- 2. STATE & LƯU TRỮ ---------- */

const LS_KEYS = {
  extraDraws: 'xskt_extra_draws',
  predictions: 'xskt_predictions',
  province: 'xskt_selected_province',
  windowSize: 'xskt_window_size',
};

let SEED_DRAWS = [];           // load từ data/xsmn_seed.json
let EXTRA_DRAWS = loadJSON(LS_KEYS.extraDraws, []);
let PREDICTIONS = loadJSON(LS_KEYS.predictions, []);
let SELECTED_PROVINCE = localStorage.getItem(LS_KEYS.province) || 'tp-hcm';
let WINDOW_SIZE = parseInt(localStorage.getItem(LS_KEYS.windowSize) || '30', 10);
let LAST_FORECAST = null; // để phục vụ nút "Lưu dự báo"

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* quota hết chỗ, bỏ qua */ }
}

/* ---------- 3. TIỆN ÍCH DỮ LIỆU ---------- */

function pad2(n) { return String(n).padStart(2, '0'); }

// Trả về toàn bộ số (chuỗi) của 1 giải trong 1 kỳ quay, dạng mảng.
function numbersOfPrize(draw, key) {
  const v = draw.prizes[key];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

// Trả về mảng 2 số cuối (lô) của TẤT CẢ các giải trong 1 kỳ (18 giá trị theo cơ cấu Miền Nam).
function loOfDraw(draw) {
  const out = [];
  PRIZE_META.forEach(pm => {
    numbersOfPrize(draw, pm.key).forEach(v => out.push(v.slice(-2)));
  });
  return out;
}

// Trả về mảng 2 số cuối chỉ của 1 giải cụ thể trong 1 kỳ.
function loOfPrize(draw, key) {
  return numbersOfPrize(draw, key).map(v => v.slice(-2));
}

function dedupeKey(d) { return d.province + '|' + d.date; }

function getAllDrawsForProvince(slug) {
  const map = new Map();
  SEED_DRAWS.filter(d => d.province === slug).forEach(d => map.set(dedupeKey(d), d));
  EXTRA_DRAWS.filter(d => d.province === slug).forEach(d => map.set(dedupeKey(d), d)); // extra ghi đè seed nếu trùng ngày
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date)); // mới nhất trước
}

function countDrawsPerProvince() {
  const out = {};
  PROVINCES.forEach(p => { out[p.slug] = getAllDrawsForProvince(p.slug).length; });
  return out;
}

/* ---------- 4. ĐỘNG CƠ THỐNG KÊ & XÁC SUẤT ---------- */

function windowedDraws(allDraws, windowSize) {
  return allDraws.slice(0, Math.min(windowSize, allDraws.length));
}

// Tần suất 00..99 trong 1 danh sách giá trị lô (mảng chuỗi 2 ký tự)
function freqTable(values) {
  const t = {};
  for (let i = 0; i < 100; i++) t[pad2(i)] = 0;
  values.forEach(v => { if (t[v] !== undefined) t[v]++; });
  return t;
}

// Số kỳ "gan" (chưa xuất hiện) của mỗi số 00..99, dựa trên danh sách draws đã sắp xếp mới->cũ,
// và hàm getValues(draw) trả về mảng lô của kỳ đó (theo giải cụ thể hoặc toàn bảng lô).
function ganTable(draws, getValues) {
  const gan = {};
  for (let i = 0; i < 100; i++) gan[pad2(i)] = draws.length; // mặc định: chưa thấy trong toàn bộ dữ liệu hiện có
  const found = new Set();
  draws.forEach((d, idx) => {
    getValues(d).forEach(v => {
      if (!found.has(v)) { found.add(v); gan[v] = idx; }
    });
  });
  return gan;
}

function minMaxNormalize(obj) {
  const vals = Object.values(obj);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const out = {};
  Object.keys(obj).forEach(k => { out[k] = (obj[k] - min) / range; });
  return out;
}

// Bảng đầu (chục) - đuôi (đơn vị) từ 1 danh sách lô
function headTailFreq(values) {
  const head = new Array(10).fill(0), tail = new Array(10).fill(0);
  values.forEach(v => { head[+v[0]]++; tail[+v[1]]++; });
  return { head, tail };
}

const WEIGHTS = { freq: 0.5, gan: 0.35, headtail: 0.15 };

// Tính điểm xác suất tham khảo cho từng số 00..99, ứng với 1 giải cụ thể của 1 tỉnh.
function computeScoresForGiai(allDraws, giaiKey, windowSize) {
  const win = windowedDraws(allDraws, windowSize);
  const countPerDraw = prizeMetaOf(giaiKey).count;

  const flatValues = [];
  win.forEach(d => loOfPrize(d, giaiKey).forEach(v => flatValues.push(v)));
  const freq = freqTable(flatValues);
  const expectedPerNumber = Math.max(win.length * countPerDraw / 100, 0.01);

  const gan = ganTable(allDraws, d => loOfPrize(d, giaiKey)); // dùng toàn bộ lịch sử để tính gan cho chính xác hơn

  const { head, tail } = headTailFreq(flatValues);
  const headMax = Math.max(...head, 1), tailMax = Math.max(...tail, 1);

  const ratioRaw = {}, ganRaw = {}, htRaw = {};
  for (let i = 0; i < 100; i++) {
    const n = pad2(i);
    ratioRaw[n] = freq[n] / expectedPerNumber;
    ganRaw[n] = gan[n];
    htRaw[n] = (head[+n[0]] / headMax + tail[+n[1]] / tailMax) / 2;
  }
  const ratioNorm = minMaxNormalize(ratioRaw);
  const ganNorm = minMaxNormalize(ganRaw);

  const scores = {};
  for (let i = 0; i < 100; i++) {
    const n = pad2(i);
    scores[n] = WEIGHTS.freq * ratioNorm[n] + WEIGHTS.gan * ganNorm[n] + WEIGHTS.headtail * htRaw[n];
    scores[n] = Math.max(scores[n], 0.001); // giữ dương để roulette-wheel luôn chọn được
  }

  return { scores, freq, expectedPerNumber, gan, windowUsed: win.length };
}

// Chọn ngẫu nhiên có trọng số (roulette-wheel), không lặp số, ưu tiên điểm cao nhưng vẫn đổi mới mỗi lần bấm.
function weightedPickWithoutReplacement(scores, k) {
  let pool = Object.entries(scores).slice();
  const picks = [];
  for (let i = 0; i < k && pool.length; i++) {
    const total = pool.reduce((s, [, v]) => s + v, 0);
    let r = Math.random() * total;
    let idx = 0, acc = 0;
    for (; idx < pool.length; idx++) {
      acc += pool[idx][1];
      if (acc >= r) break;
    }
    if (idx >= pool.length) idx = pool.length - 1;
    picks.push(pool[idx][0]);
    pool.splice(idx, 1);
  }
  return picks;
}

function rankOf(scores, number) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  return sorted.indexOf(number) + 1; // 1 = cao nhất
}

/* ---------- 5. SINH LÝ DO (REASONING) ---------- */

function buildReasoning(number, giaiLabel, stat, windowSize) {
  const { freq, expectedPerNumber, gan } = stat;
  const f = freq[number];
  const exp = expectedPerNumber;
  const g = gan[number];
  const diffPct = Math.round(Math.abs(f / exp - 1) * 100);
  const higher = f >= exp;
  let ganText;
  if (g === 0) ganText = `vừa về ở kỳ gần nhất`;
  else if (g >= stat.windowUsed) ganText = `chưa xuất hiện trong toàn bộ ${stat.windowUsed} kỳ dữ liệu đang có (số gan dài)`;
  else ganText = `đã gan ${g} kỳ liên tiếp chưa lặp lại`;

  return `Số <b>${number}</b>: xuất hiện <b>${f}</b> lần trong ${stat.windowUsed} kỳ gần nhất tại ${giaiLabel} `
    + `(kỳ vọng ngẫu nhiên trung bình ≈ ${exp.toFixed(1)} lần) — tần suất ${higher ? 'cao hơn' : 'thấp hơn'} mức kỳ vọng khoảng ${diffPct}%. `
    + `Số này ${ganText}.`;
}

const GLOBAL_DISCLAIMER_SHORT = 'Chỉ số xác suất tham khảo từ dữ liệu quá khứ — mỗi kỳ quay là sự kiện độc lập, không đảm bảo kết quả.';

/* ---------- 6. DỰ BÁO CHO 1 TỈNH (TẤT CẢ CÁC GIẢI) ---------- */

function pickCountFor(giaiKey) {
  // giải càng "to" (ít số) thì gợi ý ít số hơn để tập trung, giải phụ gợi ý nhiều lựa chọn hơn
  if (['db', 'g1', 'g2'].includes(giaiKey)) return 2;
  if (['g3', 'g5', 'g7', 'g8'].includes(giaiKey)) return 3;
  return 3; // g4, g6
}

function generateFullForecast(provinceSlug, windowSize) {
  const allDraws = getAllDrawsForProvince(provinceSlug);
  const result = { province: provinceSlug, windowSize, generatedAt: new Date().toISOString(), items: [] };
  if (allDraws.length === 0) {
    result.empty = true;
    return result;
  }
  PRIZE_META.forEach(pm => {
    const stat = computeScoresForGiai(allDraws, pm.key, windowSize);
    const k = pickCountFor(pm.key);
    const picks = weightedPickWithoutReplacement(stat.scores, k);
    const numbers = picks.map(n => ({
      number: n,
      rank: rankOf(stat.scores, n),
      reasoning: buildReasoning(n, pm.label, stat, windowSize),
    }));
    result.items.push({ key: pm.key, label: pm.label, numbers });
  });
  return result;
}

/* ---------- 7. CẦU GHÉP CẶP THEO CÔNG THỨC ---------- */

function generatePairFormulas(provinceSlug, windowSize) {
  const allDraws = getAllDrawsForProvince(provinceSlug);
  if (allDraws.length === 0) return [];
  const win = windowedDraws(allDraws, windowSize);
  const allLoLists = win.map(d => loOfDraw(d));
  const flat = allLoLists.flat();
  const freq = freqTable(flat);
  const gan = ganTable(allDraws, d => loOfDraw(d));
  const { head, tail } = headTailFreq(flat);

  const out = [];

  // 1) Đầu - Đuôi kết hợp: đầu có tần suất cao nhất + đuôi có tần suất cao nhất (từ 2-3 ứng viên đầu bảng, xáo trộn nhẹ)
  {
    const headRanked = head.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]);
    const tailRanked = tail.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]);
    const topHeads = headRanked.slice(0, 3);
    const topTails = tailRanked.slice(0, 3);
    const h = topHeads[Math.floor(Math.random() * topHeads.length)];
    const t = topTails[Math.floor(Math.random() * topTails.length)];
    const num1 = `${h[0]}${t[0]}`;
    out.push({
      formula: 'Đầu – Đuôi kết hợp',
      pair: num1,
      reasoning: `Chữ số đầu <b>${h[0]}</b> xuất hiện ${h[1]} lần và chữ số đuôi <b>${t[0]}</b> xuất hiện ${t[1]} lần trong bảng lô ${win.length} kỳ gần nhất — ghép lại thành số <b>${num1}</b>.`,
    });
  }

  // 2) Song thủ lô (đồng xuất hiện): 2 số cùng về chung 1 kỳ nhiều lần nhất
  {
    const coCount = {};
    allLoLists.forEach(loSet => {
      const uniq = Array.from(new Set(loSet));
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const key = uniq[i] < uniq[j] ? uniq[i] + '-' + uniq[j] : uniq[j] + '-' + uniq[i];
          coCount[key] = (coCount[key] || 0) + 1;
        }
      }
    });
    const ranked = Object.entries(coCount).sort((a, b) => b[1] - a[1]);
    const topN = ranked.slice(0, 5);
    if (topN.length) {
      const pick = topN[Math.floor(Math.random() * topN.length)];
      out.push({
        formula: 'Song thủ lô (đồng xuất hiện)',
        pair: pick[0],
        reasoning: `Cặp số <b>${pick[0]}</b> cùng xuất hiện chung trong <b>${pick[1]}</b> kỳ (trên tổng ${win.length} kỳ gần nhất) — mức đồng xuất hiện cao nhất trong dữ liệu hiện có.`,
      });
    }
  }

  // 3) Số gan kép: số gan lâu nhất ghép với số tần suất cao nhất hiện tại (bù trừ nóng - lạnh)
  {
    const ganRanked = Object.entries(gan).sort((a, b) => b[1] - a[1]);
    const freqRanked = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const topGan = ganRanked.slice(0, 3);
    const topFreq = freqRanked.slice(0, 3);
    const g = topGan[Math.floor(Math.random() * topGan.length)];
    const f = topFreq[Math.floor(Math.random() * topFreq.length)];
    out.push({
      formula: 'Số gan kép (bù nóng – lạnh)',
      pair: `${g[0]}-${f[0]}`,
      reasoning: `Số <b>${g[0]}</b> đã gan ${g[1]} kỳ chưa về (số lạnh), kết hợp với số <b>${f[0]}</b> đang có tần suất cao nhất (${f[1]} lần trong ${win.length} kỳ) — chiến thuật bù trừ giữa số nóng và số lạnh.`,
    });
  }

  return out;
}

/* ---------- 8. LƯU & SO SÁNH DỰ BÁO ---------- */

function nextDrawDateISO(provinceSlug, fromDate) {
  const p = provinceBySlug(provinceSlug);
  if (!p) return null;
  const dayIdxSet = new Set(p.days.map(d => DAY_INDEX[d]));
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setHours(0, 0, 0, 0);
  for (let off = 0; off < 8; off++) {
    const d = new Date(base);
    d.setDate(base.getDate() + off);
    if (dayIdxSet.has(d.getDay())) return isoDate(d);
  }
  return null;
}

function isoDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function savePrediction(forecast, pairFormulas) {
  const targetDate = nextDrawDateISO(forecast.province, new Date());
  const record = {
    id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
    province: forecast.province,
    savedAt: new Date().toISOString(),
    targetDate,
    windowSize: forecast.windowSize,
    items: forecast.items.map(it => ({ key: it.key, label: it.label, numbers: it.numbers.map(n => n.number) })),
    pairFormulas: (pairFormulas || []).map(p => ({ formula: p.formula, pair: p.pair })),
  };
  PREDICTIONS.unshift(record);
  saveJSON(LS_KEYS.predictions, PREDICTIONS);
  return record;
}

function findActualDraw(provinceSlug, dateISO) {
  return getAllDrawsForProvince(provinceSlug).find(d => d.date === dateISO) || null;
}

function evaluatePrediction(pred) {
  const actual = findActualDraw(pred.province, pred.targetDate);
  if (!actual) return { status: 'pending', actual: null, hits: [] };
  const hits = [];
  pred.items.forEach(it => {
    const actualLo = loOfPrize(actual, it.key);
    const matched = it.numbers.filter(n => actualLo.includes(n));
    hits.push({ key: it.key, label: it.label, predicted: it.numbers, actual: actualLo, matched });
  });
  const totalMatched = hits.reduce((s, h) => s + h.matched.length, 0);
  return { status: totalMatched > 0 ? 'win' : 'lose', actual, hits, totalMatched };
}

function buildDeviationNote(pred, evalResult) {
  if (evalResult.status === 'pending') return '';
  const allDraws = getAllDrawsForProvince(pred.province);
  const notes = [];
  evalResult.hits.forEach(h => {
    if (h.matched.length > 0) {
      notes.push(`${h.label}: dự báo đúng số <b>${h.matched.join(', ')}</b>.`);
    } else if (h.actual.length) {
      // xem thứ hạng xác suất của số thực tế về so với bảng điểm tại thời điểm đó
      const stat = computeScoresForGiai(allDraws.filter(d => d.date < pred.targetDate), h.key, pred.windowSize || 30);
      const ranks = h.actual.map(n => `${n} (hạng ${rankOf(stat.scores, n)}/100)`);
      notes.push(`${h.label}: kết quả thực tế là ${ranks.join(', ')} — không nằm trong nhóm dự báo. Điều này cho thấy yếu tố ngẫu nhiên vẫn chi phối mạnh, kể cả với số có điểm xác suất thấp.`);
    }
  });
  return notes.join(' ');
}

function deletePrediction(id) {
  PREDICTIONS = PREDICTIONS.filter(p => p.id !== id);
  saveJSON(LS_KEYS.predictions, PREDICTIONS);
}

/* ---------- 9. PHÂN TÍCH VĂN BẢN (DÙNG CHUNG CHO DÁN TAY & CẬP NHẬT MẠNG) ---------- */

const PRIZE_REGEX = [
  { key: 'db', re: /Gi(ả|a)i\s*(Đ(ặ|a)c\s*Bi(ệ|e)t|ĐB)[^\d]{0,40}(\d{6})\b/i, digits: 6, group: 5 },
  { key: 'g1', re: /Gi(ả|a)i\s*nh(ấ|a)t[^\d]{0,40}(\d{5})\b/i, digits: 5, group: 3 },
  { key: 'g2', re: /Gi(ả|a)i\s*nh(ì|i)[^\d]{0,40}(\d{5})\b/i, digits: 5, group: 3 },
  { key: 'g3', re: /Gi(ả|a)i\s*ba[^\d]{0,40}(\d{10})\b/i, digits: 10, group: 2, split: 5 },
  { key: 'g4', re: /Gi(ả|a)i\s*t(ư|u)[^\d]{0,40}(\d{35})\b/i, digits: 35, group: 3, split: 5 },
  { key: 'g5', re: /Gi(ả|a)i\s*n(ă|a)m[^\d]{0,40}(\d{4})\b/i, digits: 4, group: 3 },
  { key: 'g6', re: /Gi(ả|a)i\s*s(á|a)u[^\d]{0,40}(\d{12})\b/i, digits: 12, group: 3, split: 4 },
  { key: 'g7', re: /Gi(ả|a)i\s*b(ả|a)y[^\d]{0,40}(\d{3})\b/i, digits: 3, group: 3 },
  { key: 'g8', re: /Gi(ả|a)i\s*(t(á|a)m|8)[^\d]{0,40}(\d{2})\b/i, digits: 2, group: 4 },
];

function splitDigits(str, size) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/g;

// Tách văn bản thô (đã copy từ trang web) thành từng đoạn ứng với 1 kỳ quay, dựa trên các vị trí xuất hiện ngày.
function splitTextByDate(text) {
  const matches = [...text.matchAll(DATE_RE)];
  if (!matches.length) return [];
  const segments = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    segments.push({ dateStr: matches[i][0], text: text.slice(start, end) });
  }
  return segments;
}

function parseSegmentToDraw(segment, provinceSlug) {
  const [dd, mm, yyyy] = segment.dateStr.split('/');
  const dateISO = `${yyyy}-${mm}-${dd}`;
  const prizes = {};
  let foundCount = 0;
  for (const pr of PRIZE_REGEX) {
    const m = segment.text.match(pr.re);
    if (!m) continue;
    const raw = m[pr.group];
    if (!raw || raw.length !== pr.digits) continue;
    prizes[pr.key] = pr.split ? splitDigits(raw, pr.split) : raw;
    foundCount++;
  }
  if (foundCount < PRIZE_REGEX.length) return null; // yêu cầu đủ cả 9 giải mới chấp nhận, tránh dữ liệu thiếu/sai
  // Ưu tiên tìm theo "Loại vé:" trước (đứng riêng, không để chung 1 pattern với XS-prefix vì có thể match nhầm
  // ở cụm "XSHCM - Loại vé: 8B2" nếu để chung alternation — leftmost match sẽ ăn vào chữ "Loại").
  let ticketCode = '';
  const m1 = segment.text.match(/Lo(ạ|a)i\s*v[ée]\s*[:：]?\s*([A-Z0-9]{2,8})/i);
  if (m1) {
    ticketCode = m1[2];
  } else {
    const m2 = segment.text.match(/XS[A-ZĐ]{2,5}\s*-\s*([A-Z0-9]{2,8})/i);
    if (m2) ticketCode = m2[1];
  }
  return {
    province: provinceSlug,
    date: dateISO,
    ticketCode,
    prizes,
  };
}

function parseDrawsFromText(text, provinceSlug) {
  const segments = splitTextByDate(text);
  const draws = [];
  let skipped = 0;
  segments.forEach(seg => {
    const d = parseSegmentToDraw(seg, provinceSlug);
    if (d) draws.push(d); else skipped++;
  });
  return { draws, skipped, totalSegments: segments.length };
}

function mergeExtraDraws(newDraws) {
  const map = new Map();
  EXTRA_DRAWS.forEach(d => map.set(dedupeKey(d), d));
  let added = 0, updated = 0;
  newDraws.forEach(d => {
    const k = dedupeKey(d);
    if (map.has(k)) updated++; else added++;
    map.set(k, d);
  });
  EXTRA_DRAWS = Array.from(map.values());
  saveJSON(LS_KEYS.extraDraws, EXTRA_DRAWS);
  return { added, updated };
}

/* ---------- 10. CẬP NHẬT DỮ LIỆU QUA MẠNG (CORS PROXY) ---------- */

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function fetchProvinceLive(slug) {
  const target = `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-nam/${slug}.html`;
  const url = CORS_PROXY + encodeURIComponent(target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body ? doc.body.innerText || doc.body.textContent : html;
    const { draws, skipped } = parseDrawsFromText(text, slug);
    if (draws.length) mergeExtraDraws(draws);
    return { ok: true, count: draws.length, skipped };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e.message || String(e) };
  }
}

/* ---------- 11. RENDER: HEADER / SELECT / TABS ---------- */

function populateProvinceSelects() {
  const grouped = {};
  PROVINCES.forEach(p => {
    const dayKey = p.days.join(', ');
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(p);
  });
  const buildOptions = () => {
    let html = '';
    Object.keys(grouped).forEach(dayKey => {
      html += `<optgroup label="${dayKey}">`;
      grouped[dayKey].forEach(p => {
        html += `<option value="${p.slug}">${p.name}</option>`;
      });
      html += `</optgroup>`;
    });
    return html;
  };
  const sel1 = document.getElementById('provinceSelect');
  const sel2 = document.getElementById('pasteProvinceSelect');
  sel1.innerHTML = buildOptions();
  sel2.innerHTML = buildOptions();
  sel1.value = SELECTED_PROVINCE;
  sel2.value = SELECTED_PROVINCE;
}

function setTodayPill() {
  const d = new Date();
  document.getElementById('todayPill').textContent = pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
}

function initTabs() {
  document.querySelectorAll('.tabbar button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabbar button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-stats') renderStatsTab();
      if (btn.dataset.tab === 'tab-compare') renderCompareTab();
      if (btn.dataset.tab === 'tab-settings') renderSettingsTab();
    });
  });
}

function initWindowChips() {
  document.querySelectorAll('#windowChipRow .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#windowChipRow .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      WINDOW_SIZE = parseInt(chip.dataset.w, 10);
      localStorage.setItem(LS_KEYS.windowSize, String(WINDOW_SIZE));
      renderForecastHeader();
      if (document.getElementById('tab-stats').classList.contains('active')) renderStatsTab();
    });
  });
  document.querySelectorAll('#windowChipRow .chip').forEach(c => {
    if (parseInt(c.dataset.w, 10) === WINDOW_SIZE) c.classList.add('active');
    else c.classList.remove('active');
  });
}

function onProvinceChange(slug) {
  SELECTED_PROVINCE = slug;
  localStorage.setItem(LS_KEYS.province, slug);
  document.getElementById('provinceSelect').value = slug;
  document.getElementById('pasteProvinceSelect').value = slug;
  renderForecastHeader();
  document.getElementById('forecastResults').innerHTML = '';
  document.getElementById('pairFormulaCard').style.display = 'none';
  if (document.getElementById('tab-stats').classList.contains('active')) renderStatsTab();
}

function renderForecastHeader() {
  const p = provinceBySlug(SELECTED_PROVINCE);
  document.getElementById('fcProvinceName').textContent = p ? p.name : '--';
}

/* ---------- 12. RENDER: TAB DỰ BÁO ---------- */

function renderForecast() {
  const p = provinceBySlug(SELECTED_PROVINCE);
  const forecast = generateFullForecast(SELECTED_PROVINCE, WINDOW_SIZE);
  const container = document.getElementById('forecastResults');

  if (forecast.empty) {
    container.innerHTML = `<div class="card"><div class="empty-state">Chưa có dữ liệu lịch sử cho ${p.name}.<br/>Vào tab Cài đặt để Cập nhật dữ liệu hoặc dán dữ liệu thủ công.</div></div>`;
    document.getElementById('pairFormulaCard').style.display = 'none';
    LAST_FORECAST = null;
    return;
  }

  let html = '';
  forecast.items.forEach(it => {
    html += `<div class="prize-card">
      <div class="prize-head">
        <span class="prize-name">${it.label}</span>
        <span class="prize-tag">${p.name}</span>
      </div>
      <div class="num-chip-row">${it.numbers.map(n => `<span class="num-chip">${n.number}</span>`).join('')}</div>
      ${it.numbers.map(n => `<div class="reasoning">${n.reasoning}</div>`).join('')}
    </div>`;
  });
  container.innerHTML = html;

  const pairFormulas = generatePairFormulas(SELECTED_PROVINCE, WINDOW_SIZE);
  const pairCard = document.getElementById('pairFormulaCard');
  const pairResults = document.getElementById('pairFormulaResults');
  if (pairFormulas.length) {
    pairCard.style.display = '';
    pairResults.innerHTML = pairFormulas.map(pf => `
      <div class="pair-card">
        <div class="pair-formula">${pf.formula}</div>
        <div class="pair-nums">${pf.pair}</div>
        <div class="pair-reason">${pf.reasoning}</div>
      </div>`).join('');
  } else {
    pairCard.style.display = 'none';
  }

  LAST_FORECAST = { forecast, pairFormulas };
}

function initForecastTab() {
  document.getElementById('btnForecast').addEventListener('click', renderForecast);
  document.getElementById('btnSavePrediction').addEventListener('click', () => {
    if (!LAST_FORECAST) {
      alert('Hãy bấm "Dự Báo Ngay" trước khi lưu.');
      return;
    }
    const rec = savePrediction(LAST_FORECAST.forecast, LAST_FORECAST.pairFormulas);
    alert(`Đã lưu dự báo cho ${provinceBySlug(rec.province).name} — kỳ dự kiến ${rec.targetDate}. Xem ở tab "So Sánh".`);
  });
}

/* ---------- 13. RENDER: TAB THỐNG KÊ ---------- */

function renderStatsTab() {
  const p = provinceBySlug(SELECTED_PROVINCE);
  document.getElementById('statProvinceName').textContent = p.name;
  const allDraws = getAllDrawsForProvince(SELECTED_PROVINCE);
  const win = windowedDraws(allDraws, WINDOW_SIZE);

  // Lịch sử
  const historyEl = document.getElementById('historyList');
  if (!win.length) {
    historyEl.innerHTML = '<div class="empty-state">Chưa có dữ liệu.</div>';
  } else {
    historyEl.innerHTML = win.map(d => `
      <div class="history-row">
        <div>
          <div class="hd">${d.date}${d.ticketCode ? ' · ' + d.ticketCode : ''}</div>
          <div class="history-lo">Lô: ${loOfDraw(d).join(' ')}</div>
        </div>
        <div class="hdb">${d.prizes.db}</div>
      </div>`).join('');
  }

  if (!win.length) {
    document.getElementById('headTailTable').innerHTML = '';
    document.getElementById('ganList').innerHTML = '<div class="empty-state">--</div>';
    document.getElementById('hotList').innerHTML = '<div class="empty-state">--</div>';
    return;
  }

  // Bảng đầu - đuôi
  const flat = win.map(d => loOfDraw(d)).flat();
  const freq = freqTable(flat);
  const byHeadTail = {}; // "h-t" -> count (thực tế đếm theo số cụ thể, không phải riêng head/tail)
  flat.forEach(v => { byHeadTail[v] = (byHeadTail[v] || 0) + 1; });

  let tableHtml = '<tr><th>Chục\\Đơn vị</th>' + [...Array(10).keys()].map(i => `<th>${i}</th>`).join('') + '</tr>';
  for (let h = 0; h < 10; h++) {
    tableHtml += `<tr><th>${h}</th>`;
    for (let t = 0; t < 10; t++) {
      const n = `${h}${t}`;
      const c = byHeadTail[n] || 0;
      tableHtml += `<td style="${c > 0 ? 'color:var(--accent);font-weight:800;' : 'color:var(--text-dim);'}">${c || '·'}</td>`;
    }
    tableHtml += '</tr>';
  }
  document.getElementById('headTailTable').innerHTML = tableHtml;

  // Gan cực đại (dùng toàn bộ lịch sử, không giới hạn cửa sổ, để phản ánh đúng "gan")
  const ganFull = ganTable(allDraws, d => loOfDraw(d));
  const ganRanked = Object.entries(ganFull).sort((a, b) => b[1] - a[1]).slice(0, 10);
  document.getElementById('ganList').innerHTML = ganRanked.map(([n, g]) => `
    <div class="history-row">
      <span class="hdb" style="font-size:16px;">${n}</span>
      <span class="badge cold">Gan ${g} kỳ</span>
    </div>`).join('');

  // Số nóng
  const hotRanked = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  document.getElementById('hotList').innerHTML = hotRanked.map(([n, f]) => `
    <div class="history-row">
      <span class="hdb" style="font-size:16px;">${n}</span>
      <span class="badge hot">${f} lần / ${win.length} kỳ</span>
    </div>`).join('');
}

/* ---------- 14. RENDER: TAB SO SÁNH ---------- */

function renderCompareTab() {
  const listEl = document.getElementById('predictionList');
  const summaryEl = document.getElementById('compareSummary');

  if (!PREDICTIONS.length) {
    listEl.innerHTML = '<div class="card"><div class="empty-state">Chưa có dự báo nào được lưu. Sang tab Dự Báo, bấm "Dự Báo Ngay" rồi "Lưu dự báo này".</div></div>';
    summaryEl.innerHTML = '';
    return;
  }

  let winCount = 0, loseCount = 0, pendingCount = 0;
  let html = '';
  PREDICTIONS.forEach(pred => {
    const ev = evaluatePrediction(pred);
    if (ev.status === 'win') winCount++;
    else if (ev.status === 'lose') loseCount++;
    else pendingCount++;

    const p = provinceBySlug(pred.province);
    const statusLabel = ev.status === 'win' ? `🎉 Trúng ${ev.totalMatched} số` : ev.status === 'lose' ? '✗ Chưa trúng' : '⏳ Chờ kết quả';
    const statusClass = ev.status === 'win' ? 'win' : ev.status === 'lose' ? 'lose' : 'pending';

    let detail = '';
    if (ev.status !== 'pending') {
      const note = buildDeviationNote(pred, ev);
      detail = `<div class="pred-detail">${note}</div>`;
    }

    html += `<div class="pred-item">
      <div class="pred-top">
        <div>
          <div class="pred-title">${p ? p.name : pred.province}</div>
          <div class="pred-date">Kỳ dự kiến: ${pred.targetDate} · Lưu lúc ${new Date(pred.savedAt).toLocaleString('vi-VN')}</div>
        </div>
        <span class="pred-status ${statusClass}">${statusLabel}</span>
      </div>
      ${detail}
      <div class="btn-row"><button class="btn-danger" data-del="${pred.id}">Xoá</button></div>
    </div>`;
  });
  listEl.innerHTML = html;

  const total = PREDICTIONS.length;
  const evaluated = winCount + loseCount;
  const rate = evaluated ? Math.round((winCount / evaluated) * 100) : 0;
  summaryEl.innerHTML = `
    <div class="data-count-grid">
      <div><span class="n">${total}</span>Tổng dự báo</div>
      <div><span class="n">${winCount}</span>Trúng ≥1 số</div>
      <div><span class="n">${pendingCount}</span>Đang chờ</div>
    </div>
    ${evaluated ? `<p class="sub" style="margin-top:10px;">Tỷ lệ dự báo trúng ít nhất 1 số/giải trong số ${evaluated} kỳ đã có kết quả: <b style="color:var(--accent)">${rate}%</b>. Con số này chỉ mang tính tham khảo hiệu quả các công thức đang dùng, không phải xác suất trúng thật của toàn bộ giải thưởng.</p>` : ''}
  `;

  listEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      deletePrediction(btn.dataset.del);
      renderCompareTab();
    });
  });
}

/* ---------- 15. RENDER: TAB CÀI ĐẶT ---------- */

function renderSettingsTab() {
  const counts = countDrawsPerProvince();
  const grid = document.getElementById('dataCountGrid');
  grid.innerHTML = PROVINCES.map(p => `<div><span class="n">${counts[p.slug]}</span>${p.name}</div>`).join('');
}

function setStatus(elId, text, type) {
  const el = document.getElementById(elId);
  el.innerHTML = `<div class="status-line ${type}">${text}</div>`;
}

function initSettingsTab() {
  document.getElementById('btnUpdateCurrent').addEventListener('click', async () => {
    setStatus('updateStatus', `Đang tải dữ liệu mới cho ${provinceBySlug(SELECTED_PROVINCE).name}...`, 'info');
    const r = await fetchProvinceLive(SELECTED_PROVINCE);
    if (r.ok) {
      setStatus('updateStatus', `✓ Đã cập nhật ${r.count} kỳ quay cho ${provinceBySlug(SELECTED_PROVINCE).name}${r.skipped ? ` (bỏ qua ${r.skipped} đoạn không đủ dữ liệu)` : ''}.`, 'ok');
      renderSettingsTab();
    } else {
      setStatus('updateStatus', `✗ Không lấy được dữ liệu (${r.error}). Trang nguồn có thể đã đổi cấu trúc, hoặc mạng chặn proxy. Hãy thử cách dán dữ liệu thủ công bên dưới.`, 'err');
    }
  });

  document.getElementById('btnUpdateAll').addEventListener('click', async () => {
    let ok = 0, fail = 0, total = 0;
    for (const p of PROVINCES) {
      setStatus('updateStatus', `Đang cập nhật ${p.name}... (${ok + fail}/${PROVINCES.length})`, 'info');
      const r = await fetchProvinceLive(p.slug);
      if (r.ok) { ok++; total += r.count; } else { fail++; }
    }
    setStatus('updateStatus', `✓ Hoàn tất: cập nhật thành công ${ok}/${PROVINCES.length} tỉnh, tổng ${total} kỳ quay mới. ${fail ? `${fail} tỉnh lỗi (có thể do mạng hoặc proxy).` : ''}`, fail ? 'err' : 'ok');
    renderSettingsTab();
  });

  document.getElementById('btnParsePaste').addEventListener('click', () => {
    const text = document.getElementById('pasteArea').value.trim();
    const slug = document.getElementById('pasteProvinceSelect').value;
    if (!text) { setStatus('pasteStatus', 'Vui lòng dán nội dung trước.', 'err'); return; }
    const { draws, skipped, totalSegments } = parseDrawsFromText(text, slug);
    if (!draws.length) {
      setStatus('pasteStatus', `Không nhận diện được kỳ quay nào hợp lệ (đã thử ${totalSegments} đoạn). Hãy đảm bảo đã copy đủ các dòng "Giải ĐB", "Giải nhất"... và ngày quay dạng DD/MM/YYYY.`, 'err');
      return;
    }
    const { added, updated } = mergeExtraDraws(draws);
    setStatus('pasteStatus', `✓ Đã nhập ${draws.length} kỳ (${added} kỳ mới, ${updated} kỳ cập nhật lại)${skipped ? `, bỏ qua ${skipped} đoạn thiếu dữ liệu` : ''}.`, 'ok');
    document.getElementById('pasteArea').value = '';
    renderSettingsTab();
  });

  document.getElementById('btnResetData').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ dữ liệu đã cập nhật/dán thêm và các dự báo đã lưu? (Dữ liệu gốc đi kèm ứng dụng sẽ không bị mất)')) return;
    EXTRA_DRAWS = [];
    PREDICTIONS = [];
    saveJSON(LS_KEYS.extraDraws, EXTRA_DRAWS);
    saveJSON(LS_KEYS.predictions, PREDICTIONS);
    renderSettingsTab();
    setStatus('updateStatus', 'Đã xoá dữ liệu bổ sung và dự báo đã lưu.', 'ok');
  });
}

/* ---------- 16. KHỞI ĐỘNG ---------- */

async function loadSeedData() {
  // Dữ liệu gốc được nhúng sẵn trong data/xsmn_seed.js (window.__XSMN_SEED__) để app chạy được
  // ngay cả khi mở trực tiếp file index.html trên điện thoại (không cần máy chủ web),
  // vì fetch() các file cục bộ thường bị trình duyệt chặn (CORS) khi chạy qua giao thức file://.
  if (window.__XSMN_SEED__ && Array.isArray(window.__XSMN_SEED__.draws)) {
    SEED_DRAWS = window.__XSMN_SEED__.draws;
    return;
  }
  // Dự phòng: nếu app được chạy qua máy chủ web (http/https) và vì lý do nào đó chưa nhúng được,
  // thử tải qua fetch bình thường.
  try {
    const resp = await fetch('data/xsmn_seed.json');
    const json = await resp.json();
    SEED_DRAWS = json.draws || [];
  } catch (e) {
    SEED_DRAWS = [];
    console.error('Không tải được dữ liệu gốc:', e);
  }
}

async function init() {
  setTodayPill();
  await loadSeedData();
  populateProvinceSelects();
  initTabs();
  initWindowChips();
  initForecastTab();
  initSettingsTab();
  renderForecastHeader();

  document.getElementById('provinceSelect').addEventListener('change', (e) => onProvinceChange(e.target.value));
  document.getElementById('pasteProvinceSelect').addEventListener('change', (e) => { SELECTED_PROVINCE = e.target.value; });

  renderSettingsTab();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
