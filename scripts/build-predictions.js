/**
 * XSMN PREDICTION ENGINE V1
 * =========================
 *
 * Input:
 *   data/xsmn_stats.json
 *
 * Output:
 *   data/xsmn_predictions.json
 *
 * Mục tiêu:
 * - Dự báo giải đặc biệt đầy đủ 6 chữ số
 * - Tạo Top 10 ứng viên cho mỗi đài
 * - Tạo Top 10 dự báo 2 số cuối
 * - Không gọi API bên ngoài
 * - Hoạt động hoàn toàn từ statistics database
 *
 * LƯU Ý:
 * score = điểm xếp hạng của mô hình,
 * KHÔNG phải xác suất trúng.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

const STATS_FILE = path.join(
  DATA_DIR,
  "xsmn_stats.json"
);

const OUTPUT_FILE = path.join(
  DATA_DIR,
  "xsmn_predictions.json"
);

const TOP_DIGITS_PER_POSITION = 4;
const TOP_FULL_PREDICTIONS = 10;
const TOP_LAST2_PREDICTIONS = 10;


/* =========================================================
   HELPERS
   ========================================================= */

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}


function round(value, digits = 4) {

  const factor =
    Math.pow(10, digits);

  return (
    Math.round(value * factor) /
    factor
  );
}


function safeNumber(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function normalizeArray(value) {

  return Array.isArray(value)
    ? value
    : [];
}


/* =========================================================
   LOAD DATABASE
   ========================================================= */

function loadStats() {

  if (!fs.existsSync(STATS_FILE)) {

    throw new Error(
      `Statistics file not found: ${STATS_FILE}`
    );
  }


  const raw =
    fs.readFileSync(
      STATS_FILE,
      "utf8"
    );


  const data =
    JSON.parse(raw);


  if (
    !data ||
    !data.provinces ||
    typeof data.provinces !== "object"
  ) {

    throw new Error(
      "Invalid xsmn_stats.json structure"
    );
  }


  return data;
}


/* =========================================================
   POSITION EXTRACTION
   ========================================================= */

function getPositions(provinceStats) {

  const positions =
    provinceStats &&
    provinceStats.specialPrize &&
    Array.isArray(
      provinceStats.specialPrize.positions
    )
      ? provinceStats.specialPrize.positions
      : [];


  return positions
    .filter(
      item =>
        item &&
        Number(item.position) >= 1 &&
        Number(item.position) <= 6
    )
    .sort(
      (a, b) =>
        Number(a.position) -
        Number(b.position)
    );
}


/* =========================================================
   DIGIT SCORE
   ========================================================= */

/**
 * Chấm điểm chữ số tại từng vị trí.
 *
 * Nguồn chính:
 * - frequency
 * - ranking
 *
 * Nếu build-stats.js có thêm windows:
 * - 10
 * - 30
 * - 50
 * - 100
 *
 * thì engine sẽ tự động tận dụng.
 */

function extractWindowFrequency(
  positionStats,
  windowSize,
  digit
) {

  /*
   * Hỗ trợ nhiều cấu trúc JSON
   * để engine không bị phụ thuộc cứng
   * vào một tên property duy nhất.
   */

  const possibleContainers = [
    positionStats.windows,
    positionStats.windowFrequency,
    positionStats.frequencyByWindow,
    positionStats.periods
  ];


  for (const container of possibleContainers) {

    if (
      !container ||
      typeof container !== "object"
    ) {
      continue;
    }


    const windowData =
      container[String(windowSize)] ||
      container[windowSize];


    if (!windowData) {
      continue;
    }


    /*
     * Dạng:
     *
     * "10": {
     *   "0": 1,
     *   "1": 2
     * }
     */

    if (
      typeof windowData[digit] !==
      "undefined"
    ) {

      return safeNumber(
        windowData[digit]
      );
    }


    /*
     * Dạng:
     *
     * "10": {
     *   "frequency": {
     *      "0": 1
     *   }
     * }
     */

    if (
      windowData.frequency &&
      typeof
        windowData.frequency[digit] !==
        "undefined"
    ) {

      return safeNumber(
        windowData.frequency[digit]
      );
    }
  }


  return null;
}


/**
 * Chuyển frequency thành điểm 0 -> 1.
 *
 * Với chữ số ngẫu nhiên:
 * kỳ vọng mỗi digit khoảng 10%.
 *
 * Chúng ta dùng relative score,
 * không coi đây là xác suất.
 */

function frequencyScore(
  count,
  totalDraws
) {

  if (
    !totalDraws ||
    totalDraws <= 0
  ) {
    return 0;
  }


  const rate =
    count / totalDraws;


  /*
   * 10% = mức trung bình lý thuyết.
   *
   * rate 20% trở lên được cap.
   */

  return clamp(
    rate / 0.20,
    0,
    1
  );
}


/* =========================================================
   RANK SCORE
   ========================================================= */

function getRankScore(
  positionStats,
  digit
) {

  const ranking =
    normalizeArray(
      positionStats.ranking
    );


  const index =
    ranking.findIndex(
      item =>
        String(item.value) ===
        String(digit)
    );


  if (index === -1) {
    return 0;
  }


  /*
   * Rank 1 = 1.00
   * Rank 2 = 0.90
   * ...
   * Rank 10 = 0.10
   */

  return clamp(
    1 - index * 0.10,
    0.10,
    1
  );
}


/* =========================================================
   SINGLE DIGIT MODEL
   ========================================================= */

function scoreDigit(
  positionStats,
  digit,
  drawCount
) {

  const frequency =
    positionStats.frequency || {};


  const allCount =
    safeNumber(
      frequency[digit]
    );


  const allTimeScore =
    frequencyScore(
      allCount,
      drawCount
    );


  const rankScore =
    getRankScore(
      positionStats,
      digit
    );


  /*
   * Window scores.
   */

  const windows = [
    {
      size: 10,
      weight: 0.30
    },
    {
      size: 30,
      weight: 0.20
    },
    {
      size: 50,
      weight: 0.10
    },
    {
      size: 100,
      weight: 0.05
    }
  ];


  let windowScore = 0;
  let windowWeight = 0;


  for (const window of windows) {

    const count =
      extractWindowFrequency(
        positionStats,
        window.size,
        digit
      );


    if (count === null) {
      continue;
    }


    const score =
      frequencyScore(
        count,
        Math.min(
          drawCount,
          window.size
        )
      );


    windowScore +=
      score * window.weight;


    windowWeight +=
      window.weight;
  }


  /*
   * Nếu stats chưa có window data,
   * dùng frequency + ranking.
   */

  if (windowWeight === 0) {

    return round(
      allTimeScore * 0.65 +
      rankScore * 0.35
    );
  }


  const normalizedWindow =
    windowScore /
    windowWeight;


  /*
   * Trọng số V1:
   *
   * Recent windows : 55%
   * All history    : 30%
   * Rank           : 15%
   */

  return round(
    normalizedWindow * 0.55 +
    allTimeScore * 0.30 +
    rankScore * 0.15
  );
}


/* =========================================================
   BUILD POSITION CANDIDATES
   ========================================================= */

function buildPositionCandidates(
  positionStats,
  drawCount
) {

  const candidates = [];


  for (
    let digit = 0;
    digit <= 9;
    digit++
  ) {

    const value =
      String(digit);


    const score =
      scoreDigit(
        positionStats,
        value,
        drawCount
      );


    candidates.push({
      digit: value,
      score
    });
  }


  candidates.sort(
    (a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        Number(a.digit) -
        Number(b.digit)
      );
    }
  );


  return candidates;
}


/* =========================================================
   COMBINATION GENERATOR
   ========================================================= */

function generateCombinations(
  candidateLists
) {

  let combinations = [
    {
      number: "",
      scores: []
    }
  ];


  for (
    const candidates
    of candidateLists
  ) {

    const next = [];


    for (
      const combination
      of combinations
    ) {

      for (
        const candidate
        of candidates
      ) {

        next.push({

          number:
            combination.number +
            candidate.digit,

          scores: [
            ...combination.scores,
            candidate.score
          ]
        });
      }
    }


    combinations =
      next;
  }


  return combinations;
}


/* =========================================================
   FULL NUMBER SCORE
   ========================================================= */

function calculateCombinationScore(
  scores
) {

  if (
    !Array.isArray(scores) ||
    scores.length !== 6
  ) {

    return 0;
  }


  /*
   * Trung bình điểm của 6 vị trí.
   */

  const average =
    scores.reduce(
      (sum, value) =>
        sum + safeNumber(value),
      0
    ) / scores.length;


  /*
   * Balance factor:
   *
   * Hạn chế trường hợp 1 chữ số cực mạnh
   * nhưng các vị trí còn lại quá yếu.
   */

  const minimum =
    Math.min(
      ...scores
    );


  const balancedScore =
    average * 0.85 +
    minimum * 0.15;


  return round(
    balancedScore * 100,
    2
  );
}


/* =========================================================
   LAST 2 DIGITS
   ========================================================= */

function buildLast2Predictions(
  positionCandidates
) {

  if (
    positionCandidates.length < 6
  ) {

    return [];
  }


  const position5 =
    positionCandidates[4];


  const position6 =
    positionCandidates[5];


  const results = [];


  for (
    const a of position5
  ) {

    for (
      const b of position6
    ) {

      const score =
        (
          safeNumber(a.score) +
          safeNumber(b.score)
        ) / 2;


      results.push({

        number:
          `${a.digit}${b.digit}`,

        score:
          round(
            score * 100,
            2
          )
      });
    }
  }


  results.sort(
    (a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        a.number.localeCompare(
          b.number
        )
      );
    }
  );


  return results.slice(
    0,
    TOP_LAST2_PREDICTIONS
  );
}


/* =========================================================
   PROVINCE PREDICTION
   ========================================================= */

function predictProvince(
  provinceId,
  provinceStats
) {

  const drawCount =
    safeNumber(
      provinceStats.drawCount
    );


  const positions =
    getPositions(
      provinceStats
    );


  if (positions.length !== 6) {

    throw new Error(
      `${provinceId}: expected 6 special-prize positions, got ${positions.length}`
    );
  }


  /*
   * Chấm cả 10 digit tại mỗi vị trí.
   */

  const allPositionCandidates =
    positions.map(
      position =>
        buildPositionCandidates(
          position,
          drawCount
        )
    );


  /*
   * Full 6-digit prediction:
   * chỉ lấy Top 4 digit / vị trí.
   *
   * 4^6 = 4096 combinations.
   *
   * Nhẹ và đủ để ranking.
   */

  const combinationCandidates =
    allPositionCandidates.map(
      candidates =>
        candidates.slice(
          0,
          TOP_DIGITS_PER_POSITION
        )
    );


  const combinations =
    generateCombinations(
      combinationCandidates
    );


  const ranked =
    combinations.map(
      combination => ({

        number:
          combination.number,

        score:
          calculateCombinationScore(
            combination.scores
          )

      })
    );


  ranked.sort(
    (a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        a.number.localeCompare(
          b.number
        )
      );
    }
  );


  const topPredictions =
    ranked.slice(
      0,
      TOP_FULL_PREDICTIONS
    );


  const last2 =
    buildLast2Predictions(
      allPositionCandidates
    );


  /*
   * Lưu Top digit từng vị trí
   * để app có thể giải thích dự báo.
   */

  const positionSummary =
    allPositionCandidates.map(
      (candidates, index) => ({

        position:
          index + 1,

        candidates:
          candidates
            .slice(0, 5)
            .map(
              candidate => ({
                digit:
                  candidate.digit,

                score:
                  round(
                    candidate.score * 100,
                    2
                  )
              })
            )
      })
    );


  return {

    province:
      provinceId,

    provinceName:
      provinceStats.provinceName ||
      provinceId,

    basedOnDraws:
      drawCount,

    latestDrawDate:
      provinceStats.latestDate ||
      null,

    latestSpecialPrize:
      provinceStats.latestSpecialPrize ||
      null,

    prediction: {

      specialPrize6Digits:
        topPredictions,

      last2Digits:
        last2,

      positions:
        positionSummary
    }
  };
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validatePrediction(
  prediction
) {

  if (
    !prediction ||
    !prediction.prediction
  ) {

    return false;
  }


  const full =
    prediction
      .prediction
      .specialPrize6Digits;


  if (
    !Array.isArray(full) ||
    full.length === 0
  ) {

    return false;
  }


  for (const item of full) {

    if (
      !item ||
      !/^\d{6}$/.test(
        String(item.number)
      )
    ) {

      return false;
    }


    if (
      !Number.isFinite(
        Number(item.score)
      )
    ) {

      return false;
    }
  }


  return true;
}


/* =========================================================
   MAIN
   ========================================================= */

function main() {

  console.log(
    "========================================"
  );

  console.log(
    "XSMN PREDICTION ENGINE V1"
  );

  console.log(
    "========================================"
  );


  const stats =
    loadStats();


  console.log(
    `Database draws : ${stats.databaseDraws || 0}`
  );

  console.log(
    `Provinces      : ${stats.provinceCount || 0}`
  );

  console.log("");


  const predictions = {};

  let success = 0;
  let failed = 0;

  const failures = [];


  for (
    const [
      provinceId,
      provinceStats
    ]
    of Object.entries(
      stats.provinces
    )
  ) {

    try {

      console.log(
        `Building ${provinceId}...`
      );


      const prediction =
        predictProvince(
          provinceId,
          provinceStats
        );


      if (
        !validatePrediction(
          prediction
        )
      ) {

        throw new Error(
          "Prediction validation failed"
        );
      }


      predictions[provinceId] =
        prediction;


      success++;


      const best =
        prediction
          .prediction
          .specialPrize6Digits[0];


      console.log(
        `✓ ${provinceId} | ${best.number} | score ${best.score}`
      );


    } catch (error) {

      failed++;


      failures.push({
        province:
          provinceId,

        error:
          error.message
      });


      console.log(
        `✗ ${provinceId}: ${error.message}`
      );
    }
  }


  const output = {

    generatedAt:
      new Date().toISOString(),

    sourceStatsGeneratedAt:
      stats.generatedAt || null,

    model: {

      version:
        "XSMN-PRED-V1",

      specialPrizeDigits:
        6,

      scoreType:
        "ranking-score",

      scoreIsProbability:
        false,

      topPredictions:
        TOP_FULL_PREDICTIONS,

      topLast2:
        TOP_LAST2_PREDICTIONS,

      candidateDigitsPerPosition:
        TOP_DIGITS_PER_POSITION
    },

    database: {

      draws:
        safeNumber(
          stats.databaseDraws
        ),

      provinces:
        safeNumber(
          stats.provinceCount
        )
    },

    status: {

      success,

      failed,

      total:
        success + failed,

      predictionReady:
        (
          failed === 0 &&
          success > 0
        ),

      failures
    },

    provinces:
      predictions
  };


  fs.writeFileSync(

    OUTPUT_FILE,

    JSON.stringify(
      output,
      null,
      2
    ),

    "utf8"
  );


  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "PREDICTION SUMMARY"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Success : ${success}`
  );

  console.log(
    `Failed  : ${failed}`
  );

  console.log(
    `Total   : ${success + failed}`
  );

  console.log(
    `Ready   : ${output.status.predictionReady}`
  );

  console.log("");

  console.log(
    `✓ Saved ${OUTPUT_FILE}`
  );

  console.log(
    "========================================"
  );


  /*
   * Nếu không tạo được dự báo nào
   * thì workflow phải fail.
   */

  if (success === 0) {
    process.exitCode = 1;
  }
}


/* =========================================================
   RUN
   ========================================================= */

try {

  main();

} catch (error) {

  console.error(
    "FATAL ERROR:",
    error.message
  );

  process.exit(1);
    }
