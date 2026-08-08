/**
 * XSMN API BUILDER
 * ================
 *
 * Tạo các file JSON nhẹ để Android App sử dụng.
 *
 * Input:
 * - data/xsmn_predictions.json
 * - data/*-latest.json
 *
 * Output:
 * - data/api/predictions.json
 * - data/api/latest.json
 * - data/api/status.json
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const API_DIR = path.join(DATA_DIR, "api");

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
    return null;
  }

  try {

    return JSON.parse(
      fs.readFileSync(
        filePath,
        "utf8"
      )
    );

  } catch (error) {

    console.error(
      `Could not read ${filePath}:`,
      error.message
    );

    return null;
  }
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


/* =========================================================
   NORMALIZE PREDICTION
   ========================================================= */

function normalizePrediction(
  province,
  source
) {

  if (!source) {
    return null;
  }


  /*
   * build-predictions.js có thể sử dụng
   * một trong các tên field dưới đây.
   *
   * Phần này giúp API chịu được thay đổi nhỏ
   * của prediction builder.
   */

  const sixDigit =
    source.topPredictions ||
    source.predictions ||
    source.specialPrizePredictions ||
    source.top6 ||
    [];


  const last2 =
    source.last2 ||
    source.lastTwo ||
    source.last2Predictions ||
    [];


  return {
    province:
      province.id,

    provinceName:
      province.name,

    basedOnDraws:
      source.basedOnDraws ??
      source.drawCount ??
      null,

    latestDate:
      source.latestDate ??
      null,

    latestSpecialPrize:
      source.latestSpecialPrize ??
      null,

    sixDigit:
      sixDigit,

    last2:
      last2
  };
}


/* =========================================================
   BUILD PREDICTIONS API
   ========================================================= */

function buildPredictionsApi() {

  console.log("");
  console.log(
    "Building predictions API..."
  );


  const source =
    readJson(
      PREDICTIONS_FILE
    );


  if (!source) {

    throw new Error(
      "data/xsmn_predictions.json not found or invalid"
    );
  }


  const output = {

    generatedAt:
      source.generatedAt ||
      new Date().toISOString(),

    ready:
      source.ready !== false,

    provinceCount:
      PROVINCES.length,

    provinces: {}
  };


  for (const province of PROVINCES) {
