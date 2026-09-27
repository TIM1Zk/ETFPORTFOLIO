# 📊 ETF Portfolio Analytics Master Terminal

> **ระบบแดชบอร์ดติดตามผลการดำเนินงานและสัดส่วนพอร์ตการลงทุน ETF แบบ Real-time**  
> ขับเคลื่อนด้วย Modern Tech Stack: **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** และ **Recharts** เชื่อมต่อโดยตรงกับ Google Sheets อัตโนมัติ

---

## ✨ Features & Highlights

- **⚡ Real-time Multi-Sheet Synchronization**: ดึงข้อมูลสดจาก Google Sheets ทุกแผ่นงาน (Portfolio Overview, Individual Holdings, Historical Performance)
- **💎 Ultra-Modern Glassmorphism Design**: ธีมมืดระดับ Financial Terminal พร้อม Ambient Glows และ Micro-interactions
- **📈 6 Core KPI Financial Metrics**:
  - มูลค่าพอร์ตสุทธิ (THB & USD)
  - เปอร์เซ็นต์ผลตอบแทนสะสม (Cumulative Return %)
  - เงินต้นสะสม (Invested Cost) พร้อมชื่อกลยุทธ์
  - อัตราส่วน กำไร / ขาดทุน (Win / Loss / Neutral Ratio)
  - กองทุนที่ผลงานเติบโตสูงสุด (Best Performer)
  - กองทุนที่ปรับฐานสูงสุด (Worst Drawdown)
- **📊 3-Pillar Analytics Visualization**:
  - **Asset Allocation (Donut Chart)**: สัดส่วนน้ำหนักการถือครองสินทรัพย์
  - **Geographic Exposure**: สัดส่วนการกระจายตัวตามภูมิภาค (US, Global, Japan, India, Emerging Markets, Cash)
  - **Portfolio Diagnostics (Radar Chart)**: วิเคราะห์สุขภาพพอร์ต 6 มิติ พร้อม Health Score
- **📋 In-Depth Holdings Matrix**:
  - ตารางสินทรัพย์เชิงลึก พร้อมข้อมูลค่าธรรมเนียม (**Expense Ratio**), อัตราเงินปันผล (**Dividend Yield**)
  - ค้นหาแบบ Real-time, กรองตามภูมิภาค และสถานะกำไร/ขาดทุน
  - จัดเรียงลำดับ (Sortable) ได้ทุกคอลัมน์
  - **ปุ่มส่งออกรายงาน CSV (Export CSV)** ดาวน์โหลดไปใช้งานต่อได้ทันที

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/TIM1Zk/ETFPORTFOLIO.git
cd ETFPORTFOLIO
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
