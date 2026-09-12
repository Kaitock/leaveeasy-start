// ─────────────────────────────────────────────────────────────
// tests/smoke.spec.js — เทสต์ตัวอย่าง เช็คว่าเว็บที่ deploy ไปแล้วเปิดได้จริง
//
// 📌 เขียนเฉพาะส่วนที่ไม่ต้องล็อกอิน เพราะไฟล์นี้ไม่มีรหัสผ่านของใครอยู่ในนั้น
//    ถ้าจะเทสต์หน้าที่ต้องล็อกอิน (ยื่นใบลา/อนุมัติ) ต้องเพิ่มขั้นกรอกอีเมล-รหัสผ่านเอง
//    และห้ามเขียนรหัสผ่านจริงลงไฟล์นี้ตรง ๆ (ใช้ตัวแปรสภาพแวดล้อมแทน — ถามผู้ช่วยได้ถ้าต้องการ)
// ─────────────────────────────────────────────────────────────

const { test, expect } = require("@playwright/test");

// 📌 js/auth.js บังคับล็อกอินกับ "ทุกหน้ายกเว้น login.html" (ดูคอมเมนต์ในไฟล์นั้น)
//    รวมถึงหน้าแรก index.html ด้วย — ยังไม่ได้ล็อกอินจึงเด้งไป login.html เสมอ
//    เทสต์ 2 ตัวแรกด้านล่างจึงเช็คพฤติกรรมนี้ ไม่ใช่เช็คเนื้อหาหน้าแรกตรง ๆ
test("หน้าแรกเด้งไปหน้าเข้าสู่ระบบ ถ้ายังไม่ได้ล็อกอิน", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login\.html/);
});

test("หน้าที่ต้องล็อกอินก่อน (เช่นหน้ารายการใบลา) เด้งไปหน้าเข้าสู่ระบบเหมือนกัน", async ({ page }) => {
  await page.goto("/leave-requests.html");
  await expect(page).toHaveURL(/login\.html/);
});

test("หน้าเข้าสู่ระบบมีฟอร์มครบ", async ({ page }) => {
  await page.goto("/login.html");
  await expect(page).toHaveTitle(/LeaveEasy/);
  await expect(page.locator("#อีเมล")).toBeVisible();
  await expect(page.locator("#รหัสผ่าน")).toBeVisible();
  await expect(page.locator("#ปุ่มส่ง")).toBeVisible();
});
