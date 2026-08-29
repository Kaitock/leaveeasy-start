// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านจากโฟลเดอร์ leaveRequests บน Firestore ของจริง
//
// 📌 ไฟล์นี้เป็น module แล้ว (ดูที่ leave-requests.html ใช้ type="module")
//    ฟังก์ชันจาก util.js — esc, ป้ายสถานะ, ค่าจากURL — ยังเรียกใช้ได้ตามปกติ
//    เพราะเบราว์เซอร์รันไฟล์ defer ให้เสร็จก่อน module เสมอ
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var กล่อง = document.getElementById("ผลลัพธ์");

เริ่มทำงาน();

async function เริ่มทำงาน() {
  กล่อง.innerHTML = "<p>กำลังโหลดข้อมูลจาก Firestore …</p>";

  var ใบลาทั้งหมด;
  try {
    ใบลาทั้งหมด = await อ่านใบลาจากFirestore();
  } catch (ข้อผิดพลาด) {
    แสดงข้อผิดพลาด(ข้อผิดพลาด);
    return;
  }

  // ใบที่เพิ่งยื่นจากหน้าฟอร์ม ยังเก็บชั่วคราวในเบราว์เซอร์อยู่
  // (สัปดาห์ที่ 7 ฟอร์มจะเขียนลง Firestore ได้จริง แล้วบรรทัดนี้จะถูกตัดทิ้ง)
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  ใบลาทั้งหมด = ใบลาทั้งหมด.concat(ใบลาที่ยื่นใหม่);

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด);
}

// ── อ่านข้อมูลจริงจากโฟลเดอร์ leaveRequests ──────────────────
// Firestore คืนไฟล์มาเรียงตามชื่อไฟล์อยู่แล้ว จึงได้ lr001…lr005 ตามลำดับเดิม
// ชื่อไฟล์คือ id — ต้องเติมกลับเข้าไปเอง เพราะไม่ได้เก็บซ้ำไว้ข้างในไฟล์
async function อ่านใบลาจากFirestore() {
  var ผล = await getDocs(collection(db, "leaveRequests"));
  return ผล.docs.map(function (ไฟล์) {
    return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
  });
}

// ── แสดงข้อผิดพลาดแบบอ่านรู้เรื่อง ───────────────────────────
// ไม่แอบสลับกลับไปใช้ข้อมูลปลอม เพราะหน้าจอจะดูปกติทั้งที่ฐานข้อมูลพัง
function แสดงข้อผิดพลาด(ข้อผิดพลาด) {
  var รหัส = String(ข้อผิดพลาด.code || ข้อผิดพลาด.message || "");
  var คำแนะนำ;

  if (รหัส.indexOf("permission-denied") !== -1) {
    คำแนะนำ = "กฎความปลอดภัยของ Firestore ปิดกั้นอยู่ — ไปที่ Firestore Database → แท็บ Rules แล้วตั้งเป็น test mode";
  } else if (รหัส.indexOf("not-found") !== -1) {
    คำแนะนำ = "ยังไม่มีฐานข้อมูล Firestore ในโครงการนี้ — ไปสร้างก่อนที่ Firestore Database → Create database";
  } else if (รหัส.indexOf("unavailable") !== -1) {
    คำแนะนำ = "ต่อ Firestore ไม่ติด — ตรวจว่าเน็ตต่ออยู่ไหม และสร้างฐานข้อมูลใน Console แล้วหรือยัง";
  } else {
    คำแนะนำ = "กด F12 เปิด Console ของเบราว์เซอร์ แล้วคัดลอกข้อความสีแดงมาถามผู้ช่วย";
  }

  กล่อง.innerHTML =
    '<div class="alert alert-error">' +
    "<strong>อ่านข้อมูลจาก Firestore ไม่ได้</strong>" +
    "<p>" + esc(ข้อผิดพลาด.message) + "</p>" +
    "<p>💡 " + esc(คำแนะนำ) + "</p>" +
    "</div>" +
    '<p class="hint">ถ้ายังไม่ได้ใส่ข้อมูลตัวอย่าง ให้ไปที่หน้า <a href="seed.html">seed.html</a> แล้วกดปุ่มใส่ข้อมูลก่อน</p>';
}

// ── วาดตาราง (ส่วนนี้เหมือนเดิมทุกบรรทัด) ────────────────────
function แสดงตาราง(รายการ) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML =
      "<p>ยังไม่มีใบขอลาในระบบ</p>" +
      '<p class="hint">ถ้าเพิ่งสร้างฐานข้อมูลใหม่ ให้ไปที่หน้า <a href="seed.html">seed.html</a> เพื่อใส่ข้อมูลตัวอย่างก่อน</p>';
    return;
  }

  var html =
    "<table><thead><tr>" +
    "<th>หัวข้อ</th>" +
    "<th>ประเภทการลา</th>" +
    "<th>สถานะ</th>" +
    '<th class="hide-mobile">ผู้ขอลา</th>' +
    '<th class="hide-mobile">วันที่ลา</th>' +
    "</tr></thead><tbody>";

  รายการ.forEach(function (ใบ) {
    html +=
      '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
      "<td>" + esc(ใบ.title) + "</td>" +
      "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
      "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
      "</tr>";
  });

  html += "</tbody></table>";
  กล่อง.innerHTML = html;

  // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
  กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
    แถว.addEventListener("click", function () {
      location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
    });
  });
}
