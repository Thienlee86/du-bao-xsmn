/**
 * XSMN HISTORY BUILDER - AN GIANG TEST
 * =====================================
 * Mục tiêu:
 * - Thu thập tối đa 100 kỳ An Giang
 * - Nguồn: minhngoc.net.vn
 * - Validate đủ 18 kết quả mỗi kỳ
 * - Chống trùng bằng province + date
 * - Merge với data/xsmn_seed.json hiện có
 *
 * Giai đoạn test:
 * CHỈ chạy An Giang.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SEED_FILE = path.join(DATA_DIR, "xsmn_seed.json");

const PROVINCE = {
  id: "an-giang",
  name: "An Giang",
  slug: "an-giang"
};

const TARGET_DRAWS = 100;

const BASE_URL =
  "https://www.minhngoc.net.vn/ket-qua-xo-so/mien-nam";


/* =========================================================
   UTILITIES
   ========================================================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateVN(date) {
  return [
    pad2(date.getDate()),
    pad2(date.getMonth() + 1),
    date.getFullYear()
  ].join("-");
}

function isoDate(year, month, day) {
  return (
    String(year) +
    "-" +
    pad2(month) +
    "-" +
    pad2(day)
  );
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

async function download(url) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);

  try {

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/124.0 Safari/537.36",

        "Accept":
          "text/html,application/xhtml+xml," +
          "application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "vi-VN,vi;q=0.9,en;q=0.8",

        "Cache-Control":
          "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    return await response.text();

  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================================
   HTML HELPERS
   ========================================================= */

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
   EXTRACT PRIZE
   ========================================================= */

function extractPrize(html, prizeClass) {

  const tdRegex = new RegExp(
    `<td[^>]*class=["'][^"']*\\b${prizeClass}\\b[^"']*["'][^>]*>` +
    `([\\s\\S]*?)<\\/td>`,
    "i"
  );

  const match = html.match(tdRegex);

  if (!match) {
    return [];
  }

  const content = match[1];

  const numbers = [];

  const divRegex =
    /<div[^>]*>\s*([0-9]+)\s*<\/div>/gi;

  let result;

  while ((result = divRegex.exec(content)) !== null) {
    numbers.push(result[1]);
  }

  if (numbers.length === 0) {

    const plain = stripTags(content);

    const fallback =
      plain.match(/\b\d{2,6}\b/g);

    if (fallback) {
      return fallback;
    }
  }

  return numbers;
}


/* =========================================================
   PARSE RESULTS
   ========================================================= */

function parseResults(html) {

  return {
    giai8: extractPrize(html, "giai8"),
    giai7: extractPrize(html, "giai7"),
    giai6: extractPrize(html, "giai6"),
    giai5: extractPrize(html, "giai5"),
    giai4: extractPrize(html, "giai4"),
    giai3: extractPrize(html, "giai3"),
    giai2: extractPrize(html, "giai2"),
    giai1: extractPrize(html, "giai1"),
    giaidb: extractPrize(html, "giaidb")
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

  for (const [key, count] of Object.entries(expected)) {

    if (
      !Array.isArray(results[key]) ||
      results[key].length !== count
    ) {
      return false;
    }
  }

  return true;
}


/* =========================================================
   CONVERT TO SEED FORMAT
   ========================================================= */

function first(array) {
  return Array.isArray(array) && array.length
    ? array[0]
    : "";
}

function convertToSeedDraw(date, results) {

  return {
    province: PROVINCE.id,
    date,

    prizes: {
      db: first(results.giaidb),
      g1: first(results.giai1),
      g2: first(results.giai2),

      g3: results.giai3,
      g4: results.giai4,

      g5: first(results.giai5),
      g6: results.giai6,

      g7: first(results.giai7),
      g8: first(results.giai8)
    }
  };
}


/* =========================================================
   LOAD EXISTING SEED
   ========================================================= */

function loadSeed() {

  if (!fs.existsSync(SEED_FILE)) {

    return {
      generatedAt:
        new Date().toISOString().slice(0, 10),

      source:
        "minhngoc.net.vn",

      draws: []
    };
  }

  try {

    const raw =
      fs.readFileSync(SEED_FILE, "utf8");

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed.draws)) {
      parsed.draws = [];
    }

    return parsed;

  } catch (error) {

    throw new Error(
      "Không đọc được xsmn_seed.json: " +
      error.message
    );
  }
}


/* =========================================================
   BUILD EXISTING KEY SET
   ========================================================= */

function createExistingKeys(seed) {

  const keys = new Set();

  for (const draw of seed.draws) {

    if (!draw.province || !draw.date) {
      continue;
    }

    keys.add(
      `${draw.province}|${draw.date}`
    );
  }

  return keys;
}


/* =========================================================
   CRAWL ONE HISTORICAL DATE
   ========================================================= */

async function crawlDate(date) {

  const dateVN =
    formatDateVN(date);

  const url =
    `${BASE_URL}/${PROVINCE.slug}/${dateVN}.html`;

  console.log("");
  console.log("------------------------------------");
  console.log(`Checking ${dateVN}`);
  console.log(url);

  try {

    const html =
      await download(url);

    if (!html || html.length < 1000) {

      console.log(
        "Skip: HTML quá nhỏ."
      );

      return null;
    }

    const results =
      parseResults(html);

    if (!validateResults(results)) {

      console.log(
        "Skip: không tìm thấy kết quả An Giang hợp lệ."
      );

      return null;
    }

    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;

    const day =
      date.getDate();

    const dateISO =
      isoDate(year, month, day);

    console.log(
      `✓ Found draw: ${dateISO}`
    );

    console.log(
      `  DB: ${first(results.giaidb)}`
    );

    return convertToSeedDraw(
      dateISO,
      results
    );

  } catch (error) {

    console.log(
      `Skip ${dateVN}: ${error.message}`
    );

    return null;
  }
}


/* =========================================================
   REMOVE DUPLICATES
   ========================================================= */

function deduplicate(draws) {

  const map = new Map();

  for (const draw of draws) {

    if (!draw.province || !draw.date) {
      continue;
    }

    const key =
      `${draw.province}|${draw.date}`;

    if (!map.has(key)) {
      map.set(key, draw);
    }
  }

  return Array.from(
    map.values()
  );
}


/* =========================================================
   SORT DRAWS
   ========================================================= */

function sortDraws(draws) {

  return draws.sort((a, b) => {

    const dateCompare =
      String(b.date)
        .localeCompare(String(a.date));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(a.province)
      .localeCompare(String(b.province));
  });
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log(
    "===================================="
  );

  console.log(
    "XSMN HISTORY BUILDER"
  );

  console.log(
    "TEST PROVINCE: AN GIANG"
  );

  console.log(
    `TARGET: ${TARGET_DRAWS} DRAWS`
  );

  console.log(
    "===================================="
  );


  fs.mkdirSync(
    DATA_DIR,
    { recursive: true }
  );


  const seed =
    loadSeed();

  const existingKeys =
    createExistingKeys(seed);


  const existingAnGiang =
    seed.draws.filter(
      draw =>
        draw.province === PROVINCE.id
    );


  console.log(
    `Existing An Giang draws: ${existingAnGiang.length}`
  );


  /*
   * Bắt đầu từ ngày hiện tại.
   *
   * Chỉ kiểm tra THỨ NĂM vì An Giang
   * quay vào thứ Năm.
   */

  let cursor =
    new Date();

  cursor.setHours(
    12, 0, 0, 0
  );


  /*
   * JS:
   * Sunday    = 0
   * Monday    = 1
   * Tuesday   = 2
   * Wednesday = 3
   * Thursday  = 4
   */

  while (cursor.getDay() !== 4) {

    cursor.setDate(
      cursor.getDate() - 1
    );
  }


  let collected =
    existingAnGiang.length;

  let newDraws = [];

  let attempts = 0;


  /*
   * Giới hạn 180 tuần để tránh vòng lặp vô hạn.
   */

  const MAX_ATTEMPTS = 180;


  while (
    collected < TARGET_DRAWS &&
    attempts < MAX_ATTEMPTS
  ) {

    const dateISO =
      [
        cursor.getFullYear(),
        pad2(cursor.getMonth() + 1),
        pad2(cursor.getDate())
      ].join("-");


    const key =
      `${PROVINCE.id}|${dateISO}`;


    if (existingKeys.has(key)) {

      console.log(
        `Already exists: ${dateISO}`
      );

    } else {

      const draw =
        await crawlDate(cursor);


      if (draw) {

        newDraws.push(draw);

        existingKeys.add(key);

        collected++;

        console.log(
          `Progress: ${collected}/${TARGET_DRAWS}`
        );
      }


      /*
       * Nghỉ giữa các request để tránh
       * gửi request quá nhanh.
       */

      await sleep(1200);
    }


    /*
     * Lùi đúng 7 ngày.
     */

    cursor.setDate(
      cursor.getDate() - 7
    );

    attempts++;
  }


  /* =======================================================
     MERGE
     ======================================================= */

  console.log("");
  console.log("Merging data...");


  const merged =
    deduplicate([
      ...seed.draws,
      ...newDraws
    ]);


  sortDraws(merged);


  seed.generatedAt =
    new Date()
      .toISOString()
      .slice(0, 10);

  seed.source =
    "minhngoc.net.vn";

  seed.draws =
    merged;


  fs.writeFileSync(
    SEED_FILE,

    JSON.stringify(
      seed,
      null,
      2
    ),

    "utf8"
  );


  /* =======================================================
     SUMMARY
     ======================================================= */

  const finalAnGiang =
    seed.draws.filter(
      draw =>
        draw.province === PROVINCE.id
    );


  console.log("");
  console.log(
    "===================================="
  );

  console.log(
    "HISTORY BUILD COMPLETE"
  );

  console.log(
    "===================================="
  );

  console.log(
    `Existing before : ${existingAnGiang.length}`
  );

  console.log(
    `New draws       : ${newDraws.length}`
  );

  console.log(
    `An Giang total  : ${finalAnGiang.length}`
  );

  console.log(
    `All seed draws  : ${seed.draws.length}`
  );

  console.log(
    `Saved           : ${SEED_FILE}`
  );

  console.log(
    "===================================="
  );


  if (finalAnGiang.length < TARGET_DRAWS) {

    console.log(
      `WARNING: Chỉ thu được ${finalAnGiang.length}/${TARGET_DRAWS} kỳ.`
    );

  } else {

    console.log(
      "✓ TARGET REACHED: 100 kỳ An Giang"
    );
  }
}


main().catch(error => {

  console.error(
    "FATAL ERROR:",
    error
  );

  process.exit(1);
});
