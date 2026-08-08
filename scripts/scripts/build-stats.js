/**
 * XSMN STATISTICS BUILDER
 * =======================
 *
 * Input:
 *   data/xsmn_seed.json
 *
 * Output:
 *   data/xsmn_stats.json
 *
 * Chức năng:
 * - Thống kê 21 đài XSMN
 * - Phân tích 100 kỳ / đài
 * - Giải đặc biệt đủ 6 chữ số
 * - Thống kê từng vị trí chữ số
 * - Thống kê đầu / giữa / đuôi
 * - Thống kê 2 số cuối 00-99
 * - Thống kê tổng GĐB
 * - Chẵn / lẻ
 * - Khoảng cách kể từ lần xuất hiện gần nhất
 *
 * LƯU Ý:
 * Đây là tầng thống kê.
 * Chưa phải mô hình dự báo cuối cùng.
 */

const fs = require("fs");
const path = require("path");


/* =========================================================
   CONFIG
   ========================================================= */

const DATA_DIR =
  path.join(__dirname, "..", "data");

const INPUT_FILE =
  path.join(DATA_DIR, "xsmn_seed.json");

const OUTPUT_FILE =
  path.join(DATA_DIR, "xsmn_stats.json");


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
   LOAD DATABASE
   ========================================================= */

function loadDatabase() {

  if (!fs.existsSync(INPUT_FILE)) {

    throw new Error(
      "data/xsmn_seed.json not found"
    );
  }


  const raw =
    fs.readFileSync(
      INPUT_FILE,
      "utf8"
    );


  const data =
    JSON.parse(raw);


  if (!Array.isArray(data.draws)) {

    throw new Error(
      "Invalid xsmn_seed.json: draws array not found"
    );
  }


  return data;
}


/* =========================================================
   HELPERS
   ========================================================= */

function createDigitCounter() {

  return {
    "0": 0,
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0
  };
}


function createPairCounter() {

  const counter = {};


  for (let i = 0; i < 100; i++) {

    const key =
      String(i).padStart(2, "0");

    counter[key] = 0;
  }


  return counter;
}


function sortCounter(counter) {

  return Object.entries(counter)
    .map(
      ([value, count]) => ({
        value,
        count
      })
    )
    .sort(
      (a, b) => {

        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.value.localeCompare(
          b.value
        );
      }
    );
}


function digitSum(numberString) {

  return numberString
    .split("")
    .reduce(
      (sum, digit) =>
        sum + Number(digit),
      0
    );
}


/* =========================================================
   SPECIAL PRIZE VALIDATION
   ========================================================= */

function getSpecialPrize(draw) {

  if (
    !draw ||
    !draw.prizes ||
    draw.prizes.db === undefined ||
    draw.prizes.db === null
  ) {
    return null;
  }


  const value =
    String(draw.prizes.db)
      .trim()
      .padStart(6, "0");


  if (!/^\d{6}$/.test(value)) {
    return null;
  }


  return value;
}


/* =========================================================
   POSITION STATISTICS
   ========================================================= */

function buildPositionStats(numbers) {

  const positions = [
    createDigitCounter(),
    createDigitCounter(),
    createDigitCounter(),
    createDigitCounter(),
    createDigitCounter(),
    createDigitCounter()
  ];


  for (const number of numbers) {

    for (
      let position = 0;
      position < 6;
      position++
    ) {

      const digit =
        number[position];


      positions[position][digit]++;
    }
  }


  return positions.map(
    (counter, index) => ({

      position:
        index + 1,

      frequency:
        counter,

      ranking:
        sortCounter(counter)
    })
  );
}


/* =========================================================
   PAIR STATISTICS
   ========================================================= */

function buildPairStats(
  numbers,
  startPosition
) {

  const counter =
    createPairCounter();


  for (const number of numbers) {

    const pair =
      number.substring(
        startPosition,
        startPosition + 2
      );


    if (
      Object.prototype.hasOwnProperty.call(
        counter,
        pair
      )
    ) {

      counter[pair]++;
    }
  }


  return {
    frequency:
      counter,

    ranking:
      sortCounter(counter)
  };
}


/* =========================================================
   LAST 2 DIGITS + GAP
   ========================================================= */

function buildLast2Stats(numbers) {

  const counter =
    createPairCounter();


  const lastSeen = {};


  for (
    let index = 0;
    index < numbers.length;
    index++
  ) {

    const number =
      numbers[index];


    const pair =
      number.slice(-2);


    counter[pair]++;


    /*
     * numbers được sort mới -> cũ.
     *
     * index 0 = kỳ mới nhất.
     * Vì vậy lần đầu gặp chính là
     * khoảng cách từ hiện tại.
     */

    if (
      lastSeen[pair] === undefined
    ) {

      lastSeen[pair] =
        index;
    }
  }


  const gaps = {};


  for (let i = 0; i < 100; i++) {

    const pair =
      String(i).padStart(2, "0");


    gaps[pair] =
      lastSeen[pair] !== undefined
        ? lastSeen[pair]
        : numbers.length;
  }


  const hot =
    sortCounter(counter)
      .slice(0, 10);


  const cold =
    Object.entries(gaps)
      .map(
        ([value, gap]) => ({
          value,
          gap,
          count:
            counter[value]
        })
      )
      .sort(
        (a, b) => {

          if (b.gap !== a.gap) {
            return b.gap - a.gap;
          }

          return a.value.localeCompare(
            b.value
          );
        }
      )
      .slice(0, 10);


  return {
    frequency:
      counter,

    ranking:
      sortCounter(counter),

    gap:
      gaps,

    hotTop10:
      hot,

    overdueTop10:
      cold
  };
}


/* =========================================================
   SUM STATISTICS
   ========================================================= */

function buildSumStats(numbers) {

  const counter = {};


  for (let i = 0; i <= 54; i++) {
    counter[String(i)] = 0;
  }


  for (const number of numbers) {

    const sum =
      digitSum(number);


    counter[String(sum)]++;
  }


  return {
    frequency:
      counter,

    ranking:
      sortCounter(counter)
  };
}


/* =========================================================
   EVEN / ODD
   ========================================================= */

function buildEvenOddStats(numbers) {

  let evenLastDigit = 0;
  let oddLastDigit = 0;


  let totalEvenDigits = 0;
  let totalOddDigits = 0;


  for (const number of numbers) {

    const lastDigit =
      Number(
        number[number.length - 1]
      );


    if (lastDigit % 2 === 0) {
      evenLastDigit++;
    } else {
      oddLastDigit++;
    }


    for (const char of number) {

      const digit =
        Number(char);


      if (digit % 2 === 0) {
        totalEvenDigits++;
      } else {
        totalOddDigits++;
      }
    }
  }


  return {

    lastDigit: {
      even:
        evenLastDigit,

      odd:
        oddLastDigit
    },

    allDigits: {
      even:
        totalEvenDigits,

      odd:
        totalOddDigits
    }
  };
}


/* =========================================================
   RECENT WINDOWS
   ========================================================= */

function buildWindowStats(
  numbers,
  windowSize
) {

  const sample =
    numbers.slice(
      0,
      windowSize
    );


  return {

    draws:
      sample.length,

    last2:
      buildLast2Stats(
        sample
      ),

    positions:
      buildPositionStats(
        sample
      )
  };
}


/* =========================================================
   BUILD ONE PROVINCE
   ========================================================= */

function buildProvinceStats(
  province,
  allDraws
) {

  const draws =
    allDraws
      .filter(
        draw =>
          draw.province === province.id
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      );


  const validDraws = [];


  for (const draw of draws) {

    const db =
      getSpecialPrize(draw);


    if (!db) {
      continue;
    }


    validDraws.push({
      date:
        draw.date,

      db
    });
  }


  const numbers =
    validDraws.map(
      draw => draw.db
    );


  if (numbers.length === 0) {

    return {
      province:
        province.id,

      provinceName:
        province.name,

      drawCount:
        0
    };
  }


  /*
   * DB = ABCDEF
   *
   * head2   = AB
   * middle2 = CD
   * tail2   = EF
   */

  const head2 =
    buildPairStats(
      numbers,
      0
    );


  const middle2 =
    buildPairStats(
      numbers,
      2
    );


  const tail2 =
    buildLast2Stats(
      numbers
    );


  return {

    province:
      province.id,

    provinceName:
      province.name,

    drawCount:
      numbers.length,

    latestDate:
      validDraws[0].date,

    oldestDate:
      validDraws[
        validDraws.length - 1
      ].date,

    latestSpecialPrize:
      numbers[0],


    specialPrize: {

      /*
       * 6 vị trí A B C D E F
       */

      positions:
        buildPositionStats(
          numbers
        ),


      /*
       * AB | CD | EF
       */

      head2,

      middle2,

      tail2,


      /*
       * Tổng 6 chữ số.
       */

      sum:
        buildSumStats(
          numbers
        ),


      /*
       * Chẵn / lẻ.
       */

      evenOdd:
        buildEvenOddStats(
          numbers
        ),


      /*
       * Các cửa sổ gần đây.
       */

      windows: {

        last10:
          buildWindowStats(
            numbers,
            10
          ),

        last30:
          buildWindowStats(
            numbers,
            30
          ),

        last50:
          buildWindowStats(
            numbers,
            50
          ),

        last100:
          buildWindowStats(
            numbers,
            100
          )
      }
    }
  };
}


/* =========================================================
   BUILD ALL
   ========================================================= */

function buildStatistics(data) {

  const provinces = {};


  for (const province of PROVINCES) {

    console.log(
      `Building stats: ${province.name}`
    );


    provinces[province.id] =
      buildProvinceStats(
        province,
        data.draws
      );
  }


  return {

    generatedAt:
      new Date()
        .toISOString(),

    sourceGeneratedAt:
      data.generatedAt || null,

    databaseDraws:
      data.draws.length,

    provinceCount:
      PROVINCES.length,

    model: {

      specialPrizeDigits:
        6,

      supportedWindows: [
        10,
        30,
        50,
        100
      ],

      predictionReady:
        false
    },

    provinces
  };
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateStatistics(stats) {

  const provinceIds =
    Object.keys(
      stats.provinces
    );


  if (
    provinceIds.length !==
    PROVINCES.length
  ) {

    throw new Error(
      `Expected ${PROVINCES.length} provinces, got ${provinceIds.length}`
    );
  }


  let complete = 0;


  console.log("");
  console.log(
    "----- STATISTICS SUMMARY -----"
  );


  for (const province of PROVINCES) {

    const stat =
      stats.provinces[
        province.id
      ];


    const count =
      stat?.drawCount || 0;


    const status =
      count === 100
        ? "OK"
        : "CHECK";


    if (count === 100) {
      complete++;
    }


    console.log(
      `${province.name.padEnd(12)} | ${String(count).padStart(3)} kỳ | DB ${stat?.latestSpecialPrize || "-"} | ${status}`
    );
  }


  console.log(
    "----------------------------------------"
  );

  console.log(
    `DATABASE DRAWS : ${stats.databaseDraws}`
  );

  console.log(
    `PROVINCES      : ${provinceIds.length}`
  );

  console.log(
    `COMPLETE       : ${complete}/${PROVINCES.length}`
  );

  console.log(
    "----------------------------------------"
  );


  if (
    stats.databaseDraws !== 2100
  ) {

    throw new Error(
      `Expected databaseDraws = 2100, got ${stats.databaseDraws}`
    );
  }


  if (
    complete !==
    PROVINCES.length
  ) {

    throw new Error(
      "Some provinces do not contain 100 valid special prizes"
    );
  }
}


/* =========================================================
   SAVE
   ========================================================= */

function saveStatistics(stats) {

  fs.writeFileSync(

    OUTPUT_FILE,

    JSON.stringify(
      stats,
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
    `✓ Saved ${OUTPUT_FILE}`
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
    "XSMN STATISTICS BUILDER"
  );

  console.log(
    "========================================"
  );


  const data =
    loadDatabase();


  console.log(
    `Loaded ${data.draws.length} draws`
  );


  const stats =
    buildStatistics(
      data
    );


  validateStatistics(
    stats
  );


  saveStatistics(
    stats
  );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "✓ XSMN STATISTICS READY"
  );

  console.log(
    "6-DIGIT SPECIAL PRIZE SUPPORT: READY"
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
