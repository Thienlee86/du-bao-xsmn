/**
 * XSMN HISTORY DATABASE MAINTAINER
 * ================================
 *
 * Nhiệm vụ:
 * - Đọc database lịch sử data/xsmn_seed.json
 * - Đọc kết quả mới nhất của 21 đài từ *-latest.json
 * - Thêm kỳ mới nếu chưa tồn tại
 * - Chống trùng province + date
 * - Chỉ giữ tối đa 100 kỳ / đài
 * - Loại record thuộc province không hợp lệ
 * - Kiểm tra cấu trúc giải
 * - Database chuẩn cuối cùng: 21 x 100 = 2100 kỳ
 *
 * Script này KHÔNG crawl lại lịch sử.
 */

const fs = require("fs");
const path = require("path");


/* =========================================================
   CONFIG
   ========================================================= */

const DATA_DIR =
  path.join(__dirname, "..", "data");

const OUTPUT_FILE =
  path.join(DATA_DIR, "xsmn_seed.json");

const MAX_DRAWS_PER_PROVINCE = 100;


/* =========================================================
   21 ĐÀI XSMN
   ========================================================= */

const PROVINCES = [
  {
    id: "an-giang",
    name: "An Giang"
  },
  {
    id: "bac-lieu",
    name: "Bạc Liêu"
  },
  {
    id: "ben-tre",
    name: "Bến Tre"
  },
  {
    id: "binh-duong",
    name: "Bình Dương"
  },
  {
    id: "binh-phuoc",
    name: "Bình Phước"
  },
  {
    id: "binh-thuan",
    name: "Bình Thuận"
  },
  {
    id: "ca-mau",
    name: "Cà Mau"
  },
  {
    id: "can-tho",
    name: "Cần Thơ"
  },
  {
    id: "da-lat",
    name: "Đà Lạt"
  },
  {
    id: "dong-nai",
    name: "Đồng Nai"
  },
  {
    id: "dong-thap",
    name: "Đồng Tháp"
  },
  {
    id: "hau-giang",
    name: "Hậu Giang"
  },
  {
    id: "kien-giang",
    name: "Kiên Giang"
  },
  {
    id: "long-an",
    name: "Long An"
  },
  {
    id: "soc-trang",
    name: "Sóc Trăng"
  },
  {
    id: "tay-ninh",
    name: "Tây Ninh"
  },
  {
    id: "tien-giang",
    name: "Tiền Giang"
  },
  {
    id: "tphcm",
    name: "TP.HCM"
  },
  {
    id: "tra-vinh",
    name: "Trà Vinh"
  },
  {
    id: "vinh-long",
    name: "Vĩnh Long"
  },
  {
    id: "vung-tau",
    name: "Vũng Tàu"
  }
];


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function makeKey(draw) {

  return `${draw.province}|${draw.date}`;
}


function isKnownProvince(provinceId) {

  return PROVINCES.some(
    province =>
      province.id === provinceId
  );
}


/* =========================================================
   VALIDATE PRIZE STRUCTURE
   ========================================================= */

function validatePrizes(prizes) {

  if (
    !prizes ||
    typeof prizes !== "object"
  ) {
    return false;
  }


  if (
    typeof prizes.db !== "string" ||
    prizes.db.length !== 6
  ) {
    return false;
  }


  if (
    typeof prizes.g1 !== "string" ||
    prizes.g1.length !== 5
  ) {
    return false;
  }


  if (
    typeof prizes.g2 !== "string" ||
    prizes.g2.length !== 5
  ) {
    return false;
  }


  if (
    !Array.isArray(prizes.g3) ||
    prizes.g3.length !== 2
  ) {
    return false;
  }


  if (
    !Array.isArray(prizes.g4) ||
    prizes.g4.length !== 7
  ) {
    return false;
  }


  if (
    typeof prizes.g5 !== "string" ||
    prizes.g5.length !== 4
  ) {
    return false;
  }


  if (
    !Array.isArray(prizes.g6) ||
    prizes.g6.length !== 3
  ) {
    return false;
  }


  if (
    typeof prizes.g7 !== "string" ||
    prizes.g7.length !== 3
  ) {
    return false;
  }


  if (
    typeof prizes.g8 !== "string" ||
    prizes.g8.length !== 2
  ) {
    return false;
  }


  return true;
}


/* =========================================================
   VALIDATE DRAW
   ========================================================= */

function validateDraw(draw) {

  if (
    !draw ||
    typeof draw !== "object"
  ) {
    return false;
  }


  if (
    !draw.province ||
    !isKnownProvince(draw.province)
  ) {
    return false;
  }


  if (
    typeof draw.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draw.date)
  ) {
    return false;
  }


  if (
    !validatePrizes(draw.prizes)
  ) {
    return false;
  }


  return true;
}


/* =========================================================
   LOAD EXISTING DATABASE
   ========================================================= */

function loadExistingDatabase() {

  if (!fs.existsSync(OUTPUT_FILE)) {

    throw new Error(
      "data/xsmn_seed.json does not exist."
    );
  }


  const raw =
    fs.readFileSync(
      OUTPUT_FILE,
      "utf8"
    );


  const data =
    JSON.parse(raw);


  if (!Array.isArray(data.draws)) {

    throw new Error(
      "xsmn_seed.json does not contain draws array."
    );
  }


  return data.draws;
}


/* =========================================================
   CONVERT LATEST FILE
   ========================================================= */

function convertLatestToDraw(
  province,
  latest
) {

  if (
    !latest ||
    !latest.drawDate ||
    !latest.results
  ) {
    return null;
  }


  const results =
    latest.results;


  const draw = {

    province:
      province.id,

    date:
      latest.drawDate,

    ticketCode:
      "",

    prizes: {

      db:
        results.giaidb?.[0] || "",

      g1:
        results.giai1?.[0] || "",

      g2:
        results.giai2?.[0] || "",

      g3:
        results.giai3 || [],

      g4:
        results.giai4 || [],

      g5:
        results.giai5?.[0] || "",

      g6:
        results.giai6 || [],

      g7:
        results.giai7?.[0] || "",

      g8:
        results.giai8?.[0] || ""
    }
  };


  if (!validateDraw(draw)) {

    return null;
  }


  return draw;
}


/* =========================================================
   LOAD LATEST RESULT
   ========================================================= */

function loadLatestDraw(province) {

  const filePath =
    path.join(
      DATA_DIR,
      `${province.id}-latest.json`
    );


  if (!fs.existsSync(filePath)) {

    console.log(
      `⚠ Missing latest file: ${province.id}`
    );

    return null;
  }


  try {

    const raw =
      fs.readFileSync(
        filePath,
        "utf8"
      );


    const latest =
      JSON.parse(raw);


    return convertLatestToDraw(
      province,
      latest
    );


  } catch (error) {

    console.log(
      `⚠ Cannot read ${province.id}-latest.json: ${error.message}`
    );

    return null;
  }
}


/* =========================================================
   DEDUPLICATE
   ========================================================= */

function deduplicate(draws) {

  const map =
    new Map();


  for (const draw of draws) {

    if (!validateDraw(draw)) {
      continue;
    }


    const key =
      makeKey(draw);


    map.set(
      key,
      draw
    );
  }


  return Array.from(
    map.values()
  );
}


/* =========================================================
   BUILD DATABASE
   ========================================================= */

function buildDatabase(existingDraws) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "MERGING LATEST RESULTS"
  );

  console.log(
    "========================================"
  );


  /*
   * Bước 1:
   * Loại record không hợp lệ.
   */

  const validExisting =
    existingDraws.filter(
      validateDraw
    );


  console.log(
    `Existing raw   : ${existingDraws.length}`
  );

  console.log(
    `Existing valid : ${validExisting.length}`
  );


  /*
   * Bước 2:
   * Thêm latest của 21 đài.
   */

  const combined = [
    ...validExisting
  ];


  let latestLoaded = 0;


  for (const province of PROVINCES) {

    const latest =
      loadLatestDraw(
        province
      );


    if (!latest) {

      console.log(
        `⚠ ${province.name}: latest unavailable`
      );

      continue;
    }


    combined.push(
      latest
    );


    latestLoaded++;


    console.log(
      `✓ ${province.name.padEnd(12)} | ${latest.date} | DB ${latest.prizes.db}`
    );
  }


  console.log("");
  console.log(
    `Latest loaded: ${latestLoaded}/${PROVINCES.length}`
  );


  /*
   * Bước 3:
   * Deduplicate.
   */

  const unique =
    deduplicate(
      combined
    );


  /*
   * Bước 4:
   * Mỗi tỉnh giữ đúng tối đa 100 kỳ.
   */

  const finalDraws = [];


  for (const province of PROVINCES) {

    const provinceDraws =
      unique
        .filter(
          draw =>
            draw.province === province.id
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date)
        )
        .slice(
          0,
          MAX_DRAWS_PER_PROVINCE
        );


    finalDraws.push(
      ...provinceDraws
    );
  }


  /*
   * Sort database:
   * province ASC
   * date DESC
   */

  finalDraws.sort(
    (a, b) => {

      const provinceCompare =
        a.province.localeCompare(
          b.province
        );


      if (provinceCompare !== 0) {
        return provinceCompare;
      }


      return b.date.localeCompare(
        a.date
      );
    }
  );


  return finalDraws;
}


/* =========================================================
   DATABASE VALIDATION
   ========================================================= */

function validateDatabase(draws) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "DATABASE VALIDATION"
  );

  console.log(
    "========================================"
  );


  const expectedTotal =
    PROVINCES.length *
    MAX_DRAWS_PER_PROVINCE;


  let completeProvinces = 0;

  let incompleteProvinces = 0;

  let invalidDraws = 0;


  const seen =
    new Set();

  let duplicates = 0;


  for (const draw of draws) {

    if (!validateDraw(draw)) {
      invalidDraws++;
    }


    const key =
      makeKey(draw);


    if (seen.has(key)) {
      duplicates++;
    }


    seen.add(key);
  }


  console.log("");
  console.log(
    "----- DRAWS BY PROVINCE -----"
  );


  for (const province of PROVINCES) {

    const provinceDraws =
      draws
        .filter(
          draw =>
            draw.province === province.id
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date)
        );


    const count =
      provinceDraws.length;


    const newest =
      count > 0
        ? provinceDraws[0].date
        : "-";


    const oldest =
      count > 0
        ? provinceDraws[count - 1].date
        : "-";


    const status =
      count === MAX_DRAWS_PER_PROVINCE
        ? "OK"
        : "INCOMPLETE";


    if (
      count ===
      MAX_DRAWS_PER_PROVINCE
    ) {

      completeProvinces++;

    } else {

      incompleteProvinces++;
    }


    console.log(
      `${province.name.padEnd(12)} | ${String(count).padStart(3)} kỳ | ${newest} -> ${oldest} | ${status}`
    );
  }


  console.log("");
  console.log(
    "----------------------------------------"
  );

  console.log(
    `TOTAL DRAWS        : ${draws.length}`
  );

  console.log(
    `EXPECTED DRAWS     : ${expectedTotal}`
  );

  console.log(
    `COMPLETE PROVINCES : ${completeProvinces}/${PROVINCES.length}`
  );

  console.log(
    `INCOMPLETE         : ${incompleteProvinces}/${PROVINCES.length}`
  );

  console.log(
    `DUPLICATES         : ${duplicates}`
  );

  console.log(
    `INVALID DRAWS      : ${invalidDraws}`
  );

  console.log(
    "----------------------------------------"
  );


  const valid =
    draws.length === expectedTotal &&
    completeProvinces === PROVINCES.length &&
    incompleteProvinces === 0 &&
    duplicates === 0 &&
    invalidDraws === 0;


  if (valid) {

    console.log("");
    console.log(
      "✓ XSMN HISTORY DATABASE READY"
    );

    console.log(
      "========================================"
    );


    return true;
  }


  console.log("");
  console.log(
    "✗ DATABASE VALIDATION FAILED"
  );

  console.log(
    "========================================"
  );


  return false;
}


/* =========================================================
   SAVE DATABASE
   ========================================================= */

function saveDatabase(draws) {

  const output = {

    generatedAt:
      new Date()
        .toISOString()
        .slice(0, 10),

    source:
      "minhngoc.net.vn",

    draws
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


  const size =
    fs.statSync(
      OUTPUT_FILE
    ).size;


  console.log("");
  console.log(
    `✓ Saved: ${OUTPUT_FILE}`
  );

  console.log(
    `File size: ${(size / 1024).toFixed(1)} KB`
  );
}


/* =========================================================
   MAIN
   ========================================================= */

function main() {

  console.log(
    "========================================"
  );

  console.log(
    "XSMN HISTORY DATABASE MAINTAINER"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Provinces : ${PROVINCES.length}`
  );

  console.log(
    `Target    : ${MAX_DRAWS_PER_PROVINCE} draws / province`
  );

  console.log(
    `Expected  : ${PROVINCES.length * MAX_DRAWS_PER_PROVINCE} draws`
  );


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


  /*
   * Load database hiện tại.
   */

  const existingDraws =
    loadExistingDatabase();


  console.log(
    `Loaded    : ${existingDraws.length} existing draws`
  );


  /*
   * Merge latest + clean.
   */

  const finalDraws =
    buildDatabase(
      existingDraws
    );


  /*
   * Validate TRƯỚC khi ghi file.
   *
   * Nếu database không đủ 21 x 100,
   * không ghi đè database hiện tại.
   */

  const valid =
    validateDatabase(
      finalDraws
    );


  if (!valid) {

    throw new Error(
      "Database validation failed. Existing xsmn_seed.json was NOT overwritten."
    );
  }


  /*
   * Chỉ save khi validation thành công.
   */

  saveDatabase(
    finalDraws
  );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "DONE"
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
    error.message
  );

  process.exit(1);
  }
