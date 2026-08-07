/**
 * XSMN DATA UPDATER
 * =================
 * Tải kết quả xổ số miền Nam từ nguồn công khai,
 * tách dữ liệu giải và lưu JSON sạch vào thư mục data/.
 *
 * Chạy bằng GitHub Actions.
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
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
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


/**
 * Lấy tất cả số nằm trong:
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
   * Một số trang có thể không dùng DIV.
   * Nếu chưa lấy được số, loại HTML rồi tìm số.
   */
  if (numbers.length === 0) {

    const plain = content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();

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


function countNumbers(results) {

  return Object.values(results)
    .reduce(
      (total, arr) => total + arr.length,
      0
    );
}


function validateResults(results) {

  /*
   * XSMN chuẩn có:
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

  for (const [key, expectedCount]
    of Object.entries(expected)) {

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


async function updateProvince(province) {

  const url =
    `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-nam/${province.slug}.html`;

  console.log("");
  console.log(
    `========== ${province.name} ==========`
  );

  console.log(url);

  try {

    const html = await download(url);

    console.log(
      `HTML length: ${html.length}`
    );

    if (!html || html.length < 1000) {
      throw new Error(
        "Downloaded HTML is unexpectedly small"
      );
    }

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

    const validationErrors =
      validateResults(results);

    if (validationErrors.length > 0) {

      throw new Error(
        "Invalid lottery result: " +
        validationErrors.join("; ")
      );
    }

    const output = {
      province: province.name,
      provinceId: province.id,
      source: url,
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

    return true;

  } catch (error) {

    console.error(
      `✗ ${province.name}:`,
      error.message
    );

    return false;
  }
}


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

  for (const province of PROVINCES) {

    const ok =
      await updateProvince(province);

    if (ok) {
      success++;
    } else {
      failed++;
      failures.push(province.id);
    }

    /*
     * Không request liên tục.
     */
    await sleep(1500);
  }


  const status = {

    updatedAt:
      new Date().toISOString(),

    success,

    failed,

    total:
      PROVINCES.length,

    failures
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
   * Chỉ báo workflow lỗi nếu
   * không lấy được tỉnh nào.
   */
  if (success === 0) {
    process.exitCode = 1;
  }
}


main().catch(error => {

  console.error(error);

  process.exit(1);

});
