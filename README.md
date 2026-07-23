# หมากหนีบออนไลน์

เกมกระดาน Multiplayer แบบ real-time สำหรับผู้เล่นห้องละ 2 คน สร้างด้วย Node.js, Express, Socket.IO และ Vanilla JavaScript โดย server เป็นผู้ตรวจสอบและคำนวณสถานะเกมทั้งหมด

## ติดตั้งและรัน

ต้องมี Node.js 18 ขึ้นไป จากโฟลเดอร์โปรเจกต์รัน:

```bash
npm install
npm start
```

จากนั้นเปิด http://localhost:3000 ในเบราว์เซอร์สองหน้าต่าง สร้างห้องในหน้าต่างแรก แล้วนำรหัสตัวเลข 5 หลักไปเข้าห้องในหน้าต่างที่สอง

## ทดสอบ

```bash
npm test
```

ชุดทดสอบครอบคลุมกระดานเริ่มต้น การเดินปกติ การปฏิเสธการเดินผิดกติกา/ผิดฝ่าย/นอกกระดาน การหนีบทั้งสี่ทิศพร้อมกัน การตรวจผู้ชนะ ตลอดจนการสร้างห้อง เข้าห้อง ห้องเต็ม ห้องไม่มีอยู่ การ reconnect และ cleanup

## โครงสร้าง

```text
mak-neeb-online/
├── package.json
├── server.js
├── README.md
├── src/
│   ├── gameLogic.js
│   ├── roomManager.js
│   ├── validators.js
│   └── socketHandlers.js
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── socketService.js
│   └── gameBoard.js
└── test/
    ├── gameLogic.test.js
    └── roomManager.test.js
```

ข้อมูลห้องเก็บใน memory และจะหายเมื่อ restart server ห้องที่ไม่มีการใช้งานเกิน 30 นาทีจะถูกลบอัตโนมัติ ส่วน refresh/reconnect ใช้ token สุ่มที่บันทึกใน `localStorage`
