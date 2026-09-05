// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ / สมัครสมาชิก / ลืมรหัสผ่าน
//
// ฟอร์มเดียวสลับได้ 2 โหมด:
//   - เข้าสู่ระบบ  → signInWithEmailAndPassword
//   - สมัครสมาชิก → createUserWithEmailAndPassword แล้วสร้างเอกสาร users/{uid}
//                   ให้เองทันที (role เริ่มต้นเป็น employee เสมอ)
//
// 📌 หน้านี้เป็นคนสั่งเด้งไปหน้าแรกเอง (ไม่ปล่อยให้ js/auth.js เด้งแทน)
//    เพราะถ้า auth.js เด้งทันทีที่เห็นสถานะล็อกอินเปลี่ยน จะแทรกกลางระหว่างที่
//    ไฟล์นี้ยังเขียน users/{uid} ไม่เสร็จ (โดยเฉพาะตอนสมัครสมาชิก) ทำให้ setDoc ถูกตัดตอน
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var โหมด = "login"; // "login" หรือ "signup"

var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
var ช่องชื่อ = document.getElementById("ชื่อผู้ใช้");
var ป้ายชื่อ = document.getElementById("ป้ายชื่อ");
var ช่องอีเมล = document.getElementById("อีเมล");
var ช่องรหัสผ่าน = document.getElementById("รหัสผ่าน");
var ปุ่มส่ง = document.getElementById("ปุ่มส่ง");
var คำอธิบายโหมด = document.getElementById("คำอธิบายโหมด");
var ลิงก์สลับโหมด = document.getElementById("ลิงก์สลับโหมด");
var ลิงก์ลืมรหัสผ่าน = document.getElementById("ลิงก์ลืมรหัสผ่าน");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var กล่องสำเร็จ = document.getElementById("ข้อความสำเร็จ");

ลิงก์สลับโหมด.addEventListener("click", function (e) {
  e.preventDefault();
  โหมด = โหมด === "login" ? "signup" : "login";
  ปรับหน้าตาตามโหมด();
});

ลิงก์ลืมรหัสผ่าน.addEventListener("click", ลืมรหัสผ่าน);
ฟอร์ม.addEventListener("submit", ส่งฟอร์ม);

ปรับหน้าตาตามโหมด();

function ปรับหน้าตาตามโหมด() {
  ซ่อนข้อความ();
  var เป็นสมัครสมาชิก = โหมด === "signup";
  ช่องชื่อ.classList.toggle("hidden", !เป็นสมัครสมาชิก);
  ป้ายชื่อ.classList.toggle("hidden", !เป็นสมัครสมาชิก);
  ปุ่มส่ง.textContent = เป็นสมัครสมาชิก ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
  คำอธิบายโหมด.textContent = เป็นสมัครสมาชิก
    ? "สมัครสมาชิกใหม่ด้วยอีเมลและรหัสผ่าน"
    : "เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน";
  ลิงก์สลับโหมด.textContent = เป็นสมัครสมาชิก ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก";
}

async function ส่งฟอร์ม(e) {
  e.preventDefault();
  ซ่อนข้อความ();

  var อีเมล = ช่องอีเมล.value.trim();
  var รหัสผ่าน = ช่องรหัสผ่าน.value;
  var ชื่อ = ช่องชื่อ.value.trim();

  if (!อีเมล || !รหัสผ่าน) {
    แสดงเตือน("กรอกอีเมลและรหัสผ่านก่อน");
    return;
  }
  if (โหมด === "signup" && !ชื่อ) {
    แสดงเตือน("กรอกชื่อ-นามสกุลก่อน จึงจะสมัครสมาชิกได้");
    return;
  }
  if (รหัสผ่าน.length < 6) {
    แสดงเตือน("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }

  ปุ่มส่ง.disabled = true;
  ปุ่มส่ง.textContent = "กำลังดำเนินการ …";

  try {
    if (โหมด === "signup") {
      var ผล = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
      await updateProfile(ผล.user, { displayName: ชื่อ });
      // สร้างเอกสารใน users/{uid} ทันที — role เริ่มต้นเป็น employee เสมอ
      // ถ้าจะยกสิทธิ์เป็น manager/hr ต้องไปแก้ที่ Firebase Console เอง
      await setDoc(doc(db, "users", ผล.user.uid), {
        name: ชื่อ,
        email: อีเมล,
        role: "employee",
      });
    } else {
      await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    }
    // สำเร็จแล้ว (และเขียน users/{uid} เสร็จแล้วถ้าเป็นการสมัครสมาชิก) ค่อยเด้งไปหน้าแรก
    location.href = "index.html";
  } catch (ข้อผิดพลาด) {
    ปุ่มส่ง.textContent = โหมด === "signup" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"; // คืนข้อความปุ่มให้ตรงโหมดเดิม
    ปุ่มส่ง.disabled = false;
    แสดงเตือน(แปลข้อผิดพลาด(ข้อผิดพลาด));
  }
}

async function ลืมรหัสผ่าน(e) {
  e.preventDefault();
  ซ่อนข้อความ();

  var อีเมล = ช่องอีเมล.value.trim();
  if (!อีเมล) {
    แสดงเตือน("กรอกอีเมลในช่องด้านบนก่อน แล้วค่อยกด ลืมรหัสผ่าน");
    return;
  }

  ลิงก์ลืมรหัสผ่าน.textContent = "กำลังส่งอีเมล …";

  try {
    await sendPasswordResetEmail(auth, อีเมล);
    แสดงสำเร็จ("ส่งอีเมลสำหรับตั้งรหัสผ่านใหม่ไปที่ " + อีเมล + " แล้ว — ไปเช็คกล่องจดหมาย (รวมถึงถังขยะ/สแปม)");
  } catch (ข้อผิดพลาด) {
    แสดงเตือน(แปลข้อผิดพลาด(ข้อผิดพลาด));
  } finally {
    ลิงก์ลืมรหัสผ่าน.textContent = "ลืมรหัสผ่าน?";
  }
}

function แสดงเตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แสดงสำเร็จ(ข้อความ) {
  กล่องสำเร็จ.textContent = "✅ " + ข้อความ;
  กล่องสำเร็จ.classList.remove("hidden");
}

function ซ่อนข้อความ() {
  กล่องเตือน.classList.add("hidden");
  กล่องสำเร็จ.classList.add("hidden");
}

// ── แปลรหัสข้อผิดพลาดของ Firebase Auth เป็นภาษาไทย ────────────
function แปลข้อผิดพลาด(ข้อผิดพลาด) {
  var รหัส = String(ข้อผิดพลาด.code || "");

  if (รหัส === "auth/email-already-in-use") return "อีเมลนี้สมัครสมาชิกไว้แล้ว ลองเข้าสู่ระบบแทน";
  if (รหัส === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  if (รหัส === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
  if (รหัส === "auth/invalid-credential" || รหัส === "auth/wrong-password" || รหัส === "auth/user-not-found") {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (รหัส === "auth/too-many-requests") return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
  if (รหัส === "auth/network-request-failed") return "ต่อเน็ตไม่ติด ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
  return "เกิดข้อผิดพลาด — " + (ข้อผิดพลาด.message || รหัส);
}
