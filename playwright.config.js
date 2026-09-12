// ─────────────────────────────────────────────────────────────
// playwright.config.js — ตั้งค่าการทดสอบอัตโนมัติด้วย Playwright
//
// ชี้ไปที่เว็บ LeaveEasy ตัวจริงบน Firebase Hosting (ไม่ใช่ localhost)
// เพราะต้องการทดสอบระบบที่ deploy ขึ้นออนไลน์แล้วจริง ๆ
//
// 📌 ไฟล์นี้เป็น CommonJS (require/module.exports) ให้ตรงกับ package.json
//    ของโปรเจกต์ที่ไม่ได้ตั้ง "type": "module" ไว้ — ไม่เกี่ยวกับหน้าเว็บ
//    ที่ยังเป็น ES module ตามเดิม (ไฟล์นี้รันด้วย Node ตอนเทสต์เท่านั้น)
// ─────────────────────────────────────────────────────────────

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",

  // เว็บจริงบน Firebase Hosting — เขียน path สั้น ๆ ในเทสต์ได้ เช่น page.goto("/login.html")
  use: {
    baseURL: "https://leaveeasy-jirapan.web.app",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  // ตอนนี้ดาวน์โหลดไว้แค่ Chromium — ถ้าจะเพิ่ม Firefox/WebKit ต้อง
  // npx playwright install <ชื่อเบราว์เซอร์> ก่อน แล้วค่อยเพิ่ม project ที่นี่
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  reporter: "html", // ดูผลแบบหน้าเว็บได้ด้วย: npx playwright show-report
});
