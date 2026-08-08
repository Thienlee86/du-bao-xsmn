/**
 * XSMN API BUILDER
 * =================
 *
 * Tạo dữ liệu API nhẹ cho ứng dụng Android.
 *
 * Input:
 *   data/xsmn_seed.json
 *   data/xsmn_predictions.json
 *
 * Output:
 *   data/api/latest.json
 *   data/api/predictions.json
 *   data/api/status.json
 */

const fs = require("fs");
const path = require("path");

/* =========================================================
   PATHS
   ========================================================= */

const ROOT_DIR = path.join(__dirname, "..");

const DATA_DIR = path.join(
  ROOT_DIR,
  "data"
);

const API_DIR = path.join(
  DATA_DIR,
  "api"
);

const SEED_FILE = path.join(
  DATA_DIR,
  "xsmn_seed.json"
);

const PREDICTIONS_FILE = path.join(
  DATA_DIR,
  "xsmn_predictions.json"
);


/* =========================================================
   PROVINCES
   ========================================================= */

const PROVINCES = [
  { id: "an-giang", name: "An Giang" },
  { id: "bac-lieu", name: "Bạc Liêu" },
  { id: "ben-tre", name: "Bến Tre" },
  { id: "binh-duong", name: "Bình Dương" },
  { id: "binh-phuoc", name: "Bình Phước" },
  { id: "binh-thuan", name: "Bình Thuận" },
  { id: "ca-mau", name: "Cà Mau" },
  { id: "can-tho", name: "Cần Thơ" },
  { id: "da-lat", name: "Đà Lạt" },
  { id: "dong-nai", name: "Đồng Nai" },
  { id: "dong-thap", name: "Đồng Tháp" },
  { id: "hau-giang", name: "Hậu Giang" },
  { id: "kien-giang", name: "Kiên Giang" },
  { id: "long-an", name: "Long An" },
  { id: "soc-trang", name: "Sóc Trăng" },
  { id: "tay-ninh", name: "Tây Ninh" },
  { id: "tien-giang", name: "Tiền Giang" },
  { id: "tphcm", name: "TP.HCM" },
  { id: "tra-vinh", name: "Trà Vinh" },
  { id: "vinh-long", name: "Vĩnh Long" },
  { id: "vung-tau", name: "Vũng Tàu" }
];


/* =========================================================
   HELPERS
   ========================================================= */

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `File not found: ${filePath}`
    );
  }

  const raw = fs.readFileSync(
    filePath,
    "utf8"
  );

  return JSON.parse(raw);
}


function writeJson(
  filePath,
  data
) {

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf8"
  );
}


function getProvinceName(
  provinceId
) {

  const province =
    PROVINCES.find(
      item =>
        item.id === provinceId
    );

  return province
    ? province.name
    : provinceId;
}


/* =========================================================
   VALIDATE DRAW
   ========================================================= */

function isValidDraw(draw) {

  if (
    !draw ||
    !draw.province ||
    !draw.date ||
    !draw.prizes
  ) {
    return false;
  }

  const prizes =
    draw.prizes;

  if (
    typeof prizes.db !== "string" ||
    prizes.db.length !== 6
  ) {
    return false;
  }

  return true;
}


/* =========================================================
   BUILD LATEST RESULTS
   ========================================================= */

function buildLatest(seed) {

  const draws =
    Array.isArray(seed.draws)
      ? seed.draws.filter(isValidDraw)
      : [];

  const provinces = {};

  for (
    const province
    of PROVINCES
  ) {

    const provinceDraws =
      draws
        .filter(
          draw =>
            draw.province ===
            province.id
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(
              a.date
            )
        );

    if (
      provinceDraws.length === 0
    ) {
      continue;
    }

    const latest =
      provinceDraws[0];

    provinces[province.id] = {

      province:
        province.id,

      provinceName:
        province.name,

      date:
        latest.date,

      ticketCode:
        latest.ticketCode || "",

      prizes:
        latest.prizes
    };
  }

  return {

    generatedAt:
      new Date().toISOString(),

    sourceGeneratedAt:
      seed.generatedAt || null,

    provinceCount:
      Object.keys(
        provinces
      ).length,

    provinces
  };
}


/* =========================================================
   NORMALIZE PREDICTIONS
   ========================================================= */

function normalizePredictions(
  predictionsData
) {

  const source =
    predictionsData &&
    predictionsData.provinces &&
    typeof predictionsData.provinces === "object"
      ? predictionsData.provinces
      : {};

  const provinces = {};

  for (
    const province
    of PROVINCES
  ) {

    const prediction =
      source[province.id];

    if (!prediction) {
      continue;
    }

    provinces[province.id] = {
      ...prediction,

      province:
        province.id,

      provinceName:
        province.name
    };
  }

  return {

    generatedAt:
      predictionsData.generatedAt ||
      new Date().toISOString(),

    sourceGeneratedAt:
      predictionsData.sourceGeneratedAt ||
      null,

    provinceCount:
      Object.keys(
        provinces
      ).length,

    ready:
      Object.keys(
        provinces
      ).length ===
      PROVINCES.length,

    provinces
  };
}


/* =========================================================
   BUILD STATUS
   ========================================================= */

function buildStatus(
  latest,
  predictions
) {

  const errors = [];

  const provinces = {};

  for (
    const province
    of PROVINCES
  ) {

    const hasLatest =
      Boolean(
        latest.provinces[
          province.id
        ]
      );

    const hasPrediction =
      Boolean(
        predictions.provinces[
          province.id
        ]
      );

    provinces[province.id] = {

      provinceName:
        province.name,

      latest:
        hasLatest,

      prediction:
        hasPrediction
    };

    if (!hasLatest) {

      errors.push(
        `${province.name}: latest result missing`
      );
    }

    if (!hasPrediction) {

      errors.push(
        `${province.name}: prediction missing`
      );
    }
  }

  const latestReady =
    Object.values(
      provinces
    ).filter(
      item => item.latest
    ).length;

  const predictionsReady =
    Object.values(
      provinces
    ).filter(
      item => item.prediction
    ).length;

  return {

    generatedAt:
      new Date().toISOString(),

    totalProvinces:
      PROVINCES.length,

    latestReady,

    predictionsReady,

    errorCount:
      errors.length,

    ready:
      latestReady ===
        PROVINCES.length &&
      predictionsReady ===
        PROVINCES.length &&
      errors.length === 0,

    errors,

    provinces
  };
}


/* =========================================================
   MAIN
   ========================================================= */

function main() {

  console.log(
    "========================================"
  );

  console.log(
    "XSMN API BUILDER"
  );

  console.log(
    "========================================"
  );

  fs.mkdirSync(
    API_DIR,
    {
      recursive: true
    }
  );


  /* ---------- LOAD DATABASE ---------- */

  console.log(
    "Loading xsmn_seed.json..."
  );

  const seed =
    readJson(
      SEED_FILE
    );

  console.log(
    `Database draws: ${
      Array.isArray(seed.draws)
        ? seed.draws.length
        : 0
    }`
  );


  /* ---------- LOAD PREDICTIONS ---------- */

  console.log(
    "Loading xsmn_predictions.json..."
  );

  const predictionsData =
    readJson(
      PREDICTIONS_FILE
    );


  /* ---------- BUILD LATEST ---------- */

  console.log(
    "Building latest results..."
  );

  const latest =
    buildLatest(
      seed
    );


  /* ---------- BUILD PREDICTIONS ---------- */

  console.log(
    "Building predictions..."
  );

  const predictions =
    normalizePredictions(
      predictionsData
    );


  /* ---------- BUILD STATUS ---------- */

  console.log(
    "Building API status..."
  );

  const status =
    buildStatus(
      latest,
      predictions
    );


  /* ---------- WRITE FILES ---------- */

  writeJson(
    path.join(
      API_DIR,
      "latest.json"
    ),
    latest
  );

  writeJson(
    path.join(
      API_DIR,
      "predictions.json"
    ),
    predictions
  );

  writeJson(
    path.join(
      API_DIR,
      "status.json"
    ),
    status
  );


  /* ---------- RESULT ---------- */

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "XSMN API RESULT"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Latest      : ${status.latestReady}/${status.totalProvinces}`
  );

  console.log(
    `Predictions : ${status.predictionsReady}/${status.totalProvinces}`
  );

  console.log(
    `Errors      : ${status.errorCount}`
  );

  console.log(
    `Ready       : ${status.ready}`
  );

  console.log(
    "----------------------------------------"
  );


  if (
    status.errors.length > 0
  ) {

    for (
      const error
      of status.errors
    ) {

      console.log(
        `ERROR: ${error}`
      );
    }
  }


  if (!status.ready) {

    console.log(
      "✗ XSMN API NOT READY"
    );

    process.exitCode = 1;

    return;
  }


  console.log(
    "✓ XSMN API READY"
  );

  console.log(
    "========================================"
  );
}


/* =========================================================
   RUN
   ========================================================= */

try {

  main();

} catch (error) {

  console.error("");
  console.error(
    "FATAL ERROR:"
  );

  console.error(
    error &&
    error.stack
      ? error.stack
      : error
  );

  process.exit(1);
}
