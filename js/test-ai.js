// หน้าทดสอบเรียก AI ผ่าน OpenRouter
// การเรียก AI จริง ๆ อยู่ใน js/ai.js (ใช้ร่วมกับ new-leave-request.js ด้วย)

import { เรียกAI } from "./ai.js";

const ปุ่มทดสอบ = document.getElementById("ปุ่มทดสอบ");
const กล่องเตือน = document.getElementById("เตือน");
const กล่องผลลัพธ์ = document.getElementById("ผลลัพธ์");

ปุ่มทดสอบ.addEventListener("click", async () => {
  กล่องเตือน.classList.add("hidden");
  กล่องเตือน.textContent = "";
  ปุ่มทดสอบ.disabled = true;
  กล่องผลลัพธ์.textContent = "กำลังส่งข้อความ...";

  try {
    const คำตอบ = await เรียกAI("สวัสดี");
    กล่องผลลัพธ์.textContent = คำตอบ || "(ไม่มีคำตอบกลับมา)";
  } catch (err) {
    กล่องผลลัพธ์.textContent = "— ยังไม่ได้กดปุ่ม —";
    กล่องเตือน.textContent = "เรียก AI ไม่สำเร็จ: " + err.message;
    กล่องเตือน.classList.remove("hidden");
  } finally {
    ปุ่มทดสอบ.disabled = false;
  }
});
