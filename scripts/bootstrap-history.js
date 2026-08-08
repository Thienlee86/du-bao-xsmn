/**
 * XSMN HISTORY BOOTSTRAPPER
 * =========================
 *
 * Mục tiêu:
 * - Tải lịch sử XSMN từ Minh Ngọc.
 * - Thu thập tối đa 100 kỳ cho mỗi đài.
 * - 21 đài x 100 kỳ = 2100 records.
 * - Tách nhiều bảng kết quả có trong cùng một trang.
 * - Validate đầy đủ cơ cấu 18 số/kỳ.
 * - Chống trùng province + date.
 * - Không ghi đè xsmn_seed.json nếu dữ liệu bootstrap không đạt yêu cầu.
 *
 * Script này dùng để BOOTSTRAP lịch sử.
 * Sau khi database đủ dữ liệu:
 *   update-data.js   -> lấy kết quả mới nhất
 *   build-history.js -> merge kỳ mới vào database
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

const BACKUP_FILE =
  path.join(DATA_DIR, "xsmn_seed.backup.json");

const MAX_DRAWS_PER_PROVINCE = 100;

/*
 * Mỗi request cách nhau một khoảng để tránh gửi quá nhanh.
 */
const REQUEST_DELAY_MS = 1800;

/*
 * Số trang/mốc tối đa cho một tỉnh.
 * Bình thường sẽ dừng sớm ngay khi đủ 100 kỳ.
 */
const MAX_REQUESTS_PER_PROVINCE = 30;


/* =========================================================
   PROVINCES
   ========================================================= */

const PROVINCES = [

  {
    id: "tphcm",
    name: "TP. HCM",
    slug: "tp-hcm",
    days: [1, 6]
  },

  {
    id: "dong-thap",
    name: "Đồng Tháp",
    slug: "dong-thap",
    days: [1]
  },

  {
    id: "ca-mau",
    name: "Cà Mau",
    slug: "ca-mau",
    days: [1]
  },

  {
    id: "ben-tre",
    name: "Bến Tre",
    slug: "ben-tre",
    days: [2]
  },

  {
    id: "vung-tau",
    name: "Vũng Tàu",
    slug: "vung-tau",
    days: [2]
  },

  {
    id: "bac-lieu",
    name: "Bạc Liêu",
    slug: "bac-lieu",
    days: [2]
  },

  {
    id: "dong-nai",
    name: "Đồng Nai",
    slug: "dong-nai",
    days: [3]
  },

  {
    id: "can-tho",
    name: "Cần Thơ",
    slug: "can-tho",
    days: [3]
  },

  {
    id: "soc-trang",
    name: "Sóc Trăng",
    slug: "soc-trang",
    days: [3]
  },

  {
    id: "tay-ninh",
    name: "Tây Ninh",
    slug: "tay-ninh",
    days: [4]
  },

  {
    id: "an-giang",
    name: "An Giang",
    slug: "an-giang",
    days: [4]
  },

  {
    id: "binh-thuan",
    name: "Bình Thuận",
    slug: "binh-thuan",
    days: [4]
  },

  {
    id: "vinh-long",
    name: "Vĩnh Long",
    slug: "vinh-long",
    days: [5]
  },

  {
    id: "binh-duong",
    name: "Bình Dương",
    slug: "binh-duong",
    days: [5]
  },

  {
    id: "tra-vinh",
    name: "Trà Vinh",
    slug: "tra-vinh",
    days: [5]
  },

  {
    id: "long-an",
    name: "Long An",
    slug: "long-an",
    days: [6]
  },

  {
    id: "binh-phuoc",
    name: "Bình Phước",
    slug: "binh-phuoc",
    days: [6]
  },

  {
    id: "hau-giang",
    name: "Hậu Giang",
    slug: "hau-giang",
    days: [6]
  },

  {
    id: "tien-giang",
    name: "Tiền Giang",
    slug: "tien-giang",
    days: [0]
  },

  {
    id: "kien-giang",
    name: "Kiên Giang",
    slug: "kien-giang",
    days: [0]
  },

  {
    id: "da-lat",
    name: "Đà Lạt",
    slug: "da-lat",
    days: [0]
  }

];


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}


function pad2(value) {

  return String(value)
    .padStart(2, "0");
}


function formatDateForUrl(date) {

  return (
    pad2(date.getDate()) +
    "-" +
    pad2(date.getMonth() + 1) +
    "-" +
    date.getFullYear()
  );
}


function isoDateFromParts(
  day,
  month,
  year
) {

  return (
    String(year) +
    "-" +
    pad2(month) +
    "-" +
    pad2(day)
  );
}


function makeKey(draw) {

  return (
    draw.province +
    "|" +
    draw.date
  );
}


function isKnownProvince(id) {

  return PROVINCES.some(
    province =>
      province.id === id
  );
}


/* =========================================================
   HTML HELPERS
   ========================================================= */

function decodeBasicEntities(text) {

  return String(text || "")

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&#160;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /&quot;/gi,
      "\""
    )

    .replace(
      /&#39;/gi,
      "'"
    )

    .replace(
      /&ndash;/gi,
      "-"
    )

    .replace(
      /&mdash;/gi,
      "-"
    );
}


function stripTags(html) {

  return decodeBasicEntities(

    String(html || "")

      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )

      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )

      .replace(
        /<[^>]+>/g,
        " "
      )

  )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

async function download(url) {

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      25000
    );


  try {

    const response =
      await fetch(
        url,
        {

          signal:
            controller.signal,

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

            "Accept-Language":
              "vi-VN,vi;q=0.9,en;q=0.8"

          }

        }
      );


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


    return html;


  } finally {

    clearTimeout(timeout);

  }

}


/* =========================================================
   EXTRACT ALL RESULT TABLES
   ========================================================= */

/*
 * Minh Ngọc có thể chứa nhiều bảng kết quả trên cùng trang.
 *
 * Ta tìm các khối có class box_kqxs_content thay vì chỉ
 * parse bảng đầu tiên của toàn bộ HTML.
 */

function extractResultBlocks(html) {

  const blocks = [];

  const markerRegex =
    /class=["'][^"']*\bbox_kqxs_content\b[^"']*["']/gi;


  const positions = [];

  let match;


  while (
    (match = markerRegex.exec(html)) !== null
  ) {

    positions.push(
      match.index
    );
  }


  if (!positions.length) {

    /*
     * Fallback:
     * nếu cấu trúc website thay đổi,
     * dùng vị trí Giải 8 làm điểm chia.
     */

    const fallbackRegex =
      /class=["'][^"']*\bgiai8\b[^"']*["']/gi;


    while (
      (match = fallbackRegex.exec(html)) !== null
    ) {

      if (
        match.index > 20000
      ) {

        positions.push(
          Math.max(
            0,
            match.index - 8000
          )
        );
      }
    }
  }


  if (!positions.length) {

    return [];
  }


  /*
   * Loại vị trí quá gần nhau.
   */

  const uniquePositions = [];


  for (const position of positions) {

    const previous =
      uniquePositions[
        uniquePositions.length - 1
      ];


    if (
      previous === undefined ||
      position - previous > 3000
    ) {

      uniquePositions.push(
        position
      );
    }
  }


  for (
    let i = 0;
    i < uniquePositions.length;
    i++
  ) {

    const current =
      uniquePositions[i];


    /*
     * Lấy thêm vùng phía trước để chứa tiêu đề/ngày.
     */

    const start =
      Math.max(
        0,
        current - 10000
      );


    let end;


    if (
      i + 1 <
      uniquePositions.length
    ) {

      end =
        uniquePositions[i + 1];

    } else {

      end =
        Math.min(
          html.length,
          current + 50000
        );
    }


    blocks.push(
      html.substring(
        start,
        end
      )
    );
  }


  return blocks;
}


/* =========================================================
   EXTRACT PRIZE
   ========================================================= */

function extractPrize(
  html,
  prizeClass
) {

  const tdRegex =
    new RegExp(

      `<td[^>]*class=["'][^"']*\\b${prizeClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,

      "i"

    );


  const match =
    html.match(
      tdRegex
    );


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


  if (!numbers.length) {

    const plain =
      stripTags(content);


    const fallback =
      plain.match(
        /\b\d{2,6}\b/g
      );


    if (fallback) {

      return fallback;
    }
  }


  return numbers;
}


function parseResults(html) {

  return {

    giai8:
      extractPrize(
        html,
        "giai8"
      ),

    giai7:
      extractPrize(
        html,
        "giai7"
      ),

    giai6:
      extractPrize(
        html,
        "giai6"
      ),

    giai5:
      extractPrize(
        html,
        "giai5"
      ),

    giai4:
      extractPrize(
        html,
        "giai4"
      ),

    giai3:
      extractPrize(
        html,
        "giai3"
      ),

    giai2:
      extractPrize(
        html,
        "giai2"
      ),

    giai1:
      extractPrize(
        html,
        "giai1"
      ),

    giaidb:
      extractPrize(
        html,
        "giaidb"
      )

  };
}


/* =========================================================
   RESULT VALIDATION
   ========================================================= */

function validateResults(results) {

  const expected = {

    giai8: {
      count: 1,
      digits: 2
    },

    giai7: {
      count: 1,
      digits: 3
    },

    giai6: {
      count: 3,
      digits: 4
    },

    giai5: {
      count: 1,
      digits: 4
    },

    giai4: {
      count: 7,
      digits: 5
    },

    giai3: {
      count: 2,
      digits: 5
    },

    giai2: {
      count: 1,
      digits: 5
    },

    giai1: {
      count: 1,
      digits: 5
    },

    giaidb: {
      count: 1,
      digits: 6
    }

  };


  for (
    const [key, config]
    of Object.entries(expected)
  ) {

    const values =
      results[key];


    if (
      !Array.isArray(values) ||
      values.length !== config.count
    ) {

      return false;
    }


    for (
      const value
      of values
    ) {

      const pattern =
        new RegExp(
          `^\\d{${config.digits}}$`
        );


      if (
        !pattern.test(
          String(value)
        )
      ) {

        return false;
      }
    }
  }


  return true;
}


/* =========================================================
   EXTRACT DATE FROM RESULT BLOCK
   ========================================================= */

function extractDrawDateFromBlock(
  block,
  province
) {

  const text =
    stripTags(block);


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
   * Có thể có nhiều ngày ở vùng HTML.
   *
   * Chọn ngày hợp lệ và đúng thứ quay của tỉnh.
   */

  const candidates = [];


  for (const match of matches) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);


    if (
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 2010 ||
      year > 2100
    ) {

      continue;
    }


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {

      continue;
    }


    if (
      province.days.includes(
        date.getDay()
      )
    ) {

      candidates.push({

        iso:
          isoDateFromParts(
            day,
            month,
            year
          ),

        index:
          match.index

      });
    }
  }


  if (!candidates.length) {

    return null;
  }


  /*
   * Ngày gần phần bảng nhất thường nằm cuối vùng heading.
   * Ưu tiên candidate cuối cùng.
   */

  return candidates[
    candidates.length - 1
  ].iso;
}


/* =========================================================
   CONVERT RESULT -> DATABASE DRAW
   ========================================================= */

function convertToDraw(
  province,
  date,
  results
) {

  const draw = {

    province:
      province.id,

    date,

    ticketCode:
      "",

    prizes: {

      db:
        String(
          results.giaidb[0]
        ),

      g1:
        String(
          results.giai1[0]
        ),

      g2:
        String(
          results.giai2[0]
        ),

      g3:
        results.giai3
          .map(String),

      g4:
        results.giai4
          .map(String),

      g5:
        String(
          results.giai5[0]
        ),

      g6:
        results.giai6
          .map(String),

      g7:
        String(
          results.giai7[0]
        ),

      g8:
        String(
          results.giai8[0]
        )

    }

  };


  return draw;
}


/* =========================================================
   DATABASE DRAW VALIDATION
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
    !isKnownProvince(
      draw.province
    )
  ) {

    return false;
  }


  if (
    typeof draw.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/
      .test(draw.date)
  ) {

    return false;
  }


  const p =
    draw.prizes;


  if (!p) {

    return false;
  }


  if (
    !/^\d{6}$/.test(
      String(p.db)
    )
  ) {

    return false;
  }


  if (
    !/^\d{5}$/.test(
      String(p.g1)
    )
  ) {

    return false;
  }


  if (
    !/^\d{5}$/.test(
      String(p.g2)
    )
  ) {

    return false;
  }


  if (
    !Array.isArray(p.g3) ||
    p.g3.length !== 2 ||
    !p.g3.every(
      value =>
        /^\d{5}$/.test(
          String(value)
        )
    )
  ) {

    return false;
  }


  if (
    !Array.isArray(p.g4) ||
    p.g4.length !== 7 ||
    !p.g4.every(
      value =>
        /^\d{5}$/.test(
          String(value)
        )
    )
  ) {

    return false;
  }


  if (
    !/^\d{4}$/.test(
      String(p.g5)
    )
  ) {

    return false;
  }


  if (
    !Array.isArray(p.g6) ||
    p.g6.length !== 3 ||
    !p.g6.every(
      value =>
        /^\d{4}$/.test(
          String(value)
        )
    )
  ) {

    return false;
  }


  if (
    !/^\d{3}$/.test(
      String(p.g7)
    )
  ) {

    return false;
  }


  if (
    !/^\d{2}$/.test(
      String(p.g8)
    )
  ) {

    return false;
  }


  return true;
}


/* =========================================================
   PARSE ALL DRAWS FROM PAGE
   ========================================================= */

function parsePage(
  html,
  province
) {

  const blocks =
    extractResultBlocks(
      html
    );


  const draws = [];


  for (
    const block
    of blocks
  ) {

    const results =
      parseResults(
        block
      );


    if (
      !validateResults(
        results
      )
    ) {

      continue;
    }


    const date =
      extractDrawDateFromBlock(
        block,
        province
      );


    if (!date) {

      continue;
    }


    const draw =
      convertToDraw(
        province,
        date,
        results
      );


    if (
      validateDraw(
        draw
      )
    ) {

      draws.push(
        draw
      );
    }
  }


  /*
   * Chống trùng trong cùng page.
   */

  const map =
    new Map();


  for (const draw of draws) {

    map.set(
      makeKey(draw),
      draw
    );
  }


  return Array.from(
    map.values()
  )

    .sort(
      (a, b) =>
        b.date.localeCompare(
          a.date
        )
    );
}


/* =========================================================
   FIND PREVIOUS REQUEST DATE
   ========================================================= */

function dateBefore(
  iso,
  days
) {

  const [
    year,
    month,
    day
  ] =
    iso
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  date.setDate(
    date.getDate() -
    days
  );


  return date;
}


/* =========================================================
   BUILD URL
   ========================================================= */

function currentUrl(
  province
) {

  return (
    "https://www.minhngoc.net.vn/" +
    "ket-qua-xo-so/mien-nam/" +
    province.slug +
    ".html"
  );
}


function historicalUrl(
  province,
  date
) {

  return (
    "https://www.minhngoc.net.vn/" +
    "ket-qua-xo-so/mien-nam/" +
    province.slug +
    "/" +
    formatDateForUrl(date) +
    ".html"
  );
}


/* =========================================================
   LOAD EXISTING DATABASE
   ========================================================= */

function loadExistingDraws() {

  if (
    !fs.existsSync(
      OUTPUT_FILE
    )
  ) {

    return [];
  }


  try {

    const raw =
      fs.readFileSync(
        OUTPUT_FILE,
        "utf8"
      );


    const json =
      JSON.parse(raw);


    if (
      !Array.isArray(
        json.draws
      )
    ) {

      return [];
    }


    return json.draws
      .filter(
        validateDraw
      );


  } catch (error) {

    console.warn(
      "⚠ Existing database could not be read:",
      error.message
    );


    return [];
  }

}


/* =========================================================
   BOOTSTRAP ONE PROVINCE
   ========================================================= */

async function bootstrapProvince(
  province,
  existing
) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    `BOOTSTRAP: ${province.name}`
  );

  console.log(
    "========================================"
  );


  const map =
    new Map();


  /*
   * Giữ dữ liệu hợp lệ đang có.
   */

  existing

    .filter(
      draw =>
        draw.province ===
        province.id
    )

    .forEach(
      draw => {

        map.set(
          makeKey(draw),
          draw
        );

      }
    );


  console.log(
    `Existing: ${map.size}/${MAX_DRAWS_PER_PROVINCE}`
  );


  /*
   * Request đầu tiên:
   * trang hiện tại.
   */

  let requestUrl =
    currentUrl(
      province
    );


  let requestNumber = 0;

  let oldestDate = null;

  const visitedUrls =
    new Set();


  while (
    map.size <
      MAX_DRAWS_PER_PROVINCE &&

    requestNumber <
      MAX_REQUESTS_PER_PROVINCE
  ) {

    requestNumber++;


    if (
      visitedUrls.has(
        requestUrl
      )
    ) {

      console.log(
        "⚠ URL already visited, stopping."
      );

      break;
    }


    visitedUrls.add(
      requestUrl
    );


    console.log("");
    console.log(
      `[${requestNumber}/${MAX_REQUESTS_PER_PROVINCE}] ${requestUrl}`
    );


    try {

      const html =
        await download(
          requestUrl
        );


      const pageDraws =
        parsePage(
          html,
          province
        );


      console.log(
        `Parsed valid draws: ${pageDraws.length}`
      );


      if (!pageDraws.length) {

        console.log(
          "⚠ No valid draw found on page."
        );


        /*
         * Nếu page không parse được,
         * lùi thêm khoảng 28 ngày.
         */

        const fallbackDate =
          oldestDate
            ? dateBefore(
                oldestDate,
                28
              )
            : dateBefore(
                new Date()
                  .toISOString()
                  .slice(0, 10),
                requestNumber * 28
              );


        requestUrl =
          historicalUrl(
            province,
            fallbackDate
          );


        await sleep(
          REQUEST_DELAY_MS
        );


        continue;
      }


      let added = 0;


      for (
        const draw
        of pageDraws
      ) {

        const key =
          makeKey(draw);


        if (
          !map.has(key)
        ) {

          map.set(
            key,
            draw
          );

          added++;
        }
      }


      console.log(
        `Added: ${added}`
      );


      console.log(
        `Total: ${map.size}/${MAX_DRAWS_PER_PROVINCE}`
      );


      /*
       * Tìm kỳ cũ nhất ta đang có.
       */

      const sorted =
        Array.from(
          map.values()
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        );


      if (sorted.length) {

        oldestDate =
          sorted[0].date;
      }


      if (
        map.size >=
        MAX_DRAWS_PER_PROVINCE
      ) {

        break;
      }


      /*
       * Request tiếp theo:
       * lùi 7 ngày trước kỳ cũ nhất.
       *
       * URL chỉ là mốc truy vấn.
       * drawDate thực tế vẫn được đọc từ HTML.
       */

      const nextDate =
        dateBefore(
          oldestDate,
          7
        );


      requestUrl =
        historicalUrl(
          province,
          nextDate
        );


    } catch (error) {

      console.log(
        `⚠ Request failed: ${error.message}`
      );


      /*
       * Nếu lỗi request,
       * lùi sâu hơn 14 ngày.
       */

      const fallbackDate =
        oldestDate
          ? dateBefore(
              oldestDate,
              14
            )
          : dateBefore(
              new Date()
                .toISOString()
                .slice(0, 10),
              requestNumber * 14
            );


      requestUrl =
        historicalUrl(
          province,
          fallbackDate
        );
    }


    await sleep(
      REQUEST_DELAY_MS
    );
  }


  const final =
    Array.from(
      map.values()
    )

      .filter(
        validateDraw
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


  console.log("");
  console.log(
    `${province.name}: ${final.length}/${MAX_DRAWS_PER_PROVINCE} kỳ`
  );


  if (final.length) {

    console.log(
      `Newest: ${final[0].date}`
    );

    console.log(
      `Oldest: ${final[final.length - 1].date}`
    );
  }


  return final;
}


/* =========================================================
   FINAL DATABASE VALIDATION
   ========================================================= */

function validateFinalDatabase(
  draws
) {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "FINAL DATABASE VALIDATION"
  );

  console.log(
    "========================================"
  );


  let complete = 0;

  let duplicates = 0;

  let invalid = 0;


  const seen =
    new Set();


  for (const draw of draws) {

    if (
      !validateDraw(
        draw
      )
    ) {

      invalid++;
    }


    const key =
      makeKey(draw);


    if (
      seen.has(key)
    ) {

      duplicates++;
    }


    seen.add(key);
  }


  for (
    const province
    of PROVINCES
  ) {

    const list =
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


    const status =
      list.length ===
      MAX_DRAWS_PER_PROVINCE
        ? "OK"
        : "INCOMPLETE";


    if (
      list.length ===
      MAX_DRAWS_PER_PROVINCE
    ) {

      complete++;
    }


    const newest =
      list.length
        ? list[0].date
        : "-";


    const oldest =
      list.length
        ? list[
            list.length - 1
          ].date
        : "-";


    console.log(

      `${province.name.padEnd(12)} | ` +

      `${String(list.length).padStart(3)} kỳ | ` +

      `${newest} -> ${oldest} | ` +

      status

    );
  }


  const expected =
    PROVINCES.length *
    MAX_DRAWS_PER_PROVINCE;


  console.log("");
  console.log(
    "----------------------------------------"
  );

  console.log(
    `TOTAL       : ${draws.length}`
  );

  console.log(
    `EXPECTED    : ${expected}`
  );

  console.log(
    `COMPLETE    : ${complete}/${PROVINCES.length}`
  );

  console.log(
    `DUPLICATES  : ${duplicates}`
  );

  console.log(
    `INVALID     : ${invalid}`
  );

  console.log(
    "----------------------------------------"
  );


  return (

    draws.length === expected &&

    complete ===
      PROVINCES.length &&

    duplicates === 0 &&

    invalid === 0

  );
}


/* =========================================================
   SAVE DATABASE
   ========================================================= */

function saveDatabase(
  draws
) {

  /*
   * Backup database cũ trước.
   */

  if (
    fs.existsSync(
      OUTPUT_FILE
    )
  ) {

    fs.copyFileSync(
      OUTPUT_FILE,
      BACKUP_FILE
    );


    console.log(
      `✓ Backup: ${BACKUP_FILE}`
    );
  }


  const output = {

    generatedAt:
      new Date()
        .toISOString(),

    source:
      "minhngoc.net.vn",

    provinceCount:
      PROVINCES.length,

    maxDrawsPerProvince:
      MAX_DRAWS_PER_PROVINCE,

    totalDraws:
      draws.length,

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
    `✓ File size: ${(size / 1024).toFixed(1)} KB`
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
    "XSMN HISTORY BOOTSTRAPPER"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Provinces : ${PROVINCES.length}`
  );

  console.log(
    `Target    : ${MAX_DRAWS_PER_PROVINCE} draws/province`
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


  const existing =
    loadExistingDraws();


  console.log(
    `Existing valid draws: ${existing.length}`
  );


  const allDraws = [];


  /*
   * Chạy tuần tự.
   *
   * Không Promise.all để tránh gửi 21 request cùng lúc.
   */

  for (
    let i = 0;
    i < PROVINCES.length;
    i++
  ) {

    const province =
      PROVINCES[i];


    console.log("");
    console.log(
      `######## ${i + 1}/${PROVINCES.length} ########`
    );


    const provinceDraws =
      await bootstrapProvince(
        province,
        existing
      );


    allDraws.push(
      ...provinceDraws
    );


    /*
     * Nghỉ thêm giữa hai tỉnh.
     */

    if (
      i <
      PROVINCES.length - 1
    ) {

      await sleep(
        2500
      );
    }
  }


  /*
   * Sort cuối.
   */

  allDraws.sort(
    (a, b) => {

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
  );


  /*
   * QUAN TRỌNG:
   *
   * Không ghi đè database nếu chưa đủ
   * 21 tỉnh x 100 kỳ.
   */

  const valid =
    validateFinalDatabase(
      allDraws
    );


  if (!valid) {

    console.log("");
    console.log(
      "✗ BOOTSTRAP CHƯA ĐẠT 21 x 100."
    );

    console.log(
      "xsmn_seed.json KHÔNG bị ghi đè."
    );

    console.log(
      "Hãy xem log tỉnh nào INCOMPLETE."
    );


    process.exitCode = 1;

    return;
  }


  saveDatabase(
    allDraws
  );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "✓ XSMN HISTORY DATABASE READY"
  );

  console.log(
    "✓ 21 PROVINCES x 100 DRAWS = 2100"
  );

  console.log(
    "========================================"
  );

}


/* =========================================================
   RUN
   ========================================================= */

main()
  .catch(
    error => {

      console.error("");
      console.error(
        "FATAL ERROR:"
      );

      console.error(
        error.stack ||
        error.message
      );

      process.exit(1);

    }
  );
