/* =========================================================================
   DỰ BÁO XSMN V2
   Thống kê dữ liệu lịch sử + Multi-window Statistical Scoring Engine

   V2:
   - Frequency
   - Gan / Overdue
   - Head / Tail
   - Recent Trend
   - Momentum
   - Cycle
   - Stability
   - Multi-window 10/20/30/60 kỳ
   - Deterministic Ranking
   - Confidence Score
   - Pair / Co-occurrence
   - Backtest-friendly

   Toàn bộ logic phân tích chạy trên thiết bị người dùng.
   ========================================================================= */


/* =========================================================================
   1. DỮ LIỆU TỈNH
   ========================================================================= */

const DAY_INDEX = {
  'Chủ Nhật': 0,
  'Thứ Hai': 1,
  'Thứ Ba': 2,
  'Thứ Tư': 3,
  'Thứ Năm': 4,
  'Thứ Sáu': 5,
  'Thứ Bảy': 6
};


const PROVINCES = [

  {
    slug: 'tp-hcm',
    name: 'TP. HCM',
    days: ['Thứ Hai', 'Thứ Bảy']
  },

  {
    slug: 'dong-thap',
    name: 'Đồng Tháp',
    days: ['Thứ Hai']
  },

  {
    slug: 'ca-mau',
    name: 'Cà Mau',
    days: ['Thứ Hai']
  },

  {
    slug: 'ben-tre',
    name: 'Bến Tre',
    days: ['Thứ Ba']
  },

  {
    slug: 'vung-tau',
    name: 'Vũng Tàu',
    days: ['Thứ Ba']
  },

  {
    slug: 'bac-lieu',
    name: 'Bạc Liêu',
    days: ['Thứ Ba']
  },

  {
    slug: 'dong-nai',
    name: 'Đồng Nai',
    days: ['Thứ Tư']
  },

  {
    slug: 'can-tho',
    name: 'Cần Thơ',
    days: ['Thứ Tư']
  },

  {
    slug: 'soc-trang',
    name: 'Sóc Trăng',
    days: ['Thứ Tư']
  },

  {
    slug: 'tay-ninh',
    name: 'Tây Ninh',
    days: ['Thứ Năm']
  },

  {
    slug: 'an-giang',
    name: 'An Giang',
    days: ['Thứ Năm']
  },

  {
    slug: 'binh-thuan',
    name: 'Bình Thuận',
    days: ['Thứ Năm']
  },

  {
    slug: 'vinh-long',
    name: 'Vĩnh Long',
    days: ['Thứ Sáu']
  },

  {
    slug: 'binh-duong',
    name: 'Bình Dương',
    days: ['Thứ Sáu']
  },

  {
    slug: 'tra-vinh',
    name: 'Trà Vinh',
    days: ['Thứ Sáu']
  },

  {
    slug: 'long-an',
    name: 'Long An',
    days: ['Thứ Bảy']
  },

  {
    slug: 'binh-phuoc',
    name: 'Bình Phước',
    days: ['Thứ Bảy']
  },

  {
    slug: 'hau-giang',
    name: 'Hậu Giang',
    days: ['Thứ Bảy']
  },

  {
    slug: 'tien-giang',
    name: 'Tiền Giang',
    days: ['Chủ Nhật']
  },

  {
    slug: 'kien-giang',
    name: 'Kiên Giang',
    days: ['Chủ Nhật']
  },

  {
    slug: 'da-lat',
    name: 'Đà Lạt',
    days: ['Chủ Nhật']
  }

];


function provinceBySlug(slug) {
  return PROVINCES.find(p => p.slug === slug);
}


/* =========================================================================
   2. CƠ CẤU GIẢI XSMN
   ========================================================================= */

const PRIZE_META = [

  {
    key: 'db',
    label: 'Giải Đặc Biệt',
    count: 1,
    digits: 6
  },

  {
    key: 'g1',
    label: 'Giải Nhất',
    count: 1,
    digits: 5
  },

  {
    key: 'g2',
    label: 'Giải Nhì',
    count: 1,
    digits: 5
  },

  {
    key: 'g3',
    label: 'Giải Ba',
    count: 2,
    digits: 5
  },

  {
    key: 'g4',
    label: 'Giải Tư',
    count: 7,
    digits: 5
  },

  {
    key: 'g5',
    label: 'Giải Năm',
    count: 1,
    digits: 4
  },

  {
    key: 'g6',
    label: 'Giải Sáu',
    count: 3,
    digits: 4
  },

  {
    key: 'g7',
    label: 'Giải Bảy',
    count: 1,
    digits: 3
  },

  {
    key: 'g8',
    label: 'Giải Tám',
    count: 1,
    digits: 2
  }

];


function prizeMetaOf(key) {
  return PRIZE_META.find(p => p.key === key);
}


/* =========================================================================
   3. STATE + LOCAL STORAGE
   ========================================================================= */

const LS_KEYS = {

  extraDraws: 'xskt_extra_draws',

  predictions: 'xskt_predictions',

  province: 'xskt_selected_province',

  windowSize: 'xskt_window_size'

};


let SEED_DRAWS = [];

let EXTRA_DRAWS =
  loadJSON(LS_KEYS.extraDraws, []);

let PREDICTIONS =
  loadJSON(LS_KEYS.predictions, []);

let SELECTED_PROVINCE =
  localStorage.getItem(
    LS_KEYS.province
  ) || 'tp-hcm';

let WINDOW_SIZE =
  parseInt(
    localStorage.getItem(
      LS_KEYS.windowSize
    ) || '30',
    10
  );

let LAST_FORECAST = null;


function loadJSON(key, fallback) {

  try {

    const raw =
      localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : fallback;

  } catch (e) {

    return fallback;

  }

}


function saveJSON(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (e) {

    console.warn(
      'Không lưu được localStorage:',
      e
    );

  }

}


/* =========================================================================
   4. TIỆN ÍCH
   ========================================================================= */

function pad2(n) {

  return String(n)
    .padStart(2, '0');

}


function clamp(v, min = 0, max = 1) {

  return Math.max(
    min,
    Math.min(max, v)
  );

}


function safeDiv(a, b) {

  if (!b) return 0;

  return a / b;

}


function mean(arr) {

  if (!arr.length) return 0;

  return arr.reduce(
    (a, b) => a + b,
    0
  ) / arr.length;

}


function stdDev(arr) {

  if (arr.length < 2)
    return 0;

  const avg = mean(arr);

  const variance =
    mean(
      arr.map(
        v => Math.pow(v - avg, 2)
      )
    );

  return Math.sqrt(variance);

}


function numbersOfPrize(draw, key) {

  if (
    !draw ||
    !draw.prizes
  ) return [];

  const v =
    draw.prizes[key];

  if (v == null)
    return [];

  return Array.isArray(v)
    ? v
    : [v];

}


function loOfPrize(draw, key) {

  return numbersOfPrize(
    draw,
    key
  )
    .map(v => String(v))
    .filter(v => v.length >= 2)
    .map(v => v.slice(-2));

}


function loOfDraw(draw) {

  const out = [];

  PRIZE_META.forEach(pm => {

    loOfPrize(
      draw,
      pm.key
    ).forEach(
      n => out.push(n)
    );

  });

  return out;

}


function dedupeKey(draw) {

  return (
    draw.province +
    '|' +
    draw.date
  );

}


function getAllDrawsForProvince(slug) {

  const map =
    new Map();


  SEED_DRAWS
    .filter(
      d => d.province === slug
    )
    .forEach(
      d => map.set(
        dedupeKey(d),
        d
      )
    );


  EXTRA_DRAWS
    .filter(
      d => d.province === slug
    )
    .forEach(
      d => map.set(
        dedupeKey(d),
        d
      )
    );


  return Array
    .from(map.values())
    .sort(
      (a, b) =>
        b.date.localeCompare(
          a.date
        )
    );

}


function countDrawsPerProvince() {

  const out = {};

  PROVINCES.forEach(
    p => {

      out[p.slug] =
        getAllDrawsForProvince(
          p.slug
        ).length;

    }
  );

  return out;

}


function windowedDraws(
  draws,
  size
) {

  return draws.slice(
    0,
    Math.min(
      size,
      draws.length
    )
  );

}


/* =========================================================================
   5. FREQUENCY
   ========================================================================= */

function freqTable(values) {

  const table = {};

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    table[pad2(i)] = 0;

  }


  values.forEach(v => {

    if (
      table[v] !== undefined
    ) {

      table[v]++;

    }

  });


  return table;

}


/* =========================================================================
   6. GAN
   ========================================================================= */

function ganTable(
  draws,
  getValues
) {

  const gan = {};

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    gan[pad2(i)] =
      draws.length;

  }


  const found =
    new Set();


  draws.forEach(
    (draw, index) => {

      getValues(draw)
        .forEach(v => {

          if (
            !found.has(v)
          ) {

            found.add(v);

            gan[v] =
              index;

          }

        });

    }
  );


  return gan;

}


/* =========================================================================
   7. HEAD / TAIL
   ========================================================================= */

function headTailFreq(values) {

  const head =
    new Array(10).fill(0);

  const tail =
    new Array(10).fill(0);


  values.forEach(v => {

    if (
      typeof v !== 'string' ||
      v.length !== 2
    ) return;

    head[
      Number(v[0])
    ]++;

    tail[
      Number(v[1])
    ]++;

  });


  return {
    head,
    tail
  };

}


/* =========================================================================
   8. NORMALIZATION
   ========================================================================= */

function minMaxNormalize(obj) {

  const values =
    Object.values(obj);

  if (!values.length)
    return {};


  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  const range =
    max - min;


  const out = {};


  Object.keys(obj)
    .forEach(k => {

      out[k] =
        range === 0
          ? 0.5
          : (obj[k] - min) /
            range;

    });


  return out;

}


/* =========================================================================
   9. V2 CONFIG
   ========================================================================= */

/*
   Tổng trọng số = 1.00

   frequency  : 25%
   recent     : 18%
   momentum   : 12%
   gan        : 15%
   cycle      : 12%
   headTail   : 8%
   stability  : 10%
*/

const V2_WEIGHTS = {

  frequency: 0.25,

  recent: 0.18,

  momentum: 0.12,

  gan: 0.15,

  cycle: 0.12,

  headTail: 0.08,

  stability: 0.10

};


const MULTI_WINDOWS = [
  10,
  20,
  30,
  60
];


/* =========================================================================
   10. MULTI WINDOW FREQUENCY
   ========================================================================= */

function frequencyForWindow(
  draws,
  giaiKey,
  size
) {

  const win =
    windowedDraws(
      draws,
      size
    );

  const values = [];

  win.forEach(d => {

    loOfPrize(
      d,
      giaiKey
    ).forEach(
      n => values.push(n)
    );

  });


  return {

    window: win.length,

    values,

    freq:
      freqTable(values)

  };

}


function multiWindowFrequency(
  draws,
  giaiKey
) {

  const result = {};

  MULTI_WINDOWS.forEach(
    w => {

      result[w] =
        frequencyForWindow(
          draws,
          giaiKey,
          w
        );

    }
  );

  return result;

}


/* =========================================================================
   11. RECENCY SCORE
   ========================================================================= */

function calculateRecencyScores(
  draws,
  giaiKey,
  maxWindow = 30
) {

  const win =
    windowedDraws(
      draws,
      maxWindow
    );

  const scores = {};

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    scores[pad2(i)] = 0;

  }


  win.forEach(
    (draw, index) => {

      /*
       * Kỳ càng gần hiện tại
       * trọng số càng lớn.
       */

      const weight =
        Math.exp(
          -index / 10
        );


      loOfPrize(
        draw,
        giaiKey
      ).forEach(n => {

        scores[n] +=
          weight;

      });

    }
  );


  return minMaxNormalize(
    scores
  );

}


/* =========================================================================
   12. MOMENTUM
   ========================================================================= */

function calculateMomentumScores(
  draws,
  giaiKey
) {

  const recent =
    frequencyForWindow(
      draws,
      giaiKey,
      10
    );

  const medium =
    frequencyForWindow(
      draws,
      giaiKey,
      30
    );


  const raw = {};


  const pm =
    prizeMetaOf(giaiKey);

  const countPerDraw =
    pm
      ? pm.count
      : 1;


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);


    const recentRate =
      safeDiv(
        recent.freq[n],
        Math.max(
          recent.window *
          countPerDraw,
          1
        )
      );


    const mediumRate =
      safeDiv(
        medium.freq[n],
        Math.max(
          medium.window *
          countPerDraw,
          1
        )
      );


    /*
     * >0 = đang tăng
     * <0 = đang giảm
     */

    raw[n] =
      recentRate -
      mediumRate;

  }


  return minMaxNormalize(
    raw
  );

}


/* =========================================================================
   13. CYCLE ANALYSIS
   ========================================================================= */

function occurrenceIndexes(
  draws,
  giaiKey,
  number
) {

  const indexes = [];

  draws.forEach(
    (draw, index) => {

      if (
        loOfPrize(
          draw,
          giaiKey
        ).includes(number)
      ) {

        indexes.push(index);

      }

    }
  );


  return indexes;

}


function calculateCycleScore(
  draws,
  giaiKey
) {

  const raw = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);

    const indexes =
      occurrenceIndexes(
        draws,
        giaiKey,
        n
      );


    if (
      indexes.length < 2
    ) {

      raw[n] = 0;

      continue;

    }


    const gaps = [];

    for (
      let j = 0;
      j <
      indexes.length - 1;
      j++
    ) {

      gaps.push(
        indexes[j + 1] -
        indexes[j]
      );

    }


    const avgGap =
      mean(gaps);


    const currentGap =
      indexes[0];


    /*
     * Điểm cao khi khoảng gan hiện tại
     * tiến gần chu kỳ lịch sử trung bình.
     *
     * Không coi "quá gan" là chắc chắn
     * phải xuất hiện.
     */

    if (
      avgGap <= 0
    ) {

      raw[n] = 0;

      continue;

    }


    const ratio =
      currentGap /
      avgGap;


    /*
     * peak quanh ratio = 1
     */

    raw[n] =
      Math.exp(
        -Math.abs(
          ratio - 1
        )
      );

  }


  return minMaxNormalize(
    raw
  );

}


/* =========================================================================
   14. STABILITY
   ========================================================================= */

function calculateStabilityScore(
  draws,
  giaiKey
) {

  const segments = [
    [0, 10],
    [10, 20],
    [20, 30]
  ];


  const raw = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);

    const rates = [];


    segments.forEach(
      ([start, end]) => {

        const segment =
          draws.slice(
            start,
            Math.min(
              end,
              draws.length
            )
          );


        if (!segment.length) {

          rates.push(0);

          return;

        }


        let count = 0;


        segment.forEach(d => {

          count +=
            loOfPrize(
              d,
              giaiKey
            )
            .filter(
              x => x === n
            ).length;

        });


        rates.push(
          count /
          segment.length
        );

      }
    );


    const avg =
      mean(rates);

    const sd =
      stdDev(rates);


    /*
     * Có xuất hiện đều ở nhiều đoạn
     * sẽ có stability cao hơn.
     */

    raw[n] =
      avg > 0
        ? avg /
          (1 + sd)
        : 0;

  }


  return minMaxNormalize(
    raw
  );

}


/* =========================================================================
   15. GAN SCORE V2
   ========================================================================= */

function calculateGanScore(
  draws,
  giaiKey
) {

  const gan =
    ganTable(
      draws,
      d =>
        loOfPrize(
          d,
          giaiKey
        )
    );


  /*
   * Không tăng điểm tuyến tính vô hạn.
   *
   * Sử dụng hàm saturation:
   *
   * gan/(gan+10)
   *
   * tránh suy luận:
   * "càng lâu chưa về càng chắc về".
   */

  const raw = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);

    const g =
      gan[n];

    raw[n] =
      g /
      (g + 10);

  }


  return {

    raw: gan,

    normalized:
      minMaxNormalize(raw)

  };

}


/* =========================================================================
   16. HEAD / TAIL SCORE V2
   ========================================================================= */

function calculateHeadTailScore(
  draws,
  giaiKey,
  size = 30
) {

  const win =
    windowedDraws(
      draws,
      size
    );

  const values = [];


  win.forEach(d => {

    loOfPrize(
      d,
      giaiKey
    ).forEach(
      n => values.push(n)
    );

  });


  const {
    head,
    tail
  } =
    headTailFreq(values);


  const headMax =
    Math.max(
      ...head,
      1
    );

  const tailMax =
    Math.max(
      ...tail,
      1
    );


  const score = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);

    score[n] =
      (
        head[
          Number(n[0])
        ] /
        headMax +

        tail[
          Number(n[1])
        ] /
        tailMax
      ) / 2;

  }


  return score;

}


/* =========================================================================
   17. FREQUENCY SCORE V2
   ========================================================================= */

function calculateMultiFrequencyScore(
  draws,
  giaiKey
) {

  const multi =
    multiWindowFrequency(
      draws,
      giaiKey
    );


  const raw = {};


  const windowWeights = {

    10: 0.40,

    20: 0.30,

    30: 0.20,

    60: 0.10

  };


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);

    let score = 0;


    MULTI_WINDOWS.forEach(
      w => {

        const data =
          multi[w];

        const total =
          Math.max(
            data.values.length,
            1
          );

        const rate =
          data.freq[n] /
          total;

        score +=
          rate *
          windowWeights[w];

      }
    );


    raw[n] =
      score;

  }


  return {

    raw,

    normalized:
      minMaxNormalize(raw),

    multi

  };

}


/* =========================================================================
   18. V2 SCORING ENGINE
   ========================================================================= */

function computeScoresForGiai(
  allDraws,
  giaiKey,
  windowSize
) {

  const pm =
    prizeMetaOf(giaiKey);


  const primaryWindow =
    windowedDraws(
      allDraws,
      windowSize
    );


  const flatValues = [];


  primaryWindow
    .forEach(d => {

      loOfPrize(
        d,
        giaiKey
      ).forEach(
        n =>
          flatValues.push(n)
      );

    });


  const freq =
    freqTable(
      flatValues
    );


  const expectedPerNumber =
    Math.max(
      primaryWindow.length *
      (pm ? pm.count : 1) /
      100,
      0.01
    );


  const frequency =
    calculateMultiFrequencyScore(
      allDraws,
      giaiKey
    );


  const recent =
    calculateRecencyScores(
      allDraws,
      giaiKey,
      Math.max(
        30,
        windowSize
      )
    );


  const momentum =
    calculateMomentumScores(
      allDraws,
      giaiKey
    );


  const ganResult =
    calculateGanScore(
      allDraws,
      giaiKey
    );


  const cycle =
    calculateCycleScore(
      allDraws,
      giaiKey
    );


  const headTail =
    calculateHeadTailScore(
      allDraws,
      giaiKey,
      windowSize
    );


  const stability =
    calculateStabilityScore(
      allDraws,
      giaiKey
    );


  const scores = {};


  const components = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);


    const parts = {

      frequency:
        frequency.normalized[n] || 0,

      recent:
        recent[n] || 0,

      momentum:
        momentum[n] || 0,

      gan:
        ganResult.normalized[n] || 0,

      cycle:
        cycle[n] || 0,

      headTail:
        headTail[n] || 0,

      stability:
        stability[n] || 0

    };


    const finalScore =

      parts.frequency *
      V2_WEIGHTS.frequency +

      parts.recent *
      V2_WEIGHTS.recent +

      parts.momentum *
      V2_WEIGHTS.momentum +

      parts.gan *
      V2_WEIGHTS.gan +

      parts.cycle *
      V2_WEIGHTS.cycle +

      parts.headTail *
      V2_WEIGHTS.headTail +

      parts.stability *
      V2_WEIGHTS.stability;


    scores[n] =
      clamp(
        finalScore,
        0,
        1
      );


    components[n] =
      parts;

  }


  return {

    scores,

    components,

    freq,

    expectedPerNumber,

    gan:
      ganResult.raw,

    windowUsed:
      primaryWindow.length,

    multiFrequency:
      frequency.multi

  };

}


/* =========================================================================
   19. DETERMINISTIC RANKING
   ========================================================================= */

function rankedNumbers(scores) {

  return Object
    .entries(scores)
    .sort(
      (a, b) => {

        if (
          b[1] !== a[1]
        ) {

          return b[1] -
            a[1];

        }

        return a[0]
          .localeCompare(
            b[0]
          );

      }
    );

}


function deterministicPick(
  scores,
  count
) {

  return rankedNumbers(
    scores
  )
    .slice(
      0,
      count
    )
    .map(
      ([n]) => n
    );

}


/*
 * Giữ tên function cũ để tương thích
 * nếu HTML hoặc code khác đang gọi.
 *
 * V2 không còn roulette ngẫu nhiên.
 */

function weightedPickWithoutReplacement(
  scores,
  k
) {

  return deterministicPick(
    scores,
    k
  );

}


function rankOf(
  scores,
  number
) {

  const ranked =
    rankedNumbers(
      scores
    )
    .map(
      ([n]) => n
    );


  const index =
    ranked.indexOf(
      number
    );


  return index >= 0
    ? index + 1
    : 100;

}


/* =========================================================================
   20. CONFIDENCE
   ========================================================================= */

function confidenceOf(
  stat,
  number
) {

  const score =
    stat.scores[number] || 0;

  const components =
    stat.components[number] || {};


  const values =
    Object.values(
      components
    );


  /*
   * Agreement:
   * các tín hiệu càng đồng thuận
   * confidence càng cao.
   */

  const agreement =
    values.length
      ? clamp(
          1 -
          stdDev(values)
        )
      : 0;


  /*
   * Confidence không phải
   * xác suất trúng.
   */

  const confidence =
    (
      score * 0.70 +
      agreement * 0.30
    ) * 100;


  return Math.round(
    clamp(
      confidence,
      1,
      99
    )
  );

}


/* =========================================================================
   21. REASONING V2
   ========================================================================= */

function buildReasoning(
  number,
  giaiLabel,
  stat,
  windowSize
) {

  const freq =
    stat.freq[number] || 0;

  const gan =
    stat.gan[number] || 0;

  const rank =
    rankOf(
      stat.scores,
      number
    );

  const confidence =
    confidenceOf(
      stat,
      number
    );

  const c =
    stat.components[number];


  const signals = [];


  if (
    c.frequency >= 0.65
  ) {

    signals.push(
      'tần suất đa khung cao'
    );

  }


  if (
    c.recent >= 0.65
  ) {

    signals.push(
      'xu hướng gần đây tích cực'
    );

  }


  if (
    c.momentum >= 0.65
  ) {

    signals.push(
      'momentum đang tăng'
    );

  }


  if (
    c.cycle >= 0.65
  ) {

    signals.push(
      'đang gần chu kỳ xuất hiện lịch sử'
    );

  }


  if (
    c.headTail >= 0.65
  ) {

    signals.push(
      'đầu/đuôi đang có tín hiệu tốt'
    );

  }


  if (
    c.stability >= 0.65
  ) {

    signals.push(
      'tần suất tương đối ổn định'
    );

  }


  if (
    gan >= 5
  ) {

    signals.push(
      `đã gan ${gan} kỳ`
    );

  }


  if (
    !signals.length
  ) {

    signals.push(
      'điểm tổng hợp cao hơn phần lớn các số còn lại'
    );

  }


  return `
    Số <b>${number}</b> ·
    hạng <b>${rank}/100</b> ·
    điểm tin cậy mô hình
    <b>${confidence}/100</b>.
    Xuất hiện <b>${freq}</b> lần
    trong ${stat.windowUsed} kỳ
    gần nhất tại ${giaiLabel}.
    Tín hiệu chính:
    ${signals.join(', ')}.
  `;

}


const GLOBAL_DISCLAIMER_SHORT =
  'Điểm tin cậy là mức đồng thuận của mô hình thống kê, không phải xác suất trúng. Mỗi kỳ quay vẫn là sự kiện ngẫu nhiên độc lập.';


/* =========================================================================
   22. SỐ LƯỢNG GỢI Ý
   ========================================================================= */

function pickCountFor(
  giaiKey
) {

  if (
    ['db', 'g1', 'g2']
      .includes(giaiKey)
  ) {

    return 2;

  }


  return 3;

}


/* =========================================================================
   23. GENERATE FULL FORECAST V2
   ========================================================================= */

function generateFullForecast(
  provinceSlug,
  windowSize
) {

  const allDraws =
    getAllDrawsForProvince(
      provinceSlug
    );


  const result = {

    version: 'V2',

    province:
      provinceSlug,

    windowSize,

    generatedAt:
      new Date()
        .toISOString(),

    items: []

  };


  if (
    !allDraws.length
  ) {

    result.empty = true;

    return result;

  }


  PRIZE_META.forEach(
    pm => {

      const stat =
        computeScoresForGiai(
          allDraws,
          pm.key,
          windowSize
        );


      const k =
        pickCountFor(
          pm.key
        );


      const picks =
        deterministicPick(
          stat.scores,
          k
        );


      const numbers =
        picks.map(n => ({

          number: n,

          rank:
            rankOf(
              stat.scores,
              n
            ),

          score:
            stat.scores[n],

          confidence:
            confidenceOf(
              stat,
              n
            ),

          reasoning:
            buildReasoning(
              n,
              pm.label,
              stat,
              windowSize
            )

        }));


      result.items.push({

        key:
          pm.key,

        label:
          pm.label,

        numbers

      });

    }
  );


  return result;

}


/* =========================================================================
   24. CẦU GHÉP CẶP V2
   ========================================================================= */

function generatePairFormulas(
  provinceSlug,
  windowSize
) {

  const allDraws =
    getAllDrawsForProvince(
      provinceSlug
    );


  if (
    !allDraws.length
  ) return [];


  const win =
    windowedDraws(
      allDraws,
      windowSize
    );


  const allLoLists =
    win.map(
      d => loOfDraw(d)
    );


  const flat =
    allLoLists.flat();


  const freq =
    freqTable(flat);


  const gan =
    ganTable(
      allDraws,
      d => loOfDraw(d)
    );


  const {
    head,
    tail
  } =
    headTailFreq(flat);


  const out = [];


  /* -----------------------------------------------------------------------
     Công thức 1:
     Đầu mạnh + đuôi mạnh
     ----------------------------------------------------------------------- */

  const headRanked =
    head
      .map(
        (v, i) => [i, v]
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  const tailRanked =
    tail
      .map(
        (v, i) => [i, v]
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  if (
    headRanked.length &&
    tailRanked.length
  ) {

    const h =
      headRanked[0];

    const t =
      tailRanked[0];

    const number =
      `${h[0]}${t[0]}`;


    out.push({

      formula:
        'Đầu – Đuôi mạnh',

      pair:
        number,

      reasoning:
        `Đầu <b>${h[0]}</b> xuất hiện ${h[1]} lần và đuôi <b>${t[0]}</b> xuất hiện ${t[1]} lần trong ${win.length} kỳ gần nhất. Ghép thành <b>${number}</b>.`

    });

  }


  /* -----------------------------------------------------------------------
     Công thức 2:
     Co-occurrence
     ----------------------------------------------------------------------- */

  const coCount = {};


  allLoLists.forEach(
    list => {

      const uniq =
        Array.from(
          new Set(list)
        ).sort();


      for (
        let i = 0;
        i < uniq.length;
        i++
      ) {

        for (
          let j = i + 1;
          j < uniq.length;
          j++
        ) {

          const key =
            `${uniq[i]}-${uniq[j]}`;

          coCount[key] =
            (
              coCount[key] || 0
            ) + 1;

        }

      }

    }
  );


  const coRanked =
    Object.entries(
      coCount
    )
    .sort(
      (a, b) => {

        if (
          b[1] !== a[1]
        ) {

          return b[1] -
            a[1];

        }

        return a[0]
          .localeCompare(
            b[0]
          );

      }
    );


  if (
    coRanked.length
  ) {

    const [
      pair,
      count
    ] =
      coRanked[0];


    out.push({

      formula:
        'Song thủ đồng xuất hiện',

      pair,

      reasoning:
        `Cặp <b>${pair}</b> cùng xuất hiện trong <b>${count}</b> kỳ trên ${win.length} kỳ gần nhất, đứng đầu bảng đồng xuất hiện.`

    });

  }


  /* -----------------------------------------------------------------------
     Công thức 3:
     Nóng + gan
     ----------------------------------------------------------------------- */

  const hotRanked =
    Object.entries(
      freq
    )
    .sort(
      (a, b) => {

        if (
          b[1] !== a[1]
        ) {

          return b[1] -
            a[1];

        }

        return a[0]
          .localeCompare(
            b[0]
          );

      }
    );


  const ganRanked =
    Object.entries(
      gan
    )
    .sort(
      (a, b) => {

        if (
          b[1] !== a[1]
        ) {

          return b[1] -
            a[1];

        }

        return a[0]
          .localeCompare(
            b[0]
          );

      }
    );


  if (
    hotRanked.length &&
    ganRanked.length
  ) {

    const hot =
      hotRanked[0];

    const cold =
      ganRanked.find(
        x => x[0] !== hot[0]
      ) || ganRanked[0];


    out.push({

      formula:
        'Nóng – Gan',

      pair:
        `${hot[0]}-${cold[0]}`,

      reasoning:
        `Số <b>${hot[0]}</b> đang có tần suất cao (${hot[1]} lần/${win.length} kỳ), kết hợp số <b>${cold[0]}</b> đã gan ${cold[1]} kỳ. Đây là tín hiệu thống kê nóng–lạnh, không phải quy luật chắc chắn.`

    });

  }


  return out;

}


/* =========================================================================
   25. NGÀY QUAY TIẾP THEO
   ========================================================================= */

function isoDate(d) {

  return (
    d.getFullYear() +
    '-' +
    pad2(
      d.getMonth() + 1
    ) +
    '-' +
    pad2(
      d.getDate()
    )
  );

}


function nextDrawDateISO(
  provinceSlug,
  fromDate
) {

  const p =
    provinceBySlug(
      provinceSlug
    );


  if (!p)
    return null;


  const days =
    new Set(
      p.days.map(
        d => DAY_INDEX[d]
      )
    );


  const base =
    fromDate
      ? new Date(fromDate)
      : new Date();


  base.setHours(
    0,
    0,
    0,
    0
  );


  for (
    let offset = 0;
    offset <= 7;
    offset++
  ) {

    const d =
      new Date(base);

    d.setDate(
      base.getDate() +
      offset
    );


    if (
      days.has(
        d.getDay()
      )
    ) {

      return isoDate(d);

    }

  }


  return null;

}


/* =========================================================================
   26. SAVE PREDICTION
   ========================================================================= */

function savePrediction(
  forecast,
  pairFormulas
) {

  const targetDate =
    nextDrawDateISO(
      forecast.province,
      new Date()
    );


  const record = {

    id:
      'p' +
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    version:
      forecast.version ||
      'V2',

    province:
      forecast.province,

    savedAt:
      new Date()
        .toISOString(),

    targetDate,

    windowSize:
      forecast.windowSize,

    items:
      forecast.items.map(
        item => ({

          key:
            item.key,

          label:
            item.label,

          numbers:
            item.numbers.map(
              n => n.number
            )

        })
      ),

    pairFormulas:
      (pairFormulas || [])
        .map(p => ({

          formula:
            p.formula,

          pair:
            p.pair

        }))

  };


  PREDICTIONS.unshift(
    record
  );


  saveJSON(
    LS_KEYS.predictions,
    PREDICTIONS
  );


  return record;

}


/* =========================================================================
   27. SO SÁNH DỰ BÁO
   ========================================================================= */

function findActualDraw(
  provinceSlug,
  dateISO
) {

  return (
    getAllDrawsForProvince(
      provinceSlug
    )
    .find(
      d =>
        d.date === dateISO
    ) || null
  );

}


function evaluatePrediction(
  pred
) {

  const actual =
    findActualDraw(
      pred.province,
      pred.targetDate
    );


  if (!actual) {

    return {

      status:
        'pending',

      actual:
        null,

      hits: [],

      totalMatched:
        0

    };

  }


  const hits = [];


  pred.items.forEach(
    item => {

      const actualLo =
        loOfPrize(
          actual,
          item.key
        );


      const matched =
        item.numbers.filter(
          n =>
            actualLo.includes(n)
        );


      hits.push({

        key:
          item.key,

        label:
          item.label,

        predicted:
          item.numbers,

        actual:
          actualLo,

        matched

      });

    }
  );


  const totalMatched =
    hits.reduce(
      (sum, h) =>
        sum +
        h.matched.length,
      0
    );


  return {

    status:
      totalMatched > 0
        ? 'win'
        : 'lose',

    actual,

    hits,

    totalMatched

  };

}


/* =========================================================================
   28. DEVIATION ANALYSIS
   ========================================================================= */

function buildDeviationNote(
  pred,
  evaluation
) {

  if (
    evaluation.status ===
    'pending'
  ) return '';


  const historical =
    getAllDrawsForProvince(
      pred.province
    )
    .filter(
      d =>
        d.date <
        pred.targetDate
    );


  const notes = [];


  evaluation.hits
    .forEach(h => {

      if (
        h.matched.length
      ) {

        notes.push(
          `${h.label}: dự báo đúng số <b>${h.matched.join(', ')}</b>.`
        );

        return;

      }


      if (
        !h.actual.length ||
        !historical.length
      ) return;


      const stat =
        computeScoresForGiai(
          historical,
          h.key,
          pred.windowSize || 30
        );


      const ranks =
        h.actual.map(
          n =>
            `${n} (hạng ${rankOf(stat.scores, n)}/100)`
        );


      notes.push(
        `${h.label}: thực tế ${ranks.join(', ')} — không nằm trong nhóm dự báo V2.`
      );

    });


  return notes.join(' ');

}


function deletePrediction(id) {

  PREDICTIONS =
    PREDICTIONS.filter(
      p => p.id !== id
    );


  saveJSON(
    LS_KEYS.predictions,
    PREDICTIONS
  );

}


/* =========================================================================
   29. PARSER DỮ LIỆU DÁN TAY
   ========================================================================= */

const PRIZE_REGEX = [

  {
    key: 'db',
    re: /Gi(ả|a)i\s*(Đ(ặ|a)c\s*Bi(ệ|e)t|ĐB)[^\d]{0,40}(\d{6})\b/i,
    digits: 6,
    group: 5
  },

  {
    key: 'g1',
    re: /Gi(ả|a)i\s*nh(ấ|a)t[^\d]{0,40}(\d{5})\b/i,
    digits: 5,
    group: 3
  },

  {
    key: 'g2',
    re: /Gi(ả|a)i\s*nh(ì|i)[^\d]{0,40}(\d{5})\b/i,
    digits: 5,
    group: 3
  },

  {
    key: 'g3',
    re: /Gi(ả|a)i\s*ba[^\d]{0,40}(\d{10})\b/i,
    digits: 10,
    group: 2,
    split: 5
  },

  {
    key: 'g4',
    re: /Gi(ả|a)i\s*t(ư|u)[^\d]{0,40}(\d{35})\b/i,
    digits: 35,
    group: 3,
    split: 5
  },

  {
    key: 'g5',
    re: /Gi(ả|a)i\s*n(ă|a)m[^\d]{0,40}(\d{4})\b/i,
    digits: 4,
    group: 3
  },

  {
    key: 'g6',
    re: /Gi(ả|a)i\s*s(á|a)u[^\d]{0,40}(\d{12})\b/i,
    digits: 12,
    group: 3,
    split: 4
  },

  {
    key: 'g7',
    re: /Gi(ả|a)i\s*b(ả|a)y[^\d]{0,40}(\d{3})\b/i,
    digits: 3,
    group: 3
  },

  {
    key: 'g8',
    re: /Gi(ả|a)i\s*(t(á|a)m|8)[^\d]{0,40}(\d{2})\b/i,
    digits: 2,
    group: 4
  }

];


function splitDigits(
  str,
  size
) {

  const out = [];

  for (
    let i = 0;
    i < str.length;
    i += size
  ) {

    out.push(
      str.slice(
        i,
        i + size
      )
    );

  }

  return out;

}


const DATE_RE =
  /(\d{2})\/(\d{2})\/(\d{4})/g;


function splitTextByDate(text) {

  const matches =
    [...text.matchAll(DATE_RE)];


  if (!matches.length)
    return [];


  const segments = [];


  for (
    let i = 0;
    i < matches.length;
    i++
  ) {

    const start =
      matches[i].index;

    const end =
      i + 1 <
      matches.length
        ? matches[i + 1].index
        : text.length;


    segments.push({

      dateStr:
        matches[i][0],

      text:
        text.slice(
          start,
          end
        )

    });

  }


  return segments;

}


function parseSegmentToDraw(
  segment,
  provinceSlug
) {

  const [
    dd,
    mm,
    yyyy
  ] =
    segment.dateStr
      .split('/');


  const dateISO =
    `${yyyy}-${mm}-${dd}`;


  const prizes = {};

  let foundCount = 0;


  for (
    const pr of
    PRIZE_REGEX
  ) {

    const match =
      segment.text.match(
        pr.re
      );


    if (!match)
      continue;


    const raw =
      match[pr.group];


    if (
      !raw ||
      raw.length !==
      pr.digits
    ) {

      continue;

    }


    prizes[pr.key] =
      pr.split
        ? splitDigits(
            raw,
            pr.split
          )
        : raw;


    foundCount++;

  }


  if (
    foundCount <
    PRIZE_REGEX.length
  ) {

    return null;

  }


  let ticketCode = '';


  const ticketMatch =
    segment.text.match(
      /Lo(ạ|a)i\s*v[ée]\s*[:：]?\s*([A-Z0-9]{2,8})/i
    );


  if (
    ticketMatch
  ) {

    ticketCode =
      ticketMatch[2];

  } else {

    const alt =
      segment.text.match(
        /XS[A-ZĐ]{2,5}\s*-\s*([A-Z0-9]{2,8})/i
      );

    if (alt) {

      ticketCode =
        alt[1];

    }

  }


  return {

    province:
      provinceSlug,

    date:
      dateISO,

    ticketCode,

    prizes

  };

}


function parseDrawsFromText(
  text,
  provinceSlug
) {

  const segments =
    splitTextByDate(text);


  const draws = [];

  let skipped = 0;


  segments.forEach(
    segment => {

      const draw =
        parseSegmentToDraw(
          segment,
          provinceSlug
        );


      if (draw) {

        draws.push(draw);

      } else {

        skipped++;

      }

    }
  );


  return {

    draws,

    skipped,

    totalSegments:
      segments.length

  };

}


/* =========================================================================
   30. MERGE DATA
   ========================================================================= */

function mergeExtraDraws(
  newDraws
) {

  const map =
    new Map();


  EXTRA_DRAWS
    .forEach(
      d =>
        map.set(
          dedupeKey(d),
          d
        )
    );


  let added = 0;

  let updated = 0;


  newDraws.forEach(
    draw => {

      const key =
        dedupeKey(draw);


      if (
        map.has(key)
      ) {

        updated++;

      } else {

        added++;

      }


      map.set(
        key,
        draw
      );

    }
  );


  EXTRA_DRAWS =
    Array.from(
      map.values()
    );


  saveJSON(
    LS_KEYS.extraDraws,
    EXTRA_DRAWS
  );


  return {

    added,

    updated

  };

}


/* =========================================================================
   31. GITHUB JSON
   ========================================================================= */

async function fetchProvinceLive(
  slug
) {

  try {

    const url =
      `data/${slug}-latest.json?t=${Date.now()}`;


    const response =
      await fetch(
        url,
        {
          cache:
            'no-store'
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const json =
      await response.json();


    if (
      !json ||
      !json.results
    ) {

      throw new Error(
        'File JSON không có results'
      );

    }


    if (
      !json.drawDate
    ) {

      throw new Error(
        'File JSON chưa có drawDate'
      );

    }


    const r =
      json.results;


    const draw = {

      province:
        slug,

      date:
        json.drawDate,

      ticketCode:
        '',

      prizes: {

        db:
          Array.isArray(
            r.giaidb
          )
            ? String(
                r.giaidb[0] || ''
              )
            : '',


        g1:
          Array.isArray(
            r.giai1
          )
            ? String(
                r.giai1[0] || ''
              )
            : '',


        g2:
          Array.isArray(
            r.giai2
          )
            ? String(
                r.giai2[0] || ''
              )
            : '',


        g3:
          Array.isArray(
            r.giai3
          )
            ? r.giai3.map(String)
            : [],


        g4:
          Array.isArray(
            r.giai4
          )
            ? r.giai4.map(String)
            : [],


        g5:
          Array.isArray(
            r.giai5
          )
            ? String(
                r.giai5[0] || ''
              )
            : '',


        g6:
          Array.isArray(
            r.giai6
          )
            ? r.giai6.map(String)
            : [],


        g7:
          Array.isArray(
            r.giai7
          )
            ? String(
                r.giai7[0] || ''
              )
            : '',


        g8:
          Array.isArray(
            r.giai8
          )
            ? String(
                r.giai8[0] || ''
              )
            : ''

      }

    };


    const valid =

      /^\d{6}$/
        .test(
          draw.prizes.db
        ) &&

      /^\d{5}$/
        .test(
          draw.prizes.g1
        ) &&

      /^\d{5}$/
        .test(
          draw.prizes.g2
        ) &&

      draw.prizes.g3
        .length === 2 &&

      draw.prizes.g3
        .every(
          v =>
            /^\d{5}$/
              .test(v)
        ) &&

      draw.prizes.g4
        .length === 7 &&

      draw.prizes.g4
        .every(
          v =>
            /^\d{5}$/
              .test(v)
        ) &&

      /^\d{4}$/
        .test(
          draw.prizes.g5
        ) &&

      draw.prizes.g6
        .length === 3 &&

      draw.prizes.g6
        .every(
          v =>
            /^\d{4}$/
              .test(v)
        ) &&

      /^\d{3}$/
        .test(
          draw.prizes.g7
        ) &&

      /^\d{2}$/
        .test(
          draw.prizes.g8
        );


    if (!valid) {

      throw new Error(
        'Dữ liệu kỳ quay không đầy đủ hoặc sai định dạng'
      );

    }


    const mergeResult =
      mergeExtraDraws(
        [draw]
      );


    return {

      ok: true,

      count: 1,

      skipped: 0,

      added:
        mergeResult.added,

      updated:
        mergeResult.updated,

      drawDate:
        json.drawDate,

      updatedAt:
        json.updatedAt ||
        null

    };


  } catch (e) {

    console.error(
      `Không tải được dữ liệu ${slug}:`,
      e
    );


    return {

      ok: false,

      error:
        e.message ||
        String(e)

    };

  }

}


/* =========================================================================
   32. PROVINCE SELECT
   ========================================================================= */

function populateProvinceSelects() {

  const grouped = {};


  PROVINCES.forEach(
    p => {

      const dayKey =
        p.days.join(', ');


      if (
        !grouped[dayKey]
      ) {

        grouped[dayKey] = [];

      }


      grouped[dayKey]
        .push(p);

    }
  );


  const buildOptions =
    () => {

      let html = '';


      Object.keys(
        grouped
      )
      .forEach(
        dayKey => {

          html +=
            `<optgroup label="${dayKey}">`;


          grouped[dayKey]
            .forEach(p => {

              html +=
                `<option value="${p.slug}">${p.name}</option>`;

            });


          html +=
            '</optgroup>';

        }
      );


      return html;

    };


  const sel1 =
    document.getElementById(
      'provinceSelect'
    );


  const sel2 =
    document.getElementById(
      'pasteProvinceSelect'
    );


  if (sel1) {

    sel1.innerHTML =
      buildOptions();

    sel1.value =
      SELECTED_PROVINCE;

  }


  if (sel2) {

    sel2.innerHTML =
      buildOptions();

    sel2.value =
      SELECTED_PROVINCE;

  }

}


/* =========================================================================
   33. TODAY
   ========================================================================= */

function setTodayPill() {

  const el =
    document.getElementById(
      'todayPill'
    );


  if (!el)
    return;


  const d =
    new Date();


  el.textContent =
    pad2(d.getDate()) +
    '/' +
    pad2(
      d.getMonth() + 1
    ) +
    '/' +
    d.getFullYear();

}


/* =========================================================================
   34. TABS
   ========================================================================= */

function initTabs() {

  document
    .querySelectorAll(
      '.tabbar button'
    )
    .forEach(
      btn => {

        btn.addEventListener(
          'click',
          () => {

            document
              .querySelectorAll(
                '.tabbar button'
              )
              .forEach(
                b =>
                  b.classList
                    .remove(
                      'active'
                    )
              );


            document
              .querySelectorAll(
                '.tab-panel'
              )
              .forEach(
                p =>
                  p.classList
                    .remove(
                      'active'
                    )
              );


            btn.classList
              .add(
                'active'
              );


            const panel =
              document
                .getElementById(
                  btn.dataset.tab
                );


            if (panel) {

              panel.classList
                .add(
                  'active'
                );

            }


            if (
              btn.dataset.tab ===
              'tab-stats'
            ) {

              renderStatsTab();

            }


            if (
              btn.dataset.tab ===
              'tab-compare'
            ) {

              renderCompareTab();

            }


            if (
              btn.dataset.tab ===
              'tab-settings'
            ) {

              renderSettingsTab();

            }

          }
        );

      }
    );

}


/* =========================================================================
   35. WINDOW CHIPS
   ========================================================================= */

function initWindowChips() {

  const chips =
    document.querySelectorAll(
      '#windowChipRow .chip'
    );


  chips.forEach(
    chip => {

      chip.addEventListener(
        'click',
        () => {

          chips.forEach(
            c =>
              c.classList
                .remove(
                  'active'
                )
          );


          chip.classList
            .add(
              'active'
            );


          WINDOW_SIZE =
            parseInt(
              chip.dataset.w,
              10
            );


          localStorage
            .setItem(
              LS_KEYS.windowSize,
              String(
                WINDOW_SIZE
              )
            );


          renderForecastHeader();


          const stats =
            document
              .getElementById(
                'tab-stats'
              );


          if (
            stats &&
            stats.classList
              .contains(
                'active'
              )
          ) {

            renderStatsTab();

          }

        }
      );

    }
  );


  chips.forEach(
    c => {

      c.classList.toggle(
        'active',
        parseInt(
          c.dataset.w,
          10
        ) === WINDOW_SIZE
      );

    }
  );

}


/* =========================================================================
   36. PROVINCE CHANGE
   ========================================================================= */

function onProvinceChange(
  slug
) {

  SELECTED_PROVINCE =
    slug;


  localStorage
    .setItem(
      LS_KEYS.province,
      slug
    );


  const main =
    document.getElementById(
      'provinceSelect'
    );


  const paste =
    document.getElementById(
      'pasteProvinceSelect'
    );


  if (main)
    main.value = slug;


  if (paste)
    paste.value = slug;


  renderForecastHeader();


  const results =
    document.getElementById(
      'forecastResults'
    );


  if (results)
    results.innerHTML = '';


  const pairCard =
    document.getElementById(
      'pairFormulaCard'
    );


  if (pairCard)
    pairCard.style.display =
      'none';


  LAST_FORECAST =
    null;


  const stats =
    document.getElementById(
      'tab-stats'
    );


  if (
    stats &&
    stats.classList
      .contains('active')
  ) {

    renderStatsTab();

  }

}


/* =========================================================================
   37. FORECAST HEADER
   ========================================================================= */

function renderForecastHeader() {

  const p =
    provinceBySlug(
      SELECTED_PROVINCE
    );


  const el =
    document.getElementById(
      'fcProvinceName'
    );


  if (el) {

    el.textContent =
      p
        ? p.name
        : '--';

  }

}


/* =========================================================================
   38. RENDER FORECAST V2
   ========================================================================= */

function renderForecast() {

  const p =
    provinceBySlug(
      SELECTED_PROVINCE
    );


  const forecast =
    generateFullForecast(
      SELECTED_PROVINCE,
      WINDOW_SIZE
    );


  const container =
    document.getElementById(
      'forecastResults'
    );


  if (!container)
    return;


  if (
    forecast.empty
  ) {

    container.innerHTML =
      `
      <div class="card">
        <div class="empty-state">
          Chưa có dữ liệu lịch sử cho ${p ? p.name : SELECTED_PROVINCE}.
          <br>
          Vào tab Cài đặt để cập nhật dữ liệu.
        </div>
      </div>
      `;


    const pairCard =
      document
        .getElementById(
          'pairFormulaCard'
        );


    if (pairCard) {

      pairCard.style.display =
        'none';

    }


    LAST_FORECAST =
      null;

    return;

  }


  let html =
    `
    <div class="card">
      <div style="font-weight:800;margin-bottom:5px;">
        🧠 Statistical Engine V2
      </div>

      <div class="sub">
        Multi-window · Frequency · Recent Trend · Momentum · Gan · Cycle · Head/Tail · Stability
      </div>

      <div class="sub" style="margin-top:6px;">
        ${GLOBAL_DISCLAIMER_SHORT}
      </div>
    </div>
    `;


  forecast.items
    .forEach(
      item => {

        html +=
          `
          <div class="prize-card">

            <div class="prize-head">

              <span class="prize-name">
                ${item.label}
              </span>

              <span class="prize-tag">
                ${p ? p.name : ''}
              </span>

            </div>


            <div class="num-chip-row">

              ${item.numbers
                .map(
                  n =>
                    `<span class="num-chip"
                      title="Hạng ${n.rank}/100 · Confidence ${n.confidence}/100">
                      ${n.number}
                    </span>`
                )
                .join('')}

            </div>


            ${item.numbers
              .map(
                n =>
                  `
                  <div class="reasoning">

                    ${n.reasoning}

                  </div>
                  `
              )
              .join('')}

          </div>
          `;

      }
    );


  container.innerHTML =
    html;


  const pairFormulas =
    generatePairFormulas(
      SELECTED_PROVINCE,
      WINDOW_SIZE
    );


  const pairCard =
    document.getElementById(
      'pairFormulaCard'
    );


  const pairResults =
    document.getElementById(
      'pairFormulaResults'
    );


  if (
    pairCard &&
    pairResults &&
    pairFormulas.length
  ) {

    pairCard.style.display =
      '';


    pairResults.innerHTML =
      pairFormulas
        .map(
          pf =>
            `
            <div class="pair-card">

              <div class="pair-formula">
                ${pf.formula}
              </div>

              <div class="pair-nums">
                ${pf.pair}
              </div>

              <div class="pair-reason">
                ${pf.reasoning}
              </div>

            </div>
            `
        )
        .join('');

  } else if (
    pairCard
  ) {

    pairCard.style.display =
      'none';

  }


  LAST_FORECAST = {

    forecast,

    pairFormulas

  };

}


/* =========================================================================
   39. FORECAST BUTTONS
   ========================================================================= */

function initForecastTab() {

  const forecastBtn =
    document.getElementById(
      'btnForecast'
    );


  const saveBtn =
    document.getElementById(
      'btnSavePrediction'
    );


  if (forecastBtn) {

    forecastBtn
      .addEventListener(
        'click',
        renderForecast
      );

  }


  if (saveBtn) {

    saveBtn
      .addEventListener(
        'click',
        () => {

          if (
            !LAST_FORECAST
          ) {

            alert(
              'Hãy bấm "Dự Báo Ngay" trước khi lưu.'
            );

            return;

          }


          const rec =
            savePrediction(
              LAST_FORECAST.forecast,
              LAST_FORECAST.pairFormulas
            );


          const p =
            provinceBySlug(
              rec.province
            );


          alert(
            `Đã lưu dự báo V2 cho ${p ? p.name : rec.province} — kỳ dự kiến ${rec.targetDate}. Xem tại tab "So Sánh".`
          );

        }
      );

  }

}


/* =========================================================================
   40. RENDER STATS
   ========================================================================= */

function renderStatsTab() {

  const p =
    provinceBySlug(
      SELECTED_PROVINCE
    );


  const name =
    document.getElementById(
      'statProvinceName'
    );


  if (name) {

    name.textContent =
      p ? p.name : '';

  }


  const allDraws =
    getAllDrawsForProvince(
      SELECTED_PROVINCE
    );


  const win =
    windowedDraws(
      allDraws,
      WINDOW_SIZE
    );


  const history =
    document.getElementById(
      'historyList'
    );


  if (history) {

    if (
      !win.length
    ) {

      history.innerHTML =
        '<div class="empty-state">Chưa có dữ liệu.</div>';

    } else {

      history.innerHTML =
        win.map(
          d =>
            `
            <div class="history-row">

              <div>

                <div class="hd">
                  ${d.date}${d.ticketCode ? ' · ' + d.ticketCode : ''}
                </div>

                <div class="history-lo">
                  Lô: ${loOfDraw(d).join(' ')}
                </div>

              </div>

              <div class="hdb">
                ${d.prizes.db}
              </div>

            </div>
            `
        )
        .join('');

    }

  }


  if (
    !win.length
  ) {

    const table =
      document.getElementById(
        'headTailTable'
      );

    const ganList =
      document.getElementById(
        'ganList'
      );

    const hotList =
      document.getElementById(
        'hotList'
      );


    if (table)
      table.innerHTML = '';

    if (ganList)
      ganList.innerHTML =
        '<div class="empty-state">--</div>';

    if (hotList)
      hotList.innerHTML =
        '<div class="empty-state">--</div>';

    return;

  }


  const flat =
    win
      .map(
        d => loOfDraw(d)
      )
      .flat();


  const freq =
    freqTable(flat);


  const byNumber = {};


  flat.forEach(
    v => {

      byNumber[v] =
        (
          byNumber[v] ||
          0
        ) + 1;

    }
  );


  let tableHtml =
    '<tr><th>Chục\\Đơn vị</th>' +
    [...Array(10).keys()]
      .map(
        i => `<th>${i}</th>`
      )
      .join('') +
    '</tr>';


  for (
    let h = 0;
    h < 10;
    h++
  ) {

    tableHtml +=
      `<tr><th>${h}</th>`;


    for (
      let t = 0;
      t < 10;
      t++
    ) {

      const n =
        `${h}${t}`;

      const count =
        byNumber[n] || 0;


      tableHtml +=
        `
        <td style="${
          count > 0
            ? 'color:var(--accent);font-weight:800;'
            : 'color:var(--text-dim);'
        }">
          ${count || '·'}
        </td>
        `;

    }


    tableHtml +=
      '</tr>';

  }


  const table =
    document.getElementById(
      'headTailTable'
    );


  if (table) {

    table.innerHTML =
      tableHtml;

  }


  const ganFull =
    ganTable(
      allDraws,
      d => loOfDraw(d)
    );


  const ganRanked =
    Object.entries(
      ganFull
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(
      0,
      10
    );


  const ganList =
    document.getElementById(
      'ganList'
    );


  if (ganList) {

    ganList.innerHTML =
      ganRanked
        .map(
          ([n, g]) =>
            `
            <div class="history-row">

              <span class="hdb" style="font-size:16px;">
                ${n}
              </span>

              <span class="badge cold">
                Gan ${g} kỳ
              </span>

            </div>
            `
        )
        .join('');

  }


  const hotRanked =
    Object.entries(
      freq
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(
      0,
      10
    );


  const hotList =
    document.getElementById(
      'hotList'
    );


  if (hotList) {

    hotList.innerHTML =
      hotRanked
        .map(
          ([n, f]) =>
            `
            <div class="history-row">

              <span class="hdb" style="font-size:16px;">
                ${n}
              </span>

              <span class="badge hot">
                ${f} lần / ${win.length} kỳ
              </span>

            </div>
            `
        )
        .join('');

  }

}


/* =========================================================================
   41. RENDER COMPARE
   ========================================================================= */

function renderCompareTab() {

  const list =
    document.getElementById(
      'predictionList'
    );


  const summary =
    document.getElementById(
      'compareSummary'
    );


  if (
    !list ||
    !summary
  ) return;


  if (
    !PREDICTIONS.length
  ) {

    list.innerHTML =
      `
      <div class="card">
        <div class="empty-state">
          Chưa có dự báo nào được lưu.
          Sang tab Dự Báo → Dự Báo Ngay → Lưu dự báo này.
        </div>
      </div>
      `;


    summary.innerHTML =
      '';

    return;

  }


  let winCount = 0;

  let loseCount = 0;

  let pendingCount = 0;

  let html = '';


  PREDICTIONS.forEach(
    pred => {

      const ev =
        evaluatePrediction(
          pred
        );


      if (
        ev.status === 'win'
      ) {

        winCount++;

      } else if (
        ev.status === 'lose'
      ) {

        loseCount++;

      } else {

        pendingCount++;

      }


      const p =
        provinceBySlug(
          pred.province
        );


      const statusLabel =
        ev.status === 'win'

          ? `🎉 Trúng ${ev.totalMatched} số`

          : ev.status === 'lose'

            ? '✗ Chưa trúng'

            : '⏳ Chờ kết quả';


      const statusClass =
        ev.status === 'win'

          ? 'win'

          : ev.status === 'lose'

            ? 'lose'

            : 'pending';


      let detail = '';


      if (
        ev.status !==
        'pending'
      ) {

        const note =
          buildDeviationNote(
            pred,
            ev
          );


        detail =
          `<div class="pred-detail">${note}</div>`;

      }


      html +=
        `
        <div class="pred-item">

          <div class="pred-top">

            <div>

              <div class="pred-title">
                ${p ? p.name : pred.province}
                ${pred.version ? ' · ' + pred.version : ''}
              </div>

              <div class="pred-date">
                Kỳ dự kiến: ${pred.targetDate}
                · Lưu lúc
                ${new Date(pred.savedAt).toLocaleString('vi-VN')}
              </div>

            </div>

            <span class="pred-status ${statusClass}">
              ${statusLabel}
            </span>

          </div>

          ${detail}

          <div class="btn-row">

            <button
              class="btn-danger"
              data-del="${pred.id}">
              Xoá
            </button>

          </div>

        </div>
        `;

    }
  );


  list.innerHTML =
    html;


  const total =
    PREDICTIONS.length;


  const evaluated =
    winCount +
    loseCount;


  const rate =
    evaluated
      ? Math.round(
          winCount /
          evaluated *
          100
        )
      : 0;


  summary.innerHTML =
    `
    <div class="data-count-grid">

      <div>
        <span class="n">${total}</span>
        Tổng dự báo
      </div>

      <div>
        <span class="n">${winCount}</span>
        Trúng ≥1 số
      </div>

      <div>
        <span class="n">${pendingCount}</span>
        Đang chờ
      </div>

    </div>

    ${
      evaluated
        ? `
          <p class="sub" style="margin-top:10px;">
            Backtest thực tế:
            <b style="color:var(--accent)">
              ${rate}%
            </b>
            số dự báo đã đánh giá có ít nhất một số trùng kết quả.
            Chỉ số này dùng để theo dõi hiệu quả mô hình,
            không phải xác suất trúng giải.
          </p>
          `
        : ''
    }
    `;


  list
    .querySelectorAll(
      '[data-del]'
    )
    .forEach(
      btn => {

        btn.addEventListener(
          'click',
          () => {

            deletePrediction(
              btn.dataset.del
            );

            renderCompareTab();

          }
        );

      }
    );

}


/* =========================================================================
   42. SETTINGS
   ========================================================================= */

function renderSettingsTab() {

  const counts =
    countDrawsPerProvince();


  const grid =
    document.getElementById(
      'dataCountGrid'
    );


  if (!grid)
    return;


  grid.innerHTML =
    PROVINCES
      .map(
        p =>
          `
          <div>
            <span class="n">
              ${counts[p.slug]}
            </span>
            ${p.name}
          </div>
          `
      )
      .join('');

}


function setStatus(
  id,
  text,
  type
) {

  const el =
    document.getElementById(
      id
    );


  if (!el)
    return;


  el.innerHTML =
    `
    <div class="status-line ${type}">
      ${text}
    </div>
    `;

}


/* =========================================================================
   43. SETTINGS BUTTONS
   ========================================================================= */

function initSettingsTab() {

  const current =
    document.getElementById(
      'btnUpdateCurrent'
    );


  const all =
    document.getElementById(
      'btnUpdateAll'
    );


  const pasteBtn =
    document.getElementById(
      'btnParsePaste'
    );


  const reset =
    document.getElementById(
      'btnResetData'
    );


  if (current) {

    current.addEventListener(
      'click',
      async () => {

        const p =
          provinceBySlug(
            SELECTED_PROVINCE
          );


        setStatus(
          'updateStatus',
          `Đang tải dữ liệu mới cho ${p ? p.name : SELECTED_PROVINCE}...`,
          'info'
        );


        const result =
          await fetchProvinceLive(
            SELECTED_PROVINCE
          );


        if (
          result.ok
        ) {

          setStatus(
            'updateStatus',
            `✓ Đã cập nhật kỳ ${result.drawDate} cho ${p ? p.name : SELECTED_PROVINCE}. Mới: ${result.added}, cập nhật lại: ${result.updated}.`,
            'ok'
          );


          renderSettingsTab();

        } else {

          setStatus(
            'updateStatus',
            `✗ Không lấy được dữ liệu: ${result.error}. Hãy kiểm tra file data/${SELECTED_PROVINCE}-latest.json trên GitHub Pages.`,
            'err'
          );

        }

      }
    );

  }


  if (all) {

    all.addEventListener(
      'click',
      async () => {

        let ok = 0;

        let fail = 0;

        let total = 0;


        for (
          let i = 0;
          i < PROVINCES.length;
          i++
        ) {

          const p =
            PROVINCES[i];


          setStatus(
            'updateStatus',
            `Đang cập nhật ${p.name}... (${i + 1}/${PROVINCES.length})`,
            'info'
          );


          const result =
            await fetchProvinceLive(
              p.slug
            );


          if (
            result.ok
          ) {

            ok++;

            total +=
              result.count || 0;

          } else {

            fail++;

          }

        }


        setStatus(
          'updateStatus',
          `✓ Hoàn tất: ${ok}/${PROVINCES.length} tỉnh thành công · ${fail} lỗi · ${total} kỳ được xử lý.`,
          fail
            ? 'err'
            : 'ok'
        );


        renderSettingsTab();

      }
    );

  }


  if (pasteBtn) {

    pasteBtn.addEventListener(
      'click',
      () => {

        const area =
          document.getElementById(
            'pasteArea'
          );


        const select =
          document.getElementById(
            'pasteProvinceSelect'
          );


        const text =
          area
            ? area.value.trim()
            : '';


        const slug =
          select
            ? select.value
            : SELECTED_PROVINCE;


        if (!text) {

          setStatus(
            'pasteStatus',
            'Vui lòng dán nội dung trước.',
            'err'
          );

          return;

        }


        const result =
          parseDrawsFromText(
            text,
            slug
          );


        if (
          !result.draws.length
        ) {

          setStatus(
            'pasteStatus',
            `Không nhận diện được kỳ quay hợp lệ. Đã kiểm tra ${result.totalSegments} đoạn.`,
            'err'
          );

          return;

        }


        const merged =
          mergeExtraDraws(
            result.draws
          );


        setStatus(
          'pasteStatus',
          `✓ Đã nhập ${result.draws.length} kỳ · mới ${merged.added} · cập nhật ${merged.updated}${result.skipped ? ` · bỏ qua ${result.skipped}` : ''}.`,
          'ok'
        );


        if (area) {

          area.value = '';

        }


        renderSettingsTab();

      }
    );

  }


  if (reset) {

    reset.addEventListener(
      'click',
      () => {

        const yes =
          confirm(
            'Xoá toàn bộ dữ liệu cập nhật/dán thêm và các dự báo đã lưu? Dữ liệu seed gốc không bị xoá.'
          );


        if (!yes)
          return;


        EXTRA_DRAWS = [];

        PREDICTIONS = [];

        LAST_FORECAST =
          null;


        saveJSON(
          LS_KEYS.extraDraws,
          EXTRA_DRAWS
        );


        saveJSON(
          LS_KEYS.predictions,
          PREDICTIONS
        );


        renderSettingsTab();


        setStatus(
          'updateStatus',
          '✓ Đã xoá dữ liệu bổ sung và lịch sử dự báo.',
          'ok'
        );

      }
    );

  }

}


/* =========================================================================
   44. LOAD DATABASE
   XSMN V2.1
   Ưu tiên database lịch sử mới → fallback seed cũ
   ========================================================================= */

async function loadSeedData() {

  console.log('======================================');
  console.log('XSMN V2.1 - LOADING DATABASE');
  console.log('======================================');

  SEED_DRAWS = [];


  /* =======================================================================
     HÀM CHUẨN HÓA DATABASE

     Hỗ trợ:
     1. { draws: [...] }

     2. {
          provinces: {
            "an-giang": {
              draws: [...]
            }
          }
        }

     3. {
          provinces: {
            "an-giang": {
              history: [...]
            }
          }
        }
     ======================================================================= */

  function normalizeDatabase(json) {

    if (!json) {
      return [];
    }


    /* ---------------------------------------------------------------------
       FORMAT 1
       --------------------------------------------------------------------- */

    if (Array.isArray(json.draws)) {

      return json.draws
        .filter(draw =>
          draw &&
          draw.province &&
          draw.date &&
          draw.prizes
        );

    }


    /* ---------------------------------------------------------------------
       FORMAT 2 / 3
       --------------------------------------------------------------------- */

    if (
      json.provinces &&
      typeof json.provinces === 'object'
    ) {

      const output = [];


      Object.entries(json.provinces)
        .forEach(([slug, provinceData]) => {

          if (!provinceData) {
            return;
          }


          let provinceDraws = [];


          if (
            Array.isArray(
              provinceData.draws
            )
          ) {

            provinceDraws =
              provinceData.draws;

          } else if (
            Array.isArray(
              provinceData.history
            )
          ) {

            provinceDraws =
              provinceData.history;

          }


          provinceDraws
            .forEach(draw => {

              if (!draw) {
                return;
              }


              const normalized = {

                ...draw,

                province:
                  draw.province ||
                  slug

              };


              if (
                normalized.date &&
                normalized.prizes
              ) {

                output.push(
                  normalized
                );

              }

            });

        });


      return output;

    }


    return [];

  }


  /* =======================================================================
     DANH SÁCH NGUỒN DATABASE

     Ưu tiên database lịch sử mới.
     Nếu không tồn tại thì tự fallback.
     ======================================================================= */

  const sources = [

    'data/xsmn_history.json',

    'data/xsmn_seed.json'

  ];


  /* =======================================================================
     THỬ TỪNG DATABASE
     ======================================================================= */

  for (
    const source
    of sources
  ) {

    try {

      console.log(
        `Đang tải database: ${source}`
      );


      const separator =
        source.includes('?')
          ? '&'
          : '?';


      const response =
        await fetch(

          `${source}${separator}t=${Date.now()}`,

          {
            cache: 'no-store'
          }

        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const json =
        await response.json();


      const draws =
        normalizeDatabase(
          json
        );


      if (!draws.length) {

        throw new Error(
          'Database không có draw hợp lệ'
        );

      }


      /* -------------------------------------------------------------------
         LOẠI TRÙNG
         province + date
         ------------------------------------------------------------------- */

      const map =
        new Map();


      draws.forEach(draw => {

        const key =
          `${draw.province}|${draw.date}`;


        map.set(
          key,
          draw
        );

      });


      SEED_DRAWS =
        Array.from(
          map.values()
        );


      /* -------------------------------------------------------------------
         SẮP XẾP
         tỉnh → ngày mới nhất trước
         ------------------------------------------------------------------- */

      SEED_DRAWS.sort(
        (a, b) => {

          if (
            a.province !==
            b.province
          ) {

            return a.province
              .localeCompare(
                b.province
              );

          }


          return b.date
            .localeCompare(
              a.date
            );

        }
      );


      console.log(
        `✓ DATABASE OK: ${source}`
      );


      console.log(
        `✓ Tổng số kỳ: ${SEED_DRAWS.length}`
      );


      /* -------------------------------------------------------------------
         THỐNG KÊ SỐ KỲ/TỈNH
         ------------------------------------------------------------------- */

      const counts = {};


      SEED_DRAWS
        .forEach(draw => {

          counts[
            draw.province
          ] =
            (
              counts[
                draw.province
              ] || 0
            ) + 1;

        });


      console.log(
        'Số kỳ theo tỉnh:',
        counts
      );


      console.log(
        `✓ Số tỉnh có dữ liệu: ${Object.keys(counts).length}`
      );


      /* -------------------------------------------------------------------
         Nếu đã tải thành công thì dừng.
         ------------------------------------------------------------------- */

      return;

    } catch (error) {

      console.warn(
        `Không tải được ${source}:`,
        error.message ||
        error
      );

    }

  }


  /* =======================================================================
     FALLBACK CUỐI CÙNG
     xsmn_seed.js

     Chỉ chạy nếu JSON phía trên đều thất bại.
     ======================================================================= */

  try {

    if (
      window.__XSMN_SEED__ &&
      Array.isArray(
        window.__XSMN_SEED__.draws
      ) &&
      window.__XSMN_SEED__.draws.length
    ) {

      SEED_DRAWS =
        window.__XSMN_SEED__.draws;


      console.warn(
        `⚠ Đang dùng fallback xsmn_seed.js: ${SEED_DRAWS.length} kỳ`
      );


      return;

    }

  } catch (error) {

    console.warn(
      'Không đọc được xsmn_seed.js:',
      error
    );

  }


  /* =======================================================================
     KHÔNG CÓ DATABASE
     ======================================================================= */

  SEED_DRAWS = [];


  console.error(
    '======================================'
  );

  console.error(
    '❌ KHÔNG TẢI ĐƯỢC DATABASE XSMN'
  );

  console.error(
    'Đã thử:'
  );

  console.error(
    '- data/xsmn_history.json'
  );

  console.error(
    '- data/xsmn_seed.json'
  );

  console.error(
    '- window.__XSMN_SEED__'
  );

  console.error(
    '======================================'
  );

}


/* =========================================================================
   45. DATA HEALTH CHECK
   ========================================================================= */

function dataHealthCheck() {

  let invalid = 0;

  let valid = 0;


  [
    ...SEED_DRAWS,
    ...EXTRA_DRAWS
  ]
  .forEach(
    draw => {

      if (
        !draw ||
        !draw.province ||
        !draw.date ||
        !draw.prizes
      ) {

        invalid++;

        return;

      }


      valid++;

    }
  );


  console.log(
    `XSMN V2 Data Health: ${valid} hợp lệ · ${invalid} lỗi cơ bản`
  );


  return {

    valid,

    invalid

  };

}

/* =========================================================================
   XSMN V2.1 PATCH
   FULL 6-DIGIT SPECIAL PRIZE ENGINE

   - Giải Đặc Biệt: dự báo 2 bộ FULL 6 chữ số
   - G1 → G8: giữ nguyên engine V2 dự báo 2 số cuối
   - Đồng bộ Dự báo → Lưu → So sánh
   ========================================================================= */


/* =========================================================================
   1. LẤY GIÁ TRỊ ĐẦY ĐỦ CỦA GIẢI
   ========================================================================= */

function fullPrizeValues(draw, key) {

  const pm = prizeMetaOf(key);

  if (!pm) return [];

  return numbersOfPrize(draw, key)
    .map(v =>
      String(v).padStart(
        pm.digits,
        '0'
      )
    )
    .filter(v =>
      /^\d+$/.test(v) &&
      v.length === pm.digits
    );

}


/* =========================================================================
   2. LỊCH SỬ GIẢI ĐẶC BIỆT FULL 6 SỐ
   ========================================================================= */

function specialPrizeHistory(draws) {

  return draws
    .map(draw => {

      const values =
        fullPrizeValues(
          draw,
          'db'
        );

      return values.length
        ? values[0]
        : null;

    })
    .filter(Boolean);

}


/* =========================================================================
   3. PHÂN TÍCH TỪNG VỊ TRÍ CHỮ SỐ
   ========================================================================= */

function analyzeDigitPosition(
  values,
  position,
  windowSize
) {

  const win =
    values.slice(
      0,
      Math.min(
        windowSize,
        values.length
      )
    );


  const frequency =
    new Array(10)
      .fill(0);

  const recent =
    new Array(10)
      .fill(0);

  const gan =
    new Array(10)
      .fill(win.length);


  const found =
    new Set();


  win.forEach(
    (number, index) => {

      const digit =
        Number(
          number[position]
        );


      if (
        Number.isNaN(digit) ||
        digit < 0 ||
        digit > 9
      ) {

        return;

      }


      frequency[digit]++;


      /*
       * Kỳ gần hiện tại
       * có trọng số cao hơn.
       */

      recent[digit] +=
        Math.exp(
          -index / 10
        );


      /*
       * Gan của chữ số
       * tại đúng vị trí.
       */

      if (
        !found.has(digit)
      ) {

        found.add(digit);

        gan[digit] =
          index;

      }

    }
  );


  const maxFrequency =
    Math.max(
      ...frequency,
      1
    );


  const maxRecent =
    Math.max(
      ...recent,
      1
    );


  const scores = {};


  for (
    let digit = 0;
    digit <= 9;
    digit++
  ) {

    const freqScore =
      frequency[digit] /
      maxFrequency;


    const recentScore =
      recent[digit] /
      maxRecent;


    /*
     * Gan saturation.
     *
     * Không coi chữ số càng gan
     * càng chắc chắn phải xuất hiện.
     */

    const ganScore =
      gan[digit] /
      (
        gan[digit] +
        5
      );


    scores[String(digit)] =
      clamp(

        freqScore * 0.45 +

        recentScore * 0.35 +

        ganScore * 0.20,

        0,
        1

      );

  }


  return {

    scores,

    frequency,

    recent,

    gan

  };

}


/* =========================================================================
   4. ENGINE GIẢI ĐẶC BIỆT 6 CHỮ SỐ
   ========================================================================= */

function computeSpecialPrize6D(
  allDraws,
  windowSize
) {

  const history =
    specialPrizeHistory(
      allDraws
    );


  if (!history.length) {

    return {

      numbers: [],

      historyCount: 0,

      windowUsed: 0,

      positionStats: []

    };

  }


  const effectiveWindow =
    Math.min(

      Math.max(
        windowSize,
        10
      ),

      history.length

    );


  const positionStats = [];


  /*
   * Phân tích riêng 6 vị trí:
   *
   * 0 = trăm nghìn
   * 1 = chục nghìn
   * 2 = nghìn
   * 3 = trăm
   * 4 = chục
   * 5 = đơn vị
   */

  for (
    let position = 0;
    position < 6;
    position++
  ) {

    positionStats.push(

      analyzeDigitPosition(
        history,
        position,
        effectiveWindow
      )

    );

  }


  /*
   * Mỗi vị trí lấy TOP 3 chữ số.
   *
   * 3^6 = 729 tổ hợp.
   *
   * Số lượng này rất nhẹ
   * đối với trình duyệt điện thoại.
   */

  const candidatesByPosition =
    positionStats.map(
      stat => {

        return Object
          .entries(
            stat.scores
          )
          .sort(
            (a, b) => {

              if (
                b[1] !== a[1]
              ) {

                return (
                  b[1] -
                  a[1]
                );

              }


              return a[0]
                .localeCompare(
                  b[0]
                );

            }
          )
          .slice(
            0,
            3
          );

      }
    );


  const candidates = [];


  /*
   * Sinh toàn bộ tổ hợp
   * từ 6 vị trí.
   */

  function buildCandidate(
    position,
    digits,
    componentScores
  ) {

    if (
      position === 6
    ) {

      const number =
        digits.join('');


      /*
       * Geometric mean.
       *
       * Tránh trường hợp một vị trí
       * rất yếu nhưng bị các vị trí
       * mạnh còn lại che mất.
       */

      const product =
        componentScores.reduce(

          (acc, value) =>
            acc *
            Math.max(
              value,
              0.0001
            ),

          1

        );


      const geometricScore =
        Math.pow(
          product,
          1 / 6
        );


      const lo =
        number.slice(-2);


      candidates.push({

        number,

        score:
          geometricScore,

        lo

      });


      return;

    }


    candidatesByPosition[
      position
    ]
    .forEach(
      ([digit, score]) => {

        buildCandidate(

          position + 1,

          [
            ...digits,
            digit
          ],

          [
            ...componentScores,
            score
          ]

        );

      }
    );

  }


  buildCandidate(
    0,
    [],
    []
  );


  /*
   * Kết hợp với engine V2
   * đang phân tích 2 số cuối DB.
   */

  const loStat =
    computeScoresForGiai(
      allDraws,
      'db',
      windowSize
    );


  candidates.forEach(
    candidate => {

      const loScore =
        loStat.scores[
          candidate.lo
        ] || 0;


      /*
       * 80%:
       * mô hình vị trí 6 chữ số.
       *
       * 20%:
       * engine V2 hai số cuối.
       */

      candidate.finalScore =

        candidate.score *
        0.80 +

        loScore *
        0.20;

    }
  );


  /*
   * Ranking deterministic.
   */

  candidates.sort(
    (a, b) => {

      if (
        b.finalScore !==
        a.finalScore
      ) {

        return (
          b.finalScore -
          a.finalScore
        );

      }


      return a.number
        .localeCompare(
          b.number
        );

    }
  );


  /*
   * Chọn TOP 2
   * Giải Đặc Biệt.
   */

  const selected =
    candidates
      .slice(
        0,
        2
      )
      .map(
        (candidate, index) => {

          const confidence =
            Math.round(

              clamp(
                candidate.finalScore,
                0.01,
                0.99
              ) *

              100

            );


          return {

            number:
              candidate.number,

            rank:
              index + 1,

            score:
              candidate.finalScore,

            confidence,

            reasoning:
              `
              Bộ ĐB <b>${candidate.number}</b> ·
              hạng <b>${index + 1}</b>
              trong nhóm ứng viên 6 chữ số ·
              điểm mô hình
              <b>${confidence}/100</b>.
              Phân tích độc lập 6 vị trí chữ số,
              kết hợp tín hiệu 2 số cuối
              <b>${candidate.lo}</b>.
              Dữ liệu sử dụng
              ${effectiveWindow}
              kỳ Giải Đặc Biệt gần nhất.
              Điểm này là xếp hạng thống kê,
              không phải xác suất trúng.
              `

          };

        }
      );


  return {

    numbers:
      selected,

    historyCount:
      history.length,

    windowUsed:
      effectiveWindow,

    positionStats

  };

}


/* =========================================================================
   5. GHI ĐÈ GENERATE FULL FORECAST
   ========================================================================= */

generateFullForecast =
function(
  provinceSlug,
  windowSize
) {

  const allDraws =
    getAllDrawsForProvince(
      provinceSlug
    );


  const result = {

    version:
      'V2.1',

    province:
      provinceSlug,

    windowSize,

    generatedAt:
      new Date()
        .toISOString(),

    items: []

  };


  if (
    !allDraws.length
  ) {

    result.empty = true;

    return result;

  }


  PRIZE_META.forEach(
    pm => {


      /* ===============================================================
         GIẢI ĐẶC BIỆT
         FULL 6 CHỮ SỐ
         =============================================================== */

      if (
        pm.key === 'db'
      ) {

        const special =
          computeSpecialPrize6D(
            allDraws,
            windowSize
          );


        result.items.push({

          key:
            pm.key,

          label:
            pm.label,

          digits:
            6,

          predictionMode:
            'full-6-digit',

          numbers:
            special.numbers

        });


        return;

      }


      /* ===============================================================
         G1 → G8
         GIỮ ENGINE V2 2 SỐ CUỐI
         =============================================================== */

      const stat =
        computeScoresForGiai(
          allDraws,
          pm.key,
          windowSize
        );


      const k =
        pickCountFor(
          pm.key
        );


      const picks =
        deterministicPick(
          stat.scores,
          k
        );


      const numbers =
        picks.map(
          n => ({

            number:
              n,

            rank:
              rankOf(
                stat.scores,
                n
              ),

            score:
              stat.scores[n],

            confidence:
              confidenceOf(
                stat,
                n
              ),

            reasoning:
              buildReasoning(
                n,
                pm.label,
                stat,
                windowSize
              )

          })
        );


      result.items.push({

        key:
          pm.key,

        label:
          pm.label,

        digits:
          2,

        predictionMode:
          'last-2-digit',

        numbers

      });

    }
  );


  return result;

};


/* =========================================================================
   6. GHI ĐÈ EVALUATE PREDICTION
   ĐỂ SO SÁNH DB FULL 6 SỐ
   ========================================================================= */

evaluatePrediction =
function(pred) {

  const actual =
    findActualDraw(
      pred.province,
      pred.targetDate
    );


  if (!actual) {

    return {

      status:
        'pending',

      actual:
        null,

      hits: [],

      totalMatched:
        0

    };

  }


  const hits = [];


  pred.items.forEach(
    item => {


      /*
       * DB:
       * so FULL 6 chữ số.
       *
       * G1 → G8:
       * so 2 số cuối.
       */

      const actualValues =
        item.key === 'db'

          ? fullPrizeValues(
              actual,
              item.key
            )

          : loOfPrize(
              actual,
              item.key
            );


      const matched =
        item.numbers.filter(
          n =>
            actualValues.includes(
              n
            )
        );


      hits.push({

        key:
          item.key,

        label:
          item.label,

        predicted:
          item.numbers,

        actual:
          actualValues,

        matched

      });

    }
  );


  const totalMatched =
    hits.reduce(

      (sum, h) =>
        sum +
        h.matched.length,

      0

    );


  return {

    status:
      totalMatched > 0
        ? 'win'
        : 'lose',

    actual,

    hits,

    totalMatched

  };

};


/* =========================================================================
   7. V2.1 READY
   ========================================================================= */

console.log(
  'XSMN V2.1 Patch loaded — Full 6-digit Special Prize Engine'
);

/* =========================================================================
   46. INIT
   ========================================================================= */

async function init() {

  console.log(
    '======================================'
  );

  console.log(
    'Dự Báo XSMN Statistical Engine V2'
  );

  console.log(
    '======================================'
  );


  setTodayPill();


  await loadSeedData();


  dataHealthCheck();


  populateProvinceSelects();


  initTabs();


  initWindowChips();


  initForecastTab();


  initSettingsTab();


  renderForecastHeader();


  const provinceSelect =
    document.getElementById(
      'provinceSelect'
    );


  if (
    provinceSelect
  ) {

    provinceSelect
      .addEventListener(
        'change',
        event => {

          onProvinceChange(
            event.target.value
          );

        }
      );

  }


  const pasteSelect =
    document.getElementById(
      'pasteProvinceSelect'
    );


  if (
    pasteSelect
  ) {

    pasteSelect
      .addEventListener(
        'change',
        event => {

          SELECTED_PROVINCE =
            event.target.value;

        }
      );

  }


  renderSettingsTab();


  /*
   * Service Worker
   */

  if (
    'serviceWorker'
    in navigator
  ) {

    navigator
      .serviceWorker
      .register(
        'sw.js'
      )
      .then(
        () =>
          console.log(
            'Service Worker OK'
          )
      )
      .catch(
        error =>
          console.warn(
            'Service Worker:',
            error
          )
      );

  }


  console.log(
    `Province: ${SELECTED_PROVINCE}`
  );


  console.log(
    `Window: ${WINDOW_SIZE}`
  );


  console.log(
    `Seed: ${SEED_DRAWS.length}`
  );


  console.log(
    `Extra: ${EXTRA_DRAWS.length}`
  );


  console.log(
    'XSMN V2 READY'
  );

}


/* =========================================================================
   47. START
   ========================================================================= */
/* =========================================================================
   FIX TP.HCM SLUG
   Database dùng: tphcm
   App dùng: tp-hcm
   ========================================================================= */

const _originalLoadSeedData = loadSeedData;

loadSeedData = async function () {

  await _originalLoadSeedData();

  SEED_DRAWS = SEED_DRAWS.map(draw => {

    if (draw.province === 'tphcm') {

      return {
        ...draw,
        province: 'tp-hcm'
      };

    }

    return draw;

  });

  console.log(
    '✓ TP.HCM slug fixed:',
    SEED_DRAWS.filter(
      draw => draw.province === 'tp-hcm'
    ).length,
    'draws'
  );

};

document.addEventListener(
  'DOMContentLoaded',
  init
);

/* =========================================================================
   XSMN V2.2 — WALK-FORWARD BACKTEST ENGINE
   -------------------------------------------------------------------------
   MỤC TIÊU
   - Không thay đổi engine dự báo V2.1 hiện tại.
   - Kiểm định mô hình trên dữ liệu lịch sử.
   - Chống data leakage:
       tại kỳ T chỉ được sử dụng các kỳ xảy ra TRƯỚC T.
   - Minimum training: 60 kỳ.
   - Backtest tối đa 40 kỳ gần nhất.
   - Đánh giá:
       + DB Full 6 digits — Top 1 / Top 2
       + DB Last 2 digits — Top 1 / Top 2 / Top 3
       + G1 → G8 — Top 1 / Top 2 / Top 3
       + Average actual rank
       + MRR (Mean Reciprocal Rank)
   ========================================================================= */


/* =========================================================================
   1. CONFIG
   ========================================================================= */

const BACKTEST_V22_CONFIG = {

  minTrainingDraws: 60,

  maxTestDraws: 40,

  topK: 3,

  version: 'V2.2'

};


/* =========================================================================
   2. HELPER — SORT DRAW ASCENDING
   ========================================================================= */

function backtestSortAscending(draws) {

  return [...draws]
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );

}


/* =========================================================================
   3. HELPER — EMPTY METRIC
   ========================================================================= */

function createBacktestMetric() {

  return {

    tested: 0,

    top1Hits: 0,

    top2Hits: 0,

    top3Hits: 0,

    rankSum: 0,

    reciprocalRankSum: 0,

    rankedCases: 0

  };

}


/* =========================================================================
   4. UPDATE METRIC
   ========================================================================= */

function updateBacktestMetric(
  metric,
  actualValues,
  rankedCandidates
) {

  if (
    !metric ||
    !actualValues ||
    !actualValues.length ||
    !rankedCandidates ||
    !rankedCandidates.length
  ) {

    return;

  }


  metric.tested++;


  const actualSet =
    new Set(
      actualValues
    );


  const top1 =
    rankedCandidates
      .slice(0, 1);


  const top2 =
    rankedCandidates
      .slice(0, 2);


  const top3 =
    rankedCandidates
      .slice(0, 3);


  if (
    top1.some(
      n =>
        actualSet.has(n)
    )
  ) {

    metric.top1Hits++;

  }


  if (
    top2.some(
      n =>
        actualSet.has(n)
    )
  ) {

    metric.top2Hits++;

  }


  if (
    top3.some(
      n =>
        actualSet.has(n)
    )
  ) {

    metric.top3Hits++;

  }


  /*
   * Nếu một giải có nhiều số thực tế
   * như G3/G4/G6,
   * lấy rank tốt nhất.
   */

  let bestRank =
    Infinity;


  actualValues.forEach(
    actual => {

      const index =
        rankedCandidates
          .indexOf(actual);


      if (
        index >= 0
      ) {

        bestRank =
          Math.min(
            bestRank,
            index + 1
          );

      }

    }
  );


  if (
    Number.isFinite(
      bestRank
    )
  ) {

    metric.rankSum +=
      bestRank;


    metric.reciprocalRankSum +=
      1 / bestRank;


    metric.rankedCases++;

  }

}


/* =========================================================================
   5. FINALIZE METRIC
   ========================================================================= */

function finalizeBacktestMetric(
  metric
) {

  const tested =
    metric.tested || 0;


  return {

    tested,

    top1Hits:
      metric.top1Hits,

    top2Hits:
      metric.top2Hits,

    top3Hits:
      metric.top3Hits,

    top1Rate:
      tested
        ? metric.top1Hits /
          tested
        : 0,

    top2Rate:
      tested
        ? metric.top2Hits /
          tested
        : 0,

    top3Rate:
      tested
        ? metric.top3Hits /
          tested
        : 0,

    averageActualRank:
      metric.rankedCases
        ? metric.rankSum /
          metric.rankedCases
        : null,

    mrr:
      metric.rankedCases
        ? metric.reciprocalRankSum /
          metric.rankedCases
        : 0

  };

}


/* =========================================================================
   6. DB FULL 6 DIGIT — RANK ALL CANDIDATES
   ========================================================================= */

function rankSpecialPrize6DBacktest(
  trainingDraws,
  windowSize
) {

  const history =
    specialPrizeHistory(
      trainingDraws
    );


  if (
    !history.length
  ) {

    return [];

  }


  const effectiveWindow =
    Math.min(

      Math.max(
        windowSize,
        10
      ),

      history.length

    );


  const positionStats = [];


  for (
    let position = 0;
    position < 6;
    position++
  ) {

    positionStats.push(

      analyzeDigitPosition(
        history,
        position,
        effectiveWindow
      )

    );

  }


  /*
   * Giữ TOP 3 digit mỗi vị trí
   * giống V2.1.
   */

  const candidatesByPosition =
    positionStats.map(
      stat => {

        return Object
          .entries(
            stat.scores
          )
          .sort(
            (a, b) => {

              if (
                b[1] !== a[1]
              ) {

                return (
                  b[1] -
                  a[1]
                );

              }

              return a[0]
                .localeCompare(
                  b[0]
                );

            }
          )
          .slice(
            0,
            3
          );

      }
    );


  const candidates = [];


  function build(
    position,
    digits,
    componentScores
  ) {

    if (
      position === 6
    ) {

      const number =
        digits.join('');


      const product =
        componentScores.reduce(

          (acc, value) =>
            acc *
            Math.max(
              value,
              0.0001
            ),

          1

        );


      const positionScore =
        Math.pow(
          product,
          1 / 6
        );


      candidates.push({

        number,

        positionScore,

        lo:
          number.slice(-2)

      });


      return;

    }


    candidatesByPosition[
      position
    ]
    .forEach(
      ([digit, score]) => {

        build(

          position + 1,

          [
            ...digits,
            digit
          ],

          [
            ...componentScores,
            score
          ]

        );

      }
    );

  }


  build(
    0,
    [],
    []
  );


  const loStat =
    computeScoresForGiai(
      trainingDraws,
      'db',
      windowSize
    );


  candidates.forEach(
    candidate => {

      const loScore =
        loStat.scores[
          candidate.lo
        ] || 0;


      candidate.finalScore =

        candidate.positionScore *
        0.80 +

        loScore *
        0.20;

    }
  );


  candidates.sort(
    (a, b) => {

      if (
        b.finalScore !==
        a.finalScore
      ) {

        return (
          b.finalScore -
          a.finalScore
        );

      }


      return a.number
        .localeCompare(
          b.number
        );

    }
  );


  return candidates;

}


/* =========================================================================
   7. BACKTEST MỘT TỈNH
   ========================================================================= */

function backtestProvinceV22(
  provinceSlug,
  windowSize = 30
) {

  const source =
    getAllDrawsForProvince(
      provinceSlug
    );


  const draws =
    backtestSortAscending(
      source
    );


  const totalDraws =
    draws.length;


  const minTrain =
    BACKTEST_V22_CONFIG
      .minTrainingDraws;


  if (
    totalDraws <=
    minTrain
  ) {

    return {

      version:
        BACKTEST_V22_CONFIG.version,

      province:
        provinceSlug,

      totalDraws,

      testedDraws: 0,

      error:
        `Cần hơn ${minTrain} kỳ để backtest.`

    };

  }


  /*
   * Tối đa kiểm định 40 kỳ cuối.
   *
   * Nhưng luôn bảo đảm training
   * tối thiểu 60 kỳ.
   */

  const possibleTests =
    totalDraws -
    minTrain;


  const testCount =
    Math.min(

      BACKTEST_V22_CONFIG
        .maxTestDraws,

      possibleTests

    );


  const testStartIndex =
    totalDraws -
    testCount;


  const metrics = {};


  PRIZE_META.forEach(
    pm => {

      metrics[pm.key] =
        createBacktestMetric();

    }
  );


  /*
   * DB full 6 digits
   * metric riêng.
   */

  const dbFullMetric =
    createBacktestMetric();


  /*
   * DB last-2 metric riêng.
   */

  const dbLast2Metric =
    createBacktestMetric();


  const cases = [];


  for (
    let testIndex =
      testStartIndex;

    testIndex <
      totalDraws;

    testIndex++
  ) {

    const actualDraw =
      draws[
        testIndex
      ];


    /*
     * QUAN TRỌNG:
     *
     * trainingDraws chỉ chứa
     * dữ liệu TRƯỚC actualDraw.
     *
     * Đây là walk-forward.
     */

    const trainingAscending =
      draws.slice(
        0,
        testIndex
      );


    /*
     * Các engine V2/V2.1
     * giả định draw mới nhất
     * đứng trước.
     */

    const trainingDraws =
      [...trainingAscending]
        .sort(
          (a, b) =>
            b.date.localeCompare(
              a.date
            )
        );


    const caseResult = {

      date:
        actualDraw.date,

      trainingSize:
        trainingDraws.length,

      prizes: {}

    };


    /* ===============================================================
       A. DB FULL 6 DIGITS
       =============================================================== */

    const dbCandidates =
      rankSpecialPrize6DBacktest(
        trainingDraws,
        windowSize
      );


    const dbRankedFull =
      dbCandidates.map(
        x => x.number
      );


    const actualDBFull =
      fullPrizeValues(
        actualDraw,
        'db'
      );


    updateBacktestMetric(

      dbFullMetric,

      actualDBFull,

      dbRankedFull

    );


    const actualDBNumber =
      actualDBFull.length
        ? actualDBFull[0]
        : null;


    const dbFullRank =
      actualDBNumber
        ? dbRankedFull
            .indexOf(
              actualDBNumber
            ) + 1
        : 0;


    /* ===============================================================
       B. DB LAST 2 DIGITS
       =============================================================== */

    const dbLoStat =
      computeScoresForGiai(
        trainingDraws,
        'db',
        windowSize
      );


    const dbLoRanked =
      rankedNumbers(
        dbLoStat.scores
      )
      .map(
        ([n]) => n
      );


    const actualDBLo =
      loOfPrize(
        actualDraw,
        'db'
      );


    updateBacktestMetric(

      dbLast2Metric,

      actualDBLo,

      dbLoRanked

    );


    /*
     * Giữ metric db mặc định
     * là LAST 2 để tương thích
     * với G1 → G8.
     */

    updateBacktestMetric(

      metrics.db,

      actualDBLo,

      dbLoRanked

    );


    caseResult.prizes.db = {

      actualFull:
        actualDBNumber,

      fullTop2:
        dbRankedFull
          .slice(
            0,
            2
          ),

      fullRank:
        dbFullRank > 0
          ? dbFullRank
          : null,

      actualLast2:
        actualDBLo,

      last2Top3:
        dbLoRanked
          .slice(
            0,
            3
          ),

      last2Rank:
        actualDBLo.length
          ? dbLoRanked
              .indexOf(
                actualDBLo[0]
              ) + 1
          : null

    };


    /* ===============================================================
       C. G1 → G8
       =============================================================== */

    PRIZE_META
      .filter(
        pm =>
          pm.key !== 'db'
      )
      .forEach(
        pm => {

          const stat =
            computeScoresForGiai(
              trainingDraws,
              pm.key,
              windowSize
            );


          const ranked =
            rankedNumbers(
              stat.scores
            )
            .map(
              ([n]) => n
            );


          const actualValues =
            loOfPrize(
              actualDraw,
              pm.key
            );


          updateBacktestMetric(

            metrics[
              pm.key
            ],

            actualValues,

            ranked

          );


          let bestActualRank =
            null;


          actualValues
            .forEach(
              actual => {

                const index =
                  ranked
                    .indexOf(
                      actual
                    );


                if (
                  index >= 0
                ) {

                  const rank =
                    index + 1;


                  if (
                    bestActualRank ===
                      null ||
                    rank <
                      bestActualRank
                  ) {

                    bestActualRank =
                      rank;

                  }

                }

              }
            );


          caseResult
            .prizes[
              pm.key
            ] = {

              actual:
                actualValues,

              predictedTop3:
                ranked.slice(
                  0,
                  3
                ),

              bestActualRank

            };

        }
      );


    cases.push(
      caseResult
    );

  }


  const finalized = {};


  Object.keys(
    metrics
  )
  .forEach(
    key => {

      finalized[key] =
        finalizeBacktestMetric(
          metrics[key]
        );

    }
  );


  return {

    version:
      BACKTEST_V22_CONFIG.version,

    province:
      provinceSlug,

    provinceName:
      provinceBySlug(
        provinceSlug
      )?.name ||
      provinceSlug,

    totalDraws,

    trainingMinimum:
      minTrain,

    testedDraws:
      testCount,

    testFrom:
      draws[
        testStartIndex
      ]?.date ||
      null,

    testTo:
      draws[
        totalDraws - 1
      ]?.date ||
      null,

    windowSize,

    dbFull6:
      finalizeBacktestMetric(
        dbFullMetric
      ),

    dbLast2:
      finalizeBacktestMetric(
        dbLast2Metric
      ),

    prizes:
      finalized,

    cases

  };

}


/* =========================================================================
   8. BACKTEST TẤT CẢ TỈNH
   ========================================================================= */

function backtestAllProvincesV22(
  windowSize = 30
) {

  const results = [];


  PROVINCES.forEach(
    province => {

      try {

        const result =
          backtestProvinceV22(
            province.slug,
            windowSize
          );


        results.push(
          result
        );


      } catch (error) {

        console.error(
          `Backtest lỗi ${province.name}:`,
          error
        );


        results.push({

          version:
            BACKTEST_V22_CONFIG.version,

          province:
            province.slug,

          provinceName:
            province.name,

          error:
            error.message ||
            String(error)

        });

      }

    }
  );


  return results;

}


/* =========================================================================
   9. FORMAT PERCENT
   ========================================================================= */

function backtestPercent(
  value
) {

  return (
    (
      Number(value) ||
      0
    ) *
    100
  )
  .toFixed(1) +
  '%';

}


/* =========================================================================
   10. CONSOLE REPORT — MỘT TỈNH
   ========================================================================= */

function printBacktestProvinceV22(
  provinceSlug =
    SELECTED_PROVINCE,
  windowSize =
    WINDOW_SIZE
) {

  const result =
    backtestProvinceV22(
      provinceSlug,
      windowSize
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.2 WALK-FORWARD BACKTEST'
  );

  console.log(
    '=========================================='
  );


  console.log(
    'Tỉnh:',
    result.provinceName ||
    result.province
  );


  console.log(
    'Tổng dữ liệu:',
    result.totalDraws
  );


  console.log(
    'Số kỳ kiểm định:',
    result.testedDraws
  );


  console.log(
    'Khoảng kiểm định:',
    result.testFrom,
    '→',
    result.testTo
  );


  console.log(
    'Window:',
    result.windowSize
  );


  if (
    result.error
  ) {

    console.error(
      result.error
    );

    return result;

  }


  console.log(
    '------------------------------------------'
  );


  console.log(
    'DB FULL 6 DIGITS'
  );


  console.table([{

    Tested:
      result.dbFull6.tested,

    Top1:
      result.dbFull6.top1Hits,

    Top1Rate:
      backtestPercent(
        result.dbFull6.top1Rate
      ),

    Top2:
      result.dbFull6.top2Hits,

    Top2Rate:
      backtestPercent(
        result.dbFull6.top2Rate
      ),

    AvgRank:
      result.dbFull6
        .averageActualRank !== null
          ? result.dbFull6
              .averageActualRank
              .toFixed(2)
          : '--',

    MRR:
      result.dbFull6
        .mrr
        .toFixed(4)

  }]);


  console.log(
    '------------------------------------------'
  );


  console.log(
    'DB LAST 2 DIGITS'
  );


  console.table([{

    Tested:
      result.dbLast2.tested,

    Top1:
      result.dbLast2.top1Hits,

    Top1Rate:
      backtestPercent(
        result.dbLast2.top1Rate
      ),

    Top2:
      result.dbLast2.top2Hits,

    Top2Rate:
      backtestPercent(
        result.dbLast2.top2Rate
      ),

    Top3:
      result.dbLast2.top3Hits,

    Top3Rate:
      backtestPercent(
        result.dbLast2.top3Rate
      ),

    AvgRank:
      result.dbLast2
        .averageActualRank !== null
          ? result.dbLast2
              .averageActualRank
              .toFixed(2)
          : '--',

    MRR:
      result.dbLast2
        .mrr
        .toFixed(4)

  }]);


  console.log(
    '------------------------------------------'
  );


  const prizeRows =
    PRIZE_META
      .filter(
        pm =>
          pm.key !== 'db'
      )
      .map(
        pm => {

          const m =
            result.prizes[
              pm.key
            ];


          return {

            Giai:
              pm.label,

            Tested:
              m.tested,

            Top1:
              m.top1Hits,

            Top1Rate:
              backtestPercent(
                m.top1Rate
              ),

            Top2:
              m.top2Hits,

            Top2Rate:
              backtestPercent(
                m.top2Rate
              ),

            Top3:
              m.top3Hits,

            Top3Rate:
              backtestPercent(
                m.top3Rate
              ),

            AvgRank:
              m.averageActualRank !==
                null
                  ? m
                      .averageActualRank
                      .toFixed(2)
                  : '--',

            MRR:
              m.mrr
                .toFixed(4)

          };

        }
      );


  console.table(
    prizeRows
  );


  console.log(
    '=========================================='
  );


  return result;

}


/* =========================================================================
   11. SUMMARY TẤT CẢ TỈNH
   ========================================================================= */

function summarizeAllBacktestsV22(
  windowSize = 30
) {

  const results =
    backtestAllProvincesV22(
      windowSize
    );


  const rows =
    results.map(
      result => {

        if (
          result.error
        ) {

          return {

            Tinh:
              result.provinceName ||
              result.province,

            Tested:
              0,

            DB6_Top2:
              'ERROR',

            DB2_Top3:
              'ERROR',

            G1_Top3:
              'ERROR'

          };

        }


        return {

          Tinh:
            result.provinceName,

          Tested:
            result.testedDraws,

          DB6_Top1:
            backtestPercent(
              result.dbFull6
                .top1Rate
            ),

          DB6_Top2:
            backtestPercent(
              result.dbFull6
                .top2Rate
            ),

          DB2_Top1:
            backtestPercent(
              result.dbLast2
                .top1Rate
            ),

          DB2_Top3:
            backtestPercent(
              result.dbLast2
                .top3Rate
            ),

          G1_Top1:
            backtestPercent(
              result.prizes
                .g1
                .top1Rate
            ),

          G1_Top3:
            backtestPercent(
              result.prizes
                .g1
                .top3Rate
            )

        };

      }
    );


  console.log(
    '=========================================='
  );

  console.log(
    `XSMN V2.2 — ALL PROVINCES — WINDOW ${windowSize}`
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  return {

    version:
      BACKTEST_V22_CONFIG.version,

    windowSize,

    generatedAt:
      new Date()
        .toISOString(),

    results,

    rows

  };

}


/* =========================================================================
   12. SO SÁNH WINDOW 10 / 20 / 30 / 60
   ========================================================================= */

function compareBacktestWindowsV22(
  provinceSlug =
    SELECTED_PROVINCE
) {

  const windows = [
    10,
    20,
    30,
    60
  ];


  const rows = [];


  windows.forEach(
    windowSize => {

      const result =
        backtestProvinceV22(
          provinceSlug,
          windowSize
        );


      if (
        result.error
      ) {

        rows.push({

          Window:
            windowSize,

          Error:
            result.error

        });


        return;

      }


      rows.push({

        Window:
          windowSize,

        Tested:
          result.testedDraws,

        DB6_Top2:
          backtestPercent(
            result.dbFull6
              .top2Rate
          ),

        DB2_Top3:
          backtestPercent(
            result.dbLast2
              .top3Rate
          ),

        G1_Top3:
          backtestPercent(
            result.prizes
              .g1
              .top3Rate
          ),

        G2_Top3:
          backtestPercent(
            result.prizes
              .g2
              .top3Rate
          ),

        G3_Top3:
          backtestPercent(
            result.prizes
              .g3
              .top3Rate
          ),

        G4_Top3:
          backtestPercent(
            result.prizes
              .g4
              .top3Rate
          ),

        G5_Top3:
          backtestPercent(
            result.prizes
              .g5
              .top3Rate
          ),

        G6_Top3:
          backtestPercent(
            result.prizes
              .g6
              .top3Rate
          ),

        G7_Top3:
          backtestPercent(
            result.prizes
              .g7
              .top3Rate
          ),

        G8_Top3:
          backtestPercent(
            result.prizes
              .g8
              .top3Rate
          )

      });

    }
  );


  const p =
    provinceBySlug(
      provinceSlug
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.2 — WINDOW COMPARISON'
  );

  console.log(
    p
      ? p.name
      : provinceSlug
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  return rows;

}


/* =========================================================================
   13. QUICK TEST
   ========================================================================= */

/*
   Sau khi trang load xong,
   có thể chạy trong Console:

   1 tỉnh đang chọn:

   printBacktestProvinceV22();


   Riêng An Giang:

   printBacktestProvinceV22(
     'an-giang',
     30
   );


   So sánh 4 window:

   compareBacktestWindowsV22(
     'an-giang'
   );


   Tất cả 21 tỉnh:

   summarizeAllBacktestsV22(
     30
   );
*/


console.log(
  'XSMN V2.2 Backtest Engine loaded — Walk-Forward / No Future Leakage'
);
