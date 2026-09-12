// ─────────────────────────────────────────────────────────────
// js/ai.js — ฟังก์ชันกลางสำหรับเรียก AI ผ่าน OpenRouter
// ใช้ร่วมกันได้ทั้งหน้าทดสอบ (test-ai.js) และฟีเจอร์จริง (new-leave-request.js)
//
// 📌 ไฟล์นี้ไม่มีคีย์ลับอยู่เลย — คีย์อยู่ใน js/config.local.js
//    (ไฟล์นั้นถูก .gitignore กันไว้ ไม่ถูก push ขึ้น GitHub)
//    ถ้าไฟล์ config.local.js ไม่มีอยู่ ให้สร้างเองตามรูปแบบนี้:
//
//      export const OPENROUTER_API_KEY = "sk-or-...";
//      export const OPENROUTER_MODEL = "google/gemini-2.5-flash-lite";
// ─────────────────────────────────────────────────────────────

import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./config.local.js";

// เรียก AI ด้วยข้อความเดียว (single-turn) — คืนค่าเป็นข้อความคำตอบดิบ
// ตัวเลือก.หมดเวลาMs กำหนดเวลาสูงสุดที่จะรอ (ค่าเริ่มต้น 15 วินาที)
// รอเกินเวลานี้จะยกเลิก request เอง แทนที่จะปล่อยให้ค้างไม่มีกำหนด
export async function เรียกAI(ข้อความ, ตัวเลือก = {}) {
  const หมดเวลาMs = ตัวเลือก.หมดเวลาMs ?? 15000;
  const ตัวยกเลิก = new AbortController();
  const ตัวจับเวลา = setTimeout(() => ตัวยกเลิก.abort(), หมดเวลาMs);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: ข้อความ }],
      }),
      signal: ตัวยกเลิก.signal,
    });

    if (!res.ok) {
      const ข้อความผิดพลาด = await res.text();
      throw new Error(`HTTP ${res.status} — ${ข้อความผิดพลาด}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`เรียก AI ไม่ทัน — หมดเวลา ${หมดเวลาMs / 1000} วินาที`);
    }
    throw err;
  } finally {
    clearTimeout(ตัวจับเวลา);
  }
}
