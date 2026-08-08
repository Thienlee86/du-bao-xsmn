/**
 * XSMN HISTORY BOOTSTRAP
 * ======================
 *
 * Nhiệm vụ:
 * - Tạo / bổ sung database lịch sử XSMN.
 * - Hỗ trợ TEST_PROVINCE để thử riêng một đài trước.
 * - Chống trùng province + date.
 * - Kiểm tra cấu trúc giải.
 * - Giữ tối đa 100 kỳ / đài.
 *
 * TEST:
 * TEST_PROVINCE=an-giang node scripts/bootstrap-history.js
 *
 * NORMAL:
 * node scripts/bootstrap-history.js
 */

const fs = require("fs");
const path = require("path");


/* =========================================================
   CONFIG
   ========================================================= */

const DATA_DIR =
  path.join(
    __dirname,
    "..",
    "data"
  );

const OUTPUT_FILE =
  path.join(
    DATA_DIR,
    "xsmn_seed.json"
  );

const MAX_DRAWS_PER_PROVINCE = 100;

const TEST_PROVINCE =
  process.env.TEST_PROVINCE
    ? String(
        process.env.TEST_PROVINCE
      ).trim()
    : "";


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
   ACTIVE PROVINCES
   ========================================================= */

function getActiveProvinces() {

  if (!TEST_PROVINCE) {

    return PROVINCES;

  }


  const province =
    PROVINCES.find(
      item =>
        item.id === TEST_PROVINCE
    );


  if (!province) {

    throw new Error(
      `Unknown TEST_PROVINCE: ${TEST_PROVINCE}`
    );

  }


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    `TEST MODE: ${province.name}`
  );

  console.log(
    "========================================"
  );


  return [
    province
  ];

}


/* =========================================================
   HELPERS
   ========================================================= */

function makeKey(draw) {

  return (
    `${draw.province}|${draw.date}`
  );

}


function isKnownProvince(
  provinceId
) {

  return PROVINCES.some(
    province =>
      province.id === provinceId
  );

}


/* =========================================================
   VALIDATE PRIZES
   ========================================================= */

function isDigitString(
  value,
  length
) {

  return (
    typeof value === "string" &&
    new RegExp(
      `^\\d{${length}}$`
    ).test(value)
  );

}


function isDigitArray(
  value,
  count,
  length
) {

  return (
    Array.isArray(value) &&
    value.length === count &&
    value.every(
      item =>
        isDigitString(
          item,
          length
        )
    )
  );

}


function validatePrizes(
  prizes
) {

  if (
    !prizes ||
    typeof prizes !== "object"
  ) {

    return false;

  }


  return (

    isDigitString(
      prizes.db,
      6
    ) &&

    isDigitString(
      prizes.g1,
      5
    ) &&

    isDigitString(
      prizes.g2,
      5
    ) &&

    isDigitArray(
      prizes.g3,
      2,
      5
    ) &&

    isDigitArray(
      prizes.g4,
      7,
      5
    ) &&

    isDigitString(
      prizes.g5,
      4
    ) &&

    isDigitArray(
      prizes.g6,
      3,
      4
    ) &&

    isDigitString(
      prizes.g7,
      3
    ) &&

    isDigitString(
      prizes.g8,
      2
    )

  );

}


/* =========================================================
   VALIDATE DRAW
   ========================================================= */

function validateDraw(
  draw
) {

  if (
    !draw ||
    typeof draw !== "object"
  ) {

    return false;

  }


  if (
    !draw.province ||
    !isKnownProvince(
      draw.province
    )
  ) {

    return false;

  }


  if (
    typeof draw.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/
      .test(
        draw.date
      )
  ) {

    return false;

  }


  if (
    !validatePrizes(
      draw.prizes
    )
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   LOAD EXISTING DATABASE
   ========================================================= */

function loadExistingDatabase() {

  if (
    !fs.existsSync(
      OUTPUT_FILE
    )
  ) {

    console.log(
      "xsmn_seed.json chưa tồn tại. Khởi tạo database rỗng."
    );

    return [];

  }


  const raw =
    fs.readFileSync(
      OUTPUT_FILE,
      "utf8"
    );


  const data =
    JSON.parse(
      raw
    );


  if (
    !Array.isArray(
      data.draws
    )
  ) {

    throw new Error(
      "xsmn_seed.json does not contain draws array."
    );

  }


  return data.draws;

}


/* =========================================================
   CONVERT LATEST JSON
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
        String(
          results.giaidb?.[0] ||
          ""
        ),

      g1:
        String(
          results.giai1?.[0] ||
          ""
        ),

      g2:
        String(
          results.giai2?.[0] ||
          ""
        ),

      g3:
        Array.isArray(
          results.giai3
        )
          ? results.giai3.map(
              String
            )
          : [],

      g4:
        Array.isArray(
          results.giai4
        )
          ? results.giai4.map(
              String
            )
          : [],

      g5:
        String(
          results.giai5?.[0] ||
          ""
        ),

      g6:
        Array.isArray(
          results.giai6
        )
          ? results.giai6.map(
              String
            )
          : [],

      g7:
        String(
          results.giai7?.[0] ||
          ""
        ),

      g8:
        String(
          results.giai8?.[0] ||
          ""
        )

    }

  };


  if (
    !validateDraw(
      draw
    )
  ) {

    console.log(
      `⚠ ${province.name}: latest JSON không hợp lệ`
    );

    return null;

  }


  return draw;

}


/* =========================================================
   LOAD LATEST
   ========================================================= */

function loadLatestDraw(
  province
) {

  const filePath =
    path.join(
      DATA_DIR,
      `${province.id}-latest.json`
    );


  if (
    !fs.existsSync(
      filePath
    )
  ) {

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
      JSON.parse(
        raw
      );


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

function deduplicate(
  draws
) {

  const map =
    new Map();


  for (
    const draw of draws
  ) {

    if (
      !validateDraw(
        draw
      )
    ) {

      continue;

    }


    map.set(
      makeKey(draw),
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

function buildDatabase(
  existingDraws,
  activeProvinces
) {

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


  const combined = [
    ...validExisting
  ];


  let latestLoaded = 0;


  for (
    const province of
    activeProvinces
  ) {

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
    `Latest loaded: ${latestLoaded}/${activeProvinces.length}`
  );


  const unique =
    deduplicate(
      combined
    );


  /*
   * TEST MODE:
   * chỉ xử lý tỉnh đang test,
   * nhưng không phá dữ liệu tỉnh khác
   * đang có trong database.
   */

  if (
    TEST_PROVINCE
  ) {

    const activeIds =
      new Set(
        activeProvinces.map(
          p => p.id
        )
      );


    const untouched =
      unique.filter(
        draw =>
          !activeIds.has(
            draw.province
          )
      );


    const rebuilt = [];


    for (
      const province of
      activeProvinces
    ) {

      const provinceDraws =
        unique
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
          )
          .slice(
            0,
            MAX_DRAWS_PER_PROVINCE
          );


      rebuilt.push(
        ...provinceDraws
      );

    }


    const finalDraws = [
      ...untouched,
      ...rebuilt
    ];


    finalDraws.sort(
      sortDatabase
    );


    return finalDraws;

  }


  /*
   * NORMAL MODE:
   * xử lý đủ 21 đài.
   */

  const finalDraws = [];


  for (
    const province of
    PROVINCES
  ) {

    const provinceDraws =
      unique
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
        )
        .slice(
          0,
          MAX_DRAWS_PER_PROVINCE
        );


    finalDraws.push(
      ...provinceDraws
    );

  }


  finalDraws.sort(
    sortDatabase
  );


  return finalDraws;

}


/* =========================================================
   SORT
   ========================================================= */

function sortDatabase(
  a,
  b
) {

  const provinceCompare =
    a.province.localeCompare(
      b.province
    );


  if (
    provinceCompare !== 0
  ) {

    return provinceCompare;

  }


  return b.date.localeCompare(
    a.date
  );

}


/* =========================================================
   VALIDATE TEST PROVINCE
   ========================================================= */

function validateTestProvince(
  draws,
  province
) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "TEST VALIDATION"
  );

  console.log(
    "========================================"
  );


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


  const seen =
    new Set();


  let duplicates = 0;

  let invalid = 0;


  for (
    const draw of
    provinceDraws
  ) {

    if (
      !validateDraw(
        draw
      )
    ) {

      invalid++;

    }


    const key =
      makeKey(
        draw
      );


    if (
      seen.has(
        key
      )
    ) {

      duplicates++;

    }


    seen.add(
      key
    );

  }


  const newest =
    provinceDraws.length
      ? provinceDraws[0].date
      : "-";


  const oldest =
    provinceDraws.length
      ? provinceDraws[
          provinceDraws.length - 1
        ].date
      : "-";


  console.log(
    `Province   : ${province.name}`
  );

  console.log(
    `Draws      : ${provinceDraws.length}`
  );

  console.log(
    `Newest     : ${newest}`
  );

  console.log(
    `Oldest     : ${oldest}`
  );

  console.log(
    `Duplicates : ${duplicates}`
  );

  console.log(
    `Invalid    : ${invalid}`
  );


  /*
   * Trong TEST MODE chưa bắt buộc phải đủ
   * 100 kỳ ngay.
   *
   * Mục tiêu đầu tiên là xác nhận pipeline
   * đọc/merge dữ liệu hoạt động đúng.
   */

  const valid =
    provinceDraws.length > 0 &&
    duplicates === 0 &&
    invalid === 0;


  if (
    valid
  ) {

    console.log("");
    console.log(
      "✓ TEST DATABASE VALID"
    );

  } else {

    console.log("");
    console.log(
      "✗ TEST DATABASE INVALID"
    );

  }


  return valid;

}


/* =========================================================
   VALIDATE FULL DATABASE
   ========================================================= */

function validateFullDatabase(
  draws
) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "FULL DATABASE VALIDATION"
  );

  console.log(
    "========================================"
  );


  const expectedTotal =
    PROVINCES.length *
    MAX_DRAWS_PER_PROVINCE;


  let completeProvinces = 0;

  let invalidDraws = 0;

  let duplicates = 0;


  const seen =
    new Set();


  for (
    const draw of draws
  ) {

    if (
      !validateDraw(
        draw
      )
    ) {

      invalidDraws++;

    }


    const key =
      makeKey(
        draw
      );


    if (
      seen.has(
        key
      )
    ) {

      duplicates++;

    }


    seen.add(
      key
    );

  }


  console.log("");
  console.log(
    "----- DRAWS BY PROVINCE -----"
  );


  for (
    const province of
    PROVINCES
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


    const count =
      provinceDraws.length;


    const newest =
      count
        ? provinceDraws[0].date
        : "-";


    const oldest =
      count
        ? provinceDraws[
            count - 1
          ].date
        : "-";


    const status =
      count ===
      MAX_DRAWS_PER_PROVINCE
        ? "OK"
        : "INCOMPLETE";


    if (
      count ===
      MAX_DRAWS_PER_PROVINCE
    ) {

      completeProvinces++;

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
    `DUPLICATES         : ${duplicates}`
  );

  console.log(
    `INVALID DRAWS      : ${invalidDraws}`
  );

  console.log(
    "----------------------------------------"
  );


  return (

    draws.length ===
      expectedTotal &&

    completeProvinces ===
      PROVINCES.length &&

    duplicates === 0 &&

    invalidDraws === 0

  );

}


/* =========================================================
   SAVE
   ========================================================= */

function saveDatabase(
  draws
) {

  const output = {

    generatedAt:
      new Date()
        .toISOString(),

    source:
      "minhngoc.net.vn",

    maxDrawsPerProvince:
      MAX_DRAWS_PER_PROVINCE,

    draws

  };


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


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
    "XSMN HISTORY BOOTSTRAP"
  );

  console.log(
    "========================================"
  );


  const activeProvinces =
    getActiveProvinces();


  console.log(
    `Mode      : ${TEST_PROVINCE ? "TEST" : "FULL"}`
  );

  console.log(
    `Provinces : ${activeProvinces.length}`
  );

  console.log(
    `Target    : ${MAX_DRAWS_PER_PROVINCE} draws / province`
  );


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


  const existingDraws =
    loadExistingDatabase();


  console.log(
    `Loaded    : ${existingDraws.length} existing draws`
  );


  const finalDraws =
    buildDatabase(
      existingDraws,
      activeProvinces
    );


  let valid = false;


  if (
    TEST_PROVINCE
  ) {

    valid =
      validateTestProvince(
        finalDraws,
        activeProvinces[0]
      );

  } else {

    valid =
      validateFullDatabase(
        finalDraws
      );

  }


  if (!valid) {

    throw new Error(
      TEST_PROVINCE
        ? `Test validation failed for ${TEST_PROVINCE}. Database was NOT overwritten.`
        : "Full database validation failed. Database was NOT overwritten."
    );

  }


  saveDatabase(
    finalDraws
  );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    TEST_PROVINCE
      ? `✓ TEST ${TEST_PROVINCE} COMPLETE`
      : "✓ FULL DATABASE COMPLETE"
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
