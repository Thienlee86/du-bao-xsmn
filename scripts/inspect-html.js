/**
 * INSPECT XSMN HTML
 * Đọc file An Giang đã tải và tìm cấu trúc bảng kết quả.
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "data",
  "an-giang-latest.json"
);

console.log("====================================");
console.log("XSMN HTML INSPECTOR");
console.log("====================================");

if (!fs.existsSync(FILE)) {
  console.error("Không tìm thấy file:");
  console.error(FILE);
  process.exit(1);
}

const raw = fs.readFileSync(FILE, "utf8");
const data = JSON.parse(raw);

const html = data.html || "";

console.log("Province:", data.province);
console.log("HTML length:", html.length);

const keywords = [
  "giaidb",
  "giai8",
  "giai7",
  "giai6",
  "giai5",
  "giai4",
  "giai3",
  "giai2",
  "giai1",
  "Giải tám",
  "Giải đặc biệt",
  "box_kqxs"
];

console.log("\n========== SEARCH ==========\n");

let found = 0;

for (const keyword of keywords) {

  const index = html
    .toLowerCase()
    .indexOf(keyword.toLowerCase());

  if (index === -1) {
    console.log(`NOT FOUND: ${keyword}`);
    continue;
  }

  found++;

  console.log("\n====================================");
  console.log(`FOUND: ${keyword}`);
  console.log(`POSITION: ${index}`);
  console.log("====================================\n");

  const start = Math.max(0, index - 1000);
  const end = Math.min(html.length, index + 5000);

  console.log(html.substring(start, end));

  console.log("\n========== END ==========\n");
}

console.log("\n====================================");

if (found === 0) {
  console.log("Không tìm thấy keyword chuẩn.");
  console.log("Đang tìm thử các class chứa 'giai'...");

  const matches = html.match(
    /.{0,300}giai.{0,1000}/gi
  );

  if (matches) {
    matches.slice(0, 10).forEach((item, i) => {
      console.log(`\n--- MATCH ${i + 1} ---\n`);
      console.log(item);
    });
  } else {
    console.log("Không tìm thấy chuỗi 'giai'.");
  }
}

console.log("\nInspector finished.");
