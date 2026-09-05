// ─────────────────────────────────────────────────────────────
// js/firebase.js — จุดเชื่อมต่อ Firebase ของโครงงาน
//
// ไฟล์นี้ทำหน้าที่เดียว คือ "เปิดสาย" ไปหาโครงการ Firebase ของเรา
// แล้วส่งต่อให้ไฟล์อื่นเรียกใช้ ไม่ต้องตั้งค่าซ้ำทุกหน้า
//
// 📌 เรียกไฟล์นี้ในหน้า HTML ด้วย type="module" เท่านั้น
//    <script type="module" src="js/firebase.js"></script>
//
// 📌 ต้องเปิดผ่าน http://localhost:... เท่านั้น
//    ดับเบิลคลิกไฟล์ (file://) จะใช้ไม่ได้ เบราว์เซอร์บล็อก module
// ─────────────────────────────────────────────────────────────

// โหลดชุดคำสั่งของ Firebase จาก CDN ของ Google โดยตรง
// ใช้ URL เต็มเพราะโครงงานนี้ไม่มีขั้นตอน build มาแปลงชื่อย่อให้
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ค่าตั้งต้นของโครงการ — คัดลอกมาจากหน้า Project settings ใน Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDCVSnTCu3FSjIEz1SeSQYvKdX5TrL1FH0",
  authDomain: "leaveeasy-jirapan.firebaseapp.com",
  projectId: "leaveeasy-jirapan",
  storageBucket: "leaveeasy-jirapan.firebasestorage.app",
  messagingSenderId: "52308764104",
  appId: "1:52308764104:web:de34ff4f4da8cc2f3b8cfd",
};

// เปิดสายไปหาโครงการ Firebase
const app = initializeApp(firebaseConfig);

// คลังเก็บข้อมูล Firestore — ตัวที่สัปดาห์ที่ 6 จะใช้อ่านข้อมูลจริง
const db = getFirestore(app);

// ระบบล็อกอิน — สัปดาห์ที่ 7 เพิ่มเข้ามา ใช้คู่กับ js/auth.js และ js/login.js
const auth = getAuth(app);

// ส่งออกให้ไฟล์อื่นที่เป็น module นำไปใช้ได้
export { app, db, auth };

// ฝากไว้ที่ window ด้วย เพื่อให้ไฟล์ js เดิม (ที่ไม่ใช่ module) เรียกใช้ได้
// และเพื่อให้ทดสอบจาก Console ของเบราว์เซอร์ได้ง่าย
window.db = db;
window.auth = auth;
