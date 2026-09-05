// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาลงโฟลเดอร์ leaveRequests บน Firestore ของจริง
//              แล้วเด้งกลับไปหน้ารายการใบลา
//
// 📌 ไฟล์นี้เป็น module แล้ว (new-leave-request.html ต้องใช้ type="module")
//
// 📌 ใช้ addDoc ให้ Firestore ตั้งชื่อไฟล์ให้เอง — ต่างจาก js/seed.js ที่ใช้ setDoc
//    seed ใช้ setDoc เพื่อให้กดใส่ข้อมูลซ้ำแล้วเขียนทับ ไม่ใช่เพิ่มใหม่
//    แต่ใบที่ผู้ใช้ยื่นจริงต้องเพิ่มใบใหม่ทุกครั้ง และห้ามชนกันเวลามีคนยื่นพร้อมกัน
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = ฟอร์ม.querySelector('button[type="submit"]');
var กำลังบันทึก = false;

// เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
window.LEAVE_DATA.leaveTypes.forEach(function (ประเภท) {
  var ตัวเลือก = document.createElement("option");
  ตัวเลือก.value = ประเภท.id;
  ตัวเลือก.textContent = ประเภท.name;
  ช่องประเภท.appendChild(ตัวเลือก);
});

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (กำลังบันทึก) return;

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }

  var ประเภท = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === ค่า.leaveTypeId; });

  // รอให้ js/auth.js เช็คสถานะล็อกอินเสร็จก่อน แล้วค่อยรู้ว่าใครเป็นผู้ขอลา
  // (ป้องกันกรณีกดบันทึกเร็วมากตั้งแต่หน้ายังโหลดไม่เสร็จ)
  await window.รอผู้ใช้();
  var ผู้ใช้ = window.CURRENT_USER;

  // 📌 ไม่ใส่ช่อง id ลงในไฟล์ เพราะชื่อไฟล์คือ id อยู่แล้ว
  // 📌 เก็บชื่อคู่กับรหัสเสมอ เพราะ Firestore ไม่มี JOIN
  var ใบใหม่ = {
    title: ค่า.title,
    reason: ค่า.reason,
    status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
    requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.name,
    approverId: "",      approverName: "",
    leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
    startDate: ค่า.startDate,
    endDate: ค่า.endDate,
    createdAt: เวลาตอนนี้()
  };

  กำลังบันทึก = true;
  ซ่อนเตือน();
  if (ปุ่มบันทึก) {
    ปุ่มบันทึก.disabled = true;
    ปุ่มบันทึก.textContent = "กำลังบันทึก …";
  }

  try {
    await addDoc(collection(db, "leaveRequests"), ใบใหม่);
  } catch (ข้อผิดพลาด) {
    // บันทึกไม่สำเร็จ — อยู่หน้าเดิม ไม่เด้งไปไหน
    // ถ้าเด้งทั้งที่บันทึกไม่ติด ผู้ใช้จะเข้าใจผิดว่ายื่นใบลาแล้ว
    กำลังบันทึก = false;
    if (ปุ่มบันทึก) {
      ปุ่มบันทึก.disabled = false;
      ปุ่มบันทึก.textContent = "บันทึกใบลา";
    }
    เตือน("บันทึกไม่สำเร็จ — " + ข้อผิดพลาด.message + " · " + แปลข้อผิดพลาด(ข้อผิดพลาด));
    return;
  }

  // บันทึกสำเร็จแล้วค่อยเด้งกลับไปหน้ารายการ
  location.href = "leave-requests.html";
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function ซ่อนเตือน() {
  กล่องเตือน.classList.add("hidden");
}

// ── แปลข้อความผิดพลาดของ Firebase เป็นภาษาคน ─────────────────
function แปลข้อผิดพลาด(ข้อผิดพลาด) {
  var รหัส = String(ข้อผิดพลาด.code || ข้อผิดพลาด.message || "");

  if (รหัส.indexOf("permission-denied") !== -1) {
    return "กฎความปลอดภัยของ Firestore ปิดกั้นอยู่ — ไปที่ Firestore Database → แท็บ Rules แล้วตั้งเป็น test mode";
  }
  if (รหัส.indexOf("unavailable") !== -1) {
    return "ต่อ Firestore ไม่ติด — ตรวจว่าเน็ตต่ออยู่ไหม";
  }
  if (รหัส.indexOf("not-found") !== -1) {
    return "ยังไม่มีฐานข้อมูล Firestore ในโครงการนี้ — ไปสร้างก่อนที่ Firestore Database → Create database";
  }
  return "กด F12 เปิด Console ของเบราว์เซอร์ แล้วคัดลอกข้อความสีแดงมาถามผู้ช่วย";
}
