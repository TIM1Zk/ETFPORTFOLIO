import { NextResponse } from "next/server";

const SHEET_ID = "1qRZlkq9Xyf4gS84_kLZT4hKJFC1D2gN5Z1sgYPJwTzw";
const GID_PORTFOLIO = "0";
const GID_ASSETS = "1748142502";
const GID_HISTORY = "2024171134";

interface PortfolioData {
  period: string;
  name: string;
  costTHB: number;
  valueTHB: number;
  returnTHB: number;
  assetCount: number;
}

interface AssetData {
  period: string;
  portName: string;
  name: string;
  ticker: string;
  usd: number;
  pnl: number;
  shares: number;
}

interface HistoryData {
  period: string;
  returnTHB: number;
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let inQuotes = false;
    let field = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    return row;
  });
}

export async function GET() {
  try {
    const [res0, res1, res2] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID_PORTFOLIO}`, {
        cache: "no-store",
      }),
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID_ASSETS}`, {
        cache: "no-store",
      }),
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID_HISTORY}`, {
        cache: "no-store",
      }),
    ]);

    let portfolio: PortfolioData | null = null;
    let assets: AssetData[] = [];
    let history: HistoryData[] = [];

    if (res0.ok) {
      const text0 = await res0.text();
      const rows0 = parseCSV(text0);
      if (rows0.length > 1) {
        const header = rows0[0];
        const r = rows0[1];
        
        const periodIdx = header.findIndex(h => h.includes("รอบเดือน")) !== -1 ? header.findIndex(h => h.includes("รอบเดือน")) : 0;
        const nameIdx = header.findIndex(h => h.includes("ชื่อพอร์ต")) !== -1 ? header.findIndex(h => h.includes("ชื่อพอร์ต")) : 1;
        const costIdx = header.findIndex(h => h.includes("เงินต้น")) !== -1 ? header.findIndex(h => h.includes("เงินต้น")) : 2;
        const valueIdx = header.findIndex(h => h.includes("มูลค่าสิ้นงวด")) !== -1 ? header.findIndex(h => h.includes("มูลค่าสิ้นงวด")) : 3;
        const returnIdx = header.findIndex(h => h.includes("ผลตอบแทนรวม")) !== -1 ? header.findIndex(h => h.includes("ผลตอบแทนรวม")) : 4;
        const countIdx = header.findIndex(h => h.includes("จำนวนสินทรัพย์")) !== -1 ? header.findIndex(h => h.includes("จำนวนสินทรัพย์")) : 5;

        portfolio = {
          period: r[periodIdx] || "2026-08",
          name: r[nameIdx] || "Core",
          costTHB: parseFloat((r[costIdx] || "0").replace(/[^0-9.-]+/g, "")) || 0,
          valueTHB: parseFloat((r[valueIdx] || "0").replace(/[^0-9.-]+/g, "")) || 0,
          returnTHB: parseFloat((r[returnIdx] || "0").replace(/[^0-9.-]+/g, "")) || 0,
          assetCount: parseInt(r[countIdx], 10) || 0,
        };
      }
    }

    if (res1.ok) {
      const text1 = await res1.text();
      const rows1 = parseCSV(text1);
      if (rows1.length > 1) {
        const header = rows1[0];
        const periodIdx = header.findIndex(h => h.includes("รอบเดือน")) !== -1 ? header.findIndex(h => h.includes("รอบเดือน")) : 0;
        const portNameIdx = header.findIndex(h => h.includes("ชื่อพอร์ต"));
        const nameIdx = header.findIndex(h => h.includes("ชื่อสินทรัพย์")) !== -1 ? header.findIndex(h => h.includes("ชื่อสินทรัพย์")) : (portNameIdx !== -1 ? 2 : 1);
        const tickerIdx = header.findIndex(h => h.includes("Ticker")) !== -1 ? header.findIndex(h => h.includes("Ticker")) : (portNameIdx !== -1 ? 3 : 2);
        const usdIdx = header.findIndex(h => h.includes("มูลค่าสิ้นงวด") || h.includes("USD")) !== -1 ? header.findIndex(h => h.includes("มูลค่าสิ้นงวด") || h.includes("USD")) : (portNameIdx !== -1 ? 4 : 3);
        const pnlIdx = header.findIndex(h => h.includes("กำไร / ขาดทุน") || h.includes("%")) !== -1 ? header.findIndex(h => h.includes("กำไร / ขาดทุน") || h.includes("%")) : (portNameIdx !== -1 ? 5 : 4);
        const sharesIdx = header.findIndex(h => h.includes("จำนวนหน่วย")) !== -1 ? header.findIndex(h => h.includes("จำนวนหน่วย")) : (portNameIdx !== -1 ? 6 : 5);

        assets = rows1
          .slice(1)
          .map((r) => ({
            period: r[periodIdx] || "",
            portName: portNameIdx !== -1 ? r[portNameIdx] : "",
            name: r[nameIdx] || "",
            ticker: r[tickerIdx] || "",
            usd: parseFloat((r[usdIdx] || "0").replace(/[^0-9.-]+/g, "")) || 0,
            pnl: parseFloat((r[pnlIdx] || "0").replace(/[^0-9.-]+/g, "")) || 0,
            shares: parseFloat(r[sharesIdx] || "0") || 0,
          }))
          .filter((a) => a.ticker && a.ticker !== "Ticker");
      }
    }

    if (res2.ok) {
      const text2 = await res2.text();
      const rows2 = parseCSV(text2);
      const validRows = rows2.filter(r => r.length >= 2 && r[0] && r[1] && !r[0].includes("รอบเดือน"));
      history = validRows.map(r => ({
        period: r[0],
        returnTHB: parseFloat((r[1] || "0").replace(/[^0-9.-]+/g, "")) || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        assets,
        history,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Google Sheets" },
      { status: 500 }
    );
  }
}
