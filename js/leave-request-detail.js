// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลาและความเห็นจาก Firestore ของจริง
//              และกดปุ่มอนุมัติ / ไม่อนุมัติ แล้วบันทึกสถานะลงฐานข้อมูลจริง
//
// 📌 ไฟล์นี้เป็น module แล้ว (leave-request-detail.html ต้องใช้ type="module")
//    ฟังก์ชันจาก util.js — esc, ป้ายสถานะ, ค่าจากURL, เวลาตอนนี้ — ยังเรียกใช้ได้
//    เพราะเบราว์เซอร์รันไฟล์ defer ให้เสร็จก่อน module เสมอ
//
// 📌 ตอนเปลี่ยนสถานะใช้ updateDoc ไม่ใช่ setDoc
//    updateDoc แตะเฉพาะช่องที่ระบุ · setDoc เขียนทับทั้งไฟล์ (ช่องอื่นจะหายหมด)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");

var ใบ = null;        // ใบลาที่กำลังเปิดดู
var ความเห็น = [];    // ความเห็นของใบนี้
var กำลังบันทึก = false;

เริ่มทำงาน();

async function เริ่มทำงาน() {
  กล่องใบลา.innerHTML = "<p>กำลังโหลดข้อมูลจาก Firestore …</p>";

  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ลิงก์ไม่ถูกต้อง — ไม่มีรหัสใบลาต่อท้าย URL</p>";
    return;
  }

  try {
    ใบ = await อ่านใบลา();
    if (!ใบ) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ความเห็น = await อ่านความเห็น();
  } catch (ข้อผิดพลาด) {
    แสดงข้อผิดพลาด(ข้อผิดพลาด);
    return;
  }

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
}

// ── อ่านใบลาหนึ่งใบจากโฟลเดอร์ leaveRequests ─────────────────
// ชื่อไฟล์คือ id — ต้องเติมกลับเข้าไปเอง เพราะไม่ได้เก็บซ้ำไว้ข้างในไฟล์
async function อ่านใบลา() {
  var ไฟล์ = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
  if (!ไฟล์.exists()) return null;
  return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
}

// ── อ่านความเห็นจากโฟลเดอร์ย่อย leaveRequests/{id}/approvals ──
// ต้องอ่านของจริง เพราะกฎ "ไม่อนุมัติต้องมีความเห็นก่อน" ตัดสินจากจำนวนความเห็น
// ถ้าอ่านจากข้อมูลปลอม กฎจะตัดสินจากข้อมูลคนละชุดกับที่อยู่บนฐานข้อมูล
async function อ่านความเห็น() {
  var ผล = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
  return ผล.docs.map(function (ไฟล์) {
    return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
  });
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)]
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา
  if (ใบ.status === "รอพิจารณา") {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>" +
      '<p class="hidden" id="เตือนสถานะ"></p>';
  } else {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  }

  กล่องใบลา.innerHTML = html;

  if (ใบ.status === "รอพิจารณา") {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
}

// ── เปลี่ยนสถานะ แล้วบันทึกลง Firestore ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  if (กำลังบันทึก) return;

  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    เตือนสถานะ("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }

  กำลังบันทึก = true;
  ปิดปุ่ม(true);
  เตือนสถานะ("");

  try {
    // ⚠️ updateDoc แก้เฉพาะช่อง status ช่องอื่นในไฟล์ไม่ถูกแตะเลย
    //    (ไม่แตะ approverId / approverName ด้วย ถึงแม้คนกดจะเป็นผู้อนุมัติก็ตาม)
    await updateDoc(doc(db, "leaveRequests", ใบ.id), { status: สถานะใหม่ });
  } catch (ข้อผิดพลาด) {
    // บันทึกไม่สำเร็จ — ไม่เปลี่ยนหน้าจอ เพราะจะหลอกว่าบันทึกแล้ว
    กำลังบันทึก = false;
    ปิดปุ่ม(false);
    เตือนสถานะ("บันทึกสถานะไม่สำเร็จ — " + ข้อผิดพลาด.message);
    return;
  }

  // สำเร็จแล้วค่อยเปลี่ยนหน้าจอ
  กำลังบันทึก = false;
  ใบ.status = สถานะใหม่;
  วาดใบลา();
}

function ปิดปุ่ม(ปิด) {
  var อนุมัติ = document.getElementById("ปุ่มอนุมัติ");
  var ไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
  if (อนุมัติ) อนุมัติ.disabled = ปิด;
  if (ไม่อนุมัติ) ไม่อนุมัติ.disabled = ปิด;
}

function เตือนสถานะ(ข้อความ) {
  var กล่อง = document.getElementById("เตือนสถานะ");
  if (!กล่อง) return;
  if (!ข้อความ) {
    กล่อง.classList.add("hidden");
    return;
  }
  กล่อง.textContent = "⚠️ " + ข้อความ;
  กล่อง.classList.remove("hidden");
}

// ── แสดงข้อผิดพลาดแบบอ่านรู้เรื่อง ───────────────────────────
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

  กล่องใบลา.innerHTML =
    '<div class="alert alert-error">' +
    "<strong>อ่านข้อมูลจาก Firestore ไม่ได้</strong>" +
    "<p>" + esc(ข้อผิดพลาด.message) + "</p>" +
    "<p>💡 " + esc(คำแนะนำ) + "</p>" +
    "</div>" +
    '<p class="hint">ถ้ายังไม่ได้ใส่ข้อมูลตัวอย่าง ให้ไปที่หน้า <a href="seed.html">seed.html</a> แล้วกดปุ่มใส่ข้อมูลก่อน</p>';
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .slice()
    .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ ──
// ยังเก็บในหน่วยความจำเหมือนเดิม (การเขียนความเห็นลง Firestore เป็นงานคนละก้อน)
async function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");

  // ผู้เขียนความเห็นคือคนที่ล็อกอินอยู่ตอนนี้
  await window.รอผู้ใช้();
  var ผู้ใช้ = window.CURRENT_USER;

  ความเห็น.push({
    id: "ap-ใหม่-" + Date.now(),
    authorId: ผู้ใช้.uid, authorName: ผู้ใช้.name,
    message: ข้อความ,
    createdAt: เวลาตอนนี้()
  });
  ช่อง.value = "";
  วาดความเห็น();
}
