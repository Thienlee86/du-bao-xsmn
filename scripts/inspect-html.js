const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "data",
  "an-giang-latest.json"
);

console.log("====================================");
console.log("XSMN RESULT TABLE INSPECTOR");
console.log("====================================");

if (!fs.existsSync(FILE)) {
  console.error("File not found:", FILE);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const html = data.html || "";

console.log("Province:", data.province);
console.log("HTML length:", html.length);

/*
 * CSS của trang nằm ở đầu HTML và cũng chứa các từ
 * giai8, giai7, giaidb...
 *
 * Vì vậy chúng ta tìm tất cả vị trí xuất hiện,
 * thay vì chỉ lấy vị trí đầu tiên.
 */

const keywords = [
  'class="giai8"',
  'class="giai7"',
  'class="giai6"',
  'class="giai5"',
  'class="giai4"',
  'class="giai3"',
  'class="giai2"',
  'class="giai1"',
  'class="giaidb"'
];

for (const keyword of keywords) {

  console.log("\n\n====================================");
  console.log("SEARCH:", keyword);
  console.log("====================================");

  let position = 0;
  let count = 0;

  while (true) {

    position = html.indexOf(keyword, position);

    if (position === -1) {
      break;
    }

    count++;

    console.log(
      `FOUND #${count} AT POSITION ${position}`
    );

    /*
     * Chỉ in những vị trí nằm sâu trong HTML.
     * Phần CSS thường nằm ở đầu file.
     */
    if (position > 30000) {

      const start = Math.max(0, position - 500);
      const end = Math.min(
        html.length,
        position + 1500
      );

      console.log("\n----- HTML RESULT AREA -----\n");
      console.log(html.substring(start, end));
      console.log("\n----- END RESULT AREA -----\n");

      /*
       * Chỉ cần mẫu đầu tiên trong vùng dữ liệu.
       */
      break;
    }

    position += keyword.length;
  }

  console.log("Occurrences checked:", count);
}

console.log("\n====================================");
console.log("INSPECTION COMPLETE");
console.log("====================================");
