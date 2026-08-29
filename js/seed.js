// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างลง Firestore (สัปดาห์ที่ 6)
//
// หน้าที่เดียว: คัดลอกข้อมูลใน js/data.js ขึ้นไปเก็บบน Firestore
// ให้โครงสร้างตรงกับข้อกำหนดหัวข้อ 5.2
//
// 📌 ใช้ setDoc พร้อมระบุชื่อไฟล์เอง (u001, lr001, ...)
//    ไม่ใช่ addDoc ที่สุ่มชื่อให้ — กดปุ่มซ้ำจึงเป็นการเขียนทับ ไม่ใช่เพิ่มใหม่
//
// 📌 ไม่เก็บช่อง id ลงในไฟล์ เพราะชื่อไฟล์คือ id อยู่แล้ว
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var กล่องผล = document.getElementById("ผลลัพธ์");
var กล่องสรุป = document.getElementById("สรุปข้อมูล");
var ปุ่มใส่ข้อมูล = document.getElementById("ปุ่มใส่ข้อมูล");
var ปุ่มตรวจสอบ = document.getElementById("ปุ่มตรวจสอบ");

// ── ตัวช่วยแสดงผลทีละบรรทัด ───────────────────────────────────
function ล้างผล() {
  กล่องผล.innerHTML = "";
}

function เขียนบรรทัด(ข้อความ, ชนิด) {
  var p = document.createElement("p");
  p.style.margin = "4px 0";
  if (ชนิด === "ผิดพลาด") p.style.color = "#8b1f1a";
  if (ชนิด === "สำเร็จ") p.style.color = "#1b5e34";
  p.textContent = ข้อความ;
  กล่องผล.appendChild(p);
}

// ── ตัดช่องที่ไม่ต้องเก็บลงไฟล์ออก ────────────────────────────
// id     = ชื่อไฟล์อยู่แล้ว ไม่ต้องเก็บซ้ำข้างใน
// ช่องอื่นที่ระบุใน รายชื่อช่องที่ตัด จะถูกตัดทิ้งด้วย
function ตัดช่องออก(ต้นฉบับ, รายชื่อช่องที่ตัด) {
  var สำเนา = {};
  Object.keys(ต้นฉบับ).forEach(function (ช่อง) {
    if (รายชื่อช่องที่ตัด.indexOf(ช่อง) === -1) สำเนา[ช่อง] = ต้นฉบับ[ช่อง];
  });
  return สำเนา;
}

// ── แสดงสรุปว่ากำลังจะส่งอะไรขึ้นไปบ้าง ──────────────────────
function แสดงสรุป() {
  var d = window.LEAVE_DATA;
  กล่องสรุป.innerHTML =
    "<table><thead><tr><th>โฟลเดอร์</th><th>จำนวนไฟล์</th><th>ชื่อไฟล์</th></tr></thead><tbody>" +
    แถวสรุป("users", d.users) +
    แถวสรุป("leaveTypes", d.leaveTypes) +
    แถวสรุป("leaveRequests", d.leaveRequests) +
    "<tr><td>leaveRequests/…/approvals</td><td>" + d.approvals.length + "</td><td>" +
    d.approvals.map(function (a) { return a.requestId + "/" + a.id; }).join(" · ") +
    "</td></tr>" +
    "</tbody></table>";
}

function แถวสรุป(ชื่อโฟลเดอร์, รายการ) {
  return (
    "<tr><td>" + ชื่อโฟลเดอร์ + "</td><td>" + รายการ.length + "</td><td>" +
    รายการ.map(function (x) { return x.id; }).join(" · ") +
    "</td></tr>"
  );
}

// ── งานหลัก: ส่งข้อมูลขึ้น Firestore ─────────────────────────
async function ใส่ข้อมูลทั้งหมด() {
  ปุ่มใส่ข้อมูล.disabled = true;
  ล้างผล();

  var d = window.LEAVE_DATA;
  var นับสำเร็จ = 0;

  try {
    // 1) โฟลเดอร์ users
    เขียนบรรทัด("📁 กำลังใส่ users ...");
    for (var i = 0; i < d.users.length; i++) {
      var ผู้ใช้ = d.users[i];
      await setDoc(doc(db, "users", ผู้ใช้.id), ตัดช่องออก(ผู้ใช้, ["id"]));
      เขียนบรรทัด("   ✓ users/" + ผู้ใช้.id + " — " + ผู้ใช้.name);
      นับสำเร็จ++;
    }

    // 2) โฟลเดอร์ leaveTypes
    เขียนบรรทัด("📁 กำลังใส่ leaveTypes ...");
    for (var j = 0; j < d.leaveTypes.length; j++) {
      var ประเภท = d.leaveTypes[j];
      await setDoc(doc(db, "leaveTypes", ประเภท.id), ตัดช่องออก(ประเภท, ["id"]));
      เขียนบรรทัด("   ✓ leaveTypes/" + ประเภท.id + " — " + ประเภท.name);
      นับสำเร็จ++;
    }

    // 3) โฟลเดอร์ leaveRequests
    เขียนบรรทัด("📁 กำลังใส่ leaveRequests ...");
    for (var k = 0; k < d.leaveRequests.length; k++) {
      var ใบลา = d.leaveRequests[k];
      await setDoc(doc(db, "leaveRequests", ใบลา.id), ตัดช่องออก(ใบลา, ["id"]));
      เขียนบรรทัด("   ✓ leaveRequests/" + ใบลา.id + " — " + ใบลา.status + " — " + ใบลา.title);
      นับสำเร็จ++;
    }

    // 4) โฟลเดอร์ย่อย approvals — ซ้อนอยู่ในใบลาแต่ละใบ
    //    ตัดช่อง requestId ออกด้วย เพราะตำแหน่งที่เก็บบอกอยู่แล้วว่าเป็นของใบไหน
    เขียนบรรทัด("📁 กำลังใส่ approvals (โฟลเดอร์ย่อยในแต่ละใบลา) ...");
    for (var m = 0; m < d.approvals.length; m++) {
      var ความเห็น = d.approvals[m];
      await setDoc(
        doc(db, "leaveRequests", ความเห็น.requestId, "approvals", ความเห็น.id),
        ตัดช่องออก(ความเห็น, ["id", "requestId"])
      );
      เขียนบรรทัด("   ✓ leaveRequests/" + ความเห็น.requestId + "/approvals/" + ความเห็น.id);
      นับสำเร็จ++;
    }

    เขียนบรรทัด("");
    เขียนบรรทัด("🎉 เสร็จเรียบร้อย ใส่ข้อมูลสำเร็จ " + นับสำเร็จ + " ไฟล์", "สำเร็จ");
    เขียนบรรทัด("ไปเปิด Firebase Console ดูได้เลย แล้วลองกดปุ่มตรวจสอบด้านบนอีกที", "สำเร็จ");
  } catch (ข้อผิดพลาด) {
    เขียนบรรทัด("");
    เขียนบรรทัด("❌ ใส่ข้อมูลไม่สำเร็จ — " + ข้อผิดพลาด.message, "ผิดพลาด");
    เขียนบรรทัด(แปลข้อผิดพลาด(ข้อผิดพลาด), "ผิดพลาด");
  } finally {
    ปุ่มใส่ข้อมูล.disabled = false;
  }
}

// ── อ่านกลับมาดูว่ามีอะไรอยู่บน Firestore แล้วบ้าง ────────────
async function ตรวจสอบข้อมูล() {
  ปุ่มตรวจสอบ.disabled = true;
  ล้างผล();

  try {
    var โฟลเดอร์ = ["users", "leaveTypes", "leaveRequests"];
    for (var i = 0; i < โฟลเดอร์.length; i++) {
      var ผล = await getDocs(collection(db, โฟลเดอร์[i]));
      var ชื่อไฟล์ = [];
      ผล.forEach(function (ไฟล์) { ชื่อไฟล์.push(ไฟล์.id); });
      เขียนบรรทัด(
        "📁 " + โฟลเดอร์[i] + " — " + ผล.size + " ไฟล์" +
        (ชื่อไฟล์.length ? " (" + ชื่อไฟล์.join(", ") + ")" : " — ยังว่างอยู่")
      );
    }

    // นับความเห็นในโฟลเดอร์ย่อยของใบลาแต่ละใบ
    var ใบลาทั้งหมด = await getDocs(collection(db, "leaveRequests"));
    for (var รายการ of ใบลาทั้งหมด.docs) {
      var ความเห็น = await getDocs(collection(db, "leaveRequests", รายการ.id, "approvals"));
      if (ความเห็น.size > 0) {
        เขียนบรรทัด("   📁 " + รายการ.id + "/approvals — " + ความเห็น.size + " ความเห็น");
      }
    }

    เขียนบรรทัด("");
    เขียนบรรทัด("✅ อ่านข้อมูลจาก Firestore ได้สำเร็จ", "สำเร็จ");
  } catch (ข้อผิดพลาด) {
    เขียนบรรทัด("❌ อ่านข้อมูลไม่ได้ — " + ข้อผิดพลาด.message, "ผิดพลาด");
    เขียนบรรทัด(แปลข้อผิดพลาด(ข้อผิดพลาด), "ผิดพลาด");
  } finally {
    ปุ่มตรวจสอบ.disabled = false;
  }
}

// ── แปลข้อความผิดพลาดของ Firebase เป็นภาษาคน ─────────────────
function แปลข้อผิดพลาด(ข้อผิดพลาด) {
  var รหัส = String(ข้อผิดพลาด.code || ข้อผิดพลาด.message || "");

  if (รหัส.indexOf("permission-denied") !== -1) {
    return "💡 แปลว่า: กฎความปลอดภัยของ Firestore ปิดกั้นอยู่ — ไปที่ Firestore Database → แท็บ Rules แล้วตั้งเป็น test mode";
  }
  if (รหัส.indexOf("unavailable") !== -1 || รหัส.indexOf("Failed to get document") !== -1) {
    return "💡 แปลว่า: ต่อ Firestore ไม่ติด — ตรวจว่าสร้าง Firestore Database ใน Console แล้วหรือยัง และเน็ตต่ออยู่ไหม";
  }
  if (รหัส.indexOf("not-found") !== -1) {
    return "💡 แปลว่า: ยังไม่มีฐานข้อมูล Firestore ในโครงการนี้ — ไปสร้างก่อนที่ Firestore Database → Create database";
  }
  if (รหัส.indexOf("invalid-api-key") !== -1 || รหัส.indexOf("api-key") !== -1) {
    return "💡 แปลว่า: ค่า firebaseConfig ใน js/firebase.js อาจคัดลอกมาไม่ครบ — ไปคัดลอกใหม่จาก Project settings";
  }
  return "💡 ถ้าอ่านไม่ออก ให้กด F12 เปิด Console ของเบราว์เซอร์ แล้วคัดลอกข้อความสีแดงมาถาม";
}

// ── เริ่มทำงาน ───────────────────────────────────────────────
แสดงสรุป();
ปุ่มใส่ข้อมูล.addEventListener("click", ใส่ข้อมูลทั้งหมด);
ปุ่มตรวจสอบ.addEventListener("click", ตรวจสอบข้อมูล);
