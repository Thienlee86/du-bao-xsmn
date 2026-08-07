/**
 * XSMN HISTORY BUILDER
 * ====================
 * Xây dựng dữ liệu lịch sử XSMN cho toàn bộ 21 đài.
 *
 * Mục tiêu:
 * - Tối đa 100 kỳ / đài
 * - Không tạo dữ liệu trùng
 * - Giữ lại dữ liệu cũ nếu request lỗi
 * - Retry khi tải thất bại
 * - Delay giữa các request
 *
 * Output:
 * data/xsmn_seed.json
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "xsmn_seed.json");

const MAX_DRAWS_PER_PROVINCE = 100;

const REQUEST_DELAY = 1200;
const PROVINCE_DELAY = 2000;

const MAX_RETRIES = 3;


/* =========================================================
   PROVINCES
   ========================================================= */

const PROVINCES = [
  {
    id: "an-giang",
    name: "An Giang",
    slug: "an-giang"
  },
  {
    id: "bac-lieu",
    name: "Bạc Liêu",
    slug: "bac-lieu"
  },
  {
    id: "ben-tre",
    name: "Bến Tre",
    slug: "ben-tre"
  },
  {
    id: "binh-duong",
    name: "Bình Dương",
    slug: "binh-duong"
  },
  {
    id: "binh-phuoc",
    name: "Bình Phước",
    slug: "binh-phuoc"
  },
  {
    id: "binh-thuan",
    name: "Bình Thuận",
    slug: "binh-thuan"
  },
  {
    id: "ca-mau",
    name: "Cà Mau",
    slug: "ca-mau"
  },
  {
    id: "can-tho",
    name: "Cần Thơ",
    slug: "can-tho"
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    slug: "da-lat"
  },
  {
    id: "dong-nai",
    name: "Đồng Nai",
    slug: "dong-nai"
  },
  {
    id: "dong-thap",
    name: "Đồng Tháp",
    slug: "dong-thap"
  },
  {
    id: "hau-giang",
    name: "Hậu Giang",
    slug: "hau-giang"
  },
  {
    id: "kien-giang",
    name: "Kiên Giang",
    slug: "kien-giang"
  },
  {
    id: "long-an",
    name: "Long An",
    slug: "long-an"
  },
  {
    id: "soc-trang",
    name: "Sóc Trăng",
    slug: "soc-trang"
  },
  {
    id: "tay-ninh",
    name: "Tây Ninh",
    slug: "tay-ninh"
  },
  {
    id: "tien-giang",
    name: "Tiền Giang",
    slug: "tien-giang"
  },
  {
    id: "tphcm",
    name: "TP. HCM",
    slug: "tp-hcm"
  },
  {
    id: "tra-vinh",
    name: "Trà Vinh",
    slug: "tra-vinh"
  },
  {
    id: "vinh-long",
    name: "Vĩnh Long",
    slug: "vinh-long"
  },
  {
    id: "vung-tau",
    name: "Vũng Tàu",
    slug: "vung-tau"
  }
];


/* =========================================================
   HELPERS
   ========================================================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function decodeBasicEntities(text) {

  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-");
}


function stripTags(html) {

  return decodeBasicEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

async function download(url) {

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        25000
      );

    try {

      console.log(
        `Request ${attempt}/${MAX_RETRIES}: ${url}`
      );

      const response =
        await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

            "Accept-Language":
              "vi-VN,vi;q=0.9,en;q=0.8"
          }
        });


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status} ${response.statusText}`
        );
      }


      const html =
        await response.text();


      if (
        !html ||
        html.length < 1000
      ) {

        throw new Error(
          "Downloaded HTML is unexpectedly small"
        );
      }


      clearTimeout(timeout);

      return html;


    } catch (error) {

      clearTimeout(timeout);

      lastError = error;

      console.log(
        `Attempt ${attempt} failed: ${error.message}`
      );


      if (attempt < MAX_RETRIES) {

        await sleep(
          2000 * attempt
        );
      }
    }
  }


  throw lastError ||
    new Error("Download failed");
}


/* =========================================================
   PRIZE PARSER
   ========================================================= */

function extractPrize(html, prizeClass) {

  const tdRegex =
    new RegExp(
      `<td[^>]*class=["'][^"']*\\b${prizeClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
      "i"
    );


  const match =
    html.match(tdRegex);


  if (!match) {
    return [];
  }


  const content =
    match[1];


  const numbers = [];


  const divRegex =
    /<div[^>]*>\s*([0-9]+)\s*<\/div>/gi;


  let result;


  while (
    (result = divRegex.exec(content)) !== null
  ) {

    numbers.push(
      result[1]
    );
  }


  if (numbers.length === 0) {

    const plain =
      stripTags(content);


    const fallback =
      plain.match(/\b\d{2,6}\b/g);


    if (fallback) {
      return fallback;
    }
  }


  return numbers;
}


function parseResults(html) {

  return {
    giai8:
      extractPrize(html, "giai8"),

    giai7:
      extractPrize(html, "giai7"),

    giai6:
      extractPrize(html, "giai6"),

    giai5:
      extractPrize(html, "giai5"),

    giai4:
      extractPrize(html, "giai4"),

    giai3:
      extractPrize(html, "giai3"),

    giai2:
      extractPrize(html, "giai2"),

    giai1:
      extractPrize(html, "giai1"),

    giaidb:
      extractPrize(html, "giaidb")
  };
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateResults(results) {

  const expected = {
    giai8: 1,
    giai7: 1,
    giai6: 3,
    giai5: 1,
    giai4: 7,
    giai3: 2,
    giai2: 1,
    giai1: 1,
    giaidb: 1
  };


  for (
    const [key, expectedCount]
    of Object.entries(expected)
  ) {

    if (
      !Array.isArray(results[key]) ||
      results[key].length !== expectedCount
    ) {

      return false;
    }
  }


  return true;
}


/* =========================================================
   DATE
   ========================================================= */

function extractDrawDate(html) {

  const text =
    stripTags(html);


  const matches =
    [
      ...text.matchAll(
        /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g
      )
    ];


  if (!matches.length) {
    return null;
  }


  /*
   * Các trang lịch sử thường có ngày kỳ quay
   * xuất hiện nhiều lần.
   *
   * Tìm ngày hợp lệ đầu tiên trong khoảng hợp lý.
   */

  for (const match of matches) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);


    if (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 2010 &&
      year <= 2100
    ) {

      const dd =
        String(day).padStart(2, "0");

      const mm =
        String(month).padStart(2, "0");


      return `${year}-${mm}-${dd}`;
    }
  }


  return null;
}


/* =========================================================
   CONVERT RESULT
   ========================================================= */

function convertToSeedDraw(
  provinceId,
  drawDate,
  results
) {

  return {

    province:
      provinceId,

    date:
      drawDate,

    ticketCode:
      "",

    prizes: {

      db:
        results.giaidb[0],

      g1:
        results.giai1[0],

      g2:
        results.giai2[0],

      g3:
        results.giai3,

      g4:
        results.giai4,

      g5:
        results.giai5[0],

      g6:
        results.giai6,

      g7:
        results.giai7[0],

      g8:
        results.giai8[0]
    }
  };
}


/* =========================================================
   DATE UTILITIES
   ========================================================= */

function parseISODate(dateString) {

  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);


  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}


function formatISODate(date) {

  const year =
    date.getUTCFullYear();


  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getUTCDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;
}


function subtractDays(
  dateString,
  days
) {

  const date =
    parseISODate(dateString);


  date.setUTCDate(
    date.getUTCDate() - days
  );


  return formatISODate(date);
}


/* =========================================================
   LOAD EXISTING DATA
   ========================================================= */

function loadExistingData() {

  if (
    !fs.existsSync(OUTPUT_FILE)
  ) {

    return {
      generatedAt: null,
      source: "minhngoc.net.vn",
      draws: []
    };
  }


  try {

    const raw =
      fs.readFileSync(
        OUTPUT_FILE,
        "utf8"
      );


    const data =
      JSON.parse(raw);


    if (
      !Array.isArray(data.draws)
    ) {

      data.draws = [];
    }


    return data;


  } catch (error) {

    console.log(
      "WARNING: Could not read existing seed file."
    );


    return {
      generatedAt: null,
      source: "minhngoc.net.vn",
      draws: []
    };
  }
}


/* =========================================================
   LATEST FILE
   ========================================================= */

function loadLatestProvinceFile(
  province
) {

  const latestPath =
    path.join(
      DATA_DIR,
      `${province.id}-latest.json`
    );


  if (
    !fs.existsSync(latestPath)
  ) {

    return null;
  }


  try {

    const data =
      JSON.parse(
        fs.readFileSync(
          latestPath,
          "utf8"
        )
      );


    if (
      !data.drawDate ||
      !data.results ||
      !validateResults(data.results)
    ) {

      return null;
    }


    return {
      date:
        data.drawDate,

      results:
        data.results
    };


  } catch (error) {

    return null;
  }
}


/* =========================================================
   URL
   ========================================================= */

/*
 * Minh Ngọc hỗ trợ trang theo ngày:
 *
 * /ket-qua-xo-so/mien-nam/{slug}/{dd-mm-yyyy}.html
 */

function buildHistoryUrl(
  province,
  dateString
) {

  const [
    year,
    month,
    day
  ] =
    dateString.split("-");


  return (
    "https://www.minhngoc.net.vn/" +
    "ket-qua-xo-so/mien-nam/" +
    `${province.slug}/` +
    `${day}-${month}-${year}.html`
  );
}


/* =========================================================
   DEDUPLICATION
   ========================================================= */

function makeKey(draw) {

  return (
    `${draw.province}|${draw.date}`
  );
}


function deduplicate(draws) {

  const map =
    new Map();


  for (const draw of draws) {

    if (
      !draw ||
      !draw.province ||
      !draw.date ||
      !draw.prizes
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
   BUILD ONE PROVINCE
   ========================================================= */

async function buildProvince(
  province,
  allDraws
) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    `${province.name} (${province.id})`
  );

  console.log(
    "========================================"
  );


  let provinceDraws =
    allDraws.filter(
      draw =>
        draw.province === province.id
    );


  provinceDraws =
    deduplicate(
      provinceDraws
    );


  provinceDraws.sort(
    (a, b) =>
      b.date.localeCompare(a.date)
  );


  console.log(
    `Existing draws: ${provinceDraws.length}`
  );


  /*
   * Nếu đã đủ 100 kỳ thì không tải lại.
   */

  if (
    provinceDraws.length >=
    MAX_DRAWS_PER_PROVINCE
  ) {

    console.log(
      `✓ Already has ${provinceDraws.length} draws`
    );


    return provinceDraws.slice(
      0,
      MAX_DRAWS_PER_PROVINCE
    );
  }


  /*
   * Đưa file latest vào trước.
   */

  const latest =
    loadLatestProvinceFile(
      province
    );


  if (latest) {

    const latestDraw =
      convertToSeedDraw(
        province.id,
        latest.date,
        latest.results
      );


    provinceDraws.push(
      latestDraw
    );


    provinceDraws =
      deduplicate(
        provinceDraws
      );


    provinceDraws.sort(
      (a, b) =>
        b.date.localeCompare(a.date)
    );
  }


  if (
    provinceDraws.length === 0
  ) {

    console.log(
      "✗ No starting draw available."
    );

    return [];
  }


  /*
   * Các đài miền Nam quay mỗi tuần.
   *
   * Lấy kỳ cũ nhất hiện có,
   * sau đó lùi từng 7 ngày.
   */

  let cursorDate =
    provinceDraws[
      provinceDraws.length - 1
    ].date;


  let consecutiveFailures = 0;


  while (
    provinceDraws.length <
    MAX_DRAWS_PER_PROVINCE
  ) {

    const targetDate =
      subtractDays(
        cursorDate,
        7
      );


    const url =
      buildHistoryUrl(
        province,
        targetDate
      );


    console.log("");
    console.log(
      `[${provinceDraws.length + 1}/${MAX_DRAWS_PER_PROVINCE}] ${targetDate}`
    );


    try {

      const html =
        await download(url);


      const results =
        parseResults(html);


      if (
        !validateResults(results)
      ) {

        throw new Error(
          "Invalid prize structure"
        );
      }


      /*
       * Với URL theo ngày, targetDate chính là
       * ngày kỳ quay mà chúng ta yêu cầu.
       */

      const draw =
        convertToSeedDraw(
          province.id,
          targetDate,
          results
        );


      provinceDraws.push(
        draw
      );


      provinceDraws =
        deduplicate(
          provinceDraws
        );


      provinceDraws.sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      );


      console.log(
        `✓ ${targetDate} | DB ${draw.prizes.db}`
      );


      cursorDate =
        targetDate;


      consecutiveFailures = 0;


    } catch (error) {

      console.log(
        `✗ ${targetDate}: ${error.message}`
      );


      /*
       * Vẫn lùi tiếp 7 ngày.
       * Không xóa dữ liệu đã có.
       */

      cursorDate =
        targetDate;


      consecutiveFailures++;


      /*
       * Nếu 8 kỳ liên tục đều lỗi thì dừng tỉnh này.
       */

      if (
        consecutiveFailures >= 8
      ) {

        console.log(
          "Too many consecutive failures. Stop province."
        );

        break;
      }
    }


    await sleep(
      REQUEST_DELAY
    );
  }


  provinceDraws.sort(
    (a, b) =>
      b.date.localeCompare(a.date)
  );


  console.log("");
  console.log(
    `${province.name}: ${provinceDraws.length} draws`
  );


  return provinceDraws.slice(
    0,
    MAX_DRAWS_PER_PROVINCE
  );
}



  console.log(
    "FINAL SUMMARY"
  );

  console.log(
    "========================================"
  );


  for (
    const province
    of PROVINCES
  ) {

    const provinceDraws =
      draws.filter(
        draw =>
          draw.province === province.id
      );


    console.log(
      `${province.name.padEnd(12)} : ${provinceDraws.length}`
    );
  }


  console.log(
    "----------------------------------------"
  );

  console.log(
    `TOTAL: ${draws.length}`
  );

  console.log(
    "========================================"
  );
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "XSMN HISTORY BUILDER"
  );

  console.log(
    "Target: 100 draws / province"
  );

  console.log(
    `Provinces: ${PROVINCES.length}`
  );

  console.log(
    "========================================"
  );


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


  const existing =
    loadExistingData();


  let allDraws =
    Array.isArray(existing.draws)
      ? existing.draws
      : [];


  allDraws =
    deduplicate(
      allDraws
    );


  console.log(

/* =========================================================
SAVE + DATABASE VALIDATION
========================================================= */

function isKnownProvince(draw) {

  if (!draw || !draw.province) {
    return false;
  }

  return PROVINCES.some(
    province =>
      province.id === draw.province
  );
}


function cleanDatabase(draws) {

  /*
   * Chỉ giữ dữ liệu thuộc đúng 21 đài
   * được khai báo trong PROVINCES.
   *
   * Điều này loại bỏ các record cũ / orphan
   * có province ID không còn được sử dụng.
   */

  let clean =
    Array.isArray(draws)
      ? draws.filter(isKnownProvince)
      : [];


  clean =
    deduplicate(clean);


  /*
   * Mỗi đài chỉ được giữ tối đa 100 kỳ.
   */

  const finalDraws = [];


  for (const province of PROVINCES) {

    const provinceDraws =
      clean
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
   * Sort ổn định:
   * province -> date DESC
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


function saveData(draws) {

  const clean =
    cleanDatabase(draws);


  const output = {

    generatedAt:
      new Date()
        .toISOString()
        .slice(0, 10),

    source:
      "minhngoc.net.vn",

    draws:
      clean
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
    `✓ Saved ${OUTPUT_FILE}`
  );

  console.log(
    `Total valid draws: ${clean.length}`
  );


  return clean;
}


/* =========================================================
   DATABASE VALIDATION
   ========================================================= */

function validateDatabase(draws) {

  const EXPECTED_PROVINCES =
    PROVINCES.length;

  const EXPECTED_DRAWS =
    EXPECTED_PROVINCES *
    MAX_DRAWS_PER_PROVINCE;


  let invalidDraws = 0;

  let duplicateCount = 0;

  let completeProvinces = 0;

  const seen =
    new Set();


  /*
   * Kiểm tra record.
   */

  for (const draw of draws) {

    if (
      !draw ||
      !draw.province ||
      !draw.date ||
      !draw.prizes
    ) {

      invalidDraws++;

      continue;
    }


    /*
     * Province phải thuộc đúng danh sách 21 đài.
     */

    const knownProvince =
      PROVINCES.some(
        province =>
          province.id ===
          draw.province
      );


    if (!knownProvince) {

      invalidDraws++;

      continue;
    }


    /*
     * Kiểm tra ngày YYYY-MM-DD.
     */

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        draw.date
      )
    ) {

      invalidDraws++;
    }


    /*
     * Kiểm tra duplicate province + date.
     */

    const key =
      makeKey(draw);


    if (seen.has(key)) {

      duplicateCount++;

    } else {

      seen.add(key);
    }


    /*
     * Kiểm tra cấu trúc giải thưởng.
     */

    const prizes =
      draw.prizes;


    const prizeValid =

      typeof prizes.db === "string" &&
      typeof prizes.g1 === "string" &&
      typeof prizes.g2 === "string" &&

      Array.isArray(prizes.g3) &&
      prizes.g3.length === 2 &&

      Array.isArray(prizes.g4) &&
      prizes.g4.length === 7 &&

      typeof prizes.g5 === "string" &&

      Array.isArray(prizes.g6) &&
      prizes.g6.length === 3 &&

      typeof prizes.g7 === "string" &&
      typeof prizes.g8 === "string";


    if (!prizeValid) {

      invalidDraws++;
    }
  }


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "XSMN DATABASE VALIDATION"
  );

  console.log(
    "========================================"
  );


  /*
   * Thống kê từng đài.
   */

  for (const province of PROVINCES) {

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


    if (
      count ===
      MAX_DRAWS_PER_PROVINCE
    ) {

      completeProvinces++;
    }


    const newest =
      count > 0
        ? provinceDraws[0].date
        : "-";


    const oldest =
      count > 0
        ? provinceDraws[
            count - 1
          ].date
        : "-";


    const status =
      count ===
      MAX_DRAWS_PER_PROVINCE
        ? "OK"
        : "INCOMPLETE";


    console.log(

      `${province.name.padEnd(12)} | ` +

      `${String(count).padStart(3)} kỳ | ` +

      `${newest} -> ${oldest} | ` +

      status
    );
  }


  console.log(
    "----------------------------------------"
  );

  console.log(
    `PROVINCES          : ${EXPECTED_PROVINCES}`
  );

  console.log(
    `DRAWS / PROVINCE   : ${MAX_DRAWS_PER_PROVINCE}`
  );

  console.log(
    `EXPECTED DRAWS     : ${EXPECTED_DRAWS}`
  );

  console.log(
    `ACTUAL VALID DRAWS : ${draws.length}`
  );

  console.log(
    `COMPLETE PROVINCES : ${completeProvinces}/${EXPECTED_PROVINCES}`
  );

  console.log(
    `DUPLICATES         : ${duplicateCount}`
  );

  console.log(
    `INVALID DRAWS      : ${invalidDraws}`
  );

  console.log(
    "========================================"
  );


  const databaseReady =

    draws.length ===
      EXPECTED_DRAWS &&

    completeProvinces ===
      EXPECTED_PROVINCES &&

    duplicateCount === 0 &&

    invalidDraws === 0;


  if (databaseReady) {

    console.log("");
    console.log(
      "✓ DATABASE VALIDATED"
    );

    console.log(
      "✓ XSMN HISTORY DATABASE V1 READY"
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
   SUMMARY
   ========================================================= */

function printSummary(draws) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "FINAL SUMMARY"
  );

  console.log(
    "========================================"
  );


  for (
    const province
    of PROVINCES
  ) {

    const provinceDraws =
      draws.filter(
        draw =>
          draw.province ===
          province.id
      );


    console.log(
      `${province.name.padEnd(12)} : ${provinceDraws.length}`
    );
  }


  console.log(
    "----------------------------------------"
  );

  console.log(
    `TOTAL: ${draws.length}`
  );

  console.log(
    "========================================"
  );
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "XSMN HISTORY BUILDER"
  );

  console.log(
    "Target: 100 draws / province"
  );

  console.log(
    `Provinces: ${PROVINCES.length}`
  );

  console.log(
    "========================================"
  );


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


  const existing =
    loadExistingData();


  let allDraws =
    Array.isArray(existing.draws)
      ? existing.draws
      : [];


  /*
   * Quan trọng:
   *
   * Lọc bỏ record không thuộc 21 province hiện tại
   * ngay khi load database cũ.
   */

  const beforeCleanup =
    allDraws.length;


  allDraws =
    cleanDatabase(
      allDraws
    );


  const removed =
    beforeCleanup -
    allDraws.length;


  console.log(
    `Existing raw draws  : ${beforeCleanup}`
  );

  console.log(
    `Existing valid draws: ${allDraws.length}`
  );


  if (removed > 0) {

    console.log(
      `Removed old/orphan draws: ${removed}`
    );
  }


  /*
   * Build từng tỉnh.
   */

  for (
    const province
    of PROVINCES
  ) {

    const otherDraws =
      allDraws.filter(
        draw =>
          draw.province !==
          province.id
      );


    const provinceDraws =
      await buildProvince(
        province,
        allDraws
      );


    allDraws = [
      ...otherDraws,
      ...provinceDraws
    ];


    allDraws =
      cleanDatabase(
        allDraws
      );


    /*
     * Save sau từng tỉnh.
     *
     * Nếu workflow bị ngắt giữa chừng,
     * dữ liệu đã hoàn thành vẫn còn.
     */

    saveData(
      allDraws
    );


    await sleep(
      PROVINCE_DELAY
    );
  }


  /*
   * Final cleanup.
   */

  allDraws =
    cleanDatabase(
      allDraws
    );


  allDraws =
    saveData(
      allDraws
    );


  printSummary(
    allDraws
  );


  /*
   * VALIDATE DATABASE.
   */

  const databaseReady =
    validateDatabase(
      allDraws
    );


  /*
   * Workflow phải báo lỗi nếu database
   * không đạt chuẩn.
   */

  if (!databaseReady) {

    process.exitCode = 1;
  }
}


/* =========================================================
   RUN
   ========================================================= */

main().catch(error => {

  console.error(
    "FATAL ERROR:",
    error
  );

  process.exit(1);
});
