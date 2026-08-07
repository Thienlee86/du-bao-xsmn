/**
 * XSMN DATA UPDATER
 * Chạy bằng GitHub Actions.
 *
 * Mục tiêu:
 * - Lấy trang kết quả XSMN từ nguồn công khai
 * - Lưu bản HTML mới nhất vào data/
 * - App GitHub Pages có thể đọc dữ liệu cùng domain
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
  { id: "tien-giang", name: "Tiền Giang", slug: "tien-giang" },
  { id: "kien-giang", name: "Kiên Giang", slug: "kien-giang" },
  { id: "da-lat", name: "Đà Lạt", slug: "da-lat" }
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

async function updateProvince(province) {
  /*
   * Nếu Minh Ngọc thay đổi URL trong tương lai,
   * chỉ cần sửa dòng URL này.
   */
  const url =
    `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-nam/${province.slug}.html`;

  console.log(`\nUpdating ${province.name}`);
  console.log(url);

  try {
    const html = await download(url);

    if (!html || html.length < 1000) {
      throw new Error("Downloaded page is unexpectedly empty.");
    }

    const output = {
      province: province.name,
      provinceId: province.id,
      source: url,
      updatedAt: new Date().toISOString(),
      html
    };

    const outputPath = path.join(
      DATA_DIR,
      `${province.id}-latest.json`
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(output, null, 2),
      "utf8"
    );

    console.log(`✓ Saved ${outputPath}`);

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
  console.log("=================================");
  console.log("XSMN automatic data updater");
  console.log("=================================");

  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });

  let success = 0;
  let failed = 0;

  for (const province of PROVINCES) {
    const ok = await updateProvince(province);

    if (ok) {
      success++;
    } else {
      failed++;
    }

    /*
     * Không gửi 21 request cùng lúc.
     * Nghỉ một chút giữa các tỉnh.
     */
    await sleep(1500);
  }

  const status = {
    updatedAt: new Date().toISOString(),
    success,
    failed,
    total: PROVINCES.length
  };

  fs.writeFileSync(
    path.join(DATA_DIR, "update-status.json"),
    JSON.stringify(status, null, 2),
    "utf8"
  );

  console.log("\n=================================");
  console.log(`Success: ${success}`);
  console.log(`Failed : ${failed}`);
  console.log(`Total  : ${PROVINCES.length}`);
  console.log("=================================");

  /*
   * Không làm workflow chết hoàn toàn nếu chỉ
   * một vài tỉnh tạm thời không tải được.
   */
  if (success === 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
