/**
 * XSMN DATA UPDATER
 * =================
 * Tải kết quả xổ số miền Nam từ nguồn công khai,
 * tách dữ liệu giải và lưu JSON sạch vào thư mục data/.
 *
 * Chạy tự động bằng GitHub Actions.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

const PROVINCES = [
  { id: "tphcm", name: "TP. HCM", slug: "tp-hcm" },
  { id: "dong-thap", name: "Đồng Tháp", slug: "dong-thap" },
  { id: "ca-mau", name: "Cà Mau", slug: "ca-mau" },
  { id: "ben-tre", name: "Bến Tre", slug: "ben-tre" },
  { id: "vung-tau", name: "Vũng Tàu", slug: "vung-tau" },
  { id: "bac-lieu", name: "Bạc Liêu", slug: "bac-lieu" },
  { id: "dong-nai", name: "Đồng Nai", slug: "dong-nai" },
  { id: "can-tho", name: "Cần Thơ", slug: "can-tho" },
  { id: "soc-trang", name: "Sóc Trăng", slug: "soc-trang" },
  { id: "tay-ninh", name: "Tây Ninh", slug: "tay-ninh" },
  { id: "an-giang", name: "An Giang", slug: "an-giang" },
  { id: "binh-thuan", name: "Bình Thuận", slug: "binh-thuan" },
  { id: "vinh-long", name: "Vĩnh Long", slug: "vinh-long" },
  { id: "binh-duong", name: "Bình Dương", slug: "binh-duong" },
  { id: "tra-vinh", name: "Trà Vinh", slug: "tra-vinh" },
  { id: "long-an", name: "Long An", slug: "long-an" },
  { id: "binh-phuoc", name: "Bình Phước", slug: "binh-phuoc" },
  { id: "hau-giang", name: "Hậu Giang", slug: "hau-giang" },
  { id: "kien-giang", name: "Kiên Giang", slug: "kien-giang" },
  { id: "da-lat", name: "Đà Lạt", slug: "da-lat" },
  { id: "tien-giang", name: "Tiền Giang", slug: "tien-giang" }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================================================
   DOWNLOAD HTML
   ========================================================= */

async function download(url) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 20000);

  try {

    const response = await fetch(url, {
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
   EXTRACT PRIZES
   ========================================================= */

/**
 * Ví dụ:
 *
 * <td class="giai6">
 *   <div>8519</div>
 *   <div>3148</div>
 *   <div>8395</div>
 * </td>
 */

function extractPrize(html, prizeClass) {

  const tdRegex = new RegExp(
    `<td[^>]*class=["'][^"']*\\b${prizeClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
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

  /*
   * Fallback nếu website thay DIV.
   */

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
   EXTRACT DRAW DATE
   ========================================================= */

/**
 * Tìm ngày quay DD/MM/YYYY trong vùng gần bảng kết quả.
 *
 * Quan trọng:
 * updatedAt = thời điểm GitHub tải dữ liệu.
 * drawDate  = ngày kỳ xổ số thực tế.
 *
 * Hai giá trị này KHÔNG được coi là giống nhau.
 */

function extractDrawDate(html) {

  /*
   * Bảng kết quả hiện tại nằm quanh box_kqxs_content.
   */

  const tablePosition =
    html.indexOf('class="box_kqxs_content"');

  let area = html;

  if (tablePosition !== -1) {

    const start =
      Math.max(0, tablePosition - 12000);

    const end =
      Math.min(
        html.length,
        tablePosition + 3000
      );

    area =
      html.substring(start, end);
  }

  const text =
    stripTags(area);

  /*
   * Tìm tất cả ngày DD/MM/YYYY.
   */

  const matches =
    [...text.matchAll(
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g
    )];

  if (!matches.length) {
    return null;
  }

  /*
   * Ưu tiên ngày cuối cùng xuất hiện gần bảng.
   */

  const m =
    matches[matches.length - 1];

  const dd =
    String(m[1]).padStart(2, "0");

  const mm =
    String(m[2]).padStart(2, "0");

  const yyyy =
    String(m[3]);

  const day =
    Number(dd);

  const month =
    Number(mm);

  const year =
    Number(yyyy);

  /*
   * Kiểm tra cơ bản.
   */

  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 2010 ||
    year > 2100
  ) {
    return null;
  }

  return `${yyyy}-${mm}-${dd}`;
}


/* =========================================================
   VALIDATION
   ========================================================= */

function countNumbers(results) {

  return Object.values(results)
    .reduce(
      (total, arr) =>
        total + arr.length,
      0
    );
}


function validateResults(results) {

  /*
   * Cơ cấu XSMN chuẩn:
   *
   * G8 : 1
   * G7 : 1
   * G6 : 3
   * G5 : 1
   * G4 : 7
   * G3 : 2
   * G2 : 1
   * G1 : 1
   * DB : 1
   *
   * Tổng = 18 số
   */

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

  const errors = [];

  for (
    const [key, expectedCount]
    of Object.entries(expected)
  ) {

    const actual =
      Array.isArray(results[key])
        ? results[key].length
        : 0;

    if (actual !== expectedCount) {

      errors.push(
        `${key}: expected ${expectedCount}, got ${actual}`
      );
    }
  }

  return errors;
}


/* =========================================================
   UPDATE ONE PROVINCE
   ========================================================= */

async function updateProvince(province) {

  const url =
    `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-nam/${province.slug}.html`;

  console.log("");

  console.log(
    `========== ${province.name} ==========`
  );

  console.log(url);

  try {

    const html =
      await download(url);

    console.log(
      `HTML length: ${html.length}`
    );

    if (
      !html ||
      html.length < 1000
    ) {

      throw new Error(
        "Downloaded HTML is unexpectedly small"
      );
    }


    /* ---------- RESULTS ---------- */

    const results =
      parseResults(html);

    const totalNumbers =
      countNumbers(results);

    console.log(
      "Parsed:",
      JSON.stringify(results)
    );

    console.log(
      `Numbers found: ${totalNumbers}`
    );


    /* ---------- VALIDATE ---------- */

    const validationErrors =
      validateResults(results);

    if (
      validationErrors.length > 0
    ) {

      throw new Error(
        "Invalid lottery result: " +
        validationErrors.join("; ")
      );
    }


    /* ---------- DRAW DATE ---------- */

    const drawDate =
      extractDrawDate(html);

    console.log(
      `Draw date: ${drawDate || "NOT FOUND"}`
    );


    /* ---------- OUTPUT ---------- */

    const output = {

      province:
        province.name,

      provinceId:
        province.id,

      drawDate:
        drawDate,

      source:
        url,

      updatedAt:
        new Date().toISOString(),

      results
    };


    const outputPath =
      path.join(
        DATA_DIR,
        `${province.id}-latest.json`
      );


    fs.writeFileSync(

      outputPath,

      JSON.stringify(
        output,
        null,
        2
      ),

      "utf8"
    );


    console.log(
      `✓ Saved ${outputPath}`
    );

    return {
      ok: true,
      drawDate
    };


  } catch (error) {

    console.error(
      `✗ ${province.name}:`,
      error.message
    );

    return {
      ok: false,
      error: error.message
    };
  }
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log(
    "===================================="
  );

  console.log(
    "XSMN AUTOMATIC RESULT UPDATER"
  );

  console.log(
    "===================================="
  );


  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );


  let success = 0;
  let failed = 0;

  const failures = [];

  const provinces = {};


  for (
    const province
    of PROVINCES
  ) {

    const result =
      await updateProvince(province);


    if (result.ok) {

      success++;

      provinces[province.id] = {
        ok: true,
        drawDate:
          result.drawDate || null
      };

    } else {

      failed++;

      failures.push(
        province.id
      );

      provinces[province.id] = {
        ok: false,
        error:
          result.error || "Unknown error"
      };
    }


    /*
     * Không request liên tục.
     */

    await sleep(1500);
  }


  /* ---------- STATUS ---------- */

  const status = {

    updatedAt:
      new Date().toISOString(),

    success,

    failed,

    total:
      PROVINCES.length,

    failures,

    provinces
  };


  fs.writeFileSync(

    path.join(
      DATA_DIR,
      "update-status.json"
    ),

    JSON.stringify(
      status,
      null,
      2
    ),

    "utf8"
  );


  console.log("");

  console.log(
    "===================================="
  );

  console.log(
    `Success : ${success}`
  );

  console.log(
    `Failed  : ${failed}`
  );

  console.log(
    `Total   : ${PROVINCES.length}`
  );


  if (failures.length) {

    console.log(
      `Failures: ${failures.join(", ")}`
    );
  }


  console.log(
    "===================================="
  );


  /*
   * Chỉ làm workflow FAILED
   * nếu không lấy được tỉnh nào.
   */

  if (success === 0) {
    process.exitCode = 1;
  }
}


main().catch(error => {

  console.error(error);

  process.exit(1);

});
