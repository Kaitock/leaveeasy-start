// ─────────────────────────────────────────────────────────────
// js/auth.js — ด่านตรวจล็อกอิน โหลดไฟล์นี้ก่อนไฟล์อื่นทุกหน้า (ยกเว้น login.html)
//
// หน้าที่:
// 1) ถ้ายังไม่ล็อกอิน → เด้งไปหน้า login.html ทันที
// 2) ถ้าล็อกอินแล้ว → ไปอ่านชื่อ/บทบาทจาก users/{uid} มาเก็บที่ window.CURRENT_USER
//    แล้วแสดงชื่อ + ปุ่มออกจากระบบที่แถบเมนู (ต้องมี <span id="navUser"> จาก nav.js ก่อน)
// 3) เปิดให้หน้าอื่น await window.รอผู้ใช้() ก่อนเขียน Firestore ที่ต้องรู้ตัวตนผู้ใช้
//    (เช่นตอนยื่นใบลาใหม่ หรือส่งความเห็น) กันปัญหา user ยังไม่พร้อมตอนกดปุ่มเร็วเกินไป
//
// 📌 ต้องโหลดด้วย type="module" — ใช้ import จาก firebase.js
// 📌 หน้านี้ไม่บังคับสิทธิ์ตาม role (employee/manager/hr) แค่รู้ว่าใครล็อกอินอยู่เท่านั้น
//    การจำกัดสิทธิ์จริงจังเป็นงานคนละก้อน ต้องคุย Firestore Security Rules ด้วย
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";
var หน้าที่ไม่ต้องล็อกอิน = ["login.html"];

// promise ตัวนี้จะ resolve พร้อมค่า user object (หรือ null ถ้าไม่ได้ล็อกอินและเป็นหน้า login)
// ทันทีที่ Firebase เช็คสถานะล็อกอินเสร็จรอบแรก
var ตัวจบรอผู้ใช้;
var สัญญารอผู้ใช้ = new Promise(function (resolve) { ตัวจบรอผู้ใช้ = resolve; });
window.รอผู้ใช้ = function () { return สัญญารอผู้ใช้; };

// onAuthStateChanged ยิงครั้งแรกทันทีตอนโหลดหน้า (บอกสถานะที่มีอยู่ก่อนแล้ว)
// แล้วยิงอีกทุกครั้งที่สถานะเปลี่ยน (เช่น เพิ่งสมัคร/ล็อกอินสำเร็จบนหน้า login.html เอง)
// ต้องแยก 2 กรณีนี้ให้ออก — ครั้งแรกค่อยเด้งออกจาก login.html ทันที
// ถ้าไม่ใช่ครั้งแรก (เพิ่งสมัคร/ล็อกอินบนหน้านี้พอดี) ต้อง "ไม่" เด้งเอง
// เพราะ js/login.js ยังเขียน users/{uid} ไม่เสร็จ — ถ้าเด้งแทรกจะตัดตอน setDoc ทิ้งกลางคัน
// ปล่อยให้ login.js เป็นคนสั่งเด้งหน้าเองหลังเขียนเสร็จแทน
var เป็นการเช็คครั้งแรก = true;

onAuthStateChanged(auth, async function (ผู้ใช้) {
  var ครั้งนี้เป็นครั้งแรก = เป็นการเช็คครั้งแรก;
  เป็นการเช็คครั้งแรก = false;

  // ยังไม่ล็อกอิน และหน้านี้ไม่ใช่หน้า login → เด้งไปล็อกอินก่อน
  if (!ผู้ใช้) {
    if (หน้าที่ไม่ต้องล็อกอิน.indexOf(หน้าปัจจุบัน) === -1) {
      location.href = "login.html";
      return;
    }
    ตัวจบรอผู้ใช้(null);
    return;
  }

  // ล็อกอินอยู่แล้ว "ตั้งแต่ก่อนเปิดหน้า" แต่ดันเปิดหน้า login.html ค้างไว้ → พาไปหน้าแรกแทน
  if (หน้าปัจจุบัน === "login.html") {
    if (ครั้งนี้เป็นครั้งแรก) location.href = "index.html";
    return;
  }

  // ดึงชื่อ-นามสกุลและบทบาทจาก users/{uid} มาใช้ทั่วทั้งแอป
  var ข้อมูลผู้ใช้ = null;
  try {
    var ไฟล์ = await getDoc(doc(db, "users", ผู้ใช้.uid));
    if (ไฟล์.exists()) ข้อมูลผู้ใช้ = ไฟล์.data();
  } catch (ข้อผิดพลาด) {
    // อ่านไม่ได้ก็ไม่เป็นไร ใช้อีเมลแทนชื่อไปก่อน
  }

  window.CURRENT_USER = {
    uid: ผู้ใช้.uid,
    email: ผู้ใช้.email,
    name: (ข้อมูลผู้ใช้ && ข้อมูลผู้ใช้.name) || ผู้ใช้.email,
    role: (ข้อมูลผู้ใช้ && ข้อมูลผู้ใช้.role) || "employee",
  };

  แสดงผู้ใช้ที่แถบเมนู();
  ตัวจบรอผู้ใช้(ผู้ใช้);
});

function แสดงผู้ใช้ที่แถบเมนู() {
  var ช่อง = document.getElementById("navUser");
  if (!ช่อง || !window.CURRENT_USER) return;

  // เขียน escape เองในไฟล์นี้ ไม่พึ่ง esc() จาก util.js
  // เพราะบางหน้า (index.html, seed.html) โหลด auth.js โดยไม่ได้โหลด util.js คู่ด้วย
  ช่อง.innerHTML =
    "👤 " + หนีอักขระ(window.CURRENT_USER.name) +
    ' <button type="button" id="ปุ่มออกจากระบบ" class="btn-ghost btn-small">ออกจากระบบ</button>';

  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
    signOut(auth);
  });
}

function หนีอักขระ(ข้อความ) {
  return String(ข้อความ == null ? "" : ข้อความ)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
