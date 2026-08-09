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

/* =========================================================================
   XSMN V2.3 MODEL LAB
   Walk-Forward Weight Research Engine

   Mục tiêu:
   - Không thay đổi Production Engine.
   - Backtest nhiều bộ trọng số.
   - Không sử dụng dữ liệu tương lai.
   - So sánh Top 1 / Top 2 / Top 3 / MRR / Average Rank.
   - Tìm candidate model tốt hơn baseline V2.
   ========================================================================= */


/* =========================================================================
   1. MODEL CONFIGS
   ========================================================================= */

const MODEL_LAB_V23_CONFIGS = [

  {
    id: 'BASELINE',
    name: 'V2 Baseline',
    weights: {
      frequency: 0.25,
      recent: 0.18,
      momentum: 0.12,
      gan: 0.15,
      cycle: 0.12,
      headTail: 0.08,
      stability: 0.10
    }
  },

  {
    id: 'RECENT',
    name: 'Recent Trend',
    weights: {
      frequency: 0.20,
      recent: 0.28,
      momentum: 0.17,
      gan: 0.10,
      cycle: 0.10,
      headTail: 0.07,
      stability: 0.08
    }
  },

  {
    id: 'FREQUENCY',
    name: 'Frequency',
    weights: {
      frequency: 0.35,
      recent: 0.18,
      momentum: 0.10,
      gan: 0.10,
      cycle: 0.10,
      headTail: 0.07,
      stability: 0.10
    }
  },

  {
    id: 'BALANCED',
    name: 'Balanced',
    weights: {
      frequency: 0.22,
      recent: 0.20,
      momentum: 0.14,
      gan: 0.12,
      cycle: 0.12,
      headTail: 0.08,
      stability: 0.12
    }
  },

  {
    id: 'CYCLE',
    name: 'Cycle + Gan',
    weights: {
      frequency: 0.18,
      recent: 0.15,
      momentum: 0.10,
      gan: 0.20,
      cycle: 0.20,
      headTail: 0.07,
      stability: 0.10
    }
  }

];


/* =========================================================================
   2. SCORE USING CUSTOM WEIGHTS
   ========================================================================= */

function modelLabScoresV23(
  draws,
  giaiKey,
  windowSize,
  weights
) {

  const base =
    computeScoresForGiai(
      draws,
      giaiKey,
      windowSize
    );


  const scores = {};


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const n =
      pad2(i);


    const c =
      base.components[n] || {};


    scores[n] =
      clamp(

        (c.frequency || 0) *
        weights.frequency +

        (c.recent || 0) *
        weights.recent +

        (c.momentum || 0) *
        weights.momentum +

        (c.gan || 0) *
        weights.gan +

        (c.cycle || 0) *
        weights.cycle +

        (c.headTail || 0) *
        weights.headTail +

        (c.stability || 0) *
        weights.stability,

        0,
        1

      );

  }


  return scores;

}


/* =========================================================================
   3. EMPTY METRIC
   ========================================================================= */

function createModelLabMetricV23() {

  return {

    tests: 0,

    top1: 0,

    top2: 0,

    top3: 0,

    reciprocalRank: 0,

    rankSum: 0,

    rankedHits: 0

  };

}


/* =========================================================================
   4. UPDATE METRIC
   ========================================================================= */

function updateModelLabMetricV23(
  metric,
  actualNumbers,
  ranked
) {

  metric.tests++;


  let bestRank =
    Infinity;


  actualNumbers
    .forEach(
      actual => {

        const index =
          ranked.indexOf(
            actual
          );


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
    bestRank === Infinity
  ) {

    return;

  }


  metric.rankedHits++;


  metric.rankSum +=
    bestRank;


  metric.reciprocalRank +=
    1 / bestRank;


  if (
    bestRank <= 1
  ) {

    metric.top1++;

  }


  if (
    bestRank <= 2
  ) {

    metric.top2++;

  }


  if (
    bestRank <= 3
  ) {

    metric.top3++;

  }

}


/* =========================================================================
   5. FINALIZE METRIC
   ========================================================================= */

function finalizeModelLabMetricV23(
  metric
) {

  const tests =
    metric.tests || 1;


  return {

    tests:
      metric.tests,

    top1:
      metric.top1,

    top2:
      metric.top2,

    top3:
      metric.top3,

    top1Rate:
      metric.top1 /
      tests,

    top2Rate:
      metric.top2 /
      tests,

    top3Rate:
      metric.top3 /
      tests,

    mrr:
      metric.reciprocalRank /
      tests,

    averageRank:
      metric.rankedHits
        ? metric.rankSum /
          metric.rankedHits
        : 100

  };

}


/* =========================================================================
   6. BACKTEST ONE MODEL
   ========================================================================= */

function backtestModelV23(
  provinceSlug,
  giaiKey,
  windowSize,
  config
) {

  /*
   * getAllDrawsForProvince()
   * trả newest -> oldest.
   *
   * Backtest cần oldest -> newest.
   */

  const draws =
    getAllDrawsForProvince(
      provinceSlug
    )
    .slice()
    .reverse();


  const metric =
    createModelLabMetricV23();


  /*
   * Cần tối thiểu 30 kỳ training.
   */

  const minimumTraining =
    30;


  if (
    draws.length <=
    minimumTraining
  ) {

    return finalizeModelLabMetricV23(
      metric
    );

  }


  for (
    let targetIndex =
      minimumTraining;

    targetIndex <
      draws.length;

    targetIndex++
  ) {

    /*
     * CHỈ dữ liệu trước target.
     * Không future leakage.
     */

    const trainingChronological =
      draws.slice(
        0,
        targetIndex
      );


    /*
     * Engine hiện tại yêu cầu
     * newest -> oldest.
     */

    const trainingDraws =
      trainingChronological
        .slice()
        .reverse();


    const actualDraw =
      draws[
        targetIndex
      ];


    const scores =
      modelLabScoresV23(
        trainingDraws,
        giaiKey,
        windowSize,
        config.weights
      );


    const ranked =
      rankedNumbers(
        scores
      )
      .map(
        ([n]) => n
      );


    const actual =
      loOfPrize(
        actualDraw,
        giaiKey
      );


    updateModelLabMetricV23(
      metric,
      actual,
      ranked
    );

  }


  return finalizeModelLabMetricV23(
    metric
  );

}


/* =========================================================================
   7. MODEL QUALITY SCORE
   ========================================================================= */

function modelQualityScoreV23(
  metric
) {

  /*
   * Ưu tiên:
   *
   * Top1 = 35%
   * Top3 = 30%
   * MRR  = 25%
   * Avg Rank = 10%
   */


  const rankQuality =
    clamp(
      1 -
      (
        metric.averageRank -
        1
      ) /
      99
    );


  return (

    metric.top1Rate *
    0.35 +

    metric.top3Rate *
    0.30 +

    metric.mrr *
    0.25 +

    rankQuality *
    0.10

  );

}


/* =========================================================================
   8. TEST ALL MODELS — ONE PROVINCE / ONE PRIZE
   ========================================================================= */

function compareModelsV23(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey = 'db',

  windowSize = 30
) {

  const rows = [];


  MODEL_LAB_V23_CONFIGS
    .forEach(
      config => {

        const metric =
          backtestModelV23(
            provinceSlug,
            giaiKey,
            windowSize,
            config
          );


        const quality =
          modelQualityScoreV23(
            metric
          );


        rows.push({

          Model:
            config.id,

          Name:
            config.name,

          Tests:
            metric.tests,

          Top1:
            (
              metric.top1Rate *
              100
            ).toFixed(2) + '%',

          Top2:
            (
              metric.top2Rate *
              100
            ).toFixed(2) + '%',

          Top3:
            (
              metric.top3Rate *
              100
            ).toFixed(2) + '%',

          MRR:
            metric.mrr
              .toFixed(4),

          AvgRank:
            metric.averageRank
              .toFixed(2),

          Quality:
            (
              quality *
              100
            ).toFixed(2)

        });

      }
    );


  rows.sort(
    (a, b) =>
      Number(
        b.Quality
      ) -
      Number(
        a.Quality
      )
  );


  const p =
    provinceBySlug(
      provinceSlug
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.3 MODEL LAB'
  );

  console.log(
    `${p ? p.name : provinceSlug} · ${giaiKey.toUpperCase()} · Window ${windowSize}`
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  if (
    rows.length
  ) {

    console.log(
      `BEST MODEL: ${rows[0].Model} — Quality ${rows[0].Quality}`
    );

  }


  return rows;

}


/* =========================================================================
   9. TEST WINDOWS
   ========================================================================= */

function compareModelWindowsV23(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey = 'db'
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

      MODEL_LAB_V23_CONFIGS
        .forEach(
          config => {

            const metric =
              backtestModelV23(
                provinceSlug,
                giaiKey,
                windowSize,
                config
              );


            rows.push({

              Window:
                windowSize,

              Model:
                config.id,

              Top1:
                (
                  metric.top1Rate *
                  100
                ).toFixed(2) + '%',

              Top3:
                (
                  metric.top3Rate *
                  100
                ).toFixed(2) + '%',

              MRR:
                metric.mrr
                  .toFixed(4),

              AvgRank:
                metric.averageRank
                  .toFixed(2),

              Quality:
                (
                  modelQualityScoreV23(
                    metric
                  ) *
                  100
                ).toFixed(2)

            });

          }
        );

    }
  );


  rows.sort(
    (a, b) =>
      Number(
        b.Quality
      ) -
      Number(
        a.Quality
      )
  );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.3 — MODEL + WINDOW LAB'
  );

  console.log(
    provinceSlug,
    giaiKey
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  if (
    rows.length
  ) {

    console.log(
      `BEST: ${rows[0].Model} · Window ${rows[0].Window} · Quality ${rows[0].Quality}`
    );

  }


  return rows;

}


/* =========================================================================
   10. ALL 21 PROVINCES
   ========================================================================= */

function summarizeAllModelsV23(
  giaiKey = 'db',
  windowSize = 30
) {

  const summary = {};


  MODEL_LAB_V23_CONFIGS
    .forEach(
      config => {

        summary[
          config.id
        ] = {

          quality: 0,

          top1: 0,

          top3: 0,

          mrr: 0,

          avgRank: 0,

          provinces: 0

        };

      }
    );


  PROVINCES.forEach(
    province => {

      MODEL_LAB_V23_CONFIGS
        .forEach(
          config => {

            const metric =
              backtestModelV23(
                province.slug,
                giaiKey,
                windowSize,
                config
              );


            const s =
              summary[
                config.id
              ];


            s.quality +=
              modelQualityScoreV23(
                metric
              );


            s.top1 +=
              metric.top1Rate;


            s.top3 +=
              metric.top3Rate;


            s.mrr +=
              metric.mrr;


            s.avgRank +=
              metric.averageRank;


            s.provinces++;

          }
        );

    }
  );


  const rows =
    MODEL_LAB_V23_CONFIGS
      .map(
        config => {

          const s =
            summary[
              config.id
            ];


          const count =
            Math.max(
              s.provinces,
              1
            );


          return {

            Model:
              config.id,

            Provinces:
              s.provinces,

            Top1:
              (
                s.top1 /
                count *
                100
              ).toFixed(2) + '%',

            Top3:
              (
                s.top3 /
                count *
                100
              ).toFixed(2) + '%',

            MRR:
              (
                s.mrr /
                count
              ).toFixed(4),

            AvgRank:
              (
                s.avgRank /
                count
              ).toFixed(2),

            Quality:
              (
                s.quality /
                count *
                100
              ).toFixed(2)

          };

        }
      );


  rows.sort(
    (a, b) =>
      Number(
        b.Quality
      ) -
      Number(
        a.Quality
      )
  );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.3 — ALL PROVINCES MODEL LAB'
  );

  console.log(
    `Prize: ${giaiKey.toUpperCase()} · Window: ${windowSize}`
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  if (
    rows.length
  ) {

    console.log(
      `GLOBAL BEST MODEL: ${rows[0].Model} — Quality ${rows[0].Quality}`
    );

  }


  return rows;

}


/* =========================================================================
   11. QUICK TEST

   Sau khi GitHub Pages cập nhật,
   mở Chrome Console và chạy:

   1. An Giang — DB — Window 30

      compareModelsV23(
        'an-giang',
        'db',
        30
      );


   2. So sánh Model + Window:

      compareModelWindowsV23(
        'an-giang',
        'db'
      );


   3. Test 21 tỉnh:

      summarizeAllModelsV23(
        'db',
        30
      );

   ========================================================================= */


console.log(
  'XSMN V2.3 Model Lab loaded — Production Engine unchanged'
);


/* =========================================================================
   XSMN STATISTICAL ENGINE V2.4
   AUTO MODEL SELECTION LAB

   Mục tiêu:
   - Tự động tìm Model tốt nhất
   - Tự động tìm Window tốt nhất
   - Chạy riêng theo từng tỉnh + từng giải
   - Dựa hoàn toàn trên Walk-Forward Backtest V2.3
   - KHÔNG thay đổi Production Engine hiện tại

   Phụ thuộc:
   - V2.2 Backtest Engine
   - V2.3 Model Lab
   ========================================================================= */


/* =========================================================================
   1. CONFIG
   ========================================================================= */

const XSMN_V24_WINDOWS = [
  10,
  20,
  30,
  60
];


const XSMN_V24_PRIZES = [
  'db',
  'g1',
  'g2',
  'g3',
  'g4',
  'g5',
  'g6',
  'g7',
  'g8'
];


/* =========================================================================
   2. NORMALIZE MODEL RESULT
   ========================================================================= */

function normalizeV24Number(
  value,
  fallback = 0
) {

  const n =
    Number(
      value
    );

  return Number.isFinite(n)
    ? n
    : fallback;

}


/* =========================================================================
   3. FIND BEST MODEL FOR ONE WINDOW
   ========================================================================= */

function findBestModelV24(
  provinceSlug,
  giaiKey,
  windowSize
) {

  let results;

  try {

    results =
      compareModelsV23(
        provinceSlug,
        giaiKey,
        windowSize
      );

  } catch (error) {

    console.warn(
      'V2.4 compareModelsV23 failed:',
      provinceSlug,
      giaiKey,
      windowSize,
      error
    );

    return null;

  }


  if (
    !Array.isArray(results) ||
    !results.length
  ) {

    return null;

  }


  const normalized =
    results
      .map(
        row => {

          const quality =
            normalizeV24Number(
              row.Quality
            );

          const mrr =
            normalizeV24Number(
              row.MRR
            );

          const avgRank =
            normalizeV24Number(
              row.AvgRank,
              999
            );

          const top1 =
            normalizeV24Number(
              String(
                row.Top1 || 0
              ).replace(
                '%',
                ''
              )
            );

          const top3 =
            normalizeV24Number(
              String(
                row.Top3 || 0
              ).replace(
                '%',
                ''
              )
            );

          return {

            province:
              provinceSlug,

            prize:
              giaiKey,

            window:
              windowSize,

            model:
              row.Model,

            quality,

            mrr,

            avgRank,

            top1,

            top3,

            raw:
              row

          };

        }
      );


  normalized.sort(
    (a, b) => {

      if (
        b.quality !==
        a.quality
      ) {

        return (
          b.quality -
          a.quality
        );

      }


      if (
        b.top3 !==
        a.top3
      ) {

        return (
          b.top3 -
          a.top3
        );

      }


      if (
        b.mrr !==
        a.mrr
      ) {

        return (
          b.mrr -
          a.mrr
        );

      }


      return (
        a.avgRank -
        b.avgRank
      );

    }
  );


  return normalized[0];

}


/* =========================================================================
   4. FIND BEST MODEL + WINDOW
   ========================================================================= */

function findBestModelWindowV24(
  provinceSlug,
  giaiKey
) {

  const candidates = [];


  XSMN_V24_WINDOWS.forEach(
    windowSize => {

      const best =
        findBestModelV24(
          provinceSlug,
          giaiKey,
          windowSize
        );


      if (
        best
      ) {

        candidates.push(
          best
        );

      }

    }
  );


  if (
    !candidates.length
  ) {

    return null;

  }


  candidates.sort(
    (a, b) => {

      if (
        b.quality !==
        a.quality
      ) {

        return (
          b.quality -
          a.quality
        );

      }


      if (
        b.top3 !==
        a.top3
      ) {

        return (
          b.top3 -
          a.top3
        );

      }


      if (
        b.mrr !==
        a.mrr
      ) {

        return (
          b.mrr -
          a.mrr
        );

      }


      return (
        a.avgRank -
        b.avgRank
      );

    }
  );


  const winner =
    candidates[0];


  const runnerUp =
    candidates.length > 1
      ? candidates[1]
      : null;


  const margin =
    runnerUp
      ? (
          winner.quality -
          runnerUp.quality
        )
      : winner.quality;


  return {

    ...winner,

    margin:
      Number(
        margin.toFixed(2)
      ),

    runnerUp:
      runnerUp
        ? {
            model:
              runnerUp.model,

            window:
              runnerUp.window,

            quality:
              runnerUp.quality
          }
        : null,

    candidates

  };

}


/* =========================================================================
   5. STABILITY / CONFIDENCE LABEL
   ========================================================================= */

function classifySelectionV24(
  result
) {

  if (
    !result
  ) {

    return 'NO_DATA';

  }


  const margin =
    normalizeV24Number(
      result.margin
    );


  const quality =
    normalizeV24Number(
      result.quality
    );


  if (
    quality >= 10 &&
    margin >= 2
  ) {

    return 'STRONG';

  }


  if (
    quality >= 7 &&
    margin >= 1
  ) {

    return 'GOOD';

  }


  if (
    margin >= 0.5
  ) {

    return 'WEAK';

  }


  return 'UNSTABLE';

}


/* =========================================================================
   6. TEST ONE PROVINCE + ONE PRIZE
   ========================================================================= */

function testAutoSelectionV24(
  provinceSlug = null,
  giaiKey = 'db'
) {

  let slug =
    provinceSlug;


  if (
    !slug &&
    typeof getSelectedProvince ===
      'function'
  ) {

    const selected =
      getSelectedProvince();

    if (
      selected
    ) {

      slug =
        selected.slug ||
        selected.id ||
        selected.value ||
        null;

    }

  }


  if (
    !slug
  ) {

    console.warn(
      'V2.4: Không xác định được tỉnh.'
    );

    return null;

  }


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.4 — AUTO MODEL SELECTION'
  );

  console.log(
    `Province: ${slug}`
  );

  console.log(
    `Prize: ${giaiKey.toUpperCase()}`
  );

  console.log(
    '=========================================='
  );


  const result =
    findBestModelWindowV24(
      slug,
      giaiKey
    );


  if (
    !result
  ) {

    console.warn(
      'V2.4: Không có kết quả.'
    );

    return null;

  }


  const confidence =
    classifySelectionV24(
      result
    );


  console.table(
    result.candidates.map(
      item => ({

        Model:
          item.model,

        Window:
          item.window,

        Quality:
          item.quality.toFixed(2),

        Top1:
          item.top1.toFixed(2) +
          '%',

        Top3:
          item.top3.toFixed(2) +
          '%',

        MRR:
          item.mrr.toFixed(4),

        AvgRank:
          item.avgRank.toFixed(2)

      })
    )
  );


  console.log(
    '🏆 BEST MODEL:',
    result.model
  );

  console.log(
    '🪟 BEST WINDOW:',
    result.window
  );

  console.log(
    '⭐ QUALITY:',
    result.quality.toFixed(2)
  );

  console.log(
    '📏 MARGIN:',
    result.margin.toFixed(2)
  );

  console.log(
    '🛡️ STABILITY:',
    confidence
  );


  return {

    ...result,

    confidence

  };

}


/* =========================================================================
   7. AUTO SELECT ALL PRIZES OF ONE PROVINCE
   ========================================================================= */

function autoSelectProvinceV24(
  provinceSlug
) {

  const rows = [];


  XSMN_V24_PRIZES.forEach(
    giaiKey => {

      const result =
        findBestModelWindowV24(
          provinceSlug,
          giaiKey
        );


      if (
        !result
      ) {

        return;

      }


      rows.push({

        Province:
          provinceSlug,

        Prize:
          giaiKey.toUpperCase(),

        BestModel:
          result.model,

        BestWindow:
          result.window,

        Quality:
          result.quality.toFixed(2),

        Top1:
          result.top1.toFixed(2) +
          '%',

        Top3:
          result.top3.toFixed(2) +
          '%',

        MRR:
          result.mrr.toFixed(4),

        AvgRank:
          result.avgRank.toFixed(2),

        Margin:
          result.margin.toFixed(2),

        Stability:
          classifySelectionV24(
            result
          )

      });

    }
  );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.4 — PROVINCE AUTO SELECTION'
  );

  console.log(
    provinceSlug
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
   8. SAFE PRODUCTION DECISION

   Chưa thay Production Engine.

   Chỉ đánh dấu xem kết quả có đủ ổn định
   để xem xét sử dụng hay không.
   ========================================================================= */

function productionDecisionV24(
  provinceSlug,
  giaiKey
) {

  const result =
    findBestModelWindowV24(
      provinceSlug,
      giaiKey
    );


  if (
    !result
  ) {

    return {

      useAdaptiveModel:
        false,

      reason:
        'NO_DATA'

    };

  }


  const stability =
    classifySelectionV24(
      result
    );


  const useAdaptiveModel =
    stability === 'STRONG' ||
    stability === 'GOOD';


  return {

    useAdaptiveModel,

    province:
      provinceSlug,

    prize:
      giaiKey,

    model:
      result.model,

    window:
      result.window,

    quality:
      result.quality,

    margin:
      result.margin,

    stability,

    reason:
      useAdaptiveModel
        ? 'BACKTEST_ACCEPTED'
        : 'KEEP_CURRENT_PRODUCTION'

  };

}


/* =========================================================================
   9. QUICK TEST

   Sau khi GitHub Pages cập nhật:

   Kiên Giang - Giải Đặc Biệt:

   testAutoSelectionV24(
     'kien-giang',
     'db'
   );


   Toàn bộ giải của Kiên Giang:

   autoSelectProvinceV24(
     'kien-giang'
   );


   Kiểm tra Production Decision:

   productionDecisionV24(
     'kien-giang',
     'db'
   );

   ========================================================================= */


console.log(
  'XSMN V2.4 Auto Model Selection loaded — Production Engine unchanged'
);

/* =========================================================================
   XSMN V2.5
   MULTI-PERIOD STABILITY VALIDATION ENGINE

   Mục tiêu:
   - Không thay Production Engine hiện tại.
   - Không thay V2.4 Auto Model Selection.
   - Kiểm tra Model + Window được V2.4 chọn có ổn định qua nhiều
     giai đoạn lịch sử hay không.
   - Walk-Forward / No Future Leakage.
   - Đánh giá:
       + Selection consistency
       + Model consistency
       + Window consistency
       + Quality consistency
       + Rank consistency
       + Validation score
   - Chỉ tạo Production Recommendation.
   ========================================================================= */


/* =========================================================================
   1. CONFIG
   ========================================================================= */

const V25_CONFIG = {

  /*
   * Mỗi validation period dùng một block
   * các kỳ liên tiếp trong lịch sử.
   */

  periodSize: 20,


  /*
   * Số period tối đa dùng để validation.
   *
   * Với 100 kỳ:
   * giữ lại đủ training history cho engine,
   * sau đó chia phần còn lại thành nhiều period.
   */

  maxPeriods: 4,


  /*
   * Cần tối thiểu số kỳ training
   * trước khi bắt đầu validation.
   */

  minTrainingDraws: 30,


  /*
   * Ngưỡng Stability Score.
   */

  strongThreshold: 75,

  goodThreshold: 60,

  weakThreshold: 45,


  /*
   * Nếu model chiến thắng xuất hiện
   * ít hơn tỷ lệ này thì không coi
   * là ổn định.
   */

  minModelConsistency: 0.50,


  /*
   * Production chỉ được đề nghị adaptive
   * khi V2.4 và V2.5 cùng đồng thuận.
   */

  requireV24Approval: true

};


/* =========================================================================
   2. HELPERS
   ========================================================================= */

function v25Mean(values) {

  if (
    !Array.isArray(values) ||
    !values.length
  ) {

    return 0;

  }


  return values.reduce(
    (sum, value) =>
      sum +
      Number(
        value || 0
      ),
    0
  ) / values.length;

}


function v25StdDev(values) {

  if (
    !Array.isArray(values) ||
    values.length < 2
  ) {

    return 0;

  }


  const avg =
    v25Mean(
      values
    );


  const variance =
    v25Mean(
      values.map(
        value =>
          Math.pow(
            Number(value || 0) -
            avg,
            2
          )
      )
    );


  return Math.sqrt(
    variance
  );

}


function v25Clamp(
  value,
  min = 0,
  max = 1
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


function v25Percent(
  value
) {

  return Number(
    (
      Number(value || 0) *
      100
    ).toFixed(2)
  );

}


function v25Mode(
  values
) {

  if (
    !Array.isArray(values) ||
    !values.length
  ) {

    return {

      value: null,

      count: 0,

      ratio: 0

    };

  }


  const counts = {};


  values.forEach(
    value => {

      const key =
        String(value);


      counts[key] =
        (
          counts[key] || 0
        ) + 1;

    }
  );


  const ranked =
    Object.entries(
      counts
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


        return String(
          a[0]
        ).localeCompare(
          String(
            b[0]
          )
        );

      }
    );


  const winner =
    ranked[0];


  return {

    value:
      winner
        ? winner[0]
        : null,

    count:
      winner
        ? winner[1]
        : 0,

    ratio:
      winner
        ? winner[1] /
          values.length
        : 0

  };

}


/* =========================================================================
   3. TEMPORARY HISTORICAL DATA CONTEXT

   V2.4 đang đọc dữ liệu thông qua
   getAllDrawsForProvince().

   Khi validation một thời điểm trong quá khứ,
   ta tạm thay dữ liệu của tỉnh bằng training set
   tại thời điểm đó.

   Sau khi chạy xong sẽ restore ngay.
   ========================================================================= */

function withHistoricalDrawsV25(
  provinceSlug,
  trainingDraws,
  callback
) {

  /*
   * V2.3/V2.4 cuối cùng đều dựa vào
   * getAllDrawsForProvince().
   *
   * Ta ghi đè tạm function này để
   * engine không nhìn thấy tương lai.
   */

  const original =
    getAllDrawsForProvince;


  getAllDrawsForProvince =
    function(slug) {

      if (
        slug ===
        provinceSlug
      ) {

        return trainingDraws
          .slice()
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );

      }


      return original(
        slug
      );

    };


  try {

    return callback();

  } finally {

    getAllDrawsForProvince =
      original;

  }

}


/* =========================================================================
   4. BUILD VALIDATION PERIODS
   ========================================================================= */

function buildValidationPeriodsV25(
  provinceSlug
) {

  const draws =
    getAllDrawsForProvince(
      provinceSlug
    )
    .slice()
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );


  const total =
    draws.length;


  if (
    total <
    V25_CONFIG.minTrainingDraws +
    V25_CONFIG.periodSize
  ) {

    return [];

  }


  const available =
    total -
    V25_CONFIG.minTrainingDraws;


  const possiblePeriods =
    Math.floor(
      available /
      V25_CONFIG.periodSize
    );


  const periodCount =
    Math.min(
      possiblePeriods,
      V25_CONFIG.maxPeriods
    );


  if (
    periodCount <= 0
  ) {

    return [];

  }


  /*
   * Ưu tiên các period gần hiện tại nhất,
   * nhưng mỗi period vẫn chỉ được nhìn
   * dữ liệu trước nó.
   */

  const firstTestStart =
    total -
    periodCount *
    V25_CONFIG.periodSize;


  const periods = [];


  for (
    let index = 0;
    index < periodCount;
    index++
  ) {

    const testStart =
      firstTestStart +
      index *
      V25_CONFIG.periodSize;


    const testEnd =
      Math.min(
        testStart +
        V25_CONFIG.periodSize,
        total
      );


    const training =
      draws.slice(
        0,
        testStart
      );


    const testing =
      draws.slice(
        testStart,
        testEnd
      );


    if (
      training.length <
      V25_CONFIG.minTrainingDraws ||
      !testing.length
    ) {

      continue;

    }


    periods.push({

      index:
        index + 1,

      training,

      testing,

      trainingCount:
        training.length,

      testingCount:
        testing.length,

      trainingUntil:
        training[
          training.length - 1
        ].date,

      testFrom:
        testing[0].date,

      testTo:
        testing[
          testing.length - 1
        ].date

    });

  }


  return periods;

}


/* =========================================================================
   5. VALIDATE ONE PERIOD

   V2.4 chạy selection chỉ bằng dữ liệu training.
   Sau đó lưu model/window được chọn.

   Đây là validation về độ ổn định của việc
   lựa chọn model, không phải "học" từ test set.
   ========================================================================= */

function validatePeriodV25(
  provinceSlug,
  giaiKey,
  period
) {

  let selection = null;


  try {

    selection =
      withHistoricalDrawsV25(

        provinceSlug,

        period.training,

        () =>
          findBestModelWindowV24(
            provinceSlug,
            giaiKey
          )

      );

  } catch (
    error
  ) {

    console.warn(
      'V2.5 period error:',
      provinceSlug,
      giaiKey,
      period.index,
      error
    );


    return {

      period:
        period.index,

      valid:
        false,

      error:
        error &&
        error.message
          ? error.message
          : String(error)

    };

  }


  if (
    !selection
  ) {

    return {

      period:
        period.index,

      valid:
        false,

      error:
        'NO_SELECTION'

    };

  }


  let stability =
    'UNKNOWN';


  try {

    stability =
      classifySelectionV24(
        selection
      );

  } catch (
    error
  ) {

    stability =
      'UNKNOWN';

  }


  return {

    period:
      period.index,

    valid:
      true,

    trainingCount:
      period.trainingCount,

    testingCount:
      period.testingCount,

    trainingUntil:
      period.trainingUntil,

    testFrom:
      period.testFrom,

    testTo:
      period.testTo,

    model:
      selection.model,

    window:
      Number(
        selection.window || 0
      ),

    quality:
      Number(
        selection.quality || 0
      ),

    margin:
      Number(
        selection.margin || 0
      ),

    stability

  };

}


/* =========================================================================
   6. MULTI-PERIOD VALIDATION
   ========================================================================= */

function validateModelStabilityV25(
  provinceSlug,
  giaiKey
) {

  const current =
    findBestModelWindowV24(
      provinceSlug,
      giaiKey
    );


  if (
    !current
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      reason:
        'NO_CURRENT_SELECTION'

    };

  }


  const periods =
    buildValidationPeriodsV25(
      provinceSlug
    );


  if (
    !periods.length
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      current,

      reason:
        'NOT_ENOUGH_HISTORY'

    };

  }


  const results =
    periods.map(
      period =>
        validatePeriodV25(
          provinceSlug,
          giaiKey,
          period
        )
    );


  const validResults =
    results.filter(
      item =>
        item.valid
    );


  if (
    !validResults.length
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      current,

      periods:
        results,

      reason:
        'NO_VALID_PERIOD'

    };

  }


  /* -----------------------------------------------------------------------
     MODEL CONSISTENCY
     ----------------------------------------------------------------------- */

  const modelMode =
    v25Mode(
      validResults.map(
        item =>
          item.model
      )
    );


  /* -----------------------------------------------------------------------
     WINDOW CONSISTENCY
     ----------------------------------------------------------------------- */

  const windowMode =
    v25Mode(
      validResults.map(
        item =>
          item.window
      )
    );


  /* -----------------------------------------------------------------------
     EXACT CONFIG CONSISTENCY
     ----------------------------------------------------------------------- */

  const configMode =
    v25Mode(
      validResults.map(
        item =>
          `${item.model}|${item.window}`
      )
    );


  /* -----------------------------------------------------------------------
     CURRENT CONFIG CONSISTENCY

     Bao nhiêu period chọn đúng model/window
     hiện tại của V2.4?
     ----------------------------------------------------------------------- */

  const currentMatches =
    validResults.filter(
      item =>
        item.model ===
          current.model &&
        Number(
          item.window
        ) ===
          Number(
            current.window
          )
    ).length;


  const currentConfigRatio =
    currentMatches /
    validResults.length;


  /* -----------------------------------------------------------------------
     QUALITY CONSISTENCY
     ----------------------------------------------------------------------- */

  const qualities =
    validResults.map(
      item =>
        Number(
          item.quality || 0
        )
    );


  const margins =
    validResults.map(
      item =>
        Number(
          item.margin || 0
        )
    );


  const avgQuality =
    v25Mean(
      qualities
    );


  const qualitySD =
    v25StdDev(
      qualities
    );


  const avgMargin =
    v25Mean(
      margins
    );


  /*
   * Quality consistency:
   *
   * SD càng thấp càng tốt.
   *
   * Dùng scale 10 vì Quality V2.4
   * đang ở thang tương đối nhỏ.
   */

  const qualityConsistency =
    v25Clamp(
      1 -
      qualitySD /
      10
    );


  /* -----------------------------------------------------------------------
     STABILITY SCORE

     30% model consistency
     20% window consistency
     25% exact config consistency
     15% current config repeatability
     10% quality consistency
     ----------------------------------------------------------------------- */

  const stabilityScore =
    100 *
    (

      modelMode.ratio *
      0.30 +

      windowMode.ratio *
      0.20 +

      configMode.ratio *
      0.25 +

      currentConfigRatio *
      0.15 +

      qualityConsistency *
      0.10

    );


  let classification =
    'UNSTABLE';


  if (
    stabilityScore >=
      V25_CONFIG.strongThreshold &&
    modelMode.ratio >= 0.75
  ) {

    classification =
      'STRONG';

  } else if (
    stabilityScore >=
      V25_CONFIG.goodThreshold &&
    modelMode.ratio >=
      V25_CONFIG.minModelConsistency
  ) {

    classification =
      'GOOD';

  } else if (
    stabilityScore >=
      V25_CONFIG.weakThreshold
  ) {

    classification =
      'WEAK';

  }


  return {

    ready:
      true,

    version:
      'V2.5',

    province:
      provinceSlug,

    prize:
      giaiKey,

    current: {

      model:
        current.model,

      window:
        Number(
          current.window
        ),

      quality:
        Number(
          current.quality || 0
        ),

      margin:
        Number(
          current.margin || 0
        ),

      stability:
        classifySelectionV24(
          current
        )

    },


    validation: {

      periodCount:
        validResults.length,

      modelWinner:
        modelMode.value,

      modelConsistency:
        v25Percent(
          modelMode.ratio
        ),

      windowWinner:
        Number(
          windowMode.value
        ),

      windowConsistency:
        v25Percent(
          windowMode.ratio
        ),

      configWinner:
        configMode.value,

      configConsistency:
        v25Percent(
          configMode.ratio
        ),

      currentConfigConsistency:
        v25Percent(
          currentConfigRatio
        ),

      averageQuality:
        Number(
          avgQuality.toFixed(
            4
          )
        ),

      qualityStdDev:
        Number(
          qualitySD.toFixed(
            4
          )
        ),

      averageMargin:
        Number(
          avgMargin.toFixed(
            4
          )
        ),

      qualityConsistency:
        v25Percent(
          qualityConsistency
        ),

      stabilityScore:
        Number(
          stabilityScore.toFixed(
            2
          )
        ),

      classification

    },

    periods:
      results

  };

}


/* =========================================================================
   7. PRODUCTION VALIDATION DECISION

   V2.5 KHÔNG tự thay production.

   Chỉ trả recommendation.
   ========================================================================= */

function productionDecisionV25(
  provinceSlug,
  giaiKey
) {

  const v24 =
    productionDecisionV24(
      provinceSlug,
      giaiKey
    );


  const v25 =
    validateModelStabilityV25(
      provinceSlug,
      giaiKey
    );


  if (
    !v25.ready
  ) {

    return {

      useAdaptiveModel:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      reason:
        v25.reason ||
        'V25_NOT_READY',

      v24,

      v25

    };

  }


  const classification =
    v25.validation
      .classification;


  const validationAccepted =
    classification ===
      'STRONG' ||
    classification ===
      'GOOD';


  const v24Accepted =
    V25_CONFIG
      .requireV24Approval
      ? Boolean(
          v24 &&
          v24.useAdaptiveModel
        )
      : true;


  const sameModel =
    String(
      v25.validation
        .modelWinner
    ) ===
    String(
      v25.current
        .model
    );


  const modelConsistency =
    Number(
      v25.validation
        .modelConsistency
    );


  const useAdaptiveModel =

    validationAccepted &&

    v24Accepted &&

    sameModel &&

    modelConsistency >=
      V25_CONFIG
        .minModelConsistency *
      100;


  return {

    useAdaptiveModel,

    province:
      provinceSlug,

    prize:
      giaiKey,

    model:
      v25.current.model,

    window:
      v25.current.window,

    quality:
      v25.current.quality,

    v24Stability:
      v25.current.stability,

    validationStability:
      classification,

    validationScore:
      v25.validation
        .stabilityScore,

    modelConsistency:
      v25.validation
        .modelConsistency,

    windowConsistency:
      v25.validation
        .windowConsistency,

    configConsistency:
      v25.validation
        .configConsistency,

    reason:
      useAdaptiveModel
        ? 'MULTI_PERIOD_VALIDATION_ACCEPTED'
        : 'KEEP_CURRENT_PRODUCTION',

    v24,

    v25

  };

}


/* =========================================================================
   8. PRINT ONE VALIDATION
   ========================================================================= */

function printValidationV25(
  provinceSlug =
    SELECTED_PROVINCE,
  giaiKey = 'db'
) {

  const result =
    validateModelStabilityV25(
      provinceSlug,
      giaiKey
    );


  const p =
    provinceBySlug(
      provinceSlug
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.5 — MULTI-PERIOD VALIDATION'
  );

  console.log(
    p
      ? p.name
      : provinceSlug
  );

  console.log(
    `Prize: ${String(
      giaiKey
    ).toUpperCase()}`
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.log(
      'NOT READY:',
      result.reason
    );

    return result;

  }


  console.log(
    'Current V2.4:',
    result.current
  );


  console.log(
    'Validation:',
    result.validation
  );


  console.table(
  result.periods.map(
    item => ({

      Period:
        item.period,

      Training:
        item.trainingCount ||
        '-',

      Test:
        item.testingCount ||
        '-',

      Model:
        item.model ||
        '-',

      Window:
        item.window ||
        '-',

      Quality:
        item.quality != null
          ? Number(
              item.quality
            ).toFixed(2)
          : '-',

      Margin:
        item.margin != null
          ? Number(
              item.margin
            ).toFixed(2)
          : '-',

      Stability:
        item.stability ||
        '-'

    }))
);

console.log(
  `V2.5 SCORE: ${result.validation.stabilityScore}/100`
);



console.log(
    `CLASSIFICATION: ${result.validation.classification}`
  );


  return result;

}


/* =========================================================================
   9. VALIDATE ALL PRIZES OF ONE PROVINCE
   ========================================================================= */

function validateProvinceV25(
  provinceSlug
) {

  const rows = [];


  PRIZE_META.forEach(
    prize => {

      const result =
        validateModelStabilityV25(
          provinceSlug,
          prize.key
        );


      if (
        !result.ready
      ) {

        rows.push({

          Prize:
            prize.key.toUpperCase(),

          Model:
            '-',

          Window:
            '-',

          Score:
            '-',

          Stability:
            result.reason

        });


        return;

      }


      rows.push({

        Prize:
          prize.key.toUpperCase(),

        Model:
          result.current.model,

        Window:
          result.current.window,

        ModelConsistency:
          result.validation
            .modelConsistency +
          '%',

        WindowConsistency:
          result.validation
            .windowConsistency +
          '%',

        ConfigConsistency:
          result.validation
            .configConsistency +
          '%',

        Score:
          result.validation
            .stabilityScore,

        Stability:
          result.validation
            .classification

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
    'XSMN V2.5 — PROVINCE VALIDATION'
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
   10. VALIDATE ALL 21 PROVINCES — ONE PRIZE
   ========================================================================= */

function validateAllProvincesV25(
  giaiKey = 'db'
) {

  const rows = [];


  PROVINCES.forEach(
    province => {

      const result =
        validateModelStabilityV25(
          province.slug,
          giaiKey
        );


      if (
        !result.ready
      ) {

        rows.push({

          Province:
            province.name,

          Model:
            '-',

          Window:
            '-',

          Score:
            '-',

          Stability:
            result.reason

        });


        return;

      }


      rows.push({

        Province:
          province.name,

        Model:
          result.current.model,

        Window:
          result.current.window,

        ModelConsistency:
          result.validation
            .modelConsistency +
          '%',

        ConfigConsistency:
          result.validation
            .configConsistency +
          '%',

        Score:
          result.validation
            .stabilityScore,

        Stability:
          result.validation
            .classification

      });

    }
  );


  rows.sort(
    (a, b) => {

      const scoreA =
        Number(
          a.Score
        ) || 0;

      const scoreB =
        Number(
          b.Score
        ) || 0;


      return (
        scoreB -
        scoreA
      );

    }
  );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.5 — ALL PROVINCES VALIDATION'
  );

  console.log(
    `Prize: ${String(
      giaiKey
    ).toUpperCase()}`
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
   11. QUICK TEST

   Sau khi GitHub Pages cập nhật:

   Kiên Giang — Giải Đặc Biệt:

   printValidationV25(
     'kien-giang',
     'db'
   );


   Production recommendation:

   productionDecisionV25(
     'kien-giang',
     'db'
   );


   Tất cả giải Kiên Giang:

   validateProvinceV25(
     'kien-giang'
   );


   DB của toàn bộ 21 tỉnh:

   validateAllProvincesV25(
     'db'
   );


   LƯU Ý:

   V2.5 CHƯA thay nút "Dự Báo Ngay".

   V2.5 chỉ làm lớp validation
   giữa V2.4 và Production.

   ========================================================================= */


console.log(
  'XSMN V2.5 Stability Validation loaded — Multi-Period / Production unchanged'
);

/* =========================================================================
   XSMN V2.5 — SAFE MOBILE UI
   Multi-Period Stability Validation

   - Chỉ tạo UI trong tab Cài đặt
   - Không thay Production Engine
   - Không thay init()
   - Không thay nút Dự Báo Ngay
   - Không overlay / fixed position
   ========================================================================= */

(function () {

  function v25UiEscape(value) {

    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  }


  function v25UiProvinceSlug() {

    if (
      typeof SELECTED_PROVINCE !==
      'undefined' &&
      SELECTED_PROVINCE
    ) {

      return SELECTED_PROVINCE;

    }

    return null;

  }


  function v25UiProvinceName(
    slug
  ) {

    try {

      if (
        typeof provinceBySlug ===
        'function'
      ) {

        const province =
          provinceBySlug(
            slug
          );

        if (
          province &&
          province.name
        ) {

          return province.name;

        }

      }

    } catch (error) {

      console.warn(
        'V2.5 UI province name:',
        error
      );

    }


    return slug || '--';

  }


  function v25UiClassInfo(
    classification
  ) {

    switch (
      String(
        classification || ''
      ).toUpperCase()
    ) {

      case 'STRONG':

        return {
          icon: '🟢',
          label: 'STRONG'
        };


      case 'GOOD':

        return {
          icon: '🔵',
          label: 'GOOD'
        };


      case 'WEAK':

        return {
          icon: '🟡',
          label: 'WEAK'
        };


      default:

        return {
          icon: '🔴',
          label: 'UNSTABLE'
        };

    }

  }


  function buildV25SafeUI() {

    /*
     * Không tạo card lần thứ hai.
     */

    if (
      document.getElementById(
        'v25SafeCard'
      )
    ) {

      return;

    }


    const settingsTab =
      document.getElementById(
        'tab-settings'
      );


    if (
      !settingsTab
    ) {

      console.warn(
        'V2.5 UI: không tìm thấy tab-settings'
      );

      return;

    }


    const card =
      document.createElement(
        'div'
      );


    card.id =
      'v25SafeCard';


    card.className =
      'card';


    card.style.marginTop =
      '18px';


    card.innerHTML = `

      <div
        style="
          font-size:22px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🛡️ Stability Validation V2.5
      </div>


      <div
        class="sub"
        style="
          line-height:1.6;
          margin-bottom:16px;
        "
      >
        Kiểm tra độ ổn định của Model + Window
        qua nhiều giai đoạn lịch sử độc lập.
        V2.5 hiện chỉ dùng để validation,
        chưa thay đổi Production Engine.
      </div>


      <div
        style="
          margin-bottom:14px;
        "
      >

        <div
          class="sub"
          style="
            margin-bottom:6px;
          "
        >
          Giải kiểm định
        </div>


        <select
          id="v25PrizeSelect"
          style="
            width:100%;
            padding:13px 10px;
            border-radius:12px;
            font-size:16px;
          "
        >

          <option value="db">
            Giải Đặc Biệt
          </option>

          <option value="g1">
            Giải Nhất
          </option>

          <option value="g2">
            Giải Nhì
          </option>

          <option value="g3">
            Giải Ba
          </option>

          <option value="g4">
            Giải Tư
          </option>

          <option value="g5">
            Giải Năm
          </option>

          <option value="g6">
            Giải Sáu
          </option>

          <option value="g7">
            Giải Bảy
          </option>

          <option value="g8">
            Giải Tám
          </option>

        </select>

      </div>


      <button
        id="v25RunButton"
        type="button"
        style="
          width:100%;
          border:none;
          border-radius:16px;
          padding:17px 12px;
          font-size:18px;
          font-weight:900;
          cursor:pointer;
          background:linear-gradient(
            135deg,
            #ffc447,
            #ff8a3d
          );
          color:#201600;
        "
      >
        🛡️ Chạy Validation V2.5
      </button>


      <div
        id="v25Status"
        class="sub"
        style="
          margin-top:14px;
          line-height:1.6;
        "
      >
        Chưa chạy validation.
      </div>


      <div
        id="v25Results"
        style="
          display:none;
          margin-top:16px;
        "
      >
      </div>


      <div
        class="sub"
        style="
          margin-top:16px;
          line-height:1.6;
          padding:13px;
          border-radius:12px;
          background:rgba(
            255,
            255,
            255,
            0.035
          );
        "
      >
        V2.5 đánh giá tính ổn định của mô hình
        trên dữ liệu lịch sử. Stability Score
        không phải xác suất trúng ở kỳ tiếp theo.
      </div>

    `;


    settingsTab.appendChild(
      card
    );


    const button =
      document.getElementById(
        'v25RunButton'
      );


    if (
      button
    ) {

      button.addEventListener(
        'click',
        runV25SafeUI
      );

    }


    console.log(
      'XSMN V2.5 Safe Mobile UI ready'
    );

  }


  function runV25SafeUI() {

    const button =
      document.getElementById(
        'v25RunButton'
      );


    const status =
      document.getElementById(
        'v25Status'
      );


    const results =
      document.getElementById(
        'v25Results'
      );


    const prizeSelect =
      document.getElementById(
        'v25PrizeSelect'
      );


    if (
      !status ||
      !results
    ) {

      return;

    }


    const provinceSlug =
      v25UiProvinceSlug();


    const giaiKey =
      prizeSelect
        ? prizeSelect.value
        : 'db';


    if (
      !provinceSlug
    ) {

      status.innerHTML =
        '❌ Không xác định được tỉnh đang chọn.';

      return;

    }


    if (
      typeof validateModelStabilityV25 !==
      'function'
    ) {

      status.innerHTML =
        '❌ Không tìm thấy V2.5 Validation Engine.';

      return;

    }


    const provinceName =
      v25UiProvinceName(
        provinceSlug
      );


    if (
      button
    ) {

      button.disabled =
        true;


      button.textContent =
        '⏳ Đang Validation...';

    }


    status.innerHTML =
      `
        ⏳ Đang kiểm định
        <b>${v25UiEscape(
          provinceName
        )}</b>...
      `;


    results.style.display =
      'none';


    results.innerHTML =
      '';


    /*
     * Cho browser render trạng thái trước
     * khi chạy validation.
     */

    setTimeout(
      function () {

        try {

          const result =
            validateModelStabilityV25(
              provinceSlug,
              giaiKey
            );


          if (
            !result ||
            !result.ready
          ) {

            const reason =
              result &&
              result.reason
                ? result.reason
                : 'UNKNOWN';


            status.innerHTML =
              `
                ⚠️ V2.5 chưa thể validation:
                <b>${v25UiEscape(
                  reason
                )}</b>
              `;


            return;

          }


          renderV25SafeUI(
            result,
            provinceName
          );


        } catch (error) {

          console.error(
            'V2.5 UI error:',
            error
          );


          status.innerHTML =
            `
              ❌ Validation gặp lỗi:
              <b>${v25UiEscape(
                error &&
                error.message
                  ? error.message
                  : error
              )}</b>
            `;

        } finally {

          if (
            button
          ) {

            button.disabled =
              false;


            button.textContent =
              '🛡️ Chạy Validation V2.5';

          }

        }

      },
      80
    );

  }


  function renderV25SafeUI(
    result,
    provinceName
  ) {

    const status =
      document.getElementById(
        'v25Status'
      );


    const results =
      document.getElementById(
        'v25Results'
      );


    if (
      !status ||
      !results
    ) {

      return;

    }


    const current =
      result.current || {};


    const validation =
      result.validation || {};


    const classInfo =
      v25UiClassInfo(
        validation.classification
      );


    status.innerHTML =
      `
        ✅ Hoàn tất
        <b>${v25UiEscape(
          provinceName
        )}</b>
        · ${v25UiEscape(
          String(
            result.prize || ''
          ).toUpperCase()
        )}
      `;


    results.style.display =
      'block';


    results.innerHTML = `

      <div
        style="
          padding:16px;
          border-radius:15px;
          background:rgba(
            255,
            193,
            61,
            0.10
          );
          border:1px solid rgba(
            255,
            193,
            61,
            0.30
          );
          margin-bottom:14px;
        "
      >

        <div
          class="sub"
          style="
            font-weight:800;
            margin-bottom:7px;
          "
        >
          CURRENT V2.4
        </div>


        <div
          style="
            font-size:24px;
            font-weight:900;
            color:#ffc447;
          "
        >
          ${v25UiEscape(
            current.model || '--'
          )}
          ·
          ${v25UiEscape(
            current.window || '--'
          )} kỳ
        </div>


        <div
          class="sub"
          style="
            margin-top:8px;
            line-height:1.6;
          "
        >
          Quality:
          <b>${v25UiEscape(
            current.quality !== undefined
              ? Number(
                  current.quality
                ).toFixed(2)
              : '--'
          )}</b>

          · Margin:
          <b>${v25UiEscape(
            current.margin !== undefined
              ? Number(
                  current.margin
                ).toFixed(2)
              : '--'
          )}</b>
        </div>

      </div>


      <div
        style="
          padding:16px;
          border-radius:15px;
          background:rgba(
            255,
            255,
            255,
            0.055
          );
          margin-bottom:14px;
        "
      >

        <div
          style="
            font-size:15px;
            font-weight:800;
            opacity:.8;
          "
        >
          🛡️ STABILITY SCORE
        </div>


        <div
          style="
            font-size:34px;
            font-weight:900;
            color:#ffc447;
            margin-top:5px;
          "
        >
          ${v25UiEscape(
            validation.stabilityScore
          )}/100
        </div>


        <div
          style="
            font-size:19px;
            font-weight:900;
            margin-top:6px;
          "
        >
          ${classInfo.icon}
          ${classInfo.label}
        </div>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            1fr 1fr;
          gap:10px;
          margin-bottom:14px;
        "
      >

        ${v25MetricCard(
          'Model consistency',
          validation.modelConsistency
        )}

        ${v25MetricCard(
          'Window consistency',
          validation.windowConsistency
        )}

        ${v25MetricCard(
          'Config consistency',
          validation.configConsistency
        )}

        ${v25MetricCard(
          'Current config',
          validation.currentConfigConsistency
        )}

      </div>


      <div
        style="
          padding:15px;
          border-radius:14px;
          background:rgba(
            255,
            255,
            255,
            0.045
          );
          line-height:1.7;
        "
      >

        <div>
          🏆 Model thường thắng:
          <b>
            ${v25UiEscape(
              validation.modelWinner ||
              '--'
            )}
          </b>
        </div>


        <div>
          🪟 Window thường thắng:
          <b>
            ${v25UiEscape(
              validation.windowWinner ||
              '--'
            )} kỳ
          </b>
        </div>


        <div>
          📚 Số giai đoạn kiểm định:
          <b>
            ${v25UiEscape(
              validation.periodCount ||
              0
            )}
          </b>
        </div>


        <div>
          📊 Average Quality:
          <b>
            ${v25UiEscape(
              validation.averageQuality
            )}
          </b>
        </div>


        <div>
          📉 Quality SD:
          <b>
            ${v25UiEscape(
              validation.qualityStdDev
            )}
          </b>
        </div>

      </div>

    `;

  }


  function v25MetricCard(
    label,
    value
  ) {

    const safeValue =
      value === null ||
      value === undefined
        ? '--'
        : value + '%';


    return `

      <div
        style="
          padding:13px 8px;
          border-radius:13px;
          background:rgba(
            255,
            255,
            255,
            0.05
          );
          text-align:center;
        "
      >

        <div
          style="
            font-size:21px;
            font-weight:900;
            color:#ffc447;
          "
        >
          ${v25UiEscape(
            safeValue
          )}
        </div>


        <div
          class="sub"
          style="
            font-size:12px;
            margin-top:4px;
          "
        >
          ${v25UiEscape(
            label
          )}
        </div>

      </div>

    `;

  }


  /*
   * SAFE INIT
   */

  function initV25SafeUI() {

    try {

      buildV25SafeUI();

    } catch (error) {

      console.error(
        'V2.5 Safe UI init error:',
        error
      );

    }

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initV25SafeUI,
      {
        once: true
      }
    );

  } else {

    initV25SafeUI();

  }


  console.log(
    'XSMN V2.5 Safe Mobile UI Patch loaded'
  );

})();

/* =========================================================================
   XSMN V2.6
   OUT-OF-SAMPLE PERFORMANCE VALIDATION ENGINE

   Mục tiêu:
   - Không thay Production Engine.
   - Không thay V2.4 Auto Model Selection.
   - Không thay V2.5 Stability Validation.
   - Kiểm tra Model + Window trên dữ liệu TEST
     hoàn toàn nằm ngoài training set.
   - Walk-Forward / No Future Leakage.

   Quy trình mỗi period:

       TRAINING DATA
             ↓
       V2.4 chọn Model + Window
             ↓
       khóa cấu hình
             ↓
       TEST trên dữ liệu tương lai
             ↓
       đo Top1 / Top3 / MRR / AvgRank

   V2.6 chỉ tạo Production Recommendation.
   ========================================================================= */


/* =========================================================================
   1. CONFIG
   ========================================================================= */

const V26_CONFIG = {

  /*
   * Mỗi block OOS gồm 20 kỳ.
   */

  testPeriodSize: 20,


  /*
   * Tối đa 3 block OOS.
   *
   * Với 100 kỳ dữ liệu:
   * 40 kỳ đầu training
   * + tối đa 3 block × 20 kỳ.
   */

  maxTestPeriods: 3,


  /*
   * Training tối thiểu trước
   * period OOS đầu tiên.
   */

  minTrainingDraws: 40,


  /*
   * Trọng số Performance Score.
   *
   * Top1 được ưu tiên cao nhất.
   * Top3 đo khả năng lọt nhóm đầu.
   * MRR thưởng cho thứ hạng cao.
   * Rank Quality đánh giá toàn bảng.
   */

  weights: {

    top1: 0.35,

    top3: 0.30,

    mrr: 0.25,

    rankQuality: 0.10

  },


  /*
   * Classification thresholds.
   *
   * Đây mới chỉ là ngưỡng nghiên cứu.
   * Chưa dùng để thay Production.
   */

  strongThreshold: 12,

  goodThreshold: 8,

  weakThreshold: 5,


  /*
   * Yêu cầu tối thiểu bao nhiêu
   * OOS period hợp lệ.
   */

  minValidPeriods: 2,


  /*
   * Production recommendation V2.6
   * sẽ yêu cầu V2.5 đồng thuận.
   */

  requireV25Approval: true

};


/* =========================================================================
   2. BASIC HELPERS
   ========================================================================= */

function v26Clamp(
  value,
  min = 0,
  max = 1
) {

  return Math.max(
    min,
    Math.min(
      max,
      Number(value || 0)
    )
  );

}


function v26Mean(
  values
) {

  if (
    !Array.isArray(values) ||
    !values.length
  ) {

    return 0;

  }


  return values.reduce(
    (sum, value) =>
      sum +
      Number(
        value || 0
      ),
    0
  ) / values.length;

}


function v26StdDev(
  values
) {

  if (
    !Array.isArray(values) ||
    values.length < 2
  ) {

    return 0;

  }


  const mean =
    v26Mean(
      values
    );


  const variance =
    v26Mean(
      values.map(
        value =>
          Math.pow(
            Number(value || 0) -
            mean,
            2
          )
      )
    );


  return Math.sqrt(
    variance
  );

}


/* =========================================================================
   3. FIND MODEL CONFIG
   ========================================================================= */

function getModelConfigV26(
  modelId
) {

  if (
    !Array.isArray(
      MODEL_LAB_V23_CONFIGS
    )
  ) {

    return null;

  }


  return (
    MODEL_LAB_V23_CONFIGS.find(
      config =>
        config.id ===
        modelId
    ) ||
    null
  );

}


/* =========================================================================
   4. EMPTY OOS METRIC
   ========================================================================= */

function createOOSMetricV26() {

  return {

    tests: 0,

    top1: 0,

    top2: 0,

    top3: 0,

    reciprocalRank: 0,

    rankSum: 0,

    rankedHits: 0

  };

}


/* =========================================================================
   5. UPDATE OOS METRIC
   ========================================================================= */

function updateOOSMetricV26(
  metric,
  actualNumbers,
  rankedNumbersList
) {

  metric.tests++;


  if (
    !Array.isArray(actualNumbers) ||
    !actualNumbers.length ||
    !Array.isArray(
      rankedNumbersList
    ) ||
    !rankedNumbersList.length
  ) {

    return;

  }


  let bestRank =
    Infinity;


  actualNumbers.forEach(
    actual => {

      const index =
        rankedNumbersList.indexOf(
          actual
        );


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
    bestRank === Infinity
  ) {

    return;

  }


  metric.rankedHits++;


  metric.rankSum +=
    bestRank;


  metric.reciprocalRank +=
    1 / bestRank;


  if (
    bestRank <= 1
  ) {

    metric.top1++;

  }


  if (
    bestRank <= 2
  ) {

    metric.top2++;

  }


  if (
    bestRank <= 3
  ) {

    metric.top3++;

  }

}


/* =========================================================================
   6. FINALIZE OOS METRIC
   ========================================================================= */

function finalizeOOSMetricV26(
  metric
) {

  const tests =
    Number(
      metric.tests || 0
    );


  if (
    !tests
  ) {

    return {

      tests: 0,

      top1: 0,

      top2: 0,

      top3: 0,

      top1Rate: 0,

      top2Rate: 0,

      top3Rate: 0,

      mrr: 0,

      averageRank: 100

    };

  }


  return {

    tests,

    top1:
      metric.top1,

    top2:
      metric.top2,

    top3:
      metric.top3,

    top1Rate:
      metric.top1 /
      tests,

    top2Rate:
      metric.top2 /
      tests,

    top3Rate:
      metric.top3 /
      tests,

    mrr:
      metric.reciprocalRank /
      tests,

    averageRank:
      metric.rankedHits
        ? metric.rankSum /
          metric.rankedHits
        : 100

  };

}


/* =========================================================================
   7. OOS PERFORMANCE SCORE
   ========================================================================= */

function performanceScoreV26(
  metric
) {

  if (
    !metric ||
    !metric.tests
  ) {

    return 0;

  }


  const rankQuality =
    v26Clamp(

      1 -
      (
        Number(
          metric.averageRank || 100
        ) -
        1
      ) /
      99

    );


  const score =

    Number(
      metric.top1Rate || 0
    ) *
    V26_CONFIG.weights.top1 +

    Number(
      metric.top3Rate || 0
    ) *
    V26_CONFIG.weights.top3 +

    Number(
      metric.mrr || 0
    ) *
    V26_CONFIG.weights.mrr +

    rankQuality *
    V26_CONFIG.weights.rankQuality;


  return Number(
    (
      score *
      100
    ).toFixed(4)
  );

}


/* =========================================================================
   8. PERFORMANCE CLASSIFICATION
   ========================================================================= */

function classifyPerformanceV26(
  score
) {

  const value =
    Number(
      score || 0
    );


  if (
    value >=
    V26_CONFIG.strongThreshold
  ) {

    return 'STRONG';

  }


  if (
    value >=
    V26_CONFIG.goodThreshold
  ) {

    return 'GOOD';

  }


  if (
    value >=
    V26_CONFIG.weakThreshold
  ) {

    return 'WEAK';

  }


  return 'POOR';

}


console.log(
  'XSMN V2.6 Block 1 loaded — OOS Core Helpers ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 2
   BUILD TRUE OUT-OF-SAMPLE PERIODS

   Nguyên tắc:

   Period 1:
   [ TRAINING ---------------- ][ TEST ]

   Period 2:
   [ TRAINING ------------------------ ][ TEST ]

   Period 3:
   [ TRAINING ------------------------------- ][ TEST ]

   Mỗi TEST block tuyệt đối không xuất hiện
   trong training của chính period đó.
   ========================================================================= */


/* =========================================================================
   9. BUILD OOS PERIODS
   ========================================================================= */

function buildOOSPeriodsV26(
  provinceSlug
) {

  /*
   * Chuẩn hóa:
   * oldest -> newest
   */

  const draws =
    getAllDrawsForProvince(
      provinceSlug
    )
    .slice()
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );


  const total =
    draws.length;


  const minRequired =
    V26_CONFIG.minTrainingDraws +
    V26_CONFIG.testPeriodSize;


  if (
    total <
    minRequired
  ) {

    return [];

  }


  /*
   * Số period có thể tạo sau khi
   * giữ lại minimum training.
   */

  const availableForTesting =
    total -
    V26_CONFIG.minTrainingDraws;


  const possiblePeriods =
    Math.floor(
      availableForTesting /
      V26_CONFIG.testPeriodSize
    );


  const periodCount =
    Math.min(
      possiblePeriods,
      V26_CONFIG.maxTestPeriods
    );


  if (
    periodCount <= 0
  ) {

    return [];

  }


  /*
   * Ta ưu tiên các period gần hiện tại nhất.
   *
   * Ví dụ 100 kỳ:
   *
   * total = 100
   * periodCount = 3
   * testPeriodSize = 20
   *
   * firstTestStart = 40
   *
   * Period 1:
   * training 0..39
   * test     40..59
   *
   * Period 2:
   * training 0..59
   * test     60..79
   *
   * Period 3:
   * training 0..79
   * test     80..99
   */

  const firstTestStart =
    total -
    periodCount *
    V26_CONFIG.testPeriodSize;


  const periods = [];


  for (
    let index = 0;
    index < periodCount;
    index++
  ) {

    const testStart =
      firstTestStart +
      index *
      V26_CONFIG.testPeriodSize;


    const testEnd =
      Math.min(
        testStart +
        V26_CONFIG.testPeriodSize,
        total
      );


    /*
     * Expanding-window training.
     *
     * Chỉ lấy dữ liệu TRƯỚC testStart.
     */

    const trainingChronological =
      draws.slice(
        0,
        testStart
      );


    const testingChronological =
      draws.slice(
        testStart,
        testEnd
      );


    if (
      trainingChronological.length <
        V26_CONFIG.minTrainingDraws ||
      !testingChronological.length
    ) {

      continue;

    }


    /*
     * Engine V2.3 / V2.4 sử dụng
     * newest -> oldest.
     *
     * Lưu thêm bản này để Block 3
     * có thể đưa thẳng vào engine.
     */

    const trainingNewestFirst =
      trainingChronological
        .slice()
        .reverse();


    periods.push({

      period:
        index + 1,

      training:
        trainingNewestFirst,

      testing:
        testingChronological,

      trainingCount:
        trainingChronological.length,

      testingCount:
        testingChronological.length,

      trainingFrom:
        trainingChronological[0]
          .date,

      trainingUntil:
        trainingChronological[
          trainingChronological.length - 1
        ].date,

      testFrom:
        testingChronological[0]
          .date,

      testTo:
        testingChronological[
          testingChronological.length - 1
        ].date

    });

  }


  return periods;

}


/* =========================================================================
   10. VERIFY NO FUTURE LEAKAGE

   Hàm kiểm tra độc lập:
   ngày cuối training PHẢI nhỏ hơn
   ngày đầu testing.
   ========================================================================= */

function verifyOOSPeriodV26(
  period
) {

  if (
    !period ||
    !Array.isArray(
      period.training
    ) ||
    !Array.isArray(
      period.testing
    ) ||
    !period.training.length ||
    !period.testing.length
  ) {

    return {

      valid:
        false,

      reason:
        'EMPTY_PERIOD'

    };

  }


  /*
   * Không phụ thuộc thứ tự array.
   * Tìm ngày lớn nhất của training
   * và ngày nhỏ nhất của testing.
   */

  const trainingDates =
    period.training
      .map(
        draw =>
          draw.date
      )
      .filter(
        Boolean
      );


  const testingDates =
    period.testing
      .map(
        draw =>
          draw.date
      )
      .filter(
        Boolean
      );


  if (
    !trainingDates.length ||
    !testingDates.length
  ) {

    return {

      valid:
        false,

      reason:
        'MISSING_DATE'

    };

  }


  const lastTrainingDate =
    trainingDates
      .slice()
      .sort()
      .pop();


  const firstTestingDate =
    testingDates
      .slice()
      .sort()[0];


  const valid =
    lastTrainingDate <
    firstTestingDate;


  return {

    valid,

    lastTrainingDate,

    firstTestingDate,

    reason:
      valid
        ? 'NO_FUTURE_LEAKAGE'
        : 'FUTURE_LEAKAGE_DETECTED'

  };

}


/* =========================================================================
   11. INSPECT OOS PERIODS

   Dùng để kiểm tra cấu trúc trước khi
   thực sự chạy model.
   ========================================================================= */

function inspectOOSPeriodsV26(
  provinceSlug =
    SELECTED_PROVINCE
) {

  const periods =
    buildOOSPeriodsV26(
      provinceSlug
    );


  const province =
    provinceBySlug(
      provinceSlug
    );


  const provinceName =
    province
      ? province.name
      : provinceSlug;


  const rows =
    periods.map(
      period => {

        const verification =
          verifyOOSPeriodV26(
            period
          );


        return {

          Period:
            period.period,

          Training:
            period.trainingCount,

          TrainingFrom:
            period.trainingFrom,

          TrainingUntil:
            period.trainingUntil,

          Test:
            period.testingCount,

          TestFrom:
            period.testFrom,

          TestTo:
            period.testTo,

          Leakage:
            verification.valid
              ? 'NO'
              : 'YES',

          Status:
            verification.reason

        };

      }
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — OOS PERIOD INSPECTION'
  );

  console.log(
    provinceName
  );

  console.log(
    '=========================================='
  );


  console.table(
    rows
  );


  if (
    !rows.length
  ) {

    console.warn(
      'V2.6: Không đủ dữ liệu để tạo OOS periods.'
    );

  }


  return {

    province:
      provinceSlug,

    periodCount:
      periods.length,

    periods,

    rows

  };

}


console.log(
  'XSMN V2.6 Block 2 loaded — OOS Period Builder ready'
);

/* =========================================================================
   XSMN V2.6 — MOBILE OOS TEST
   Test Block 2 trực tiếp trên điện thoại
   Không cần Chrome Console
   ========================================================================= */

function showOOSTestV26Mobile(
  provinceSlug = 'kien-giang'
) {

  try {

    const result =
      inspectOOSPeriodsV26(
        provinceSlug
      );


    if (
      !result ||
      !Array.isArray(
        result.periods
      )
    ) {

      alert(
        'V2.6 TEST\n\nKhông lấy được dữ liệu OOS.'
      );

      return;

    }


    if (
      !result.periods.length
    ) {

      alert(
        'V2.6 TEST\n\nKhông đủ dữ liệu để tạo OOS periods.'
      );

      return;

    }


    const oldPanel =
      document.getElementById(
        'oosResultV26'
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    let allPassed =
      true;


    const periodHTML =
      result.periods
        .map(
          period => {

            const check =
              verifyOOSPeriodV26(
                period
              );


            if (
              !check.valid
            ) {

              allPassed =
                false;

            }


            return `
              <div
                style="
                  padding:14px;
                  margin-top:12px;
                  border-radius:14px;
                  background:rgba(
                    255,
                    255,
                    255,
                    0.06
                  );
                "
              >

                <div
                  style="
                    font-size:18px;
                    font-weight:800;
                    margin-bottom:10px;
                  "
                >
                  Period ${period.period}
                </div>

                <div
                  style="
                    line-height:1.7;
                  "
                >
                  Training:
                  <b>${period.trainingCount}</b>
                  <br>

                  Test:
                  <b>${period.testingCount}</b>
                  <br>

                  Train until:
                  <b>${period.trainingUntil}</b>
                  <br>

                  Test from:
                  <b>${period.testFrom}</b>
                  <br>

                  Leakage:
                  <b>
                    ${
                      check.valid
                        ? 'NO'
                        : 'YES'
                    }
                  </b>
                  <br>

                  Status:
                  <b>
                    ${check.reason}
                  </b>
                </div>

              </div>
            `;

          }
        )
        .join('');


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'oosResultV26';


    panel.style.cssText =
      `
        margin-top:16px;
        padding:16px;
        border-radius:16px;
        background:rgba(
          255,
          255,
          255,
          0.05
        );
      `;


    panel.innerHTML =
      `
        <div
          style="
            font-size:21px;
            font-weight:900;
            margin-bottom:8px;
          "
        >
          🧪 XSMN V2.6 — OOS TEST
        </div>

        <div
          style="
            line-height:1.6;
            margin-bottom:10px;
          "
        >
          Tỉnh:
          <b>${provinceSlug}</b>
          <br>

          Tổng số Period:
          <b>${result.periods.length}</b>
        </div>

        ${periodHTML}

        <div
          style="
            margin-top:16px;
            padding:15px;
            border-radius:14px;
            font-size:18px;
            font-weight:900;
            text-align:center;
            background:rgba(
              255,
              193,
              61,
              0.12
            );
          "
        >
          ${
            allPassed
              ? '✅ ALL PERIODS PASSED'
              : '❌ LEAKAGE DETECTED'
          }
        </div>
      `;


    const button =
      document.getElementById(
        'btnOOSTestV26'
      );


    if (button) {

      button.insertAdjacentElement(
        'afterend',
        panel
      );

    }


    panel.scrollIntoView({

      behavior:
        'smooth',

      block:
        'start'

    });


    return {

      passed:
        allPassed,

      result

    };


  } catch (error) {

    alert(
      '❌ V2.6 TEST ERROR\n\n' +
      String(
        error.message ||
        error
      )
    );


    console.error(
      'V2.6 Mobile Test:',
      error
    );

  }

}


/*
 * Tạo nút test tạm thời trong tab Cài đặt.
 */

function addOOSTestButtonV26() {

  if (
    document.getElementById(
      'btnOOSTestV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (
    !settings
  ) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnOOSTestV26';


  button.textContent =
    '🧪 Test V2.6 OOS — Kiên Giang';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    function() {

      showOOSTestV26Mobile(
        'kien-giang'
      );

    }
  );


  settings.appendChild(
    button
  );

}


if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addOOSTestButtonV26
  );

} else {

  addOOSTestButtonV26();

}


console.log(
  'XSMN V2.6 Mobile OOS Test ready'
);

/* =========================================================================
   V2.6 — SHORT MOBILE LEAKAGE TEST
   ========================================================================= */

function testOOSLeakageV26Short(
  provinceSlug = 'kien-giang'
) {

  const periods =
    buildOOSPeriodsV26(
      provinceSlug
    );


  if (!periods.length) {

    alert(
      'V2.6: Không có OOS period.'
    );

    return;

  }


  let allPassed = true;


  const lines =
    periods.map(
      period => {

        const check =
          verifyOOSPeriodV26(
            period
          );


        if (!check.valid) {

          allPassed = false;

        }


        return (
          'P' +
          period.period +
          ': ' +
          period.trainingCount +
          '→' +
          period.testingCount +
          ' | Leakage: ' +
          (
            check.valid
              ? 'NO'
              : 'YES'
          )
        );

      }
    );


  lines.push(
    ''
  );


  lines.push(
    allPassed
      ? '✅ ALL PERIODS PASSED'
      : '❌ LEAKAGE DETECTED'
  );


  alert(
    lines.join('\n')
  );


  return allPassed;

}


/*
 * Đổi nút test hiện tại sang
 * phiên bản ngắn.
 */

const btnOOSV26 =
  document.getElementById(
    'btnOOSTestV26'
  );


if (btnOOSV26) {

  btnOOSV26.onclick =
    function() {

      testOOSLeakageV26Short(
        'kien-giang'
      );

    };


  /*
   * Xóa listener cũ bằng cách
   * clone button.
   */

  const newButton =
    btnOOSV26.cloneNode(
      true
    );


  btnOOSV26.parentNode
    .replaceChild(
      newButton,
      btnOOSV26
    );


  newButton.onclick =
    function() {

      testOOSLeakageV26Short(
        'kien-giang'
      );

    };


  newButton.textContent =
    '🧪 Test nhanh V2.6 OOS';

}


console.log(
  'XSMN V2.6 Short Leakage Test ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 3
   OUT-OF-SAMPLE PERFORMANCE EVALUATION

   Mục tiêu:
   - Dùng Training ONLY để chọn Model + Window.
   - Dùng Testing ONLY để đánh giá model đã chọn.
   - Không Future Leakage.
   - So sánh Adaptive Model với BASELINE.
   - Đo:
       + Top1 / Top2 / Top3
       + MRR
       + Average Rank
       + Quality
       + OOS Improvement
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   12. GET MODEL CONFIG
   ========================================================================= */

function getModelConfigV26(
  modelId
) {

  if (
    !Array.isArray(
      MODEL_LAB_V23_CONFIGS
    )
  ) {

    return null;

  }


  return (
    MODEL_LAB_V23_CONFIGS.find(
      config =>
        config.id === modelId
    ) ||
    null
  );

}


/* =========================================================================
   13. CREATE OOS METRIC
   ========================================================================= */

function createOOSMetricV26() {

  return {

    tests: 0,

    top1: 0,

    top2: 0,

    top3: 0,

    reciprocalRank: 0,

    rankSum: 0,

    rankedHits: 0

  };

}


/* =========================================================================
   14. UPDATE OOS METRIC
   ========================================================================= */

function updateOOSMetricV26(
  metric,
  actualNumbers,
  ranked
) {

  metric.tests++;


  let bestRank =
    Infinity;


  actualNumbers.forEach(
    actual => {

      const index =
        ranked.indexOf(
          actual
        );


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
    bestRank === Infinity
  ) {

    return;

  }


  metric.rankedHits++;


  metric.rankSum +=
    bestRank;


  metric.reciprocalRank +=
    1 / bestRank;


  if (
    bestRank <= 1
  ) {

    metric.top1++;

  }


  if (
    bestRank <= 2
  ) {

    metric.top2++;

  }


  if (
    bestRank <= 3
  ) {

    metric.top3++;

  }

}


/* =========================================================================
   15. FINALIZE OOS METRIC
   ========================================================================= */

function finalizeOOSMetricV26(
  metric
) {

  const tests =
    metric.tests;


  if (
    !tests
  ) {

    return {

      tests: 0,

      top1: 0,

      top2: 0,

      top3: 0,

      top1Rate: 0,

      top2Rate: 0,

      top3Rate: 0,

      mrr: 0,

      averageRank: 100,

      quality: 0

    };

  }


  const result = {

    tests:
      tests,

    top1:
      metric.top1,

    top2:
      metric.top2,

    top3:
      metric.top3,

    top1Rate:
      metric.top1 /
      tests,

    top2Rate:
      metric.top2 /
      tests,

    top3Rate:
      metric.top3 /
      tests,

    mrr:
      metric.reciprocalRank /
      tests,

    averageRank:
      metric.rankedHits
        ? metric.rankSum /
          metric.rankedHits
        : 100

  };


  /*
   * Dùng cùng logic Quality V2.3
   * để Adaptive và Baseline
   * có thể so sánh trực tiếp.
   */

  result.quality =
    modelQualityScoreV23(
      result
    );


  return result;

}


/* =========================================================================
   16. SCORE ONE TARGET DRAW

   trainingDraws:
   chỉ chứa dữ liệu xảy ra TRƯỚC target.

   config:
   model đã được lựa chọn từ training period.
   ========================================================================= */

function scoreTargetOOSV26(
  trainingDraws,
  giaiKey,
  windowSize,
  config
) {

  const scores =
    modelLabScoresV23(
      trainingDraws,
      giaiKey,
      windowSize,
      config.weights
    );


  return rankedNumbers(
    scores
  )
  .map(
    item =>
      item[0]
  );

}


/* =========================================================================
   17. EVALUATE MODEL ON TEST PERIOD

   Đây là Walk-Forward thật sự:

   Test draw #1:
       chỉ nhìn Training.

   Test draw #2:
       nhìn Training + Test draw #1.

   Test draw #3:
       nhìn Training + Test draw #1 + #2.

   ...

   Tuyệt đối không nhìn target hiện tại
   hoặc các target tương lai.
   ========================================================================= */

function evaluateModelOOSV26(
  period,
  giaiKey,
  modelId,
  windowSize
) {

  const config =
    getModelConfigV26(
      modelId
    );


  if (
    !config
  ) {

    return {

      valid:
        false,

      reason:
        'MODEL_NOT_FOUND',

      model:
        modelId,

      window:
        windowSize

    };

  }


  const verification =
    verifyOOSPeriodV26(
      period
    );


  if (
    !verification.valid
  ) {

    return {

      valid:
        false,

      reason:
        verification.reason,

      model:
        modelId,

      window:
        windowSize

    };

  }


  /*
   * Chuẩn hóa chronological:
   * oldest -> newest.
   */

  const historical =
    period.training
      .slice()
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );


  const testing =
    period.testing
      .slice()
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );


  const metric =
    createOOSMetricV26();


  testing.forEach(
    targetDraw => {

      /*
       * modelLabScoresV23 /
       * computeScoresForGiai
       * sử dụng newest -> oldest.
       */

      const trainingForEngine =
        historical
          .slice()
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );


      const ranked =
        scoreTargetOOSV26(
          trainingForEngine,
          giaiKey,
          windowSize,
          config
        );


      const actual =
        loOfPrize(
          targetDraw,
          giaiKey
        );


      updateOOSMetricV26(
        metric,
        actual,
        ranked
      );


      /*
       * Sau khi target đã được đánh giá
       * mới được đưa target vào history.
       *
       * Đây là điểm quan trọng chống
       * Future Leakage.
       */

      historical.push(
        targetDraw
      );

    }
  );


  return {

    valid:
      true,

    model:
      modelId,

    window:
      Number(
        windowSize
      ),

    ...finalizeOOSMetricV26(
      metric
    )

  };

}


/* =========================================================================
   18. SELECT MODEL USING TRAINING ONLY
   ========================================================================= */

function selectModelForPeriodV26(
  provinceSlug,
  giaiKey,
  period
) {

  const verification =
    verifyOOSPeriodV26(
      period
    );


  if (
    !verification.valid
  ) {

    return null;

  }


  let selection =
    null;


  try {

    selection =
      withHistoricalDrawsV25(

        provinceSlug,

        period.training,

        () =>
          findBestModelWindowV24(
            provinceSlug,
            giaiKey
          )

      );

  } catch (
    error
  ) {

    console.error(
      'V2.6 Selection Error:',
      error
    );


    return null;

  }


  return selection;

}


/* =========================================================================
   19. EVALUATE ONE OOS PERIOD

   Adaptive:
   Model + Window được V2.4 chọn
   bằng TRAINING ONLY.

   Baseline:
   BASELINE model với cùng Window.

   Dùng cùng Window để so sánh công bằng
   ảnh hưởng của model weights.
   ========================================================================= */

function evaluateOOSPeriodV26(
  provinceSlug,
  giaiKey,
  period
) {

  const verification =
    verifyOOSPeriodV26(
      period
    );


  if (
    !verification.valid
  ) {

    return {

      valid:
        false,

      period:
        period.period,

      reason:
        verification.reason

    };

  }


  const selection =
    selectModelForPeriodV26(
      provinceSlug,
      giaiKey,
      period
    );


  if (
    !selection
  ) {

    return {

      valid:
        false,

      period:
        period.period,

      reason:
        'NO_MODEL_SELECTION'

    };

  }


  const adaptive =
    evaluateModelOOSV26(

      period,

      giaiKey,

      selection.model,

      selection.window

    );


  const baseline =
    evaluateModelOOSV26(

      period,

      giaiKey,

      'BASELINE',

      selection.window

    );


  if (
    !adaptive.valid ||
    !baseline.valid
  ) {

    return {

      valid:
        false,

      period:
        period.period,

      reason:
        !adaptive.valid
          ? adaptive.reason
          : baseline.reason

    };

  }


  const adaptiveQuality =
    Number(
      adaptive.quality || 0
    );


  const baselineQuality =
    Number(
      baseline.quality || 0
    );


  const improvement =
    adaptiveQuality -
    baselineQuality;


  return {

    valid:
      true,

    period:
      period.period,

    trainingCount:
      period.trainingCount,

    testingCount:
      period.testingCount,

    trainUntil:
      period.trainingUntil,

    testFrom:
      period.testFrom,

    testTo:
      period.testTo,

    model:
      selection.model,

    window:
      Number(
        selection.window
      ),

    selectionQuality:
      Number(
        selection.quality || 0
      ),

    selectionMargin:
      Number(
        selection.margin || 0
      ),

    adaptive,

    baseline,

    improvement

  };

}


/* =========================================================================
   20. AGGREGATE OOS RESULTS
   ========================================================================= */

function aggregateOOSV26(
  periodResults
) {

  const valid =
    periodResults.filter(
      item =>
        item.valid
    );


  if (
    !valid.length
  ) {

    return null;

  }


  const totalTests =
    valid.reduce(
      (sum, item) =>
        sum +
        item.adaptive.tests,
      0
    );


  if (
    !totalTests
  ) {

    return null;

  }


  /*
   * Weighted average theo số test
   * của từng period.
   */

  function weightedAverage(
    getter
  ) {

    return valid.reduce(
      (sum, item) => {

        const tests =
          item.adaptive.tests;


        return (
          sum +
          getter(
            item
          ) *
          tests
        );

      },
      0
    ) / totalTests;

  }


  const adaptiveTop1 =
    weightedAverage(
      item =>
        item.adaptive.top1Rate
    );


  const adaptiveTop2 =
    weightedAverage(
      item =>
        item.adaptive.top2Rate
    );


  const adaptiveTop3 =
    weightedAverage(
      item =>
        item.adaptive.top3Rate
    );


  const adaptiveMRR =
    weightedAverage(
      item =>
        item.adaptive.mrr
    );


  const adaptiveRank =
    weightedAverage(
      item =>
        item.adaptive.averageRank
    );


  const adaptiveQuality =
    weightedAverage(
      item =>
        item.adaptive.quality
    );


  const baselineTop1 =
    weightedAverage(
      item =>
        item.baseline.top1Rate
    );


  const baselineTop2 =
    weightedAverage(
      item =>
        item.baseline.top2Rate
    );


  const baselineTop3 =
    weightedAverage(
      item =>
        item.baseline.top3Rate
    );


  const baselineMRR =
    weightedAverage(
      item =>
        item.baseline.mrr
    );


  const baselineRank =
    weightedAverage(
      item =>
        item.baseline.averageRank
    );


  const baselineQuality =
    weightedAverage(
      item =>
        item.baseline.quality
    );


  const improvement =
    adaptiveQuality -
    baselineQuality;


  const winningPeriods =
    valid.filter(
      item =>
        item.improvement > 0
    ).length;


  const tiedPeriods =
    valid.filter(
      item =>
        Math.abs(
          item.improvement
        ) < 0.0000001
    ).length;


  const losingPeriods =
    valid.length -
    winningPeriods -
    tiedPeriods;


  return {

    periods:
      valid.length,

    tests:
      totalTests,

    adaptive: {

      top1Rate:
        adaptiveTop1,

      top2Rate:
        adaptiveTop2,

      top3Rate:
        adaptiveTop3,

      mrr:
        adaptiveMRR,

      averageRank:
        adaptiveRank,

      quality:
        adaptiveQuality

    },

    baseline: {

      top1Rate:
        baselineTop1,

      top2Rate:
        baselineTop2,

      top3Rate:
        baselineTop3,

      mrr:
        baselineMRR,

      averageRank:
        baselineRank,

      quality:
        baselineQuality

    },

    improvement,

    winningPeriods,

    tiedPeriods,

    losingPeriods,

    winRate:
      winningPeriods /
      valid.length

  };

}


/* =========================================================================
   21. CLASSIFY OOS PERFORMANCE

   Đây mới chỉ là Research Gate.
   Không phải xác suất trúng.

   PASS:
   - Adaptive Quality > Baseline
   - >= 50% period thắng
   - Adaptive MRR >= Baseline MRR

   WEAK:
   - Có một phần cải thiện
   - nhưng chưa đủ đồng thuận

   FAIL:
   - Không vượt Baseline
   ========================================================================= */

function classifyOOSPerformanceV26(
  summary
) {

  if (
    !summary
  ) {

    return 'NO_DATA';

  }


  const qualityBetter =
    summary.improvement > 0;


  const mrrBetter =
    summary.adaptive.mrr >=
    summary.baseline.mrr;


  const rankBetter =
    summary.adaptive.averageRank <=
    summary.baseline.averageRank;


  const majorityWins =
    summary.winRate >= 0.50;


  if (
    qualityBetter &&
    mrrBetter &&
    rankBetter &&
    majorityWins
  ) {

    return 'PASS';

  }


  if (
    qualityBetter ||
    mrrBetter ||
    rankBetter
  ) {

    return 'WEAK';

  }


  return 'FAIL';

}


/* =========================================================================
   22. RUN COMPLETE OOS EVALUATION
   ========================================================================= */

function evaluateProvinceOOSV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey = 'db'
) {

  const periods =
    buildOOSPeriodsV26(
      provinceSlug
    );


  if (
    !periods.length
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      reason:
        'NO_OOS_PERIODS'

    };

  }


  const periodResults =
    periods.map(
      period =>
        evaluateOOSPeriodV26(
          provinceSlug,
          giaiKey,
          period
        )
    );


  const summary =
    aggregateOOSV26(
      periodResults
    );


  if (
    !summary
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      reason:
        'NO_VALID_OOS_RESULTS',

      periods:
        periodResults

    };

  }


  const classification =
    classifyOOSPerformanceV26(
      summary
    );


  return {

    ready:
      true,

    version:
      'V2.6',

    province:
      provinceSlug,

    prize:
      giaiKey,

    classification,

    summary,

    periods:
      periodResults

  };

}


/* =========================================================================
   23. PRINT OOS RESULT
   ========================================================================= */

function printOOSPerformanceV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey = 'db'
) {

  const result =
    evaluateProvinceOOSV26(
      provinceSlug,
      giaiKey
    );


  const province =
    provinceBySlug(
      provinceSlug
    );


  const provinceName =
    province
      ? province.name
      : provinceSlug;


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — OOS PERFORMANCE'
  );

  console.log(
    provinceName,
    String(
      giaiKey
    ).toUpperCase()
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      result.reason
    );


    return result;

  }


  console.table(

    result.periods
      .filter(
        item =>
          item.valid
      )
      .map(
        item => ({

          Period:
            item.period,

          Model:
            item.model,

          Window:
            item.window,

          Tests:
            item.adaptive.tests,

          AdaptiveTop1:
            (
              item.adaptive
                .top1Rate *
              100
            ).toFixed(2) +
            '%',

          AdaptiveTop3:
            (
              item.adaptive
                .top3Rate *
              100
            ).toFixed(2) +
            '%',

          AdaptiveMRR:
            item.adaptive
              .mrr
              .toFixed(4),

          AdaptiveRank:
            item.adaptive
              .averageRank
              .toFixed(2),

          BaselineTop1:
            (
              item.baseline
                .top1Rate *
              100
            ).toFixed(2) +
            '%',

          BaselineTop3:
            (
              item.baseline
                .top3Rate *
              100
            ).toFixed(2) +
            '%',

          BaselineMRR:
            item.baseline
              .mrr
              .toFixed(4),

          Improvement:
            item.improvement
              .toFixed(4)

        }))

  );


  console.log(
    'SUMMARY:',
    result.summary
  );


  console.log(
    'OOS CLASSIFICATION:',
    result.classification
  );


  return result;

}


/* =========================================================================
   24. MOBILE SUMMARY

   Dùng alert ngắn để tránh lỗi
   popup dài trên Samsung/Chrome.
   ========================================================================= */

function showOOSPerformanceV26Mobile(
  provinceSlug =
    'kien-giang',

  giaiKey =
    'db'
) {

  try {

    const result =
      evaluateProvinceOOSV26(
        provinceSlug,
        giaiKey
      );


    if (
      !result.ready
    ) {

      alert(
        'V2.6 OOS PERFORMANCE\n\n' +
        'Không thể đánh giá.\n' +
        'Reason: ' +
        result.reason
      );


      return result;

    }


    const s =
      result.summary;


    const text =

      'V2.6 OOS PERFORMANCE\n\n' +

      'Province: ' +
      provinceSlug +
      '\n' +

      'Prize: ' +
      giaiKey.toUpperCase() +
      '\n' +

      'Periods: ' +
      s.periods +
      '\n' +

      'Tests: ' +
      s.tests +
      '\n\n' +

      'ADAPTIVE\n' +

      'Top1: ' +
      (
        s.adaptive.top1Rate *
        100
      ).toFixed(2) +
      '%\n' +

      'Top3: ' +
      (
        s.adaptive.top3Rate *
        100
      ).toFixed(2) +
      '%\n' +

      'MRR: ' +
      s.adaptive.mrr
        .toFixed(4) +
      '\n' +

      'Avg Rank: ' +
      s.adaptive.averageRank
        .toFixed(2) +
      '\n\n' +

      'BASELINE\n' +

      'Top1: ' +
      (
        s.baseline.top1Rate *
        100
      ).toFixed(2) +
      '%\n' +

      'Top3: ' +
      (
        s.baseline.top3Rate *
        100
      ).toFixed(2) +
      '%\n' +

      'MRR: ' +
      s.baseline.mrr
        .toFixed(4) +
      '\n' +

      'Avg Rank: ' +
      s.baseline.averageRank
        .toFixed(2) +
      '\n\n' +

      'Winning periods: ' +
      s.winningPeriods +
      '/' +
      s.periods +
      '\n' +

      'Improvement: ' +
      s.improvement
        .toFixed(4) +
      '\n\n' +

      'RESULT: ' +
      result.classification;


    alert(
      text
    );


    return result;


  } catch (
    error
  ) {

    console.error(
      'V2.6 OOS Performance:',
      error
    );


    alert(
      '❌ V2.6 BLOCK 3 ERROR\n\n' +
      String(
        error.message ||
        error
      )
    );


    return null;

  }

}


/* =========================================================================
   25. TEMP MOBILE BUTTON

   Thêm nút dưới nút Test V2.6 hiện tại.
   ========================================================================= */

function addOOSPerformanceButtonV26() {

  if (
    document.getElementById(
      'btnOOSPerformanceV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (
    !settings
  ) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnOOSPerformanceV26';


  button.textContent =
    '📊 Test V2.6 OOS Performance';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    function() {

      showOOSPerformanceV26Mobile(
        'kien-giang',
        'db'
      );

    }
  );


  settings.appendChild(
    button
  );

}


/* =========================================================================
   26. INIT BLOCK 3
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addOOSPerformanceButtonV26
  );

} else {

  addOOSPerformanceButtonV26();

}


console.log(
  'XSMN V2.6 Block 3 loaded — True OOS Performance Evaluation ready'
);


/* =========================================================================
   XSMN V2.6 — BLOCK 4
   PERIOD DIAGNOSTICS

   Mục tiêu:
   - Phân tích từng OOS Period riêng biệt.
   - KHÔNG thay Production Engine.
   - KHÔNG thay model selection.
   - KHÔNG tối ưu weights.
   - Chỉ đọc kết quả từ Block 3.

   Chẩn đoán:
   - Model / Window được chọn.
   - Selection Quality / Margin.
   - Adaptive vs Baseline.
   - Top1 / Top3.
   - MRR.
   - Average Rank.
   - Quality.
   - Improvement.
   - Period WIN / TIE / LOSS.
   - Xác định period gây suy giảm tổng thể.
   ========================================================================= */


/* =========================================================================
   27. CLASSIFY ONE PERIOD
   ========================================================================= */

function classifyOOSPeriodV26(
  item
) {

  if (
    !item ||
    !item.valid
  ) {

    return 'INVALID';

  }


  const improvement =
    Number(
      item.improvement || 0
    );


  if (
    improvement > 0.0000001
  ) {

    return 'WIN';

  }


  if (
    improvement < -0.0000001
  ) {

    return 'LOSS';

  }


  return 'TIE';

}


/* =========================================================================
   28. BUILD PERIOD DIAGNOSTIC
   ========================================================================= */

function buildPeriodDiagnosticV26(
  item
) {

  if (
    !item ||
    !item.valid
  ) {

    return {

      valid:
        false,

      period:
        item
          ? item.period
          : null,

      reason:
        item &&
        item.reason
          ? item.reason
          : 'INVALID_PERIOD'

    };

  }


  const adaptive =
    item.adaptive;


  const baseline =
    item.baseline;


  const adaptiveQuality =
    Number(
      adaptive.quality || 0
    );


  const baselineQuality =
    Number(
      baseline.quality || 0
    );


  const qualityDelta =
    adaptiveQuality -
    baselineQuality;


  const mrrDelta =
    Number(
      adaptive.mrr || 0
    ) -
    Number(
      baseline.mrr || 0
    );


  /*
   * Average Rank càng THẤP càng tốt.
   *
   * Vì vậy:
   * baseline - adaptive
   *
   * > 0 = Adaptive tốt hơn.
   */

  const rankGain =
    Number(
      baseline.averageRank || 0
    ) -
    Number(
      adaptive.averageRank || 0
    );


  const top3Delta =
    Number(
      adaptive.top3Rate || 0
    ) -
    Number(
      baseline.top3Rate || 0
    );


  return {

    valid:
      true,

    period:
      item.period,

    status:
      classifyOOSPeriodV26(
        item
      ),

    trainingCount:
      item.trainingCount,

    testingCount:
      item.testingCount,

    trainUntil:
      item.trainUntil,

    testFrom:
      item.testFrom,

    testTo:
      item.testTo,

    model:
      item.model,

    window:
      item.window,

    selectionQuality:
      Number(
        item.selectionQuality || 0
      ),

    selectionMargin:
      Number(
        item.selectionMargin || 0
      ),

    adaptive: {

      top1:
        Number(
          adaptive.top1Rate || 0
        ),

      top3:
        Number(
          adaptive.top3Rate || 0
        ),

      mrr:
        Number(
          adaptive.mrr || 0
        ),

      averageRank:
        Number(
          adaptive.averageRank || 0
        ),

      quality:
        adaptiveQuality

    },

    baseline: {

      top1:
        Number(
          baseline.top1Rate || 0
        ),

      top3:
        Number(
          baseline.top3Rate || 0
        ),

      mrr:
        Number(
          baseline.mrr || 0
        ),

      averageRank:
        Number(
          baseline.averageRank || 0
        ),

      quality:
        baselineQuality

    },

    delta: {

      quality:
        qualityDelta,

      mrr:
        mrrDelta,

      top3:
        top3Delta,

      rankGain:
        rankGain

    }

  };

}


/* =========================================================================
   29. FIND STRONGEST / WEAKEST PERIOD
   ========================================================================= */

function summarizePeriodDiagnosticsV26(
  diagnostics
) {

  const valid =
    diagnostics.filter(
      item =>
        item.valid
    );


  if (
    !valid.length
  ) {

    return null;

  }


  const sorted =
    valid
      .slice()
      .sort(
        (a, b) =>
          b.delta.quality -
          a.delta.quality
      );


  const strongest =
    sorted[0];


  const weakest =
    sorted[
      sorted.length - 1
    ];


  const wins =
    valid.filter(
      item =>
        item.status ===
        'WIN'
    ).length;


  const losses =
    valid.filter(
      item =>
        item.status ===
        'LOSS'
    ).length;


  const ties =
    valid.filter(
      item =>
        item.status ===
        'TIE'
    ).length;


  /*
   * Kiểm tra Model consistency.
   */

  const models =
    [
      ...new Set(
        valid.map(
          item =>
            item.model
        )
      )
    ];


  const windows =
    [
      ...new Set(
        valid.map(
          item =>
            item.window
        )
      )
    ];


  return {

    periods:
      valid.length,

    wins,

    losses,

    ties,

    strongestPeriod:
      strongest.period,

    strongestImprovement:
      strongest.delta.quality,

    weakestPeriod:
      weakest.period,

    weakestImprovement:
      weakest.delta.quality,

    models,

    windows,

    modelConsistency:
      models.length === 1,

    windowConsistency:
      windows.length === 1

  };

}


/* =========================================================================
   30. RUN PERIOD DIAGNOSTICS
   ========================================================================= */

function diagnoseOOSPeriodsV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey =
    'db'
) {

  const result =
    evaluateProvinceOOSV26(
      provinceSlug,
      giaiKey
    );


  if (
    !result ||
    !result.ready
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      prize:
        giaiKey,

      reason:
        result &&
        result.reason
          ? result.reason
          : 'OOS_NOT_READY'

    };

  }


  const diagnostics =
    result.periods.map(
      item =>
        buildPeriodDiagnosticV26(
          item
        )
    );


  const summary =
    summarizePeriodDiagnosticsV26(
      diagnostics
    );


  return {

    ready:
      Boolean(
        summary
      ),

    version:
      'V2.6',

    province:
      provinceSlug,

    prize:
      giaiKey,

    oosClassification:
      result.classification,

    diagnostics,

    summary

  };

}


/* =========================================================================
   31. PRINT PERIOD DIAGNOSTICS
   ========================================================================= */

function printPeriodDiagnosticsV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey =
    'db'
) {

  const result =
    diagnoseOOSPeriodsV26(
      provinceSlug,
      giaiKey
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — PERIOD DIAGNOSTICS'
  );

  console.log(
    provinceSlug,
    String(
      giaiKey
    ).toUpperCase()
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      result.reason
    );


    return result;

  }


  console.table(

    result.diagnostics
      .filter(
        item =>
          item.valid
      )
      .map(
        item => ({

          Period:
            item.period,

          Status:
            item.status,

          Model:
            item.model,

          Window:
            item.window,

          SelectionQ:
            item.selectionQuality
              .toFixed(2),

          Margin:
            item.selectionMargin
              .toFixed(4),

          AdaptiveTop3:
            (
              item.adaptive.top3 *
              100
            ).toFixed(2) +
            '%',

          BaselineTop3:
            (
              item.baseline.top3 *
              100
            ).toFixed(2) +
            '%',

          AdaptiveMRR:
            item.adaptive.mrr
              .toFixed(4),

          BaselineMRR:
            item.baseline.mrr
              .toFixed(4),

          AdaptiveRank:
            item.adaptive
              .averageRank
              .toFixed(2),

          BaselineRank:
            item.baseline
              .averageRank
              .toFixed(2),

          AdaptiveQ:
            item.adaptive.quality
              .toFixed(4),

          BaselineQ:
            item.baseline.quality
              .toFixed(4),

          DeltaQ:
            item.delta.quality
              .toFixed(4)

        }))

  );


  console.log(
    'DIAGNOSTIC SUMMARY:',
    result.summary
  );


  return result;

}


/* =========================================================================
   32. MOBILE PERIOD DIAGNOSTICS

   Hiển thị ngắn gọn để dùng tốt
   trên Samsung / Chrome mobile.
   ========================================================================= */

function showPeriodDiagnosticsV26Mobile(
  provinceSlug =
    'kien-giang',

  giaiKey =
    'db'
) {

  try {

    const result =
      diagnoseOOSPeriodsV26(
        provinceSlug,
        giaiKey
      );


    if (
      !result.ready
    ) {

      alert(
        'V2.6 PERIOD DIAGNOSTICS\n\n' +
        'Không thể phân tích.\n' +
        'Reason: ' +
        result.reason
      );


      return result;

    }


    const lines = [];


    lines.push(
      'V2.6 PERIOD DIAGNOSTICS'
    );


    lines.push(
      ''
    );


    lines.push(
      'Province: ' +
      provinceSlug
    );


    lines.push(
      'Prize: ' +
      giaiKey.toUpperCase()
    );


    lines.push(
      'OOS: ' +
      result.oosClassification
    );


    lines.push(
      '-------------------------'
    );


    result.diagnostics
      .filter(
        item =>
          item.valid
      )
      .forEach(
        item => {

          lines.push(
            'Period ' +
            item.period +
            ' — ' +
            item.status
          );


          lines.push(
            'Model: ' +
            item.model +
            ' / ' +
            item.window +
            ' ky'
          );


          lines.push(
            'Selection Q: ' +
            item.selectionQuality
              .toFixed(2)
          );


          lines.push(
            'Margin: ' +
            item.selectionMargin
              .toFixed(4)
          );


          lines.push(
            'A Top3: ' +
            (
              item.adaptive.top3 *
              100
            ).toFixed(2) +
            '%'
          );


          lines.push(
            'B Top3: ' +
            (
              item.baseline.top3 *
              100
            ).toFixed(2) +
            '%'
          );


          lines.push(
            'A MRR: ' +
            item.adaptive.mrr
              .toFixed(4)
          );


          lines.push(
            'B MRR: ' +
            item.baseline.mrr
              .toFixed(4)
          );


          lines.push(
            'A Rank: ' +
            item.adaptive
              .averageRank
              .toFixed(2)
          );


          lines.push(
            'B Rank: ' +
            item.baseline
              .averageRank
              .toFixed(2)
          );


          lines.push(
            'Delta Q: ' +
            item.delta.quality
              .toFixed(4)
          );


          lines.push(
            '-------------------------'
          );

        }
      );


    const s =
      result.summary;


    lines.push(
      'SUMMARY'
    );


    lines.push(
      'Win/Loss/Tie: ' +
      s.wins +
      '/' +
      s.losses +
      '/' +
      s.ties
    );


    lines.push(
      'Best Period: ' +
      s.strongestPeriod +
      ' (' +
      s.strongestImprovement
        .toFixed(4) +
      ')'
    );


    lines.push(
      'Worst Period: ' +
      s.weakestPeriod +
      ' (' +
      s.weakestImprovement
        .toFixed(4) +
      ')'
    );


    lines.push(
      'Model stable: ' +
      (
        s.modelConsistency
          ? 'YES'
          : 'NO'
      )
    );


    lines.push(
      'Window stable: ' +
      (
        s.windowConsistency
          ? 'YES'
          : 'NO'
      )
    );


    alert(
      lines.join(
        '\n'
      )
    );


    return result;


  } catch (
    error
  ) {

    console.error(
      'V2.6 Period Diagnostics:',
      error
    );


    alert(
      '❌ V2.6 BLOCK 4 ERROR\n\n' +
      String(
        error.message ||
        error
      )
    );


    return null;

  }

}


/* =========================================================================
   33. TEMP MOBILE BUTTON
   ========================================================================= */

function addPeriodDiagnosticsButtonV26() {

  if (
    document.getElementById(
      'btnPeriodDiagnosticsV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (
    !settings
  ) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnPeriodDiagnosticsV26';


  button.textContent =
    '🔬 V2.6 Period Diagnostics — Kiên Giang';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    function() {

      showPeriodDiagnosticsV26Mobile(
        'kien-giang',
        'db'
      );

    }
  );


  settings.appendChild(
    button
  );

}


/* =========================================================================
   34. INIT BLOCK 4
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addPeriodDiagnosticsButtonV26
  );

} else {

  addPeriodDiagnosticsButtonV26();

}


console.log(
  'XSMN V2.6 Block 4 loaded — Period Diagnostics ready'
);

/* =========================================================================
   V2.6 BLOCK 4 — SHORT MOBILE DIAGNOSTICS

   Mỗi lần chỉ hiển thị 1 Period
   để tránh Chrome/Samsung cắt alert.
   ========================================================================= */

function showPeriodDiagnosticV26Short(
  provinceSlug = 'kien-giang',
  giaiKey = 'db'
) {

  try {

    const result =
      diagnoseOOSPeriodsV26(
        provinceSlug,
        giaiKey
      );

    if (
      !result ||
      !result.ready
    ) {

      alert(
        'V2.6 DIAGNOSTICS\n\nKhông có dữ liệu.'
      );

      return;

    }


    const items =
      result.diagnostics.filter(
        item => item.valid
      );


    items.forEach(
      (item, index) => {

        setTimeout(
          function() {

            const text =

              'PERIOD ' +
              item.period +
              ' — ' +
              item.status +
              '\n\n' +

              'Model: ' +
              item.model +
              '\n' +

              'Window: ' +
              item.window +
              ' kỳ\n' +

              'Selection Q: ' +
              item.selectionQuality.toFixed(2) +
              '\n' +

              'Margin: ' +
              item.selectionMargin.toFixed(4) +
              '\n\n' +

              'ADAPTIVE / BASELINE\n' +

              'Top3: ' +
              (
                item.adaptive.top3 * 100
              ).toFixed(2) +
              '% / ' +
              (
                item.baseline.top3 * 100
              ).toFixed(2) +
              '%\n' +

              'MRR: ' +
              item.adaptive.mrr.toFixed(4) +
              ' / ' +
              item.baseline.mrr.toFixed(4) +
              '\n' +

              'Rank: ' +
              item.adaptive.averageRank.toFixed(2) +
              ' / ' +
              item.baseline.averageRank.toFixed(2) +
              '\n' +

              'Quality: ' +
              item.adaptive.quality.toFixed(4) +
              ' / ' +
              item.baseline.quality.toFixed(4) +
              '\n\n' +

              'Delta Q: ' +
              item.delta.quality.toFixed(4);


            alert(
              text
            );

          },

          index * 300

        );

      }
    );


    const s =
      result.summary;


    setTimeout(
      function() {

        alert(

          'V2.6 DIAGNOSTIC SUMMARY\n\n' +

          'WIN / LOSS / TIE: ' +
          s.wins +
          ' / ' +
          s.losses +
          ' / ' +
          s.ties +
          '\n\n' +

          'Best Period: ' +
          s.strongestPeriod +
          '\n' +

          'Delta: ' +
          s.strongestImprovement.toFixed(4) +
          '\n\n' +

          'Worst Period: ' +
          s.weakestPeriod +
          '\n' +

          'Delta: ' +
          s.weakestImprovement.toFixed(4) +
          '\n\n' +

          'Model stable: ' +
          (
            s.modelConsistency
              ? 'YES'
              : 'NO'
          ) +
          '\n' +

          'Window stable: ' +
          (
            s.windowConsistency
              ? 'YES'
              : 'NO'
          )

        );

      },

      items.length * 300

    );


    return result;

  } catch (error) {

    console.error(
      'V2.6 Short Diagnostics:',
      error
    );

    alert(
      '❌ V2.6 SHORT DIAGNOSTICS ERROR\n\n' +
      String(
        error.message || error
      )
    );

  }

}


/* =========================================================================
   SHORT DIAGNOSTICS BUTTON
   ========================================================================= */

function addShortDiagnosticsButtonV26() {

  if (
    document.getElementById(
      'btnShortDiagnosticsV26'
    )
  ) {
    return;
  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnShortDiagnosticsV26';


  button.textContent =
    '🔎 V2.6 Diagnostics — từng Period';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    function() {

      showPeriodDiagnosticV26Short(
        'kien-giang',
        'db'
      );

    }
  );


  settings.appendChild(
    button
  );

}


if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addShortDiagnosticsButtonV26
  );

} else {

  addShortDiagnosticsButtonV26();

}


console.log(
  'XSMN V2.6 Short Period Diagnostics ready'
);

/* =========================================================================
   XSMN V2.6 — MOBILE RESEARCH PANEL
   PERIOD DIAGNOSTICS VIEWER

   Mục tiêu:
   - Không dùng alert dài.
   - Hiển thị toàn bộ Period Diagnostics ngay trong app.
   - Cuộn thoải mái trên mobile.
   - Có thể nhấn giữ để copy nội dung.
   - Không thay đổi Production Engine.
   ========================================================================= */


/* =========================================================================
   1. CREATE / GET RESEARCH PANEL
   ========================================================================= */

function getResearchPanelV26() {

  let panel =
    document.getElementById(
      'researchPanelV26'
    );


  if (panel) {
    return panel;
  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {
    return null;
  }


  panel =
    document.createElement(
      'div'
    );


  panel.id =
    'researchPanelV26';


  panel.style.cssText = `
    margin-top:18px;
    margin-bottom:30px;
    padding:18px;
    border-radius:18px;
    background:#ffffff;
    color:#111111;
    font-size:15px;
    line-height:1.55;
    overflow:visible;
    user-select:text;
    -webkit-user-select:text;
    word-break:break-word;
    box-sizing:border-box;
  `;


  settings.appendChild(
    panel
  );


  return panel;

}


/* =========================================================================
   2. FORMAT %
   ========================================================================= */

function formatPercentV26(
  value
) {

  return (
    Number(
      value || 0
    ) *
    100
  ).toFixed(2) + '%';

}


/* =========================================================================
   3. FORMAT NUMBER
   ========================================================================= */

function formatNumberV26(
  value,
  digits = 4
) {

  return Number(
    value || 0
  ).toFixed(
    digits
  );

}


/* =========================================================================
   4. BUILD PERIOD CARD
   ========================================================================= */

function buildPeriodCardV26(
  item
) {

  const adaptive =
    item.adaptive || {};


  const baseline =
    item.baseline || {};


  const delta =
    Number(
      item.improvement || 0
    );


  let status =
    'TIE';


  if (delta > 0.0000001) {
    status = 'WIN';
  }


  if (delta < -0.0000001) {
    status = 'LOSS';
  }


  const statusIcon =
    status === 'WIN'
      ? '🟢'
      : status === 'LOSS'
        ? '🔴'
        : '🟡';


  return `
    <div
      style="
        margin-top:16px;
        padding:16px;
        border-radius:16px;
        background:#f4f5f8;
        border:1px solid #dddddd;
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:800;
          margin-bottom:14px;
        "
      >
        ${statusIcon}
        PERIOD ${item.period} — ${status}
      </div>


      <div>
        <b>Model:</b>
        ${item.model || '-'}
      </div>

      <div>
        <b>Window:</b>
        ${item.window || '-'} kỳ
      </div>

      <div>
        <b>Selection Q:</b>
        ${formatNumberV26(
          item.selectionQuality,
          2
        )}
      </div>

      <div>
        <b>Margin:</b>
        ${formatNumberV26(
          item.selectionMargin,
          4
        )}
      </div>


      <hr
        style="
          margin:14px 0;
          border:0;
          border-top:1px solid #cccccc;
        "
      >


      <div
        style="
          font-weight:800;
          margin-bottom:8px;
        "
      >
        ADAPTIVE / BASELINE
      </div>


      <div>
        <b>Top1:</b>
        ${formatPercentV26(
          adaptive.top1Rate
        )}
        /
        ${formatPercentV26(
          baseline.top1Rate
        )}
      </div>


      <div>
        <b>Top3:</b>
        ${formatPercentV26(
          adaptive.top3Rate
        )}
        /
        ${formatPercentV26(
          baseline.top3Rate
        )}
      </div>


      <div>
        <b>MRR:</b>
        ${formatNumberV26(
          adaptive.mrr,
          4
        )}
        /
        ${formatNumberV26(
          baseline.mrr,
          4
        )}
      </div>


      <div>
        <b>Avg Rank:</b>
        ${formatNumberV26(
          adaptive.averageRank,
          2
        )}
        /
        ${formatNumberV26(
          baseline.averageRank,
          2
        )}
      </div>


      <div>
        <b>Quality:</b>
        ${formatNumberV26(
          adaptive.quality,
          4
        )}
        /
        ${formatNumberV26(
          baseline.quality,
          4
        )}
      </div>


      <div
        style="
          margin-top:12px;
          font-size:17px;
          font-weight:800;
        "
      >
        Delta Q:
        ${delta >= 0 ? '+' : ''}
        ${formatNumberV26(
          delta,
          4
        )}
      </div>

    </div>
  `;

}


/* =========================================================================
   5. SHOW FULL PERIOD DIAGNOSTICS
   ========================================================================= */

function showPeriodDiagnosticsPanelV26(
  provinceSlug = 'kien-giang',
  giaiKey = 'db'
) {

  const panel =
    getResearchPanelV26();


  if (!panel) {

    alert(
      'Không tìm thấy tab Cài đặt.'
    );

    return;

  }


  panel.innerHTML = `
    <div
      style="
        font-size:18px;
        font-weight:800;
      "
    >
      ⏳ Đang chạy V2.6 Period Diagnostics...
    </div>
  `;


  try {

    const result =
      evaluateProvinceOOSV26(
        provinceSlug,
        giaiKey
      );


    if (
      !result ||
      !result.ready
    ) {

      panel.innerHTML = `
        <b>❌ Không thể chạy Diagnostics</b>
        <br><br>
        Reason:
        ${
          result
            ? result.reason
            : 'UNKNOWN'
        }
      `;

      return result;

    }


    const validPeriods =
      result.periods.filter(
        item =>
          item.valid
      );


    const wins =
      validPeriods.filter(
        item =>
          Number(
            item.improvement || 0
          ) > 0.0000001
      );


    const losses =
      validPeriods.filter(
        item =>
          Number(
            item.improvement || 0
          ) < -0.0000001
      );


    const ties =
      validPeriods.filter(
        item =>
          Math.abs(
            Number(
              item.improvement || 0
            )
          ) <= 0.0000001
      );


    const sorted =
      validPeriods
        .slice()
        .sort(
          (a, b) =>
            Number(
              b.improvement || 0
            ) -
            Number(
              a.improvement || 0
            )
        );


    const best =
      sorted[0];


    const worst =
      sorted[
        sorted.length - 1
      ];


    const models =
      validPeriods.map(
        item =>
          item.model
      );


    const windows =
      validPeriods.map(
        item =>
          Number(
            item.window
          )
      );


    const modelStable =
      models.length > 0 &&
      models.every(
        model =>
          model === models[0]
      );


    const windowStable =
      windows.length > 0 &&
      windows.every(
        window =>
          window === windows[0]
      );


    let html = `

      <div
        style="
          font-size:21px;
          font-weight:900;
          margin-bottom:14px;
        "
      >
        🔬 V2.6 PERIOD DIAGNOSTICS
      </div>


      <div>
        <b>Province:</b>
        ${provinceSlug}
      </div>


      <div>
        <b>Prize:</b>
        ${String(
          giaiKey
        ).toUpperCase()}
      </div>


      <div>
        <b>OOS:</b>
        ${result.classification}
      </div>


      <div
        style="
          margin-top:16px;
          padding:14px;
          border-radius:14px;
          background:#f4f5f8;
        "
      >

        <div>
          <b>WIN / LOSS / TIE:</b>
          ${wins.length}
          /
          ${losses.length}
          /
          ${ties.length}
        </div>


        <div style="margin-top:8px;">
          <b>Best Period:</b>
          ${best ? best.period : '-'}
        </div>


        <div>
          <b>Best Delta:</b>
          ${
            best
              ? (
                  Number(
                    best.improvement
                  ) >= 0
                    ? '+'
                    : ''
                ) +
                formatNumberV26(
                  best.improvement,
                  4
                )
              : '-'
          }
        </div>


        <div style="margin-top:8px;">
          <b>Worst Period:</b>
          ${worst ? worst.period : '-'}
        </div>


        <div>
          <b>Worst Delta:</b>
          ${
            worst
              ? formatNumberV26(
                  worst.improvement,
                  4
                )
              : '-'
          }
        </div>


        <div style="margin-top:8px;">
          <b>Model stable:</b>
          ${modelStable ? 'YES' : 'NO'}
        </div>


        <div>
          <b>Window stable:</b>
          ${windowStable ? 'YES' : 'NO'}
        </div>

      </div>

    `;


    validPeriods.forEach(
      item => {

        html +=
          buildPeriodCardV26(
            item
          );

      }
    );


    html += `

      <div
        style="
          margin-top:18px;
          padding:14px;
          border-radius:14px;
          background:#f4f5f8;
          font-size:13px;
        "
      >
        📌 Research only —
        V2.6 chưa thay đổi Production Engine.
      </div>

    `;


    panel.innerHTML =
      html;


    panel.scrollIntoView({
      behavior:
        'smooth',

      block:
        'start'
    });


    return result;


  } catch (error) {

    console.error(
      'V2.6 Research Panel:',
      error
    );


    panel.innerHTML = `
      <div
        style="
          font-weight:800;
          color:#b00020;
        "
      >
        ❌ V2.6 PANEL ERROR
      </div>

      <br>

      ${
        String(
          error.message ||
          error
        )
      }
    `;


    return null;

  }

}


/* =========================================================================
   6. ADD MOBILE PANEL BUTTON
   ========================================================================= */

function addResearchPanelButtonV26() {

  if (
    document.getElementById(
      'btnResearchPanelV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnResearchPanelV26';


  button.textContent =
    '🔬 Xem Full Period Diagnostics';


  button.style.cssText = `
    width:100%;
    margin-top:16px;
    padding:17px 12px;
    border:0;
    border-radius:14px;
    font-size:17px;
    font-weight:800;
    cursor:pointer;
  `;


  button.addEventListener(
    'click',
    function() {

      showPeriodDiagnosticsPanelV26(
        'kien-giang',
        'db'
      );

    }
  );


  settings.appendChild(
    button
  );

}


/* =========================================================================
   7. INIT MOBILE RESEARCH PANEL
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addResearchPanelButtonV26
  );

} else {

  addResearchPanelButtonV26();

}


console.log(
  'XSMN V2.6 Mobile Research Panel ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 5A
   SELECTION RELIABILITY ENGINE

   Mục tiêu:
   - Kiểm tra chất lượng lựa chọn Model + Window.
   - So sánh In-Sample Selection với OOS Performance.
   - Phát hiện:
       + High Quality nhưng OOS thất bại.
       + Margin cao nhưng OOS thất bại.
       + Selection không ổn định.
       + Overfitting risk.
   - Research ONLY.
   - KHÔNG thay đổi Production Engine.
   ========================================================================= */


/* =========================================================================
   27. SAFE NUMBER
   ========================================================================= */

function safeNumberV26(
  value,
  fallback = 0
) {

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

}


/* =========================================================================
   28. PEARSON CORRELATION

   Dùng để kiểm tra:
   Selection Quality / Margin
   có tương quan với OOS Delta hay không.

   +1  : tương quan thuận mạnh
    0  : gần như không có quan hệ tuyến tính
   -1  : tương quan nghịch mạnh
   ========================================================================= */

function correlationV26(
  xs,
  ys
) {

  if (
    !Array.isArray(xs) ||
    !Array.isArray(ys) ||
    xs.length !== ys.length ||
    xs.length < 2
  ) {

    return 0;

  }


  const n =
    xs.length;


  const meanX =
    xs.reduce(
      (sum, value) =>
        sum +
        safeNumberV26(
          value
        ),
      0
    ) / n;


  const meanY =
    ys.reduce(
      (sum, value) =>
        sum +
        safeNumberV26(
          value
        ),
      0
    ) / n;


  let numerator = 0;

  let denominatorX = 0;

  let denominatorY = 0;


  for (
    let i = 0;
    i < n;
    i++
  ) {

    const dx =
      safeNumberV26(
        xs[i]
      ) -
      meanX;


    const dy =
      safeNumberV26(
        ys[i]
      ) -
      meanY;


    numerator +=
      dx * dy;


    denominatorX +=
      dx * dx;


    denominatorY +=
      dy * dy;

  }


  const denominator =
    Math.sqrt(
      denominatorX *
      denominatorY
    );


  if (
    !denominator
  ) {

    return 0;

  }


  return (
    numerator /
    denominator
  );

}


/* =========================================================================
   29. CLASSIFY CORRELATION
   ========================================================================= */

function classifyCorrelationV26(
  value
) {

  const v =
    safeNumberV26(
      value
    );


  const abs =
    Math.abs(
      v
    );


  if (
    abs >= 0.70
  ) {

    return v > 0
      ? 'STRONG_POSITIVE'
      : 'STRONG_NEGATIVE';

  }


  if (
    abs >= 0.40
  ) {

    return v > 0
      ? 'MODERATE_POSITIVE'
      : 'MODERATE_NEGATIVE';

  }


  if (
    abs >= 0.20
  ) {

    return v > 0
      ? 'WEAK_POSITIVE'
      : 'WEAK_NEGATIVE';

  }


  return 'VERY_WEAK';

}


/* =========================================================================
   30. ANALYZE ONE SELECTION

   So sánh:
   - Selection Quality
   - Selection Margin
   - OOS Improvement
   ========================================================================= */

function analyzeSelectionPeriodV26(
  item
) {

  if (
    !item ||
    !item.valid
  ) {

    return {

      valid:
        false,

      reason:
        'INVALID_PERIOD'

    };

  }


  const quality =
    safeNumberV26(
      item.selectionQuality
    );


  const margin =
    safeNumberV26(
      item.selectionMargin
    );


  const delta =
    safeNumberV26(
      item.improvement
    );


  let outcome =
    'TIE';


  if (
    delta >
    0.0000001
  ) {

    outcome =
      'WIN';

  }


  if (
    delta <
    -0.0000001
  ) {

    outcome =
      'LOSS';

  }


  /*
   * Confidence chỉ mô tả độ rõ
   * của lựa chọn trong training.
   *
   * KHÔNG phải xác suất trúng.
   */

  let selectionConfidence =
    'LOW';


  if (
    margin >= 0.03
  ) {

    selectionConfidence =
      'HIGH';

  } else if (
    margin >= 0.01
  ) {

    selectionConfidence =
      'MEDIUM';

  }


  /*
   * Nếu training tỏ ra tự tin
   * nhưng OOS lại thua,
   * đây là tín hiệu overfitting.
   */

  const overfitSignal =
    (
      selectionConfidence ===
        'HIGH' ||
      quality >= 7
    ) &&
    delta < 0;


  /*
   * Margin gần bằng 0 nghĩa là
   * model thắng training rất sít sao.
   */

  const fragileSelection =
    margin <
    0.005;


  return {

    valid:
      true,

    period:
      item.period,

    model:
      item.model,

    window:
      safeNumberV26(
        item.window
      ),

    selectionQuality:
      quality,

    selectionMargin:
      margin,

    selectionConfidence,

    oosDelta:
      delta,

    outcome,

    overfitSignal,

    fragileSelection

  };

}


/* =========================================================================
   31. MODEL / WINDOW STABILITY
   ========================================================================= */

function calculateSelectionStabilityV26(
  rows
) {

  if (
    !Array.isArray(rows) ||
    !rows.length
  ) {

    return {

      modelStability: 0,

      windowStability: 0,

      dominantModel: null,

      dominantWindow: null

    };

  }


  const modelCounts = {};

  const windowCounts = {};


  rows.forEach(
    row => {

      const model =
        String(
          row.model || ''
        );


      const window =
        String(
          row.window || ''
        );


      modelCounts[model] =
        (
          modelCounts[model] ||
          0
        ) + 1;


      windowCounts[window] =
        (
          windowCounts[window] ||
          0
        ) + 1;

    }
  );


  const modelEntries =
    Object.entries(
      modelCounts
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );


  const windowEntries =
    Object.entries(
      windowCounts
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );


  const dominantModel =
    modelEntries.length
      ? modelEntries[0][0]
      : null;


  const dominantWindow =
    windowEntries.length
      ? Number(
          windowEntries[0][0]
        )
      : null;


  const modelStability =
    modelEntries.length
      ? modelEntries[0][1] /
        rows.length
      : 0;


  const windowStability =
    windowEntries.length
      ? windowEntries[0][1] /
        rows.length
      : 0;


  return {

    modelStability,

    windowStability,

    dominantModel,

    dominantWindow,

    modelCounts,

    windowCounts

  };

}


/* =========================================================================
   32. CLASSIFY SELECTION RELIABILITY

   STRONG:
   - OOS tổng thể tốt
   - >= 2/3 periods thắng
   - Quality correlation không âm
   - Không có overfit signal
   - Selection đủ ổn định

   MODERATE:
   - Có bằng chứng tích cực
   - nhưng chưa đủ mạnh

   WEAK:
   - OOS chưa thuyết phục
   - hoặc selection thiếu ổn định

   FAIL:
   - OOS âm
   - và selection metrics không dự báo được OOS
   ========================================================================= */

function classifySelectionReliabilityV26(
  data
) {

  if (
    !data
  ) {

    return 'NO_DATA';

  }


  const positiveOOS =
    data.averageDelta > 0;


  const majorityWins =
    data.winRate >=
    0.50;


  const qualityUseful =
    data.qualityCorrelation >=
    0;


  const noOverfit =
    data.overfitPeriods ===
    0;


  const stabilityOkay =
    data.stability.modelStability >=
      0.50 &&
    data.stability.windowStability >=
      0.50;


  if (
    positiveOOS &&
    majorityWins &&
    qualityUseful &&
    noOverfit &&
    stabilityOkay
  ) {

    return 'STRONG';

  }


  if (
    majorityWins &&
    (
      positiveOOS ||
      qualityUseful
    )
  ) {

    return 'MODERATE';

  }


  if (
    positiveOOS ||
    majorityWins ||
    qualityUseful
  ) {

    return 'WEAK';

  }


  return 'FAIL';

}


/* =========================================================================
   33. RUN SELECTION RELIABILITY
   ========================================================================= */

function evaluateSelectionReliabilityV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey =
    'db'
) {

  const oos =
    evaluateProvinceOOSV26(
      provinceSlug,
      giaiKey
    );


  if (
    !oos ||
    !oos.ready
  ) {

    return {

      ready:
        false,

      reason:
        oos
          ? oos.reason
          : 'OOS_NOT_AVAILABLE'

    };

  }


  const rows =
    oos.periods
      .filter(
        item =>
          item.valid
      )
      .map(
        analyzeSelectionPeriodV26
      )
      .filter(
        item =>
          item.valid
      );


  if (
    !rows.length
  ) {

    return {

      ready:
        false,

      reason:
        'NO_VALID_SELECTION_PERIODS'

    };

  }


  const qualities =
    rows.map(
      row =>
        row.selectionQuality
    );


  const margins =
    rows.map(
      row =>
        row.selectionMargin
    );


  const deltas =
    rows.map(
      row =>
        row.oosDelta
    );


  const qualityCorrelation =
    correlationV26(
      qualities,
      deltas
    );


  const marginCorrelation =
    correlationV26(
      margins,
      deltas
    );


  const wins =
    rows.filter(
      row =>
        row.outcome ===
        'WIN'
    ).length;


  const losses =
    rows.filter(
      row =>
        row.outcome ===
        'LOSS'
    ).length;


  const ties =
    rows.length -
    wins -
    losses;


  const averageDelta =
    deltas.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    deltas.length;


  const overfitPeriods =
    rows.filter(
      row =>
        row.overfitSignal
    ).length;


  const fragilePeriods =
    rows.filter(
      row =>
        row.fragileSelection
    ).length;


  const stability =
    calculateSelectionStabilityV26(
      rows
    );


  const data = {

    periods:
      rows.length,

    wins,

    losses,

    ties,

    winRate:
      wins /
      rows.length,

    averageDelta,

    qualityCorrelation,

    qualityCorrelationClass:
      classifyCorrelationV26(
        qualityCorrelation
      ),

    marginCorrelation,

    marginCorrelationClass:
      classifyCorrelationV26(
        marginCorrelation
      ),

    overfitPeriods,

    fragilePeriods,

    stability

  };


  const classification =
    classifySelectionReliabilityV26(
      data
    );


  return {

    ready:
      true,

    version:
      'V2.6',

    province:
      provinceSlug,

    prize:
      giaiKey,

    oosClassification:
      oos.classification,

    classification,

    summary:
      data,

    periods:
      rows

  };

}


/* =========================================================================
   34. CONSOLE INSPECTION
   ========================================================================= */

function printSelectionReliabilityV26(
  provinceSlug =
    SELECTED_PROVINCE,

  giaiKey =
    'db'
) {

  const result =
    evaluateSelectionReliabilityV26(
      provinceSlug,
      giaiKey
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — SELECTION RELIABILITY'
  );

  console.log(
    provinceSlug,
    String(
      giaiKey
    ).toUpperCase()
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      result.reason
    );


    return result;

  }


  console.table(
    result.periods.map(
      row => ({

        Period:
          row.period,

        Model:
          row.model,

        Window:
          row.window,

        Quality:
          row.selectionQuality
            .toFixed(2),

        Margin:
          row.selectionMargin
            .toFixed(4),

        Confidence:
          row.selectionConfidence,

        OOSDelta:
          row.oosDelta
            .toFixed(4),

        Outcome:
          row.outcome,

        Fragile:
          row.fragileSelection
            ? 'YES'
            : 'NO',

        Overfit:
          row.overfitSignal
            ? 'YES'
            : 'NO'

      }))
  );


  console.log(
    'SUMMARY:',
    result.summary
  );


  console.log(
    'SELECTION RELIABILITY:',
    result.classification
  );


  return result;

}


console.log(
  'XSMN V2.6 Block 5A loaded — Selection Reliability Engine ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 5B
   SELECTION RELIABILITY MOBILE PANEL

   - Hiển thị kết quả Block 5A trong app.
   - Có thể cuộn / copy trên mobile.
   - Research ONLY.
   - Không thay Production Engine.
   ========================================================================= */


/* =========================================================================
   35. RELIABILITY LABEL
   ========================================================================= */

function reliabilityIconV26(
  classification
) {

  switch (
    String(
      classification || ''
    )
  ) {

    case 'STRONG':
      return '🟢';

    case 'MODERATE':
      return '🟡';

    case 'WEAK':
      return '🟠';

    case 'FAIL':
      return '🔴';

    default:
      return '⚪';

  }

}


/* =========================================================================
   36. SIGNED NUMBER
   ========================================================================= */

function signedNumberV26(
  value,
  digits = 4
) {

  const n =
    Number(
      value || 0
    );


  return (
    n > 0
      ? '+'
      : ''
  ) +
  n.toFixed(
    digits
  );

}


/* =========================================================================
   37. PERCENT
   ========================================================================= */

function reliabilityPercentV26(
  value
) {

  return (
    Number(
      value || 0
    ) *
    100
  ).toFixed(2) + '%';

}


/* =========================================================================
   38. BUILD ONE RELIABILITY PERIOD
   ========================================================================= */

function buildReliabilityPeriodCardV26(
  row
) {

  const outcomeIcon =
    row.outcome === 'WIN'
      ? '🟢'
      : row.outcome === 'LOSS'
        ? '🔴'
        : '🟡';


  return `

    <div
      style="
        margin-top:14px;
        padding:15px;
        border-radius:15px;
        background:#f4f5f8;
        border:1px solid #dddddd;
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:10px;
        "
      >
        ${outcomeIcon}
        PERIOD ${row.period} — ${row.outcome}
      </div>


      <div>
        <b>Model:</b>
        ${row.model}
      </div>


      <div>
        <b>Window:</b>
        ${row.window} kỳ
      </div>


      <div>
        <b>Selection Quality:</b>
        ${row.selectionQuality.toFixed(2)}
      </div>


      <div>
        <b>Selection Margin:</b>
        ${row.selectionMargin.toFixed(4)}
      </div>


      <div>
        <b>Training Confidence:</b>
        ${row.selectionConfidence}
      </div>


      <div
        style="
          margin-top:9px;
          font-weight:800;
        "
      >
        OOS Delta:
        ${signedNumberV26(
          row.oosDelta,
          4
        )}
      </div>


      <div style="margin-top:9px;">
        <b>Fragile Selection:</b>
        ${
          row.fragileSelection
            ? '⚠️ YES'
            : 'NO'
        }
      </div>


      <div>
        <b>Overfit Signal:</b>
        ${
          row.overfitSignal
            ? '⚠️ YES'
            : 'NO'
        }
      </div>

    </div>

  `;

}


/* =========================================================================
   39. SHOW RELIABILITY PANEL
   ========================================================================= */

function showSelectionReliabilityPanelV26(
  provinceSlug = 'kien-giang',
  giaiKey = 'db'
) {

  const panel =
    getResearchPanelV26();


  if (!panel) {

    alert(
      'Không tìm thấy Research Panel.'
    );

    return;

  }


  panel.innerHTML = `

    <div
      style="
        font-size:18px;
        font-weight:900;
      "
    >
      ⏳ Đang chạy Selection Reliability...
    </div>

  `;


  try {

    const result =
      evaluateSelectionReliabilityV26(
        provinceSlug,
        giaiKey
      );


    if (
      !result ||
      !result.ready
    ) {

      panel.innerHTML = `

        <div
          style="
            font-size:19px;
            font-weight:900;
          "
        >
          ❌ Selection Reliability không sẵn sàng
        </div>

        <br>

        Reason:
        ${
          result
            ? result.reason
            : 'UNKNOWN'
        }

      `;


      return result;

    }


    const s =
      result.summary;


    const icon =
      reliabilityIconV26(
        result.classification
      );


    let html = `

      <div
        style="
          font-size:21px;
          font-weight:900;
          margin-bottom:12px;
        "
      >
        🧠 V2.6 SELECTION RELIABILITY
      </div>


      <div>
        <b>Province:</b>
        ${provinceSlug}
      </div>


      <div>
        <b>Prize:</b>
        ${String(
          giaiKey
        ).toUpperCase()}
      </div>


      <div>
        <b>OOS Classification:</b>
        ${result.oosClassification}
      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:15px;
          background:#f4f5f8;
        "
      >

        <div
          style="
            font-size:20px;
            font-weight:900;
          "
        >
          ${icon}
          RELIABILITY:
          ${result.classification}
        </div>


        <div style="margin-top:12px;">
          <b>Periods:</b>
          ${s.periods}
        </div>


        <div>
          <b>WIN / LOSS / TIE:</b>
          ${s.wins}
          /
          ${s.losses}
          /
          ${s.ties}
        </div>


        <div>
          <b>Win Rate:</b>
          ${reliabilityPercentV26(
            s.winRate
          )}
        </div>


        <div>
          <b>Average OOS Delta:</b>
          ${signedNumberV26(
            s.averageDelta,
            4
          )}
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:15px;
          background:#f4f5f8;
        "
      >

        <div
          style="
            font-size:17px;
            font-weight:900;
            margin-bottom:10px;
          "
        >
          📈 IN-SAMPLE → OOS
        </div>


        <div>
          <b>Quality Correlation:</b>
          ${signedNumberV26(
            s.qualityCorrelation,
            4
          )}
        </div>


        <div>
          <b>Quality Signal:</b>
          ${s.qualityCorrelationClass}
        </div>


        <div style="margin-top:9px;">
          <b>Margin Correlation:</b>
          ${signedNumberV26(
            s.marginCorrelation,
            4
          )}
        </div>


        <div>
          <b>Margin Signal:</b>
          ${s.marginCorrelationClass}
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:15px;
          background:#f4f5f8;
        "
      >

        <div
          style="
            font-size:17px;
            font-weight:900;
            margin-bottom:10px;
          "
        >
          🛡️ ROBUSTNESS
        </div>


        <div>
          <b>Dominant Model:</b>
          ${
            s.stability
              .dominantModel ||
            '-'
          }
        </div>


        <div>
          <b>Model Stability:</b>
          ${reliabilityPercentV26(
            s.stability
              .modelStability
          )}
        </div>


        <div style="margin-top:9px;">
          <b>Dominant Window:</b>
          ${
            s.stability
              .dominantWindow ??
            '-'
          }
        </div>


        <div>
          <b>Window Stability:</b>
          ${reliabilityPercentV26(
            s.stability
              .windowStability
          )}
        </div>


        <div style="margin-top:9px;">
          <b>Fragile Periods:</b>
          ${s.fragilePeriods}
          /
          ${s.periods}
        </div>


        <div>
          <b>Overfit Signals:</b>
          ${s.overfitPeriods}
          /
          ${s.periods}
        </div>

      </div>


      <div
        style="
          margin-top:18px;
          font-size:18px;
          font-weight:900;
        "
      >
        PERIOD DETAILS
      </div>

    `;


    result.periods.forEach(
      row => {

        html +=
          buildReliabilityPeriodCardV26(
            row
          );

      }
    );


    html += `

      <div
        style="
          margin-top:18px;
          padding:14px;
          border-radius:14px;
          background:#f4f5f8;
          font-size:13px;
        "
      >
        📌 Correlation hiện chỉ dựa trên
        ${s.periods} OOS periods.
        Đây là diagnostic signal,
        không phải bằng chứng thống kê
        đủ mạnh để tự động thay Production.
      </div>

    `;


    panel.innerHTML =
      html;


    panel.scrollIntoView({

      behavior:
        'smooth',

      block:
        'start'

    });


    return result;


  } catch (error) {

    console.error(
      'V2.6 Selection Reliability Panel:',
      error
    );


    panel.innerHTML = `

      <div
        style="
          font-size:19px;
          font-weight:900;
          color:#b00020;
        "
      >
        ❌ V2.6 BLOCK 5B ERROR
      </div>

      <br>

      ${
        String(
          error.message ||
          error
        )
      }

    `;


    return null;

  }

}


/* =========================================================================
   40. ADD RELIABILITY BUTTON
   ========================================================================= */

function addSelectionReliabilityButtonV26() {

  if (
    document.getElementById(
      'btnSelectionReliabilityV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnSelectionReliabilityV26';


  button.textContent =
    '🧠 V2.6 Selection Reliability';


  button.style.cssText = `

    width:100%;
    margin-top:16px;
    padding:17px 12px;
    border:0;
    border-radius:14px;
    font-size:17px;
    font-weight:800;
    cursor:pointer;

  `;


  button.addEventListener(
    'click',
    function() {

      showSelectionReliabilityPanelV26(
        'kien-giang',
        'db'
      );

    }
  );


  settings.appendChild(
    button
  );

}


/* =========================================================================
   41. INIT BLOCK 5B
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addSelectionReliabilityButtonV26
  );

} else {

  addSelectionReliabilityButtonV26();

}


console.log(
  'XSMN V2.6 Block 5B loaded — Selection Reliability Mobile Panel ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 6A
   CROSS-PROVINCE OUT-OF-SAMPLE ENGINE

   Mục tiêu:
   - Chạy True OOS Evaluation cho nhiều tỉnh.
   - Mặc định kiểm định Giải Đặc Biệt.
   - Adaptive Selection phải dùng Training ONLY.
   - Testing chỉ dùng để đánh giá.
   - So sánh Adaptive vs BASELINE.
   - Tổng hợp:
       + PASS / WEAK / FAIL
       + Adaptive Quality
       + Baseline Quality
       + OOS Delta
       + Win Rate
       + Model / Window dominance
       + Positive / Negative provinces
   - Research ONLY.
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   42. SAFE NUMBER
   ========================================================================= */

function crossProvinceNumberV26(
  value,
  fallback = 0
) {

  const n =
    Number(
      value
    );


  return Number.isFinite(n)
    ? n
    : fallback;

}


/* =========================================================================
   43. MODE WITH RATIO

   Tìm Model hoặc Window xuất hiện
   nhiều nhất trong các OOS periods.
   ========================================================================= */

function crossProvinceModeV26(
  values
) {

  if (
    !Array.isArray(values) ||
    !values.length
  ) {

    return {

      value: null,

      count: 0,

      ratio: 0

    };

  }


  const counts = {};


  values.forEach(
    value => {

      const key =
        String(
          value
        );


      counts[key] =
        (
          counts[key] || 0
        ) + 1;

    }
  );


  const ranked =
    Object.entries(
      counts
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


        return String(
          a[0]
        ).localeCompare(
          String(
            b[0]
          )
        );

      }
    );


  const winner =
    ranked[0];


  return {

    value:
      winner
        ? winner[0]
        : null,

    count:
      winner
        ? winner[1]
        : 0,

    ratio:
      winner
        ? winner[1] /
          values.length
        : 0

  };

}


/* =========================================================================
   44. EXTRACT ONE PROVINCE OOS RESULT
   ========================================================================= */

function evaluateCrossProvinceItemV26(
  province,
  giaiKey = 'db'
) {

  const provinceSlug =
    province.slug;


  const provinceName =
    province.name ||
    province.slug;


  let result;


  try {

    result =
      evaluateProvinceOOSV26(
        provinceSlug,
        giaiKey
      );

  } catch (error) {

    console.error(
      'V2.6 Cross Province Error:',
      provinceSlug,
      error
    );


    return {

      ready: false,

      province:
        provinceSlug,

      provinceName,

      prize:
        giaiKey,

      classification:
        'ERROR',

      reason:
        error &&
        error.message
          ? error.message
          : String(error)

    };

  }


  if (
    !result ||
    !result.ready ||
    !result.summary
  ) {

    return {

      ready: false,

      province:
        provinceSlug,

      provinceName,

      prize:
        giaiKey,

      classification:
        result &&
        result.classification
          ? result.classification
          : 'NO_DATA',

      reason:
        result &&
        result.reason
          ? result.reason
          : 'OOS_NOT_READY',

      raw:
        result

    };

  }


  const summary =
    result.summary;


  const validPeriods =
    Array.isArray(
      result.periods
    )
      ? result.periods.filter(
          item =>
            item &&
            item.valid
        )
      : [];


  /*
   * Model dominant.
   */

  const modelMode =
    crossProvinceModeV26(

      validPeriods
        .map(
          item =>
            item.model
        )
        .filter(
          Boolean
        )

    );


  /*
   * Window dominant.
   */

  const windowMode =
    crossProvinceModeV26(

      validPeriods
        .map(
          item =>
            item.window
        )
        .filter(
          value =>
            value !== null &&
            value !== undefined
        )

    );


  const adaptiveQuality =
    crossProvinceNumberV26(
      summary.adaptive &&
      summary.adaptive.quality
    );


  const baselineQuality =
    crossProvinceNumberV26(
      summary.baseline &&
      summary.baseline.quality
    );


  const improvement =
    crossProvinceNumberV26(
      summary.improvement,
      adaptiveQuality -
      baselineQuality
    );


  return {

    ready: true,

    province:
      provinceSlug,

    provinceName,

    prize:
      giaiKey,

    classification:
      result.classification ||
      'NO_DATA',

    periods:
      crossProvinceNumberV26(
        summary.periods
      ),

    tests:
      crossProvinceNumberV26(
        summary.tests
      ),

    wins:
      crossProvinceNumberV26(
        summary.winningPeriods
      ),

    ties:
      crossProvinceNumberV26(
        summary.tiedPeriods
      ),

    losses:
      crossProvinceNumberV26(
        summary.losingPeriods
      ),

    winRate:
      crossProvinceNumberV26(
        summary.winRate
      ),

    adaptiveQuality,

    baselineQuality,

    improvement,

    adaptiveTop1:
      crossProvinceNumberV26(
        summary.adaptive &&
        summary.adaptive.top1Rate
      ),

    adaptiveTop3:
      crossProvinceNumberV26(
        summary.adaptive &&
        summary.adaptive.top3Rate
      ),

    adaptiveMRR:
      crossProvinceNumberV26(
        summary.adaptive &&
        summary.adaptive.mrr
      ),

    adaptiveRank:
      crossProvinceNumberV26(
        summary.adaptive &&
        summary.adaptive.averageRank,
        100
      ),

    baselineTop1:
      crossProvinceNumberV26(
        summary.baseline &&
        summary.baseline.top1Rate
      ),

    baselineTop3:
      crossProvinceNumberV26(
        summary.baseline &&
        summary.baseline.top3Rate
      ),

    baselineMRR:
      crossProvinceNumberV26(
        summary.baseline &&
        summary.baseline.mrr
      ),

    baselineRank:
      crossProvinceNumberV26(
        summary.baseline &&
        summary.baseline.averageRank,
        100
      ),

    dominantModel:
      modelMode.value,

    modelStability:
      modelMode.ratio,

    dominantWindow:
      windowMode.value !== null
        ? Number(
            windowMode.value
          )
        : null,

    windowStability:
      windowMode.ratio,

    raw:
      result

  };

}


/* =========================================================================
   45. CROSS-PROVINCE AGGREGATION
   ========================================================================= */

function aggregateCrossProvinceOOSV26(
  results
) {

  const valid =
    results.filter(
      item =>
        item &&
        item.ready
    );


  if (
    !valid.length
  ) {

    return null;

  }


  const totalTests =
    valid.reduce(
      (sum, item) =>
        sum +
        item.tests,
      0
    );


  /*
   * Weighted Average theo số OOS tests.
   */

  function weightedAverage(
    getter
  ) {

    if (
      !totalTests
    ) {

      return 0;

    }


    return valid.reduce(
      (sum, item) => {

        return (
          sum +
          getter(
            item
          ) *
          item.tests
        );

      },
      0
    ) / totalTests;

  }


  const adaptiveQuality =
    weightedAverage(
      item =>
        item.adaptiveQuality
    );


  const baselineQuality =
    weightedAverage(
      item =>
        item.baselineQuality
    );


  const improvement =
    adaptiveQuality -
    baselineQuality;


  const adaptiveMRR =
    weightedAverage(
      item =>
        item.adaptiveMRR
    );


  const baselineMRR =
    weightedAverage(
      item =>
        item.baselineMRR
    );


  const adaptiveRank =
    weightedAverage(
      item =>
        item.adaptiveRank
    );


  const baselineRank =
    weightedAverage(
      item =>
        item.baselineRank
    );


  const adaptiveTop1 =
    weightedAverage(
      item =>
        item.adaptiveTop1
    );


  const baselineTop1 =
    weightedAverage(
      item =>
        item.baselineTop1
    );


  const adaptiveTop3 =
    weightedAverage(
      item =>
        item.adaptiveTop3
    );


  const baselineTop3 =
    weightedAverage(
      item =>
        item.baselineTop3
    );


  const passCount =
    valid.filter(
      item =>
        item.classification ===
        'PASS'
    ).length;


  const weakCount =
    valid.filter(
      item =>
        item.classification ===
        'WEAK'
    ).length;


  const failCount =
    valid.filter(
      item =>
        item.classification ===
        'FAIL'
    ).length;


  const positiveCount =
    valid.filter(
      item =>
        item.improvement > 0
    ).length;


  const tiedCount =
    valid.filter(
      item =>
        Math.abs(
          item.improvement
        ) <
        0.0000001
    ).length;


  const negativeCount =
    valid.filter(
      item =>
        item.improvement < 0
    ).length;


  const totalPeriods =
    valid.reduce(
      (sum, item) =>
        sum +
        item.periods,
      0
    );


  const winningPeriods =
    valid.reduce(
      (sum, item) =>
        sum +
        item.wins,
      0
    );


  const tiedPeriods =
    valid.reduce(
      (sum, item) =>
        sum +
        item.ties,
      0
    );


  const losingPeriods =
    valid.reduce(
      (sum, item) =>
        sum +
        item.losses,
      0
    );


  const periodWinRate =
    totalPeriods
      ? winningPeriods /
        totalPeriods
      : 0;


  /*
   * Global dominant Model.
   *
   * Mỗi tỉnh đóng góp dominant model
   * của chính tỉnh đó.
   */

  const globalModelMode =
    crossProvinceModeV26(

      valid
        .map(
          item =>
            item.dominantModel
        )
        .filter(
          Boolean
        )

    );


  const globalWindowMode =
    crossProvinceModeV26(

      valid
        .map(
          item =>
            item.dominantWindow
        )
        .filter(
          value =>
            value !== null &&
            value !== undefined
        )

    );


  /*
   * Best / Worst Province.
   */

  const sortedByDelta =
    valid
      .slice()
      .sort(
        (a, b) =>
          b.improvement -
          a.improvement
      );


  const bestProvince =
    sortedByDelta.length
      ? sortedByDelta[0]
      : null;


  const worstProvince =
    sortedByDelta.length
      ? sortedByDelta[
          sortedByDelta.length - 1
        ]
      : null;


  return {

    provinceCount:
      valid.length,

    totalTests,

    totalPeriods,

    classifications: {

      pass:
        passCount,

      weak:
        weakCount,

      fail:
        failCount

    },

    provinces: {

      positive:
        positiveCount,

      tied:
        tiedCount,

      negative:
        negativeCount,

      positiveRate:
        positiveCount /
        valid.length

    },

    periods: {

      wins:
        winningPeriods,

      ties:
        tiedPeriods,

      losses:
        losingPeriods,

      winRate:
        periodWinRate

    },

    adaptive: {

      quality:
        adaptiveQuality,

      top1Rate:
        adaptiveTop1,

      top3Rate:
        adaptiveTop3,

      mrr:
        adaptiveMRR,

      averageRank:
        adaptiveRank

    },

    baseline: {

      quality:
        baselineQuality,

      top1Rate:
        baselineTop1,

      top3Rate:
        baselineTop3,

      mrr:
        baselineMRR,

      averageRank:
        baselineRank

    },

    improvement,

    dominantModel:
      globalModelMode.value,

    dominantModelRate:
      globalModelMode.ratio,

    dominantWindow:
      globalWindowMode.value !== null
        ? Number(
            globalWindowMode.value
          )
        : null,

    dominantWindowRate:
      globalWindowMode.ratio,

    bestProvince:
      bestProvince
        ? {
            province:
              bestProvince.province,

            name:
              bestProvince.provinceName,

            improvement:
              bestProvince.improvement,

            classification:
              bestProvince.classification
          }
        : null,

    worstProvince:
      worstProvince
        ? {
            province:
              worstProvince.province,

            name:
              worstProvince.provinceName,

            improvement:
              worstProvince.improvement,

            classification:
              worstProvince.classification
          }
        : null

  };

}


/* =========================================================================
   46. GLOBAL CROSS-PROVINCE CLASSIFICATION

   Đây vẫn chỉ là Research Gate.

   PASS:
   - Global Adaptive Quality > Baseline
   - Global MRR >= Baseline
   - Global Avg Rank <= Baseline
   - >= 50% tỉnh có Delta dương
   - >= 50% OOS periods thắng

   WEAK:
   - Có một số tín hiệu cải thiện,
     nhưng chưa đồng thuận.

   FAIL:
   - Không cho thấy lợi thế rõ ràng.
   ========================================================================= */

function classifyCrossProvinceOOSV26(
  summary
) {

  if (!summary) {

    return 'NO_DATA';

  }


  const qualityBetter =
    summary.improvement > 0;


  const mrrBetter =
    summary.adaptive.mrr >=
    summary.baseline.mrr;


  const rankBetter =
    summary.adaptive.averageRank <=
    summary.baseline.averageRank;


  const provinceMajority =
    summary.provinces
      .positiveRate >=
    0.50;


  const periodMajority =
    summary.periods
      .winRate >=
    0.50;


  if (
    qualityBetter &&
    mrrBetter &&
    rankBetter &&
    provinceMajority &&
    periodMajority
  ) {

    return 'PASS';

  }


  const positiveSignals = [

    qualityBetter,

    mrrBetter,

    rankBetter,

    provinceMajority,

    periodMajority

  ]
  .filter(
    Boolean
  )
  .length;


  if (
    positiveSignals >= 2
  ) {

    return 'WEAK';

  }


  return 'FAIL';

}


/* =========================================================================
   47. RUN CROSS-PROVINCE OOS

   Mặc định:
   toàn bộ PROVINCES + DB.
   ========================================================================= */

function evaluateAllProvincesOOSV26(
  giaiKey = 'db'
) {

  if (
    !Array.isArray(
      PROVINCES
    ) ||
    !PROVINCES.length
  ) {

    return {

      ready: false,

      reason:
        'NO_PROVINCES'

    };

  }


  const results = [];


  PROVINCES.forEach(
    province => {

      console.log(
        'V2.6 Cross OOS:',
        province.name,
        String(
          giaiKey
        ).toUpperCase()
      );


      const item =
        evaluateCrossProvinceItemV26(
          province,
          giaiKey
        );


      results.push(
        item
      );

    }
  );


  const summary =
    aggregateCrossProvinceOOSV26(
      results
    );


  if (!summary) {

    return {

      ready: false,

      prize:
        giaiKey,

      reason:
        'NO_VALID_CROSS_PROVINCE_RESULTS',

      results

    };

  }


  const classification =
    classifyCrossProvinceOOSV26(
      summary
    );


  return {

    ready: true,

    version:
      'V2.6',

    engine:
      'CROSS_PROVINCE_OOS',

    prize:
      giaiKey,

    classification,

    summary,

    results

  };

}


/* =========================================================================
   48. PRINT CROSS-PROVINCE RESULT
   ========================================================================= */

function printAllProvincesOOSV26(
  giaiKey = 'db'
) {

  const result =
    evaluateAllProvincesOOSV26(
      giaiKey
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — CROSS-PROVINCE OOS'
  );

  console.log(
    'Prize:',
    String(
      giaiKey
    ).toUpperCase()
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      'V2.6 Cross Province:',
      result.reason
    );


    return result;

  }


  console.table(

    result.results
      .filter(
        item =>
          item.ready
      )
      .map(
        item => ({

          Province:
            item.provinceName,

          OOS:
            item.classification,

          Periods:
            item.periods,

          Tests:
            item.tests,

          Wins:
            item.wins,

          Losses:
            item.losses,

          WinRate:
            (
              item.winRate *
              100
            ).toFixed(2) +
            '%',

          AdaptiveQ:
            item.adaptiveQuality
              .toFixed(4),

          BaselineQ:
            item.baselineQuality
              .toFixed(4),

          Delta:
            (
              item.improvement > 0
                ? '+'
                : ''
            ) +
            item.improvement
              .toFixed(4),

          Model:
            item.dominantModel ||
            '-',

          ModelStable:
            (
              item.modelStability *
              100
            ).toFixed(2) +
            '%',

          Window:
            item.dominantWindow ||
            '-',

          WindowStable:
            (
              item.windowStability *
              100
            ).toFixed(2) +
            '%'

        }))

  );


  console.log(
    '------------------------------------------'
  );


  console.log(
    'GLOBAL SUMMARY:',
    result.summary
  );


  console.log(
    'GLOBAL CLASSIFICATION:',
    result.classification
  );


  return result;

}


/* =========================================================================
   49. SHORT MOBILE SUMMARY TEXT

   Block 6A chỉ tạo engine.
   Hàm này chuẩn bị sẵn dữ liệu ngắn
   để test trên điện thoại nếu cần.
   ========================================================================= */

function crossProvinceSummaryTextV26(
  result
) {

  if (
    !result ||
    !result.ready
  ) {

    return (
      'V2.6 CROSS-PROVINCE OOS\n\n' +
      'NOT READY\n' +
      (
        result &&
        result.reason
          ? result.reason
          : 'UNKNOWN'
      )
    );

  }


  const s =
    result.summary;


  return (

    'V2.6 CROSS-PROVINCE OOS\n\n' +

    'Prize: ' +
    String(
      result.prize
    ).toUpperCase() +
    '\n' +

    'Provinces: ' +
    s.provinceCount +
    '\n' +

    'OOS Tests: ' +
    s.totalTests +
    '\n' +

    'Periods: ' +
    s.totalPeriods +
    '\n\n' +

    'PASS / WEAK / FAIL: ' +
    s.classifications.pass +
    ' / ' +
    s.classifications.weak +
    ' / ' +
    s.classifications.fail +
    '\n\n' +

    'Positive Provinces: ' +
    s.provinces.positive +
    '/' +
    s.provinceCount +
    '\n' +

    'Province Positive Rate: ' +
    (
      s.provinces
        .positiveRate *
      100
    ).toFixed(2) +
    '%\n' +

    'Period Win Rate: ' +
    (
      s.periods
        .winRate *
      100
    ).toFixed(2) +
    '%\n\n' +

    'Adaptive Q: ' +
    s.adaptive
      .quality
      .toFixed(4) +
    '\n' +

    'Baseline Q: ' +
    s.baseline
      .quality
      .toFixed(4) +
    '\n' +

    'Delta: ' +
    (
      s.improvement > 0
        ? '+'
        : ''
    ) +
    s.improvement
      .toFixed(4) +
    '\n\n' +

    'Adaptive MRR: ' +
    s.adaptive
      .mrr
      .toFixed(4) +
    '\n' +

    'Baseline MRR: ' +
    s.baseline
      .mrr
      .toFixed(4) +
    '\n\n' +

    'Adaptive Rank: ' +
    s.adaptive
      .averageRank
      .toFixed(2) +
    '\n' +

    'Baseline Rank: ' +
    s.baseline
      .averageRank
      .toFixed(2) +
    '\n\n' +

    'Dominant Model: ' +
    (
      s.dominantModel ||
      '-'
    ) +
    '\n' +

    'Dominant Window: ' +
    (
      s.dominantWindow ||
      '-'
    ) +
    '\n\n' +

    'GLOBAL RESULT: ' +
    result.classification

  );

}


console.log(
  'XSMN V2.6 Block 6A loaded — Cross-Province OOS Engine ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 6B
   CROSS-PROVINCE MOBILE BATCH RUNNER

   Mục tiêu:
   - Chạy Cross-Province OOS tuần tự trên mobile.
   - Không khóa UI quá lâu.
   - Hiển thị tiến độ từng tỉnh.
   - Tổng hợp kết quả sau khi chạy xong.
   - Không thay Production Engine.
   ========================================================================= */


/* =========================================================================
   50. BATCH STATE
   ========================================================================= */

const CROSS_OOS_BATCH_V26 = {

  running: false,

  cancelled: false,

  currentIndex: 0,

  total: 0,

  prize: 'db',

  results: [],

  startedAt: null,

  finishedAt: null

};


/* =========================================================================
   51. WAIT / YIELD TO BROWSER
   ========================================================================= */

function crossOOSWaitV26(
  milliseconds = 80
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );

}


/* =========================================================================
   52. GET BATCH PANEL
   ========================================================================= */

function getCrossOOSPanelV26() {

  let panel =
    document.getElementById(
      'crossOOSPanelV26'
    );


  if (panel) {

    return panel;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    return null;

  }


  panel =
    document.createElement(
      'div'
    );


  panel.id =
    'crossOOSPanelV26';


  panel.style.cssText = `

    margin-top:16px;
    padding:16px;
    border-radius:16px;
    background:rgba(255,255,255,.06);
    line-height:1.55;
    overflow-wrap:anywhere;

  `;


  settings.appendChild(
    panel
  );


  return panel;

}


/* =========================================================================
   53. PROGRESS BAR
   ========================================================================= */

function renderCrossOOSProgressV26(
  current,
  total,
  provinceName
) {

  const panel =
    getCrossOOSPanelV26();


  if (!panel) {

    return;

  }


  const percentage =
    total
      ? Math.round(
          current /
          total *
          100
        )
      : 0;


  panel.innerHTML = `

    <div
      style="
        font-size:20px;
        font-weight:900;
        margin-bottom:8px;
      "
    >
      🌐 V2.6 CROSS-PROVINCE OOS
    </div>


    <div
      style="
        margin-bottom:12px;
      "
    >
      Đang kiểm định:
      <b>
        ${provinceName || '...'}
      </b>
    </div>


    <div
      style="
        display:flex;
        justify-content:space-between;
        gap:10px;
        margin-bottom:7px;
        font-weight:800;
      "
    >

      <span>
        ${current}/${total}
      </span>

      <span>
        ${percentage}%
      </span>

    </div>


    <div
      style="
        width:100%;
        height:14px;
        border-radius:999px;
        overflow:hidden;
        background:rgba(255,255,255,.12);
      "
    >

      <div
        style="
          width:${percentage}%;
          height:100%;
          background:#ffc447;
          transition:width .2s ease;
        "
      >
      </div>

    </div>


    <div
      style="
        margin-top:12px;
        opacity:.75;
        font-size:13px;
      "
    >
      Không đóng trang trong khi
      quá trình kiểm định đang chạy.
    </div>

  `;

}


/* =========================================================================
   54. FORMAT DELTA
   ========================================================================= */

function crossOOSDeltaTextV26(
  value
) {

  const n =
    Number(
      value || 0
    );


  return (
    n > 0
      ? '+'
      : ''
  ) +
  n.toFixed(
    4
  );

}


/* =========================================================================
   55. CLASSIFICATION ICON
   ========================================================================= */

function crossOOSClassIconV26(
  classification
) {

  switch (
    classification
  ) {

    case 'PASS':
      return '🟢';

    case 'WEAK':
      return '🟡';

    case 'FAIL':
      return '🔴';

    case 'ERROR':
      return '❌';

    default:
      return '⚪';

  }

}


/* =========================================================================
   56. RUN ONE PROVINCE

   Có yield trước và sau calculation
   để browser có cơ hội cập nhật UI.
   ========================================================================= */

async function runOneCrossOOSV26(
  province,
  giaiKey
) {

  await crossOOSWaitV26(
    60
  );


  let result;


  try {

    result =
      evaluateCrossProvinceItemV26(
        province,
        giaiKey
      );

  } catch (error) {

    console.error(
      'V2.6 Mobile Batch:',
      province.slug,
      error
    );


    result = {

      ready: false,

      province:
        province.slug,

      provinceName:
        province.name,

      prize:
        giaiKey,

      classification:
        'ERROR',

      reason:
        String(
          error.message ||
          error
        )

    };

  }


  await crossOOSWaitV26(
    60
  );


  return result;

}


/* =========================================================================
   57. RUN BATCH

   Chạy tuần tự:
   Province 1 -> yield
   Province 2 -> yield
   ...
   Province 21.
   ========================================================================= */

async function runCrossProvinceBatchV26(
  giaiKey = 'db'
) {

  if (
    CROSS_OOS_BATCH_V26.running
  ) {

    alert(
      'V2.6 Cross-Province đang chạy.'
    );

    return null;

  }


  if (
    !Array.isArray(
      PROVINCES
    ) ||
    !PROVINCES.length
  ) {

    alert(
      'Không tìm thấy danh sách tỉnh.'
    );

    return null;

  }


  CROSS_OOS_BATCH_V26.running =
    true;


  CROSS_OOS_BATCH_V26.cancelled =
    false;


  CROSS_OOS_BATCH_V26.currentIndex =
    0;


  CROSS_OOS_BATCH_V26.total =
    PROVINCES.length;


  CROSS_OOS_BATCH_V26.prize =
    giaiKey;


  CROSS_OOS_BATCH_V26.results =
    [];


  CROSS_OOS_BATCH_V26.startedAt =
    new Date();


  CROSS_OOS_BATCH_V26.finishedAt =
    null;


  /*
   * Scroll tới panel.
   */

  const panel =
    getCrossOOSPanelV26();


  if (panel) {

    panel.scrollIntoView({

      behavior:
        'smooth',

      block:
        'start'

    });

  }


  try {

    for (
      let index = 0;
      index < PROVINCES.length;
      index++
    ) {

      if (
        CROSS_OOS_BATCH_V26.cancelled
      ) {

        break;

      }


      const province =
        PROVINCES[index];


      CROSS_OOS_BATCH_V26.currentIndex =
        index + 1;


      renderCrossOOSProgressV26(

        index,

        PROVINCES.length,

        province.name

      );


      /*
       * Cho browser render progress
       * trước calculation nặng.
       */

      await crossOOSWaitV26(
        120
      );


      const item =
        await runOneCrossOOSV26(
          province,
          giaiKey
        );


      CROSS_OOS_BATCH_V26.results.push(
        item
      );


      renderCrossOOSProgressV26(

        index + 1,

        PROVINCES.length,

        province.name

      );


      /*
       * Nghỉ ngắn giữa hai tỉnh.
       */

      await crossOOSWaitV26(
        120
      );

    }


    CROSS_OOS_BATCH_V26.finishedAt =
      new Date();


    if (
      CROSS_OOS_BATCH_V26.cancelled
    ) {

      renderCrossOOSCancelledV26();

      return {

        ready: false,

        cancelled: true,

        results:
          CROSS_OOS_BATCH_V26.results

      };

    }


    const summary =
      aggregateCrossProvinceOOSV26(
        CROSS_OOS_BATCH_V26.results
      );


    const classification =
      classifyCrossProvinceOOSV26(
        summary
      );


    const finalResult = {

      ready:
        Boolean(
          summary
        ),

      version:
        'V2.6',

      engine:
        'CROSS_PROVINCE_MOBILE_BATCH',

      prize:
        giaiKey,

      classification,

      summary,

      results:
        CROSS_OOS_BATCH_V26.results,

      startedAt:
        CROSS_OOS_BATCH_V26.startedAt,

      finishedAt:
        CROSS_OOS_BATCH_V26.finishedAt

    };


    renderCrossOOSFinalV26(
      finalResult
    );


    /*
     * Giữ lại kết quả để có thể
     * đọc lại bằng Console sau này.
     */

    window.LAST_CROSS_OOS_V26 =
      finalResult;


    return finalResult;


  } catch (error) {

    console.error(
      'V2.6 Cross Province Batch:',
      error
    );


    const panel =
      getCrossOOSPanelV26();


    if (panel) {

      panel.innerHTML = `

        <div
          style="
            font-size:20px;
            font-weight:900;
          "
        >
          ❌ CROSS-PROVINCE ERROR
        </div>

        <div style="margin-top:12px;">
          ${
            String(
              error.message ||
              error
            )
          }
        </div>

      `;

    }


    return null;


  } finally {

    CROSS_OOS_BATCH_V26.running =
      false;

  }

}


/* =========================================================================
   58. CANCEL BATCH
   ========================================================================= */

function cancelCrossProvinceBatchV26() {

  if (
    !CROSS_OOS_BATCH_V26.running
  ) {

    return;

  }


  CROSS_OOS_BATCH_V26.cancelled =
    true;

}


/* =========================================================================
   59. CANCELLED UI
   ========================================================================= */

function renderCrossOOSCancelledV26() {

  const panel =
    getCrossOOSPanelV26();


  if (!panel) {

    return;

  }


  panel.innerHTML = `

    <div
      style="
        font-size:20px;
        font-weight:900;
      "
    >
      ⛔ Cross-Province OOS đã dừng
    </div>


    <div style="margin-top:10px;">
      Đã hoàn thành:
      <b>
        ${CROSS_OOS_BATCH_V26.results.length}
        /
        ${CROSS_OOS_BATCH_V26.total}
      </b>
      tỉnh.
    </div>

  `;

}


/* =========================================================================
   60. PROVINCE RESULT CARD
   ========================================================================= */

function buildCrossOOSProvinceCardV26(
  item
) {

  if (
    !item.ready
  ) {

    return `

      <div
        style="
          margin-top:10px;
          padding:13px;
          border-radius:13px;
          background:rgba(255,255,255,.06);
        "
      >

        ❌
        <b>${item.provinceName}</b>

        <div
          style="
            margin-top:5px;
            font-size:13px;
            opacity:.75;
          "
        >
          ${
            item.reason ||
            'NO DATA'
          }
        </div>

      </div>

    `;

  }


  const icon =
    crossOOSClassIconV26(
      item.classification
    );


  return `

    <div
      style="
        margin-top:10px;
        padding:13px;
        border-radius:13px;
        background:rgba(255,255,255,.06);
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:8px;
          align-items:center;
        "
      >

        <div
          style="
            font-weight:900;
          "
        >
          ${icon}
          ${item.provinceName}
        </div>

        <div
          style="
            font-weight:900;
          "
        >
          ${item.classification}
        </div>

      </div>


      <div
        style="
          margin-top:8px;
          font-size:14px;
        "
      >
        Delta:
        <b>
          ${crossOOSDeltaTextV26(
            item.improvement
          )}
        </b>

        · Win:
        <b>
          ${
            (
              item.winRate *
              100
            ).toFixed(0)
          }%
        </b>
      </div>


      <div
        style="
          margin-top:4px;
          font-size:13px;
          opacity:.78;
        "
      >
        Model:
        ${item.dominantModel || '-'}

        · Window:
        ${
          item.dominantWindow ||
          '-'
        }

        · Tests:
        ${item.tests}
      </div>

    </div>

  `;

}


/* =========================================================================
   61. FINAL RESULT UI
   ========================================================================= */

function renderCrossOOSFinalV26(
  result
) {

  const panel =
    getCrossOOSPanelV26();


  if (!panel) {

    return;

  }


  if (
    !result ||
    !result.ready ||
    !result.summary
  ) {

    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:900;
        "
      >
        ❌ Không có Cross-Province Result
      </div>

    `;


    return;

  }


  const s =
    result.summary;


  const globalIcon =
    crossOOSClassIconV26(
      result.classification
    );


  const validResults =
    result.results
      .filter(
        item =>
          item.ready
      )
      .slice()
      .sort(
        (a, b) =>
          b.improvement -
          a.improvement
      );


  let html = `

    <div
      style="
        font-size:21px;
        font-weight:900;
        margin-bottom:5px;
      "
    >
      🌐 V2.6 CROSS-PROVINCE OOS
    </div>


    <div
      style="
        font-size:14px;
        opacity:.75;
      "
    >
      Prize:
      ${String(
        result.prize
      ).toUpperCase()}
    </div>


    <div
      style="
        margin-top:15px;
        padding:16px;
        border-radius:15px;
        background:rgba(255,255,255,.07);
      "
    >

      <div
        style="
          font-size:21px;
          font-weight:900;
        "
      >
        ${globalIcon}
        GLOBAL:
        ${result.classification}
      </div>


      <div style="margin-top:12px;">
        <b>Provinces:</b>
        ${s.provinceCount}
      </div>


      <div>
        <b>OOS Tests:</b>
        ${s.totalTests}
      </div>


      <div>
        <b>OOS Periods:</b>
        ${s.totalPeriods}
      </div>


      <div style="margin-top:10px;">
        <b>PASS / WEAK / FAIL:</b>
        ${s.classifications.pass}
        /
        ${s.classifications.weak}
        /
        ${s.classifications.fail}
      </div>


      <div>
        <b>Positive Provinces:</b>
        ${s.provinces.positive}
        /
        ${s.provinceCount}
        (
        ${
          (
            s.provinces
              .positiveRate *
            100
          ).toFixed(2)
        }%
        )
      </div>


      <div>
        <b>Period Win Rate:</b>
        ${
          (
            s.periods
              .winRate *
            100
          ).toFixed(2)
        }%
      </div>

    </div>


    <div
      style="
        margin-top:13px;
        padding:16px;
        border-radius:15px;
        background:rgba(255,255,255,.07);
      "
    >

      <div
        style="
          font-size:17px;
          font-weight:900;
          margin-bottom:9px;
        "
      >
        📊 ADAPTIVE vs BASELINE
      </div>


      <div>
        Adaptive Q:
        <b>
          ${s.adaptive
            .quality
            .toFixed(4)}
        </b>
      </div>


      <div>
        Baseline Q:
        <b>
          ${s.baseline
            .quality
            .toFixed(4)}
        </b>
      </div>


      <div style="margin-top:7px;">
        Delta:
        <b>
          ${crossOOSDeltaTextV26(
            s.improvement
          )}
        </b>
      </div>


      <div style="margin-top:9px;">
        Adaptive MRR:
        <b>
          ${s.adaptive
            .mrr
            .toFixed(4)}
        </b>
      </div>


      <div>
        Baseline MRR:
        <b>
          ${s.baseline
            .mrr
            .toFixed(4)}
        </b>
      </div>


      <div style="margin-top:9px;">
        Adaptive Rank:
        <b>
          ${s.adaptive
            .averageRank
            .toFixed(2)}
        </b>
      </div>


      <div>
        Baseline Rank:
        <b>
          ${s.baseline
            .averageRank
            .toFixed(2)}
        </b>
      </div>

    </div>


    <div
      style="
        margin-top:13px;
        padding:16px;
        border-radius:15px;
        background:rgba(255,255,255,.07);
      "
    >

      <div
        style="
          font-size:17px;
          font-weight:900;
          margin-bottom:9px;
        "
      >
        🧠 SELECTION PATTERN
      </div>


      <div>
        Dominant Model:
        <b>
          ${s.dominantModel || '-'}
        </b>
      </div>


      <div>
        Model Rate:
        <b>
          ${
            (
              s.dominantModelRate *
              100
            ).toFixed(2)
          }%
        </b>
      </div>


      <div style="margin-top:8px;">
        Dominant Window:
        <b>
          ${s.dominantWindow || '-'}
        </b>
      </div>


      <div>
        Window Rate:
        <b>
          ${
            (
              s.dominantWindowRate *
              100
            ).toFixed(2)
          }%
        </b>
      </div>

    </div>


    <div
      style="
        margin-top:18px;
        font-size:18px;
        font-weight:900;
      "
    >
      🏆 PROVINCE RESULTS
    </div>

  `;


  validResults.forEach(
    item => {

      html +=
        buildCrossOOSProvinceCardV26(
          item
        );

    }
  );


  html += `

    <div
      style="
        margin-top:18px;
        padding:14px;
        border-radius:14px;
        background:rgba(255,255,255,.06);
        font-size:13px;
        opacity:.8;
      "
    >
      📌 Research only.
      Cross-Province OOS chưa thay đổi
      Production Engine.
    </div>

  `;


  panel.innerHTML =
    html;


  panel.scrollIntoView({

    behavior:
      'smooth',

    block:
      'start'

  });

}


/* =========================================================================
   62. ADD MOBILE CONTROLS
   ========================================================================= */

function addCrossOOSBatchControlsV26() {

  if (
    document.getElementById(
      'crossOOSControlsV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    return;

  }


  const wrapper =
    document.createElement(
      'div'
    );


  wrapper.id =
    'crossOOSControlsV26';


  wrapper.style.cssText = `

    margin-top:16px;

  `;


  wrapper.innerHTML = `

    <button
      id="btnRunCrossOOSV26"
      style="
        width:100%;
        padding:17px 12px;
        border:0;
        border-radius:14px;
        font-size:17px;
        font-weight:900;
        cursor:pointer;
      "
    >
      🌐 Chạy V2.6 Cross-Province OOS
    </button>


    <button
      id="btnCancelCrossOOSV26"
      style="
        width:100%;
        margin-top:9px;
        padding:13px 12px;
        border:0;
        border-radius:14px;
        font-size:15px;
        font-weight:800;
        cursor:pointer;
        opacity:.8;
      "
    >
      ⛔ Dừng Cross-Province Test
    </button>

  `;


  settings.appendChild(
    wrapper
  );


  const runButton =
    document.getElementById(
      'btnRunCrossOOSV26'
    );


  const cancelButton =
    document.getElementById(
      'btnCancelCrossOOSV26'
    );


  if (runButton) {

    runButton.addEventListener(
      'click',
      function() {

        runCrossProvinceBatchV26(
          'db'
        );

      }
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      'click',
      cancelCrossProvinceBatchV26
    );

  }

}


/* =========================================================================
   63. INIT BLOCK 6B
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addCrossOOSBatchControlsV26
  );

} else {

  addCrossOOSBatchControlsV26();

}


console.log(
  'XSMN V2.6 Block 6B loaded — Mobile Batch Runner ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 6B TEST PATCH
   SAFE 3-PROVINCE MOBILE TEST
   ========================================================================= */

async function runCrossProvinceBatchTestV26(
  giaiKey = 'db'
) {

  if (
    CROSS_OOS_BATCH_V26.running
  ) {

    alert(
      'Cross-Province OOS đang chạy.'
    );

    return null;

  }


  /*
   * Chỉ test 3 tỉnh đầu tiên.
   */

  const testProvinces =
    PROVINCES.slice(
      0,
      3
    );


  if (
    !testProvinces.length
  ) {

    alert(
      'Không tìm thấy dữ liệu tỉnh.'
    );

    return null;

  }


  CROSS_OOS_BATCH_V26.running =
    true;

  CROSS_OOS_BATCH_V26.cancelled =
    false;

  CROSS_OOS_BATCH_V26.currentIndex =
    0;

  CROSS_OOS_BATCH_V26.total =
    testProvinces.length;

  CROSS_OOS_BATCH_V26.prize =
    giaiKey;

  CROSS_OOS_BATCH_V26.results =
    [];

  CROSS_OOS_BATCH_V26.startedAt =
    new Date();

  CROSS_OOS_BATCH_V26.finishedAt =
    null;


  const panel =
    getCrossOOSPanelV26();


  if (panel) {

    panel.scrollIntoView({

      behavior:
        'smooth',

      block:
        'start'

    });

  }


  try {

    for (
      let index = 0;
      index < testProvinces.length;
      index++
    ) {

      if (
        CROSS_OOS_BATCH_V26.cancelled
      ) {

        break;

      }


      const province =
        testProvinces[index];


      CROSS_OOS_BATCH_V26.currentIndex =
        index + 1;


      renderCrossOOSProgressV26(

        index,

        testProvinces.length,

        province.name

      );


      await crossOOSWaitV26(
        150
      );


      const item =
        await runOneCrossOOSV26(
          province,
          giaiKey
        );


      CROSS_OOS_BATCH_V26.results.push(
        item
      );


      renderCrossOOSProgressV26(

        index + 1,

        testProvinces.length,

        province.name

      );


      await crossOOSWaitV26(
        150
      );

    }


    CROSS_OOS_BATCH_V26.finishedAt =
      new Date();


    if (
      CROSS_OOS_BATCH_V26.cancelled
    ) {

      renderCrossOOSCancelledV26();

      return null;

    }


    const summary =
      aggregateCrossProvinceOOSV26(
        CROSS_OOS_BATCH_V26.results
      );


    const classification =
      classifyCrossProvinceOOSV26(
        summary
      );


    const finalResult = {

      ready:
        Boolean(summary),

      version:
        'V2.6',

      engine:
        'CROSS_PROVINCE_3_TEST',

      prize:
        giaiKey,

      classification,

      summary,

      results:
        CROSS_OOS_BATCH_V26.results

    };


    window.LAST_CROSS_OOS_TEST_V26 =
      finalResult;


    renderCrossOOSFinalV26(
      finalResult
    );


    return finalResult;


  } catch (error) {

    console.error(
      'V2.6 3 Province Test:',
      error
    );


    if (panel) {

      panel.innerHTML = `

        <b>❌ 3-PROVINCE TEST ERROR</b>

        <br><br>

        ${String(
          error.message ||
          error
        )}

      `;

    }


    return null;


  } finally {

    CROSS_OOS_BATCH_V26.running =
      false;

  }

}


/* =========================================================================
   ADD 3-PROVINCE TEST BUTTON
   ========================================================================= */

function addCrossOOSTest3ButtonV26() {

  if (
    document.getElementById(
      'btnCrossOOSTest3V26'
    )
  ) {

    return;

  }


  const controls =
    document.getElementById(
      'crossOOSControlsV26'
    );


  if (!controls) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnCrossOOSTest3V26';


  button.textContent =
    '🧪 Test Cross-OOS — 3 tỉnh';


  button.style.cssText = `

    width:100%;
    margin-top:9px;
    padding:15px 12px;
    border:0;
    border-radius:14px;
    font-size:16px;
    font-weight:900;
    cursor:pointer;

  `;


  button.addEventListener(
    'click',
    function() {

      runCrossProvinceBatchTestV26(
        'db'
      );

    }
  );


  controls.appendChild(
    button
  );

}


if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addCrossOOSTest3ButtonV26
  );

} else {

  addCrossOOSTest3ButtonV26();

}


console.log(
  'XSMN V2.6 3-Province Mobile Test ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 7A
   PROVINCE ADAPTIVE GATE ENGINE

   Mục tiêu:
   - Đọc kết quả Cross-Province OOS V2.6.
   - Đánh giá Adaptive theo TỪNG TỈNH.
   - Không dùng Global Model để quyết định cho tất cả tỉnh.
   - Phân biệt:
       + ADAPTIVE
       + WATCH
       + BASELINE
       + REJECT
   - Xét đồng thời:
       + OOS Quality Delta
       + Period Win Rate
       + MRR Improvement
       + Average Rank Improvement
       + Số OOS tests
       + Model được chọn
   - BASELINE được chọn không bị xem là Adaptive Failure.
   - Research Only.
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   1. CONFIG
   ========================================================================= */

const PROVINCE_GATE_V26_CONFIG = {

  /*
   * Số OOS tests tối thiểu.
   *
   * Hiện tại mỗi tỉnh:
   * 3 periods × 20 tests = 60.
   */

  minTests: 40,


  /*
   * Ngưỡng Quality Delta.
   *
   * strongDelta:
   * lợi thế OOS đáng chú ý.
   *
   * minimumPositiveDelta:
   * lợi thế tối thiểu để cân nhắc Adaptive.
   *
   * rejectDelta:
   * Adaptive thua Baseline đủ rõ.
   */

  strongDelta: 0.005,

  minimumPositiveDelta: 0.001,

  rejectDelta: -0.001,


  /*
   * Period Win Rate.
   */

  strongWinRate: 2 / 3,

  minimumWinRate: 0.50,


  /*
   * Gate Score thresholds.
   */

  adaptiveScore: 70,

  watchScore: 45,


  /*
   * Nếu model hiện tại chính là BASELINE,
   * không coi Delta ≈ 0 là failure.
   */

  baselineNeutralTolerance: 0.0005

};


/* =========================================================================
   2. NUMBER HELPERS
   ========================================================================= */

function gateNumberV26(
  value,
  fallback = 0
) {

  const n =
    Number(
      value
    );


  return Number.isFinite(n)
    ? n
    : fallback;

}


function gateClampV26(
  value,
  min = 0,
  max = 1
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


function gatePercentV26(
  value
) {

  return (
    gateNumberV26(
      value
    ) *
    100
  ).toFixed(2) + '%';

}


/* =========================================================================
   3. GET PROVINCE NAME
   ========================================================================= */

function gateProvinceNameV26(
  item
) {

  if (!item) {

    return '-';

  }


  if (
    item.provinceName
  ) {

    return item.provinceName;

  }


  if (
    item.name
  ) {

    return item.name;

  }


  if (
    item.province
  ) {

    try {

      const p =
        provinceBySlug(
          item.province
        );


      if (p) {

        return p.name;

      }

    } catch (
      error
    ) {

      /*
       * Ignore lookup error.
       */

    }


    return item.province;

  }


  return '-';

}


/* =========================================================================
   4. EXTRACT OOS SUMMARY

   Cross-Province result có thể lưu:
   - item.summary
   hoặc
   - item.oos.summary
   hoặc
   - item.result.summary

   Helper này giúp Block 7A không phụ thuộc
   quá chặt vào UI Block 6.
   ========================================================================= */

function gateSummaryV26(
  item
) {

  if (!item) {

    return null;

  }


  if (
    item.summary &&
    item.summary.adaptive &&
    item.summary.baseline
  ) {

    return item.summary;

  }


  if (
    item.oos &&
    item.oos.summary
  ) {

    return item.oos.summary;

  }


  if (
    item.result &&
    item.result.summary
  ) {

    return item.result.summary;

  }


  return null;

}


/* =========================================================================
   5. EXTRACT SELECTED MODEL / WINDOW

   Cross-Province summary hiện có thể lưu
   selection ở các vị trí khác nhau.

   Ưu tiên:
   1. item.model / item.window
   2. item.selection
   3. dominant model/window trong periods
   ========================================================================= */

function gateSelectionV26(
  item
) {

  let model =
    item &&
    item.model
      ? item.model
      : null;


  let windowSize =
    item &&
    item.window != null
      ? Number(
          item.window
        )
      : null;


  if (
    !model &&
    item &&
    item.selection
  ) {

    model =
      item.selection.model ||
      null;


    if (
      windowSize == null &&
      item.selection.window != null
    ) {

      windowSize =
        Number(
          item.selection.window
        );

    }

  }


  /*
   * Nếu chưa có, tìm dominant selection
   * trong các OOS periods.
   */

  const periodList =

    item &&
    Array.isArray(
      item.periods
    )

      ? item.periods

      : item &&
        item.oos &&
        Array.isArray(
          item.oos.periods
        )

        ? item.oos.periods

        : item &&
          item.result &&
          Array.isArray(
            item.result.periods
          )

          ? item.result.periods

          : [];


  if (
    (!model ||
     windowSize == null) &&
    periodList.length
  ) {

    const valid =
      periodList.filter(
        period =>
          period &&
          period.valid
      );


    if (valid.length) {

      const modelCounts = {};

      const windowCounts = {};


      valid.forEach(
        period => {

          if (
            period.model
          ) {

            modelCounts[
              period.model
            ] =
              (
                modelCounts[
                  period.model
                ] || 0
              ) + 1;

          }


          if (
            period.window != null
          ) {

            const key =
              String(
                period.window
              );


            windowCounts[key] =
              (
                windowCounts[key] ||
                0
              ) + 1;

          }

        }
      );


      if (!model) {

        const models =
          Object.entries(
            modelCounts
          )
          .sort(
            (a, b) =>
              b[1] -
              a[1]
          );


        if (
          models.length
        ) {

          model =
            models[0][0];

        }

      }


      if (
        windowSize == null
      ) {

        const windows =
          Object.entries(
            windowCounts
          )
          .sort(
            (a, b) =>
              b[1] -
              a[1]
          );


        if (
          windows.length
        ) {

          windowSize =
            Number(
              windows[0][0]
            );

        }

      }

    }

  }


  return {

    model:
      model ||
      'UNKNOWN',

    window:
      windowSize

  };

}


/* =========================================================================
   6. QUALITY DELTA SCORE

   Chuyển Delta thành score 0 → 100.

   Delta >= +0.010:
       gần 100.

   Delta = 0:
       khoảng 50.

   Delta <= -0.010:
       gần 0.

   Đây chỉ là Research Score,
   không phải probability.
   ========================================================================= */

function gateDeltaScoreV26(
  delta
) {

  const normalized =
    (
      gateNumberV26(
        delta
      ) +
      0.010
    ) /
    0.020;


  return (
    gateClampV26(
      normalized
    ) *
    100
  );

}


/* =========================================================================
   7. WIN RATE SCORE
   ========================================================================= */

function gateWinRateScoreV26(
  winRate
) {

  return (
    gateClampV26(
      gateNumberV26(
        winRate
      )
    ) *
    100
  );

}


/* =========================================================================
   8. MRR SCORE

   So sánh Adaptive MRR với Baseline MRR.

   Improvement +0.01 trở lên:
       score cao.

   Không cải thiện:
       khoảng 50.
   ========================================================================= */

function gateMRRScoreV26(
  adaptiveMRR,
  baselineMRR
) {

  const delta =
    gateNumberV26(
      adaptiveMRR
    ) -
    gateNumberV26(
      baselineMRR
    );


  const normalized =
    (
      delta +
      0.01
    ) /
    0.02;


  return (
    gateClampV26(
      normalized
    ) *
    100
  );

}


/* =========================================================================
   9. RANK SCORE

   Average Rank thấp hơn là tốt hơn.

   Baseline Rank - Adaptive Rank > 0
   nghĩa là Adaptive tốt hơn.

   Improvement 5 rank:
       rất tốt.

   Worse 5 rank:
       rất xấu.
   ========================================================================= */

function gateRankScoreV26(
  adaptiveRank,
  baselineRank
) {

  const improvement =
    gateNumberV26(
      baselineRank
    ) -
    gateNumberV26(
      adaptiveRank
    );


  const normalized =
    (
      improvement +
      5
    ) /
    10;


  return (
    gateClampV26(
      normalized
    ) *
    100
  );

}


/* =========================================================================
   10. TEST COVERAGE SCORE
   ========================================================================= */

function gateCoverageScoreV26(
  tests
) {

  const minTests =
    PROVINCE_GATE_V26_CONFIG
      .minTests;


  if (
    tests >= minTests
  ) {

    return 100;

  }


  return (
    gateClampV26(
      tests /
      minTests
    ) *
    100
  );

}


/* =========================================================================
   11. CALCULATE PROVINCE GATE SCORE

   Weight:

   Quality Delta      35%
   Period Win Rate    25%
   MRR Improvement    20%
   Rank Improvement   15%
   Test Coverage       5%
   ========================================================================= */

function calculateProvinceGateScoreV26(
  metrics
) {

  const deltaScore =
    gateDeltaScoreV26(
      metrics.delta
    );


  const winRateScore =
    gateWinRateScoreV26(
      metrics.winRate
    );


  const mrrScore =
    gateMRRScoreV26(
      metrics.adaptiveMRR,
      metrics.baselineMRR
    );


  const rankScore =
    gateRankScoreV26(
      metrics.adaptiveRank,
      metrics.baselineRank
    );


  const coverageScore =
    gateCoverageScoreV26(
      metrics.tests
    );


  const score =

    deltaScore *
      0.35 +

    winRateScore *
      0.25 +

    mrrScore *
      0.20 +

    rankScore *
      0.15 +

    coverageScore *
      0.05;


  return {

    score:
      Number(
        score.toFixed(
          2
        )
      ),

    components: {

      deltaScore:
        Number(
          deltaScore.toFixed(
            2
          )
        ),

      winRateScore:
        Number(
          winRateScore.toFixed(
            2
          )
        ),

      mrrScore:
        Number(
          mrrScore.toFixed(
            2
          )
        ),

      rankScore:
        Number(
          rankScore.toFixed(
            2
          )
        ),

      coverageScore:
        Number(
          coverageScore.toFixed(
            2
          )
        )

    }

  };

}


/* =========================================================================
   12. CLASSIFY PROVINCE GATE
   ========================================================================= */

function classifyProvinceGateV26(
  metrics,
  gateResult
) {

  const config =
    PROVINCE_GATE_V26_CONFIG;


  const model =
    String(
      metrics.model ||
      ''
    ).toUpperCase();


  const delta =
    gateNumberV26(
      metrics.delta
    );


  const winRate =
    gateNumberV26(
      metrics.winRate
    );


  const tests =
    gateNumberV26(
      metrics.tests
    );


  const mrrBetter =
    metrics.adaptiveMRR >=
    metrics.baselineMRR;


  const rankBetter =
    metrics.adaptiveRank <=
    metrics.baselineRank;


  /*
   * -------------------------------------------------------------
   * CASE 1:
   * V2.4/V2.6 tự chọn BASELINE.
   *
   * Nếu Delta gần 0 thì đây không phải failure.
   * Production nên tiếp tục BASELINE.
   * -------------------------------------------------------------
   */

  if (
    model === 'BASELINE' &&
    Math.abs(
      delta
    ) <=
      config
        .baselineNeutralTolerance
  ) {

    return {

      gate:
        'BASELINE',

      emoji:
        '⚪',

      reason:
        'BASELINE_SELECTED_NEUTRAL'

    };

  }


  /*
   * -------------------------------------------------------------
   * CASE 2:
   * Không đủ OOS tests.
   * -------------------------------------------------------------
   */

  if (
    tests <
    config.minTests
  ) {

    return {

      gate:
        'WATCH',

      emoji:
        '🟡',

      reason:
        'INSUFFICIENT_OOS_TESTS'

    };

  }


  /*
   * -------------------------------------------------------------
   * CASE 3:
   * Adaptive thua Baseline rõ.
   * -------------------------------------------------------------
   */

  if (
    delta <=
      config.rejectDelta &&
    winRate < 0.50
  ) {

    return {

      gate:
        'REJECT',

      emoji:
        '🔴',

      reason:
        'NEGATIVE_OOS_EDGE'

    };

  }


  /*
   * -------------------------------------------------------------
   * CASE 4:
   * Strong Adaptive Candidate.

   * Yêu cầu:
   * - Delta dương đủ rõ
   * - >= 2/3 period thắng
   * - MRR không kém
   * - Rank không kém
   * - Gate Score >= threshold
   * -------------------------------------------------------------
   */

  if (
    delta >=
      config
        .minimumPositiveDelta &&

    winRate >=
      config
        .strongWinRate &&

    mrrBetter &&

    rankBetter &&

    gateResult.score >=
      config
        .adaptiveScore
  ) {

    return {

      gate:
        'ADAPTIVE',

      emoji:
        '🟢',

      reason:
        delta >=
          config.strongDelta
          ? 'STRONG_OOS_EDGE'
          : 'CONSISTENT_OOS_EDGE'

    };

  }


  /*
   * -------------------------------------------------------------
   * CASE 5:
   * Có tín hiệu tích cực nhưng chưa đủ mạnh.
   * -------------------------------------------------------------
   */

  if (
    gateResult.score >=
      config.watchScore ||
    delta > 0 ||
    mrrBetter ||
    rankBetter
  ) {

    return {

      gate:
        'WATCH',

      emoji:
        '🟡',

      reason:
        'OOS_SIGNAL_NOT_YET_ROBUST'

    };

  }


  /*
   * -------------------------------------------------------------
   * CASE 6:
   * Không có lợi thế Adaptive.
   * -------------------------------------------------------------
   */

  return {

    gate:
      'BASELINE',

    emoji:
      '⚪',

    reason:
      'NO_CONFIRMED_ADAPTIVE_EDGE'

  };

}


/* =========================================================================
   13. ANALYZE ONE PROVINCE
   ========================================================================= */

function analyzeProvinceGateV26(
  item
) {

  const summary =
    gateSummaryV26(
      item
    );


  if (!summary) {

    return {

      ready:
        false,

      province:
        gateProvinceNameV26(
          item
        ),

      reason:
        'NO_OOS_SUMMARY'

    };

  }


  const selection =
    gateSelectionV26(
      item
    );


  const adaptive =
    summary.adaptive ||
    {};


  const baseline =
    summary.baseline ||
    {};


  const delta =
    gateNumberV26(
      summary.improvement
    );


  const winRate =
    gateNumberV26(
      summary.winRate
    );


  const metrics = {

    province:
      gateProvinceNameV26(
        item
      ),

    provinceSlug:
      item.province ||
      item.slug ||
      null,

    model:
      selection.model,

    window:
      selection.window,

    tests:
      gateNumberV26(
        summary.tests
      ),

    periods:
      gateNumberV26(
        summary.periods
      ),

    winningPeriods:
      gateNumberV26(
        summary.winningPeriods
      ),

    tiedPeriods:
      gateNumberV26(
        summary.tiedPeriods
      ),

    losingPeriods:
      gateNumberV26(
        summary.losingPeriods
      ),

    winRate,

    adaptiveQuality:
      gateNumberV26(
        adaptive.quality
      ),

    baselineQuality:
      gateNumberV26(
        baseline.quality
      ),

    delta,

    adaptiveMRR:
      gateNumberV26(
        adaptive.mrr
      ),

    baselineMRR:
      gateNumberV26(
        baseline.mrr
      ),

    mrrDelta:
      gateNumberV26(
        adaptive.mrr
      ) -
      gateNumberV26(
        baseline.mrr
      ),

    adaptiveRank:
      gateNumberV26(
        adaptive.averageRank,
        100
      ),

    baselineRank:
      gateNumberV26(
        baseline.averageRank,
        100
      ),

    rankImprovement:
      gateNumberV26(
        baseline.averageRank,
        100
      ) -
      gateNumberV26(
        adaptive.averageRank,
        100
      )

  };


  const gateResult =
    calculateProvinceGateScoreV26(
      metrics
    );


  const classification =
    classifyProvinceGateV26(
      metrics,
      gateResult
    );


  return {

    ready:
      true,

    ...metrics,

    gateScore:
      gateResult.score,

    scoreComponents:
      gateResult.components,

    gate:
      classification.gate,

    emoji:
      classification.emoji,

    reason:
      classification.reason,

    original:
      item

  };

}


/* =========================================================================
   14. FIND CROSS-PROVINCE RESULT

   Block 6B / test patch có thể lưu kết quả
   trong nhiều biến global.

   Ưu tiên kết quả 21 tỉnh.
   ========================================================================= */

function getLastCrossProvinceResultV26() {

  /*
   * Các tên phổ biến của Block 6.
   */

  const candidates = [

    window.LAST_CROSS_OOS_V26,

    window.LAST_CROSS_PROVINCE_OOS_V26,

    window.LAST_CROSS_OOS_RESULT_V26,

    typeof CROSS_OOS_BATCH_V26 !==
      'undefined' &&
    CROSS_OOS_BATCH_V26
      ? {
          ready:
            Array.isArray(
              CROSS_OOS_BATCH_V26
                .results
            ) &&
            CROSS_OOS_BATCH_V26
              .results.length > 0,

          results:
            CROSS_OOS_BATCH_V26
              .results
        }
      : null,

    window.LAST_CROSS_OOS_TEST_V26

  ];


  /*
   * Ưu tiên candidate có nhiều tỉnh nhất.
   */

  const valid =
    candidates
      .filter(
        candidate =>
          candidate &&
          Array.isArray(
            candidate.results
          ) &&
          candidate.results.length
      )
      .sort(
        (a, b) =>
          b.results.length -
          a.results.length
      );


  return valid.length
    ? valid[0]
    : null;

}


/* =========================================================================
   15. RUN PROVINCE ADAPTIVE GATE
   ========================================================================= */

function runProvinceAdaptiveGateV26(
  crossResult = null
) {

  const source =
    crossResult ||
    getLastCrossProvinceResultV26();


  if (
    !source ||
    !Array.isArray(
      source.results
    ) ||
    !source.results.length
  ) {

    return {

      ready:
        false,

      reason:
        'NO_CROSS_PROVINCE_OOS_RESULT'

    };

  }


  const results =
    source.results.map(
      item =>
        analyzeProvinceGateV26(
          item
        )
    );


  const valid =
    results.filter(
      item =>
        item.ready
    );


  if (!valid.length) {

    return {

      ready:
        false,

      reason:
        'NO_VALID_PROVINCE_GATE_RESULT',

      results

    };

  }


  /*
   * Sắp xếp:
   *
   * ADAPTIVE
   * WATCH
   * BASELINE
   * REJECT
   *
   * Trong cùng nhóm:
   * Gate Score cao hơn đứng trước.
   */

  const gateOrder = {

    ADAPTIVE: 0,

    WATCH: 1,

    BASELINE: 2,

    REJECT: 3

  };


  valid.sort(
    (a, b) => {

      const orderA =
        gateOrder[
          a.gate
        ] ?? 99;


      const orderB =
        gateOrder[
          b.gate
        ] ?? 99;


      if (
        orderA !==
        orderB
      ) {

        return (
          orderA -
          orderB
        );

      }


      return (
        b.gateScore -
        a.gateScore
      );

    }
  );


  const adaptive =
    valid.filter(
      item =>
        item.gate ===
        'ADAPTIVE'
    );


  const watch =
    valid.filter(
      item =>
        item.gate ===
        'WATCH'
    );


  const baseline =
    valid.filter(
      item =>
        item.gate ===
        'BASELINE'
    );


  const reject =
    valid.filter(
      item =>
        item.gate ===
        'REJECT'
    );


  const averageScore =
    valid.reduce(
      (sum, item) =>
        sum +
        item.gateScore,
      0
    ) /
    valid.length;


  const result = {

    ready:
      true,

    version:
      'V2.6',

    engine:
      'PROVINCE_ADAPTIVE_GATE',

    generatedAt:
      new Date()
        .toISOString(),

    provinceCount:
      valid.length,

    summary: {

      adaptive:
        adaptive.length,

      watch:
        watch.length,

      baseline:
        baseline.length,

      reject:
        reject.length,

      adaptiveRate:
        adaptive.length /
        valid.length,

      averageGateScore:
        Number(
          averageScore.toFixed(
            2
          )
        )

    },

    adaptive,

    watch,

    baseline,

    reject,

    results:
      valid

  };


  window.LAST_PROVINCE_GATE_V26 =
    result;


  return result;

}


/* =========================================================================
   16. PRINT GATE RESULTS
   ========================================================================= */

function printProvinceAdaptiveGateV26(
  crossResult = null
) {

  const result =
    runProvinceAdaptiveGateV26(
      crossResult
    );


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — PROVINCE ADAPTIVE GATE'
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      result.reason
    );


    return result;

  }


  console.log(
    'SUMMARY:',
    result.summary
  );


  console.table(

    result.results.map(
      item => ({

        Province:
          item.province,

        Model:
          item.model,

        Window:
          item.window != null
            ? item.window
            : '-',

        Tests:
          item.tests,

        Delta:
          (
            item.delta >= 0
              ? '+'
              : ''
          ) +
          item.delta
            .toFixed(4),

        WinRate:
          gatePercentV26(
            item.winRate
          ),

        MRRDelta:
          (
            item.mrrDelta >= 0
              ? '+'
              : ''
          ) +
          item.mrrDelta
            .toFixed(4),

        RankGain:
          (
            item.rankImprovement >= 0
              ? '+'
              : ''
          ) +
          item.rankImprovement
            .toFixed(2),

        GateScore:
          item.gateScore
            .toFixed(2),

        Gate:
          item.gate,

        Reason:
          item.reason

      }))

  );


  return result;

}


/* =========================================================================
   17. GET GATE FOR ONE PROVINCE

   Hàm này chuẩn bị cho Block sau.

   Hiện tại chỉ READ.
   KHÔNG được dùng để đổi Production.
   ========================================================================= */

function getProvinceGateDecisionV26(
  provinceSlug
) {

  const result =
    window
      .LAST_PROVINCE_GATE_V26;


  if (
    !result ||
    !result.ready ||
    !Array.isArray(
      result.results
    )
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      gate:
        'BASELINE',

      reason:
        'GATE_NOT_RUN'

    };

  }


  const item =
    result.results.find(
      row =>
        row.provinceSlug ===
          provinceSlug ||
        row.province ===
          provinceSlug
    );


  if (!item) {

    /*
     * Thử lookup bằng tên tỉnh.
     */

    let provinceName =
      provinceSlug;


    try {

      const p =
        provinceBySlug(
          provinceSlug
        );


      if (p) {

        provinceName =
          p.name;

      }

    } catch (
      error
    ) {

      /*
       * Ignore.
       */

    }


    const byName =
      result.results.find(
        row =>
          row.province ===
          provinceName
      );


    if (byName) {

      return {

        ready:
          true,

        province:
          provinceSlug,

        gate:
          byName.gate,

        model:
          byName.model,

        window:
          byName.window,

        gateScore:
          byName.gateScore,

        delta:
          byName.delta,

        winRate:
          byName.winRate,

        reason:
          byName.reason,

        researchOnly:
          true

      };

    }


    return {

      ready:
        false,

      province:
        provinceSlug,

      gate:
        'BASELINE',

      reason:
        'PROVINCE_NOT_FOUND'

    };

  }


  return {

    ready:
      true,

    province:
      provinceSlug,

    gate:
      item.gate,

    model:
      item.model,

    window:
      item.window,

    gateScore:
      item.gateScore,

    delta:
      item.delta,

    winRate:
      item.winRate,

    reason:
      item.reason,

    researchOnly:
      true

  };

}


/* =========================================================================
   18. SAFETY CHECK

   Block 7A tuyệt đối không thay:
   - Production weights
   - predict functions
   - nút Dự Báo Ngay

   Hàm này chỉ mô tả trạng thái Research Gate.
   ========================================================================= */

function provinceGateSafetyCheckV26() {

  return {

    version:
      'V2.6',

    block:
      '7A',

    productionModified:
      false,

    predictionButtonModified:
      false,

    adaptiveAutoEnabled:
      false,

    researchOnly:
      true,

    status:
      'SAFE_RESEARCH_GATE_ONLY'

  };

}


/* =========================================================================
   19. QUICK TEST

   Sau khi Cross-Province 21 tỉnh đã chạy:

   printProvinceAdaptiveGateV26();


   Kiểm tra riêng TP.HCM:

   getProvinceGateDecisionV26(
     'tp-hcm'
   );


   Kiểm tra Kiên Giang:

   getProvinceGateDecisionV26(
     'kien-giang'
   );


   Safety:

   provinceGateSafetyCheckV26();


   LƯU Ý:

   Block 7A KHÔNG thay Production Engine.

   Chưa sử dụng Gate để tạo dự báo thật.

   Block tiếp theo:
   7B — Mobile Province Gate Panel.
   ========================================================================= */


console.log(
  'XSMN V2.6 Block 7A loaded — Province Adaptive Gate Research Engine ready'
);


/* =========================================================================
   XSMN V2.6 — BLOCK 7A FIX 1
   NORMALIZE CROSS-PROVINCE RESULT

   Fix:
   - Block 7A cũ giả định mỗi province item có item.summary.
   - Block 6 có thể lưu chính OOS result trực tiếp hoặc qua
     nhiều wrapper khác nhau.
   - Patch chỉ mở rộng khả năng READ dữ liệu.
   - KHÔNG thay OOS Engine.
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   20. ROBUST OOS SUMMARY EXTRACTOR
   ========================================================================= */

function gateSummaryV26(
  item
) {

  if (!item) {
    return null;
  }


  /*
   * CASE 1
   * Province item chính là OOS result:
   *
   * {
   *   ready: true,
   *   classification: ...,
   *   summary: {...},
   *   periods: [...]
   * }
   */

  if (
    item.summary &&
    item.summary.adaptive &&
    item.summary.baseline
  ) {

    return item.summary;

  }


  /*
   * CASE 2
   * Wrapped trong .oos
   */

  if (
    item.oos &&
    item.oos.summary &&
    item.oos.summary.adaptive &&
    item.oos.summary.baseline
  ) {

    return item.oos.summary;

  }


  /*
   * CASE 3
   * Wrapped trong .result
   */

  if (
    item.result &&
    item.result.summary &&
    item.result.summary.adaptive &&
    item.result.summary.baseline
  ) {

    return item.result.summary;

  }


  /*
   * CASE 4
   * Wrapped trong .oosResult
   */

  if (
    item.oosResult &&
    item.oosResult.summary &&
    item.oosResult.summary.adaptive &&
    item.oosResult.summary.baseline
  ) {

    return item.oosResult.summary;

  }


  /*
   * CASE 5
   * Wrapped trong .evaluation
   */

  if (
    item.evaluation &&
    item.evaluation.summary &&
    item.evaluation.summary.adaptive &&
    item.evaluation.summary.baseline
  ) {

    return item.evaluation.summary;

  }


  /*
   * CASE 6
   * Cross Province item đã flatten summary.
   *
   * Nếu Block 6 lưu:
   *
   * adaptiveQuality
   * baselineQuality
   * adaptiveMRR
   * baselineMRR
   * adaptiveRank
   * baselineRank
   * improvement / delta
   * tests
   * winRate
   */

  const adaptiveQuality =
    item.adaptiveQuality ??
    item.adaptiveQ;


  const baselineQuality =
    item.baselineQuality ??
    item.baselineQ;


  const adaptiveMRR =
    item.adaptiveMRR;


  const baselineMRR =
    item.baselineMRR;


  const adaptiveRank =
    item.adaptiveRank;


  const baselineRank =
    item.baselineRank;


  if (
    adaptiveQuality != null &&
    baselineQuality != null &&
    adaptiveMRR != null &&
    baselineMRR != null &&
    adaptiveRank != null &&
    baselineRank != null
  ) {

    const improvement =
      item.improvement ??
      item.delta ??
      (
        Number(adaptiveQuality) -
        Number(baselineQuality)
      );


    const periods =
      Number(
        item.periodCount ??
        item.periods ??
        3
      );


    const winningPeriods =
      Number(
        item.winningPeriods ??
        item.wins ??
        0
      );


    const tiedPeriods =
      Number(
        item.tiedPeriods ??
        item.ties ??
        0
      );


    const losingPeriods =
      Number(
        item.losingPeriods ??
        item.losses ??
        Math.max(
          0,
          periods -
          winningPeriods -
          tiedPeriods
        )
      );


    const winRate =
      item.winRate != null
        ? Number(item.winRate)
        : periods
          ? winningPeriods / periods
          : 0;


    return {

      periods,

      tests:
        Number(
          item.tests ??
          item.oosTests ??
          0
        ),

      adaptive: {

        quality:
          Number(
            adaptiveQuality
          ),

        mrr:
          Number(
            adaptiveMRR
          ),

        averageRank:
          Number(
            adaptiveRank
          )

      },

      baseline: {

        quality:
          Number(
            baselineQuality
          ),

        mrr:
          Number(
            baselineMRR
          ),

        averageRank:
          Number(
            baselineRank
          )

      },

      improvement:
        Number(
          improvement
        ),

      winningPeriods,

      tiedPeriods,

      losingPeriods,

      winRate

    };

  }


  return null;

}


/* =========================================================================
   21. ROBUST PROVINCE NAME
   ========================================================================= */

function gateProvinceNameV26(
  item
) {

  if (!item) {
    return '-';
  }


  const directName =
    item.provinceName ||
    item.name ||
    item.label;


  if (directName) {
    return directName;
  }


  const slug =
    item.province ||
    item.provinceSlug ||
    item.slug;


  if (slug) {

    try {

      const p =
        provinceBySlug(
          slug
        );


      if (p) {
        return p.name;
      }

    } catch (error) {
      /* ignore */
    }


    return slug;

  }


  /*
   * Một số Cross Province wrappers
   * giữ province bên trong result.
   */

  if (
    item.result
  ) {

    return gateProvinceNameV26(
      item.result
    );

  }


  if (
    item.oos
  ) {

    return gateProvinceNameV26(
      item.oos
    );

  }


  if (
    item.oosResult
  ) {

    return gateProvinceNameV26(
      item.oosResult
    );

  }


  return '-';

}


/* =========================================================================
   22. DEBUG CROSS RESULT SHAPE

   Nếu Gate vẫn lỗi, hàm này sẽ cho biết chính xác
   Block 6 đang lưu object như thế nào.
   ========================================================================= */

function inspectCrossProvinceShapeV26() {

  const source =
    getLastCrossProvinceResultV26();


  if (
    !source ||
    !Array.isArray(
      source.results
    )
  ) {

    return {
      ready: false,
      reason: 'NO_CROSS_RESULT'
    };

  }


  const sample =
    source.results[0];


  const report = {

    ready: true,

    provinceCount:
      source.results.length,

    sourceKeys:
      Object.keys(
        source
      ),

    firstItemKeys:
      sample
        ? Object.keys(
            sample
          )
        : [],

    hasSummary:
      !!(
        sample &&
        sample.summary
      ),

    hasOOS:
      !!(
        sample &&
        sample.oos
      ),

    hasResult:
      !!(
        sample &&
        sample.result
      ),

    hasOOSResult:
      !!(
        sample &&
        sample.oosResult
      ),

    summaryDetected:
      !!gateSummaryV26(
        sample
      )

  };


  console.log(
    'V2.6 CROSS SHAPE:',
    report
  );


  console.log(
    'V2.6 FIRST PROVINCE:',
    sample
  );


  return report;

}


console.log(
  'XSMN V2.6 Block 7A FIX 1 loaded — Cross Province normalization ready'
);


/* =========================================================================
   XSMN V2.6 — BLOCK 7B
   MOBILE PROVINCE ADAPTIVE GATE PANEL

   Mục tiêu:
   - Hiển thị kết quả Block 7A trên điện thoại.
   - Không cần Chrome Console.
   - Hiển thị:
       + ADAPTIVE
       + WATCH
       + BASELINE
       + REJECT
       + Gate Score
       + Delta
       + Win Rate
       + Model
       + Window
   - Research Only.
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   20. CREATE MOBILE PANEL
   ========================================================================= */

function ensureProvinceGatePanelV26() {

  if (
    document.getElementById(
      'provinceGatePanelV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    console.warn(
      'V2.6 7B: Không tìm thấy tab-settings'
    );

    return;

  }


  const card =
    document.createElement(
      'div'
    );


  card.id =
    'provinceGatePanelV26';


  card.className =
    'card';


  card.style.marginTop =
    '18px';


  card.innerHTML = `

    <div
      style="
        font-size:22px;
        font-weight:900;
        margin-bottom:8px;
      "
    >
      🚦 Province Adaptive Gate
    </div>


    <div
      class="sub"
      style="
        line-height:1.6;
        margin-bottom:14px;
      "
    >
      V2.6 Block 7B phân loại từng tỉnh
      dựa trên kết quả Out-of-Sample.
      Research only — chưa thay Production.
    </div>


    <button
      id="btnRunProvinceGateV26"
      style="
        width:100%;
        padding:16px 12px;
        border:0;
        border-radius:14px;
        font-size:17px;
        font-weight:900;
        cursor:pointer;
      "
    >
      🚦 Phân tích Province Gate
    </button>


    <div
      id="provinceGateStatusV26"
      class="sub"
      style="
        margin-top:14px;
        line-height:1.6;
      "
    >
      Chưa chạy Province Gate.
    </div>


    <div
      id="provinceGateSummaryV26"
      style="
        display:none;
        margin-top:16px;
      "
    >
    </div>


    <div
      id="provinceGateResultsV26"
      style="
        margin-top:16px;
      "
    >
    </div>


    <div
      class="sub"
      style="
        margin-top:16px;
        line-height:1.55;
      "
    >
      📌 Gate Score là Research Score,
      không phải xác suất trúng.
    </div>

  `;


  settings.appendChild(
    card
  );


  const button =
    document.getElementById(
      'btnRunProvinceGateV26'
    );


  if (button) {

    button.addEventListener(
      'click',
      runProvinceGateMobileV26
    );

  }


  console.log(
    'XSMN V2.6 Block 7B Mobile Panel ready'
  );

}


/* =========================================================================
   21. FORMAT HELPERS
   ========================================================================= */

function provinceGateSignedV26(
  value,
  digits = 4
) {

  const n =
    Number(
      value || 0
    );


  return (
    n > 0
      ? '+'
      : ''
  ) +
  n.toFixed(
    digits
  );

}


function provinceGateColorV26(
  gate
) {

  switch (
    String(
      gate || ''
    ).toUpperCase()
  ) {

    case 'ADAPTIVE':

      return '#35d07f';


    case 'WATCH':

      return '#ffc447';


    case 'REJECT':

      return '#ff6666';


    case 'BASELINE':

      return '#b8bec8';


    default:

      return '#ffffff';

  }

}


/* =========================================================================
   22. RUN MOBILE GATE
   ========================================================================= */

function runProvinceGateMobileV26() {

  const status =
    document.getElementById(
      'provinceGateStatusV26'
    );


  const summaryBox =
    document.getElementById(
      'provinceGateSummaryV26'
    );


  const resultsBox =
    document.getElementById(
      'provinceGateResultsV26'
    );


  if (
    !status ||
    !summaryBox ||
    !resultsBox
  ) {

    return;

  }


  if (
    typeof runProvinceAdaptiveGateV26 !==
    'function'
  ) {

    status.innerHTML =
      `
        ❌ Không tìm thấy
        <b>Block 7A Engine</b>.
      `;

    return;

  }


  status.innerHTML =
    `
      ⏳ Đang phân tích
      Province Adaptive Gate...
    `;


  summaryBox.style.display =
    'none';


  resultsBox.innerHTML =
    '';


  setTimeout(
    () => {

      try {

        const result =
          runProvinceAdaptiveGateV26();


        if (
          !result ||
          !result.ready
        ) {

          const reason =
            result &&
            result.reason
              ? result.reason
              : 'UNKNOWN';


          status.innerHTML =
            `
              ⚠️ Chưa có dữ liệu
              Cross-Province OOS.

              <br><br>

              Reason:
              <b>${reason}</b>

              <br><br>

              Hãy chạy
              <b>Cross-Province OOS 21 tỉnh</b>
              trước, sau đó bấm lại
              Province Gate.
            `;


          return;

        }


        renderProvinceGateMobileV26(
          result
        );


      } catch (
        error
      ) {

        console.error(
          'V2.6 Province Gate UI:',
          error
        );


        status.innerHTML =
          `
            ❌ Province Gate Error:

            <br><br>

            <b>
              ${String(
                error.message ||
                error
              )}
            </b>
          `;

      }

    },
    50
  );

}


/* =========================================================================
   23. RENDER SUMMARY
   ========================================================================= */

function renderProvinceGateSummaryV26(
  result
) {

  const summaryBox =
    document.getElementById(
      'provinceGateSummaryV26'
    );


  if (!summaryBox) {

    return;

  }


  const s =
    result.summary;


  summaryBox.style.display =
    'block';


  summaryBox.innerHTML = `

    <div
      style="
        padding:16px;
        border-radius:14px;
        background:rgba(
          255,
          255,
          255,
          .055
        );
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:13px;
        "
      >
        📊 GATE SUMMARY
      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap:9px;
        "
      >

        <div
          style="
            padding:12px 8px;
            border-radius:11px;
            background:rgba(
              53,
              208,
              127,
              .10
            );
            text-align:center;
          "
        >

          <div
            style="
              font-size:24px;
              font-weight:900;
              color:#35d07f;
            "
          >
            ${s.adaptive}
          </div>

          <div
            class="sub"
          >
            🟢 ADAPTIVE
          </div>

        </div>


        <div
          style="
            padding:12px 8px;
            border-radius:11px;
            background:rgba(
              255,
              196,
              71,
              .10
            );
            text-align:center;
          "
        >

          <div
            style="
              font-size:24px;
              font-weight:900;
              color:#ffc447;
            "
          >
            ${s.watch}
          </div>

          <div
            class="sub"
          >
            🟡 WATCH
          </div>

        </div>


        <div
          style="
            padding:12px 8px;
            border-radius:11px;
            background:rgba(
              184,
              190,
              200,
              .08
            );
            text-align:center;
          "
        >

          <div
            style="
              font-size:24px;
              font-weight:900;
              color:#b8bec8;
            "
          >
            ${s.baseline}
          </div>

          <div
            class="sub"
          >
            ⚪ BASELINE
          </div>

        </div>


        <div
          style="
            padding:12px 8px;
            border-radius:11px;
            background:rgba(
              255,
              102,
              102,
              .10
            );
            text-align:center;
          "
        >

          <div
            style="
              font-size:24px;
              font-weight:900;
              color:#ff6666;
            "
          >
            ${s.reject}
          </div>

          <div
            class="sub"
          >
            🔴 REJECT
          </div>

        </div>

      </div>


      <div
        class="sub"
        style="
          margin-top:13px;
          line-height:1.6;
        "
      >

        Provinces:
        <b>${result.provinceCount}</b>

        <br>

        Adaptive Rate:
        <b>
          ${
            (
              s.adaptiveRate *
              100
            ).toFixed(2)
          }%
        </b>

        <br>

        Average Gate Score:
        <b>
          ${s.averageGateScore}
        </b>

      </div>

    </div>

  `;

}


/* =========================================================================
   24. RENDER PROVINCE RESULTS
   ========================================================================= */

function renderProvinceGateResultsV26(
  result
) {

  const resultsBox =
    document.getElementById(
      'provinceGateResultsV26'
    );


  if (!resultsBox) {

    return;

  }


  resultsBox.innerHTML =
    result.results
      .map(
        item => {

          const color =
            provinceGateColorV26(
              item.gate
            );


          const windowText =
            item.window != null
              ? item.window +
                ' kỳ'
              : '-';


          return `

            <div
              style="
                margin-bottom:12px;
                padding:15px;
                border-radius:14px;
                background:rgba(
                  255,
                  255,
                  255,
                  .05
                );
                border-left:
                  4px solid
                  ${color};
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  gap:10px;
                  align-items:flex-start;
                "
              >

                <div>

                  <div
                    style="
                      font-size:18px;
                      font-weight:900;
                    "
                  >
                    ${item.emoji}
                    ${item.province}
                  </div>


                  <div
                    style="
                      margin-top:4px;
                      color:${color};
                      font-weight:900;
                    "
                  >
                    ${item.gate}
                  </div>

                </div>


                <div
                  style="
                    text-align:right;
                  "
                >

                  <div
                    class="sub"
                  >
                    GATE SCORE
                  </div>

                  <div
                    style="
                      font-size:20px;
                      font-weight:900;
                      color:${color};
                    "
                  >
                    ${
                      item.gateScore
                        .toFixed(2)
                    }
                  </div>

                </div>

              </div>


              <div
                style="
                  margin-top:13px;
                  display:grid;
                  grid-template-columns:
                    repeat(2, 1fr);
                  gap:8px;
                "
              >

                <div
                  style="
                    padding:9px;
                    border-radius:10px;
                    background:rgba(
                      255,
                      255,
                      255,
                      .04
                    );
                  "
                >

                  <div
                    class="sub"
                  >
                    MODEL
                  </div>

                  <b>
                    ${item.model}
                  </b>

                </div>


                <div
                  style="
                    padding:9px;
                    border-radius:10px;
                    background:rgba(
                      255,
                      255,
                      255,
                      .04
                    );
                  "
                >

                  <div
                    class="sub"
                  >
                    WINDOW
                  </div>

                  <b>
                    ${windowText}
                  </b>

                </div>


                <div
                  style="
                    padding:9px;
                    border-radius:10px;
                    background:rgba(
                      255,
                      255,
                      255,
                      .04
                    );
                  "
                >

                  <div
                    class="sub"
                  >
                    OOS DELTA
                  </div>

                  <b>
                    ${
                      provinceGateSignedV26(
                        item.delta,
                        4
                      )
                    }
                  </b>

                </div>


                <div
                  style="
                    padding:9px;
                    border-radius:10px;
                    background:rgba(
                      255,
                      255,
                      255,
                      .04
                    );
                  "
                >

                  <div
                    class="sub"
                  >
                    WIN RATE
                  </div>

                  <b>
                    ${
                      (
                        item.winRate *
                        100
                      ).toFixed(0)
                    }%
                  </b>

                </div>

              </div>


              <div
                class="sub"
                style="
                  margin-top:11px;
                  line-height:1.55;
                "
              >

                MRR Δ:
                <b>
                  ${
                    provinceGateSignedV26(
                      item.mrrDelta,
                      4
                    )
                  }
                </b>

                · Rank Gain:
                <b>
                  ${
                    provinceGateSignedV26(
                      item.rankImprovement,
                      2
                    )
                  }
                </b>

                <br>

                Tests:
                <b>${item.tests}</b>

                · Reason:
                <b>${item.reason}</b>

              </div>

            </div>

          `;

        }
      )
      .join('');

}


/* =========================================================================
   25. MASTER RENDER
   ========================================================================= */

function renderProvinceGateMobileV26(
  result
) {

  const status =
    document.getElementById(
      'provinceGateStatusV26'
    );


  if (status) {

    status.innerHTML =
      `
        ✅ Province Adaptive Gate
        hoàn tất.

        <br>

        Đã phân tích
        <b>${result.provinceCount}</b>
        tỉnh.
      `;

  }


  renderProvinceGateSummaryV26(
    result
  );


  renderProvinceGateResultsV26(
    result
  );

}


/* =========================================================================
   26. INIT BLOCK 7B
   ========================================================================= */

function initProvinceGateMobileV26() {

  ensureProvinceGatePanelV26();

}


if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    initProvinceGateMobileV26
  );

} else {

  initProvinceGateMobileV26();

}


console.log(
  'XSMN V2.6 Block 7B loaded — Mobile Province Adaptive Gate Panel ready'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 7A FIX 2
   MODEL / WINDOW RECOVERY

   Mục tiêu:
   - Khôi phục Model + Window từ dữ liệu Cross-Province.
   - Hỗ trợ nhiều cấu trúc object của Block 6.
   - Nếu item cấp tỉnh không giữ metadata selection,
     lấy dominant Model / Window từ OOS periods.
   - KHÔNG thay Gate Score.
   - KHÔNG thay Gate Classification.
   - KHÔNG thay Production Engine.
   ========================================================================= */


/* =========================================================================
   1. FIND PERIOD LIST
   ========================================================================= */

function gatePeriodListFixV26(
  item
) {

  if (!item) {

    return [];

  }


  /*
   * Cấu trúc trực tiếp.
   */

  if (
    Array.isArray(
      item.periods
    )
  ) {

    return item.periods;

  }


  /*
   * Cấu trúc:
   * item.oos.periods
   */

  if (
    item.oos &&
    Array.isArray(
      item.oos.periods
    )
  ) {

    return item.oos.periods;

  }


  /*
   * Cấu trúc:
   * item.result.periods
   */

  if (
    item.result &&
    Array.isArray(
      item.result.periods
    )
  ) {

    return item.result.periods;

  }


  /*
   * Cấu trúc:
   * item.oos.result.periods
   */

  if (
    item.oos &&
    item.oos.result &&
    Array.isArray(
      item.oos.result.periods
    )
  ) {

    return item.oos.result.periods;

  }


  /*
   * Cấu trúc:
   * item.evaluation.periods
   */

  if (
    item.evaluation &&
    Array.isArray(
      item.evaluation.periods
    )
  ) {

    return item.evaluation.periods;

  }


  return [];

}


/* =========================================================================
   2. READ MODEL FROM ONE PERIOD
   ========================================================================= */

function gatePeriodModelFixV26(
  period
) {

  if (!period) {

    return null;

  }


  return (

    period.model ||

    (
      period.selection &&
      period.selection.model
    ) ||

    (
      period.adaptive &&
      period.adaptive.model
    ) ||

    (
      period.result &&
      period.result.model
    ) ||

    null

  );

}


/* =========================================================================
   3. READ WINDOW FROM ONE PERIOD
   ========================================================================= */

function gatePeriodWindowFixV26(
  period
) {

  if (!period) {

    return null;

  }


  let value = null;


  if (
    period.window != null
  ) {

    value =
      period.window;

  } else if (
    period.windowSize != null
  ) {

    value =
      period.windowSize;

  } else if (
    period.selection &&
    period.selection.window != null
  ) {

    value =
      period.selection.window;

  } else if (
    period.adaptive &&
    period.adaptive.window != null
  ) {

    value =
      period.adaptive.window;

  } else if (
    period.result &&
    period.result.window != null
  ) {

    value =
      period.result.window;

  }


  if (
    value == null
  ) {

    return null;

  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;

}


/* =========================================================================
   4. DOMINANT VALUE
   ========================================================================= */

function gateDominantValueFixV26(
  values
) {

  const filtered =
    values.filter(
      value =>
        value != null &&
        value !== '' &&
        value !== 'UNKNOWN'
    );


  if (
    !filtered.length
  ) {

    return null;

  }


  const counts =
    new Map();


  filtered.forEach(
    value => {

      const key =
        String(
          value
        );


      const current =
        counts.get(
          key
        ) || {

          value,

          count: 0

        };


      current.count++;


      counts.set(
        key,
        current
      );

    }
  );


  const ranked =
    Array.from(
      counts.values()
    )
    .sort(
      (a, b) =>
        b.count -
        a.count
    );


  return ranked.length
    ? ranked[0].value
    : null;

}


/* =========================================================================
   5. RECOVER SELECTION FROM PERIODS
   ========================================================================= */

function recoverSelectionFromPeriodsFixV26(
  item
) {

  const periods =
    gatePeriodListFixV26(
      item
    );


  if (
    !periods.length
  ) {

    return {

      model: null,

      window: null,

      periodCount: 0

    };

  }


  /*
   * Chỉ ưu tiên valid periods.
   * Nếu không có field valid thì vẫn cho dùng.
   */

  let usable =
    periods.filter(
      period =>
        period &&
        period.valid === true
    );


  if (
    !usable.length
  ) {

    usable =
      periods.filter(
        Boolean
      );

  }


  const models =
    usable.map(
      gatePeriodModelFixV26
    );


  const windows =
    usable.map(
      gatePeriodWindowFixV26
    );


  return {

    model:
      gateDominantValueFixV26(
        models
      ),

    window:
      gateDominantValueFixV26(
        windows
      ),

    periodCount:
      usable.length

  };

}


/* =========================================================================
   6. DEEP SEARCH FALLBACK

   Chỉ tìm các key có ý nghĩa Model / Window.
   Không thay đổi object gốc.
   ========================================================================= */

function gateDeepFindFixV26(
  object,
  keys,
  depth = 0
) {

  if (
    !object ||
    typeof object !==
      'object' ||
    depth > 5
  ) {

    return null;

  }


  for (
    const key of keys
  ) {

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          object,
          key
        ) &&
      object[key] != null &&
      object[key] !== ''
    ) {

      return object[key];

    }

  }


  const values =
    Object.values(
      object
    );


  for (
    const value of values
  ) {

    if (
      value &&
      typeof value ===
        'object'
    ) {

      const found =
        gateDeepFindFixV26(
          value,
          keys,
          depth + 1
        );


      if (
        found != null
      ) {

        return found;

      }

    }

  }


  return null;

}


/* =========================================================================
   7. NEW GATE SELECTION READER

   Override gateSelectionV26() của Block 7A.

   Thứ tự ưu tiên:

   1. item.model / item.window
   2. item.selection
   3. OOS periods
   4. deep fallback

   ========================================================================= */

gateSelectionV26 =
function(
  item
) {

  if (!item) {

    return {

      model:
        'UNKNOWN',

      window:
        null

    };

  }


  let model = null;

  let windowSize = null;


  /*
   * -------------------------------------------------------------
   * LEVEL 1 — DIRECT
   * -------------------------------------------------------------
   */

  if (
    item.model &&
    item.model !==
      'UNKNOWN'
  ) {

    model =
      item.model;

  }


  if (
    item.window != null
  ) {

    const n =
      Number(
        item.window
      );


    if (
      Number.isFinite(
        n
      )
    ) {

      windowSize =
        n;

    }

  }


  /*
   * -------------------------------------------------------------
   * LEVEL 2 — SELECTION OBJECT
   * -------------------------------------------------------------
   */

  if (
    item.selection
  ) {

    if (
      !model &&
      item.selection.model
    ) {

      model =
        item.selection.model;

    }


    if (
      windowSize == null &&
      item.selection.window != null
    ) {

      const n =
        Number(
          item.selection.window
        );


      if (
        Number.isFinite(
          n
        )
      ) {

        windowSize =
          n;

      }

    }

  }


  /*
   * -------------------------------------------------------------
   * LEVEL 3 — RECOVER FROM OOS PERIODS
   * -------------------------------------------------------------
   */

  if (
    !model ||
    windowSize == null
  ) {

    const recovered =
      recoverSelectionFromPeriodsFixV26(
        item
      );


    if (
      !model &&
      recovered.model
    ) {

      model =
        recovered.model;

    }


    if (
      windowSize == null &&
      recovered.window != null
    ) {

      windowSize =
        Number(
          recovered.window
        );

    }

  }


  /*
   * -------------------------------------------------------------
   * LEVEL 4 — DEEP FALLBACK
   *
   * Chỉ chạy nếu vẫn chưa tìm được.
   * -------------------------------------------------------------
   */

  if (!model) {

    const deepModel =
      gateDeepFindFixV26(
        item,
        [
          'selectedModel',
          'bestModel',
          'modelId'
        ]
      );


    if (
      deepModel
    ) {

      model =
        deepModel;

    }

  }


  if (
    windowSize == null
  ) {

    const deepWindow =
      gateDeepFindFixV26(
        item,
        [
          'selectedWindow',
          'bestWindow',
          'windowSize'
        ]
      );


    if (
      deepWindow != null
    ) {

      const n =
        Number(
          deepWindow
        );


      if (
        Number.isFinite(
          n
        )
      ) {

        windowSize =
          n;

      }

    }

  }


  return {

    model:
      model ||
      'UNKNOWN',

    window:
      windowSize

  };

};


/* =========================================================================
   8. REBUILD GATE FROM EXISTING CROSS-PROVINCE RESULT

   Không cần chạy lại toàn bộ OOS nếu dữ liệu Cross-Province
   vẫn còn trong memory.
   ========================================================================= */

function refreshProvinceGateModelWindowFixV26() {

  const cross =
    getLastCrossProvinceResultV26();


  if (
    !cross ||
    !Array.isArray(
      cross.results
    ) ||
    !cross.results.length
  ) {

    return {

      ready:
        false,

      reason:
        'NO_CROSS_RESULT_IN_MEMORY'

    };

  }


  const result =
    runProvinceAdaptiveGateV26(
      cross
    );


  return result;

}


/* =========================================================================
   9. QUICK MOBILE TEST
   ========================================================================= */

function showProvinceGateModelWindowFixV26() {

  const result =
    refreshProvinceGateModelWindowFixV26();


  if (
    !result ||
    !result.ready
  ) {

    alert(
      'V2.6 MODEL/WINDOW FIX\n\n' +
      'Chưa có Cross-Province data trong memory.\n\n' +
      'Hãy chạy Cross-Province OOS 21 tỉnh trước.'
    );


    return result;

  }


  const rows =
    result.results
      .slice(
        0,
        21
      );


  const lines = [

    'V2.6 MODEL / WINDOW CHECK',

    '',

    'Provinces: ' +
      result.provinceCount,

    ''

  ];


  rows.forEach(
    item => {

      lines.push(
        item.emoji +
        ' ' +
        item.province
      );


      lines.push(
        'Gate: ' +
        item.gate
      );


      lines.push(
        'Model: ' +
        item.model
      );


      lines.push(
        'Window: ' +
        (
          item.window != null
            ? item.window +
              ' kỳ'
            : '-'
        )
      );


      lines.push(
        '--------------------'
      );

    }
  );


  alert(
    lines.join(
      '\n'
    )
  );


  return result;

}


/* =========================================================================
   10. SAFETY
   ========================================================================= */

function provinceGateModelWindowFixSafetyV26() {

  return {

    version:
      'V2.6',

    patch:
      '7A_FIX_2',

    productionModified:
      false,

    predictionButtonModified:
      false,

    gateThresholdModified:
      false,

    gateScoreModified:
      false,

    gateClassificationModified:
      false,

    modelWindowRecoveryOnly:
      true,

    researchOnly:
      true,

    status:
      'SAFE_METADATA_RECOVERY_ONLY'

  };

}


console.log(
  'XSMN V2.6 Block 7A FIX 2 loaded — Model Window Recovery ready'
);

/* =========================================================================
   V2.6 — DEBUG CROSS-PROVINCE STRUCTURE
   Chỉ đọc dữ liệu. Không thay đổi Engine.
   ========================================================================= */

function debugCrossProvinceStructureV26() {

  const cross =
    getLastCrossProvinceResultV26();

  if (
    !cross ||
    !Array.isArray(cross.results) ||
    !cross.results.length
  ) {

    alert(
      'DEBUG V2.6\n\n' +
      'Không tìm thấy Cross-Province result.\n\n' +
      'Hãy chạy Cross-Province OOS 21 tỉnh trước.'
    );

    return;

  }


  const item =
    cross.results[0];


  const text = {

    CROSS_KEYS:
      Object.keys(
        cross
      ),

    FIRST_ITEM_KEYS:
      item
        ? Object.keys(item)
        : [],

    PROVINCE:
      item
        ? (
            item.province ||
            item.provinceName ||
            item.name
          )
        : null,

    MODEL:
      item
        ? item.model
        : null,

    WINDOW:
      item
        ? item.window
        : null,

    HAS_SELECTION:
      !!(
        item &&
        item.selection
      ),

    HAS_PERIODS:
      !!(
        item &&
        Array.isArray(
          item.periods
        )
      ),

    PERIOD_COUNT:
      item &&
      Array.isArray(
        item.periods
      )
        ? item.periods.length
        : 0,

    FIRST_PERIOD:
      item &&
      Array.isArray(
        item.periods
      ) &&
      item.periods.length
        ? item.periods[0]
        : null,

    HAS_OOS:
      !!(
        item &&
        item.oos
      ),

    OOS_KEYS:
      item &&
      item.oos
        ? Object.keys(
            item.oos
          )
        : [],

    HAS_RESULT:
      !!(
        item &&
        item.result
      ),

    RESULT_KEYS:
      item &&
      item.result
        ? Object.keys(
            item.result
          )
        : []

  };


  alert(
    JSON.stringify(
      text,
      null,
      2
    )
  );


  return {
    cross,
    item,
    debug: text
  };

}


/* =========================================================================
   MOBILE DEBUG BUTTON
   ========================================================================= */

function addCrossStructureDebugButtonV26() {

  if (
    document.getElementById(
      'btnCrossStructureDebugV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnCrossStructureDebugV26';


  button.textContent =
    '🔍 Debug Cross-Province Structure';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    debugCrossProvinceStructureV26
  );


  settings.appendChild(
    button
  );

}


if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addCrossStructureDebugButtonV26
  );

} else {

  addCrossStructureDebugButtonV26();

}


console.log(
  'XSMN V2.6 Cross-Province Structure Debug ready'
);

/* =========================================================================
   XSMN V2.6 — SHORT PROVINCE STRUCTURE DEBUG
   Chỉ đọc 1 tỉnh + 3 periods để tránh popup bị cắt.
   ========================================================================= */

function debugOneProvinceStructureV26() {

  const cross =
    getLastCrossProvinceResultV26();


  if (
    !cross ||
    !Array.isArray(cross.results) ||
    !cross.results.length
  ) {

    alert(
      'DEBUG V2.6\n\n' +
      'Không có Cross-Province data.'
    );

    return;

  }


  /*
   * Ưu tiên TP.HCM vì kết quả trước đó
   * cho biết:
   *
   * Model: RECENT
   * Window: 60
   */

  let item =
    cross.results.find(
      row =>
        row &&
        (
          row.province === 'tp-hcm' ||
          row.slug === 'tp-hcm' ||
          row.provinceName === 'TP. HCM' ||
          row.name === 'TP. HCM'
        )
    );


  /*
   * Nếu không tìm thấy thì dùng tỉnh đầu tiên.
   */

  if (!item) {

    item =
      cross.results[0];

  }


  const periods =

    Array.isArray(
      item.periods
    )
      ? item.periods

      : item.oos &&
        Array.isArray(
          item.oos.periods
        )
        ? item.oos.periods

        : item.result &&
          Array.isArray(
            item.result.periods
          )
          ? item.result.periods

          : [];


  const lines = [];


  lines.push(
    'V2.6 SHORT STRUCTURE DEBUG'
  );

  lines.push(
    ''
  );


  lines.push(
    'Province: ' +
    (
      item.provinceName ||
      item.name ||
      item.province ||
      item.slug ||
      '-'
    )
  );


  lines.push(
    ''
  );


  lines.push(
    'ITEM KEYS:'
  );


  lines.push(
    Object.keys(item)
      .join(', ')
  );


  lines.push(
    ''
  );


  lines.push(
    'Direct model: ' +
    String(
      item.model
    )
  );


  lines.push(
    'Direct window: ' +
    String(
      item.window
    )
  );


  lines.push(
    ''
  );


  lines.push(
    'Periods found: ' +
    periods.length
  );


  periods
    .slice(
      0,
      3
    )
    .forEach(
      (period, index) => {

        lines.push(
          ''
        );


        lines.push(
          '--- PERIOD ' +
          (index + 1) +
          ' ---'
        );


        lines.push(
          'Keys: ' +
          Object.keys(period)
            .join(', ')
        );


        lines.push(
          'model=' +
          String(
            period.model
          )
        );


        lines.push(
          'window=' +
          String(
            period.window
          )
        );


        lines.push(
          'valid=' +
          String(
            period.valid
          )
        );


        if (
          period.selection
        ) {

          lines.push(
            'selection.model=' +
            String(
              period.selection.model
            )
          );


          lines.push(
            'selection.window=' +
            String(
              period.selection.window
            )
          );

        }


        if (
          period.adaptive
        ) {

          lines.push(
            'adaptive.model=' +
            String(
              period.adaptive.model
            )
          );


          lines.push(
            'adaptive.window=' +
            String(
              period.adaptive.window
            )
          );

        }

      }
    );


  alert(
    lines.join(
      '\n'
    )
  );


  return {

    item,

    periods

  };

}


/* =========================================================================
   SHORT DEBUG BUTTON
   ========================================================================= */

function addShortProvinceDebugButtonV26() {

  if (
    document.getElementById(
      'btnShortProvinceDebugV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnShortProvinceDebugV26';


  button.textContent =
    '🔬 Debug 1 Province V2.6';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    debugOneProvinceStructureV26
  );


  settings.appendChild(
    button
  );

}


if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addShortProvinceDebugButtonV26
  );

} else {

  addShortProvinceDebugButtonV26();

}


console.log(
  'XSMN V2.6 Short Province Structure Debug ready'
);

/* =========================================================================
   XSMN V2.6 — FIX DOMINANT MODEL / WINDOW

   Cross-Province Block 6 lưu metadata dưới dạng:

     dominantModel
     dominantWindow

   Trong khi Province Gate Block 7A đang tìm:

     model
     window

   Patch này chỉ sửa mapping metadata.
   KHÔNG thay:
   - OOS Engine
   - Gate Score
   - Gate Classification
   - Production Engine
   ========================================================================= */


/* =========================================================================
   OVERRIDE gateSelectionV26
   ========================================================================= */

gateSelectionV26 =
function(
  item
) {

  if (!item) {

    return {

      model:
        'UNKNOWN',

      window:
        null

    };

  }


  /*
   * -------------------------------------------------------------
   * MODEL
   *
   * Thứ tự ưu tiên:
   *
   * 1. dominantModel  <-- cấu trúc thật của Block 6
   * 2. model
   * 3. selection.model
   * -------------------------------------------------------------
   */

  let model =

    item.dominantModel ||

    item.model ||

    (
      item.selection &&
      item.selection.model
    ) ||

    null;


  /*
   * -------------------------------------------------------------
   * WINDOW
   *
   * Thứ tự ưu tiên:
   *
   * 1. dominantWindow <-- cấu trúc thật của Block 6
   * 2. window
   * 3. selection.window
   * -------------------------------------------------------------
   */

  let windowSize = null;


  if (
    item.dominantWindow != null
  ) {

    windowSize =
      Number(
        item.dominantWindow
      );

  } else if (
    item.window != null
  ) {

    windowSize =
      Number(
        item.window
      );

  } else if (
    item.selection &&
    item.selection.window != null
  ) {

    windowSize =
      Number(
        item.selection.window
      );

  }


  /*
   * Bảo vệ trường hợp Window không phải số.
   */

  if (
    !Number.isFinite(
      windowSize
    )
  ) {

    windowSize =
      null;

  }


  return {

    model:
      model ||
      'UNKNOWN',

    window:
      windowSize

  };

};


/* =========================================================================
   REFRESH EXISTING PROVINCE GATE
   ========================================================================= */

function refreshProvinceGateDominantFixV26() {

  const cross =
    getLastCrossProvinceResultV26();


  if (
    !cross ||
    !Array.isArray(
      cross.results
    ) ||
    !cross.results.length
  ) {

    return {

      ready:
        false,

      reason:
        'NO_CROSS_PROVINCE_DATA'

    };

  }


  return runProvinceAdaptiveGateV26(
    cross
  );

}


/* =========================================================================
   SAFETY CHECK
   ========================================================================= */

function dominantModelWindowFixSafetyV26() {

  return {

    version:
      'V2.6',

    patch:
      'DOMINANT_MODEL_WINDOW_FIX',

    metadataMappingOnly:
      true,

    gateScoreModified:
      false,

    gateClassificationModified:
      false,

    oosEngineModified:
      false,

    productionModified:
      false,

    predictionButtonModified:
      false,

    researchOnly:
      true,

    status:
      'SAFE_METADATA_MAPPING_FIX'

  };

}


console.log(
  'XSMN V2.6 dominantModel / dominantWindow mapping FIX loaded'
);

/* =========================================================================
   XSMN V2.6 — BLOCK 7C
   PROVINCE GATE DECISION LAYER

   Mục tiêu:
   - Chuyển Province Gate thành Decision theo từng tỉnh.
   - ADAPTIVE:
       đề xuất Model + Window đã qua OOS Gate.
   - WATCH:
       chưa cho Adaptive.
   - BASELINE:
       đề xuất giữ Baseline.
   - REJECT:
       cấm Adaptive.
   - Có Safety Fallback.
   - Research Only.
   - KHÔNG thay Production Engine.
   - KHÔNG thay nút Dự Báo Ngay.
   ========================================================================= */


/* =========================================================================
   1. DECISION CONFIG
   ========================================================================= */

const PROVINCE_DECISION_V26_CONFIG = {

  /*
   * Gate Score tối thiểu để Decision Layer
   * chấp nhận một ADAPTIVE candidate.
   *
   * Gate 7A hiện đã dùng threshold 70.
   * 7C kiểm tra lại để tránh dữ liệu lỗi.
   */

  minimumAdaptiveGateScore: 70,


  /*
   * OOS tests tối thiểu.
   */

  minimumTests: 40,


  /*
   * Model hợp lệ.
   */

  allowedModels: [

    'BASELINE',
    'FREQUENCY',
    'RECENT',
    'CYCLE',
    'BALANCED'

  ],


  /*
   * Window hợp lệ hiện tại.
   */

  allowedWindows: [

    10,
    20,
    30,
    60

  ]

};


/* =========================================================================
   2. NORMALIZE MODEL
   ========================================================================= */

function normalizeDecisionModelV26(
  model
) {

  if (
    model == null
  ) {

    return null;

  }


  const normalized =
    String(
      model
    )
    .trim()
    .toUpperCase();


  return normalized ||
    null;

}


/* =========================================================================
   3. NORMALIZE WINDOW
   ========================================================================= */

function normalizeDecisionWindowV26(
  windowSize
) {

  const value =
    Number(
      windowSize
    );


  return Number.isFinite(
    value
  )
    ? value
    : null;

}


/* =========================================================================
   4. VALIDATE ADAPTIVE CONFIG
   ========================================================================= */

function validateAdaptiveConfigV26(
  gateItem
) {

  if (!gateItem) {

    return {

      valid:
        false,

      reason:
        'EMPTY_GATE_ITEM'

    };

  }


  const model =
    normalizeDecisionModelV26(
      gateItem.model
    );


  const windowSize =
    normalizeDecisionWindowV26(
      gateItem.window
    );


  if (
    !model ||
    model === 'UNKNOWN'
  ) {

    return {

      valid:
        false,

      reason:
        'INVALID_MODEL'

    };

  }


  if (
    !PROVINCE_DECISION_V26_CONFIG
      .allowedModels
      .includes(
        model
      )
  ) {

    return {

      valid:
        false,

      reason:
        'MODEL_NOT_ALLOWED'

    };

  }


  if (
    model === 'BASELINE'
  ) {

    return {

      valid:
        false,

      reason:
        'BASELINE_IS_NOT_ADAPTIVE'

    };

  }


  if (
    windowSize == null ||
    !PROVINCE_DECISION_V26_CONFIG
      .allowedWindows
      .includes(
        windowSize
      )
  ) {

    return {

      valid:
        false,

      reason:
        'INVALID_WINDOW'

    };

  }


  return {

    valid:
      true,

    model,

    window:
      windowSize,

    reason:
      'VALID_ADAPTIVE_CONFIG'

  };

}


/* =========================================================================
   5. BUILD FALLBACK DECISION
   ========================================================================= */

function buildFallbackDecisionV26(
  gateItem,
  reason
) {

  return {

    ready:
      true,

    province:
      gateItem
        ? gateItem.provinceSlug
        : null,

    provinceName:
      gateItem
        ? gateItem.province
        : null,

    gate:
      gateItem
        ? gateItem.gate
        : 'UNKNOWN',

    action:
      'KEEP_PRODUCTION',

    useAdaptive:
      false,

    model:
      null,

    window:
      null,

    gateScore:
      gateItem
        ? gateNumberV26(
            gateItem.gateScore
          )
        : 0,

    oosDelta:
      gateItem
        ? gateNumberV26(
            gateItem.delta
          )
        : 0,

    winRate:
      gateItem
        ? gateNumberV26(
            gateItem.winRate
          )
        : 0,

    reason:
      reason ||
      'SAFE_FALLBACK',

    productionModified:
      false,

    researchOnly:
      true

  };

}


/* =========================================================================
   6. BUILD ONE PROVINCE DECISION

   QUY TẮC:

   ADAPTIVE
   --------
   Chỉ tạo Adaptive Recommendation khi:
   - Gate = ADAPTIVE
   - Gate Score >= 70
   - Tests >= 40
   - Model hợp lệ
   - Window hợp lệ

   WATCH
   -----
   Chưa đủ bằng chứng.
   Giữ Production.

   BASELINE
   --------
   Adaptive không có lợi thế xác nhận.
   Giữ Production.

   REJECT
   ------
   Adaptive bị OOS bác bỏ.
   Giữ Production và đánh dấu BLOCK_ADAPTIVE.
   ========================================================================= */

function buildProvinceDecisionV26(
  gateItem
) {

  if (
    !gateItem ||
    !gateItem.ready
  ) {

    return {

      ready:
        false,

      action:
        'KEEP_PRODUCTION',

      useAdaptive:
        false,

      reason:
        'INVALID_GATE_ITEM',

      productionModified:
        false,

      researchOnly:
        true

    };

  }


  const gate =
    String(
      gateItem.gate ||
      ''
    ).toUpperCase();


  const gateScore =
    gateNumberV26(
      gateItem.gateScore
    );


  const tests =
    gateNumberV26(
      gateItem.tests
    );


  /*
   * -------------------------------------------------------------
   * REJECT
   * -------------------------------------------------------------
   */

  if (
    gate === 'REJECT'
  ) {

    const decision =
      buildFallbackDecisionV26(
        gateItem,
        'ADAPTIVE_REJECTED_BY_OOS'
      );


    decision.action =
      'BLOCK_ADAPTIVE';


    return decision;

  }


  /*
   * -------------------------------------------------------------
   * BASELINE
   * -------------------------------------------------------------
   */

  if (
    gate === 'BASELINE'
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      'BASELINE_PREFERRED'
    );

  }


  /*
   * -------------------------------------------------------------
   * WATCH
   * -------------------------------------------------------------
   */

  if (
    gate === 'WATCH'
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      'WAIT_FOR_STRONGER_OOS_EVIDENCE'
    );

  }


  /*
   * -------------------------------------------------------------
   * UNKNOWN GATE
   * -------------------------------------------------------------
   */

  if (
    gate !== 'ADAPTIVE'
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      'UNKNOWN_GATE_SAFE_FALLBACK'
    );

  }


  /*
   * -------------------------------------------------------------
   * ADAPTIVE SAFETY CHECK #1
   * Gate Score.
   * -------------------------------------------------------------
   */

  if (
    gateScore <
    PROVINCE_DECISION_V26_CONFIG
      .minimumAdaptiveGateScore
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      'ADAPTIVE_GATE_SCORE_TOO_LOW'
    );

  }


  /*
   * -------------------------------------------------------------
   * ADAPTIVE SAFETY CHECK #2
   * OOS coverage.
   * -------------------------------------------------------------
   */

  if (
    tests <
    PROVINCE_DECISION_V26_CONFIG
      .minimumTests
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      'INSUFFICIENT_OOS_TESTS'
    );

  }


  /*
   * -------------------------------------------------------------
   * ADAPTIVE SAFETY CHECK #3
   * Model + Window.
   * -------------------------------------------------------------
   */

  const configCheck =
    validateAdaptiveConfigV26(
      gateItem
    );


  if (
    !configCheck.valid
  ) {

    return buildFallbackDecisionV26(
      gateItem,
      configCheck.reason
    );

  }


  /*
   * -------------------------------------------------------------
   * SAFE ADAPTIVE RECOMMENDATION
   *
   * LƯU Ý:
   * Đây mới là Recommendation.
   * Chưa sử dụng trong Production Prediction.
   * -------------------------------------------------------------
   */

  return {

    ready:
      true,

    province:
      gateItem.provinceSlug,

    provinceName:
      gateItem.province,

    gate:
      'ADAPTIVE',

    action:
      'RECOMMEND_ADAPTIVE',

    useAdaptive:
      true,

    model:
      configCheck.model,

    window:
      configCheck.window,

    gateScore,

    tests,

    oosDelta:
      gateNumberV26(
        gateItem.delta
      ),

    winRate:
      gateNumberV26(
        gateItem.winRate
      ),

    mrrDelta:
      gateNumberV26(
        gateItem.mrrDelta
      ),

    rankImprovement:
      gateNumberV26(
        gateItem.rankImprovement
      ),

    reason:
      'OOS_GATE_APPROVED',

    productionModified:
      false,

    researchOnly:
      true

  };

}


/* =========================================================================
   7. RUN DECISION LAYER
   ========================================================================= */

function runProvinceDecisionLayerV26(
  gateResult = null
) {

  const source =
    gateResult ||
    window.LAST_PROVINCE_GATE_V26;


  if (
    !source ||
    !source.ready ||
    !Array.isArray(
      source.results
    ) ||
    !source.results.length
  ) {

    return {

      ready:
        false,

      reason:
        'PROVINCE_GATE_NOT_READY'

    };

  }


  const decisions =
    source.results.map(
      item =>
        buildProvinceDecisionV26(
          item
        )
    );


  const valid =
    decisions.filter(
      item =>
        item.ready
    );


  if (
    !valid.length
  ) {

    return {

      ready:
        false,

      reason:
        'NO_VALID_DECISIONS',

      decisions

    };

  }


  const adaptive =
    valid.filter(
      item =>
        item.action ===
        'RECOMMEND_ADAPTIVE'
    );


  const keepProduction =
    valid.filter(
      item =>
        item.action ===
        'KEEP_PRODUCTION'
    );


  const blocked =
    valid.filter(
      item =>
        item.action ===
        'BLOCK_ADAPTIVE'
    );


  const result = {

    ready:
      true,

    version:
      'V2.6',

    engine:
      'PROVINCE_GATE_DECISION_LAYER',

    generatedAt:
      new Date()
        .toISOString(),

    provinceCount:
      valid.length,

    summary: {

      adaptiveRecommended:
        adaptive.length,

      keepProduction:
        keepProduction.length,

      adaptiveBlocked:
        blocked.length,

      adaptiveRate:
        adaptive.length /
        valid.length

    },

    adaptive,

    keepProduction,

    blocked,

    decisions:
      valid,

    productionModified:
      false,

    researchOnly:
      true

  };


  window.LAST_PROVINCE_DECISION_V26 =
    result;


  return result;

}


/* =========================================================================
   8. GET DECISION FOR ONE PROVINCE

   Hàm chuẩn bị cho Block tương lai.

   Hiện tại:
   READ ONLY.
   ========================================================================= */

function getProvinceDecisionV26(
  provinceSlug
) {

  const result =
    window
      .LAST_PROVINCE_DECISION_V26;


  if (
    !result ||
    !result.ready ||
    !Array.isArray(
      result.decisions
    )
  ) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      action:
        'KEEP_PRODUCTION',

      useAdaptive:
        false,

      reason:
        'DECISION_LAYER_NOT_RUN',

      researchOnly:
        true

    };

  }


  let decision =
    result.decisions.find(
      item =>
        item.province ===
        provinceSlug
    );


  /*
   * Fallback lookup bằng tên tỉnh.
   */

  if (!decision) {

    let provinceName =
      provinceSlug;


    try {

      const p =
        provinceBySlug(
          provinceSlug
        );


      if (p) {

        provinceName =
          p.name;

      }

    } catch (
      error
    ) {

      /*
       * Ignore lookup error.
       */

    }


    decision =
      result.decisions.find(
        item =>
          item.provinceName ===
          provinceName
      );

  }


  if (!decision) {

    return {

      ready:
        false,

      province:
        provinceSlug,

      action:
        'KEEP_PRODUCTION',

      useAdaptive:
        false,

      reason:
        'PROVINCE_DECISION_NOT_FOUND',

      researchOnly:
        true

    };

  }


  return {

    ...decision

  };

}


/* =========================================================================
   9. PRINT DECISION LAYER
   ========================================================================= */

function printProvinceDecisionLayerV26() {

  const result =
    runProvinceDecisionLayerV26();


  console.log(
    '=========================================='
  );

  console.log(
    'XSMN V2.6 — PROVINCE DECISION LAYER'
  );

  console.log(
    '=========================================='
  );


  if (
    !result.ready
  ) {

    console.warn(
      result.reason
    );


    return result;

  }


  console.log(
    'SUMMARY:',
    result.summary
  );


  console.table(

    result.decisions.map(
      item => ({

        Province:
          item.provinceName,

        Gate:
          item.gate,

        Action:
          item.action,

        Adaptive:
          item.useAdaptive
            ? 'YES'
            : 'NO',

        Model:
          item.model ||
          '-',

        Window:
          item.window != null
            ? item.window
            : '-',

        GateScore:
          Number(
            item.gateScore || 0
          ).toFixed(2),

        Delta:
          (
            Number(
              item.oosDelta || 0
            ) >= 0
              ? '+'
              : ''
          ) +
          Number(
            item.oosDelta || 0
          ).toFixed(4),

        Reason:
          item.reason

      }))

  );


  return result;

}


/* =========================================================================
   10. MOBILE PANEL HTML
   ========================================================================= */

function provinceDecisionPanelHTMLV26(
  result
) {

  if (
    !result ||
    !result.ready
  ) {

    return `
      <div style="
        padding:18px;
        line-height:1.6;
      ">
        ⚠️ Province Decision Layer chưa sẵn sàng.
      </div>
    `;

  }


  const summary =
    result.summary;


  const adaptiveCards =
    result.adaptive.map(
      item => {

        return `
          <div style="
            margin-top:14px;
            padding:16px;
            border-radius:16px;
            background:rgba(255,255,255,0.06);
          ">

            <div style="
              font-size:18px;
              font-weight:800;
            ">
              🟢 ${item.provinceName}
            </div>

            <div style="
              margin-top:6px;
              font-weight:800;
            ">
              RECOMMEND ADAPTIVE
            </div>

            <div style="
              margin-top:12px;
              line-height:1.7;
            ">

              Model:
              <b>${item.model}</b>

              <br>

              Window:
              <b>${item.window} kỳ</b>

              <br>

              Gate Score:
              <b>${item.gateScore.toFixed(2)}</b>

              <br>

              OOS Delta:
              <b>
                ${
                  item.oosDelta >= 0
                    ? '+'
                    : ''
                }${item.oosDelta.toFixed(4)}
              </b>

              <br>

              Win Rate:
              <b>
                ${(item.winRate * 100).toFixed(0)}%
              </b>

            </div>

          </div>
        `;

      }
    )
    .join('');


  return `

    <div style="
      padding:18px;
      line-height:1.55;
    ">

      <div style="
        font-size:21px;
        font-weight:900;
      ">
        🧠 V2.6 PROVINCE DECISION LAYER
      </div>


      <div style="
        margin-top:8px;
        opacity:0.8;
      ">
        Research Decision only — chưa thay Production Engine.
      </div>


      <div style="
        margin-top:20px;
        padding:16px;
        border-radius:16px;
        background:rgba(255,255,255,0.06);
      ">

        <div style="
          font-weight:900;
          margin-bottom:10px;
        ">
          DECISION SUMMARY
        </div>

        🟢 Adaptive Recommended:
        <b>${summary.adaptiveRecommended}</b>

        <br>

        ⚪ Keep Production:
        <b>${summary.keepProduction}</b>

        <br>

        🔴 Adaptive Blocked:
        <b>${summary.adaptiveBlocked}</b>

        <br>

        Provinces:
        <b>${result.provinceCount}</b>

        <br>

        Adaptive Rate:
        <b>
          ${(summary.adaptiveRate * 100).toFixed(2)}%
        </b>

      </div>


      <div style="
        margin-top:22px;
        font-size:18px;
        font-weight:900;
      ">
        🟢 APPROVED ADAPTIVE CANDIDATES
      </div>


      ${
        adaptiveCards ||
        `
          <div style="
            margin-top:14px;
            opacity:0.8;
          ">
            Không có tỉnh nào được đề xuất Adaptive.
          </div>
        `
      }


      <div style="
        margin-top:20px;
        padding:14px;
        border-radius:14px;
        background:rgba(255,255,255,0.04);
        opacity:0.85;
      ">

        📌 Block 7C chỉ tạo Recommendation.

        <br>

        Nút Dự Báo Ngay vẫn sử dụng Production Engine hiện tại.

      </div>

    </div>

  `;

}


/* =========================================================================
   11. SHOW MOBILE PANEL
   ========================================================================= */

function showProvinceDecisionPanelV26() {

  const result =
    runProvinceDecisionLayerV26();


  if (
    !result.ready
  ) {

    alert(
      'V2.6 DECISION LAYER\n\n' +
      'Không thể tạo Decision.\n\n' +
      'Reason: ' +
      result.reason +
      '\n\n' +
      'Hãy chạy Cross-Province OOS và Province Gate trước.'
    );


    return result;

  }


  let panel =
    document.getElementById(
      'provinceDecisionPanelV26'
    );


  if (!panel) {

    panel =
      document.createElement(
        'div'
      );


    panel.id =
      'provinceDecisionPanelV26';


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      alert(
        'Không tìm thấy tab Cài đặt.'
      );


      return result;

    }


    settings.appendChild(
      panel
    );

  }


  panel.innerHTML =
    provinceDecisionPanelHTMLV26(
      result
    );


  panel.scrollIntoView({
    behavior:
      'smooth',

    block:
      'start'
  });


  return result;

}


/* =========================================================================
   12. MOBILE BUTTON
   ========================================================================= */

function addProvinceDecisionButtonV26() {

  if (
    document.getElementById(
      'btnProvinceDecisionV26'
    )
  ) {

    return;

  }


  const settings =
    document.getElementById(
      'tab-settings'
    );


  if (!settings) {

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'btnProvinceDecisionV26';


  button.textContent =
    '🧠 Phân tích Decision Layer V2.6';


  button.style.cssText =
    `
      width:100%;
      margin-top:16px;
      padding:16px 12px;
      border:0;
      border-radius:14px;
      font-size:17px;
      font-weight:800;
      cursor:pointer;
    `;


  button.addEventListener(
    'click',
    showProvinceDecisionPanelV26
  );


  settings.appendChild(
    button
  );

}


/* =========================================================================
   13. SAFETY CHECK
   ========================================================================= */

function provinceDecisionSafetyCheckV26() {

  return {

    version:
      'V2.6',

    block:
      '7C',

    decisionLayer:
      true,

    productionModified:
      false,

    predictionButtonModified:
      false,

    adaptiveAutoEnabled:
      false,

    gateModified:
      false,

    researchOnly:
      true,

    status:
      'SAFE_RESEARCH_DECISION_LAYER'

  };

}


/* =========================================================================
   14. INIT
   ========================================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    addProvinceDecisionButtonV26
  );

} else {

  addProvinceDecisionButtonV26();

}


console.log(
  'XSMN V2.6 Block 7C loaded — Province Gate Decision Layer ready'
);

