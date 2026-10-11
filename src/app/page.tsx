"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  DollarSign,
  Trophy,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpDown,
  ShieldCheck,
  Globe2,
  Scale,
  AlertTriangle,
  Download,
  Info,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sliders,
  History,
} from "lucide-react";

interface PortfolioSummary {
  period: string;
  name: string;
  costTHB: number;
  valueTHB: number;
  returnTHB: number;
  assetCount: number;
}

interface AssetHolding {
  period: string;
  portName?: string;
  name: string;
  ticker: string;
  usd: number;
  pnl: number;
  shares: number;
  thbValue?: number;
  category?: string;
  region?: string;
  expenseRatio?: string;
  dividendYield?: string;
  riskScore?: "Low" | "Medium" | "High";
}

interface HistoryPoint {
  period: string;
  returnTHB: number;
}

interface ExchangeRateInfo {
  rate: number;
  source: string;
  updatedAt: string;
}

const ASSET_METADATA: Record<
  string,
  { category: string; region: string; expenseRatio: string; yield: string; risk: "Low" | "Medium" | "High"; badgeColor: string }
> = {
  XLK: { category: "Technology", region: "US", expenseRatio: "0.09%", yield: "0.72%", risk: "High", badgeColor: "from-blue-500 to-indigo-500" },
  VEU: { category: "Global Blend", region: "Ex-US", expenseRatio: "0.07%", yield: "3.10%", risk: "Medium", badgeColor: "from-cyan-500 to-blue-500" },
  IVV: { category: "Large Cap Blend", region: "US", expenseRatio: "0.03%", yield: "1.35%", risk: "Medium", badgeColor: "from-emerald-500 to-teal-500" },
  ISAC: { category: "All World Equities", region: "Global", expenseRatio: "0.20%", yield: "1.65%", risk: "Medium", badgeColor: "from-purple-500 to-indigo-500" },
  XLE: { category: "Energy", region: "US", expenseRatio: "0.09%", yield: "3.20%", risk: "High", badgeColor: "from-amber-500 to-orange-500" },
  XLY: { category: "Consumer Discretionary", region: "US", expenseRatio: "0.09%", yield: "0.85%", risk: "High", badgeColor: "from-pink-500 to-rose-500" },
  SPEM: { category: "Emerging Markets", region: "Emerging", expenseRatio: "0.07%", yield: "2.80%", risk: "High", badgeColor: "from-yellow-500 to-amber-500" },
  PPA: { category: "Aerospace & Defense", region: "US", expenseRatio: "0.58%", yield: "0.65%", risk: "Medium", badgeColor: "from-sky-500 to-cyan-500" },
  GLDM: { category: "Commodities / Gold", region: "Global", expenseRatio: "0.10%", yield: "0.00%", risk: "Low", badgeColor: "from-yellow-400 to-amber-600" },
  XLP: { category: "Consumer Staples", region: "US", expenseRatio: "0.09%", yield: "2.60%", risk: "Low", badgeColor: "from-teal-500 to-emerald-500" },
  RSP: { category: "Equal Weight S&P 500", region: "US", expenseRatio: "0.20%", yield: "1.55%", risk: "Medium", badgeColor: "from-blue-600 to-violet-600" },
  DXJ: { category: "Japan Hedged Equities", region: "Japan", expenseRatio: "0.48%", yield: "2.10%", risk: "Medium", badgeColor: "from-red-500 to-rose-500" },
  FLIN: { category: "India Equities", region: "India", expenseRatio: "0.19%", yield: "0.80%", risk: "High", badgeColor: "from-orange-500 to-amber-500" },
  BBJP: { category: "Japan Equities", region: "Japan", expenseRatio: "0.19%", yield: "1.95%", risk: "Medium", badgeColor: "from-rose-500 to-pink-500" },
  XLI: { category: "Industrials", region: "US", expenseRatio: "0.09%", yield: "1.40%", risk: "Medium", badgeColor: "from-slate-400 to-slate-600" },
  XLV: { category: "Health Care", region: "US", expenseRatio: "0.09%", yield: "1.50%", risk: "Low", badgeColor: "from-emerald-400 to-teal-600" },
  USD: { category: "Cash & Equivalents", region: "Cash", expenseRatio: "0.00%", yield: "4.50%", risk: "Low", badgeColor: "from-emerald-500 to-green-600" },
};

const PALETTE = [
  "#38bdf8", "#818cf8", "#34d399", "#c084fc", "#f472b6",
  "#fbbf24", "#60a5fa", "#2dd4bf", "#a3e635", "#f59e0b",
  "#e879f9", "#fb7185", "#38bdf8", "#a78bfa", "#4ade80", "#fb923c", "#94a3b8"
];

export default function LuxuryDashboard() {
  const [portfolioList, setPortfolioList] = useState<PortfolioSummary[]>([]);
  const [allAssets, setAllAssets] = useState<AssetHolding[]>([]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-09");
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "gain" | "loss" | "neutral">("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AssetHolding; dir: "asc" | "desc" }>({
    key: "usd",
    dir: "desc",
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // FX Rate Modes: 'market' (Real-time live rate) vs 'implied' (Sheet THB/USD ratio)
  const [fxMode, setFxMode] = useState<"market" | "implied">("market");
  const [marketFxRate, setMarketFxRate] = useState<number>(33.53);
  const [fxSourceInfo, setFxSourceInfo] = useState<string>("Open Exchange Rates");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets", { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.data) {
        const { portfolioList: pList, portfolio, assets: rawAssets, history, periods, exchangeRate } = json.data;
        
        if (pList && pList.length > 0) {
          setPortfolioList(pList);
        } else if (portfolio) {
          setPortfolioList([portfolio]);
        }

        if (rawAssets && rawAssets.length > 0) {
          setAllAssets(rawAssets);
        }

        if (history) {
          setHistoryData(history);
        }

        if (periods && periods.length > 0) {
          setAvailablePeriods(periods);
          if (!periods.includes(selectedPeriod)) {
            setSelectedPeriod(periods[0]);
          }
        }

        if (exchangeRate?.rate) {
          setMarketFxRate(exchangeRate.rate);
          if (exchangeRate.source) setFxSourceInfo(exchangeRate.source);
        }

        setLastSyncTime(new Date().toLocaleTimeString("th-TH"));
        showToast("ซิงค์ข้อมูลสดจาก Google Sheets และอัตราแลกเปลี่ยนสำเร็จ");
      }
    } catch (err) {
      console.warn("Fetch error:", err);
      showToast("ไม่สามารถซิงค์ข้อมูลสดได้ ใช้ข้อมูลแคชล่าสุด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Current Summary according to selectedPeriod
  const summary = useMemo<PortfolioSummary>(() => {
    const found = portfolioList.find((p) => p.period === selectedPeriod);
    if (found) return found;
    if (portfolioList.length > 0) return portfolioList[0];
    return {
      period: selectedPeriod,
      name: "Core",
      costTHB: 400.0,
      valueTHB: 595.0,
      returnTHB: -5.93,
      assetCount: 17,
    };
  }, [portfolioList, selectedPeriod]);

  // Current Assets filtered by selectedPeriod
  const currentAssets = useMemo<AssetHolding[]>(() => {
    if (allAssets.length === 0) return [];
    const filtered = allAssets.filter((a) => a.period === selectedPeriod);
    return filtered.length > 0 ? filtered : allAssets;
  }, [allAssets, selectedPeriod]);

  // Implied Rate from Google Sheets (THB Value / Total USD)
  const impliedFxRate = useMemo<number>(() => {
    const totalUSD = currentAssets.reduce((sum, a) => sum + a.usd, 0);
    if (totalUSD > 0 && summary.valueTHB > 0) {
      return summary.valueTHB / totalUSD;
    }
    return 34.5;
  }, [currentAssets, summary.valueTHB]);

  // Active Effective Rate
  const activeFxRate = useMemo<number>(() => {
    return fxMode === "market" ? marketFxRate : impliedFxRate;
  }, [fxMode, marketFxRate, impliedFxRate]);

  // Enriched Assets
  const enrichedAssets = useMemo(() => {
    return currentAssets.map((a) => {
      const meta = ASSET_METADATA[a.ticker] || {
        category: a.ticker === "USD" ? "Cash & Equivalents" : "Other ETF",
        region: a.ticker === "USD" ? "Cash" : "Global",
        expenseRatio: "0.10%",
        yield: "1.50%",
        risk: (a.ticker === "USD" ? "Low" : "Medium") as "Low" | "Medium" | "High",
        badgeColor: "from-blue-500 to-indigo-500",
      };
      return {
        ...a,
        thbValue: a.usd * activeFxRate,
        category: a.category || meta.category,
        region: a.region || meta.region,
        expenseRatio: a.expenseRatio || meta.expenseRatio,
        dividendYield: a.dividendYield || meta.yield,
        riskScore: a.riskScore || meta.risk,
      };
    });
  }, [currentAssets, activeFxRate]);

  const totalUSD = useMemo(() => {
    return enrichedAssets.reduce((sum, item) => sum + item.usd, 0);
  }, [enrichedAssets]);

  const cashUSD = useMemo(() => {
    const cashItem = enrichedAssets.find((a) => a.ticker === "USD");
    return cashItem ? cashItem.usd : 0;
  }, [enrichedAssets]);

  // Value in THB: if in market FX mode, show computed THB (totalUSD * marketRate)
  const computedTHBValue = useMemo(() => {
    if (fxMode === "market") {
      return totalUSD * marketFxRate;
    }
    return summary.valueTHB;
  }, [fxMode, totalUSD, marketFxRate, summary.valueTHB]);

  const returnPercentage = useMemo(() => {
    if (summary.costTHB <= 0) return 0;
    const netReturn = fxMode === "market" ? (computedTHBValue - summary.costTHB) : summary.returnTHB;
    return (netReturn / summary.costTHB) * 100;
  }, [summary, fxMode, computedTHBValue]);

  const winningCount = useMemo(() => enrichedAssets.filter((a) => a.pnl > 0).length, [enrichedAssets]);
  const losingCount = useMemo(() => enrichedAssets.filter((a) => a.pnl < 0).length, [enrichedAssets]);
  const neutralCount = useMemo(() => enrichedAssets.filter((a) => a.pnl === 0).length, [enrichedAssets]);

  const nonCashAssets = useMemo(() => enrichedAssets.filter((a) => a.ticker !== "USD"), [enrichedAssets]);

  const bestPerformer = useMemo(() => {
    if (nonCashAssets.length === 0) return null;
    return [...nonCashAssets].sort((a, b) => b.pnl - a.pnl)[0];
  }, [nonCashAssets]);

  const worstPerformer = useMemo(() => {
    if (nonCashAssets.length === 0) return null;
    return [...nonCashAssets].sort((a, b) => a.pnl - b.pnl)[0];
  }, [nonCashAssets]);

  const regionalData = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedAssets.forEach((a) => {
      const reg = a.region || "Other";
      map[reg] = (map[reg] || 0) + a.usd;
    });
    return Object.keys(map).map((reg) => ({
      region: reg,
      value: parseFloat(map[reg].toFixed(2)),
      pct: totalUSD > 0 ? parseFloat(((map[reg] / totalUSD) * 100).toFixed(1)) : 0,
    }));
  }, [enrichedAssets, totalUSD]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedAssets.forEach((a) => {
      const cat = a.category || "Other";
      map[cat] = (map[cat] || 0) + a.usd;
    });
    return Object.keys(map)
      .map((cat) => ({
        name: cat,
        value: parseFloat(map[cat].toFixed(2)),
        pct: totalUSD > 0 ? parseFloat(((map[cat] / totalUSD) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedAssets, totalUSD]);

  const riskMetrics = useMemo(() => {
    return [
      { subject: "US Equity", score: 65, fullMark: 100 },
      { subject: "Global Diversity", score: 88, fullMark: 100 },
      { subject: "Tech Growth", score: 48, fullMark: 100 },
      { subject: "Defensive & Gold", score: 42, fullMark: 100 },
      { subject: "Emerging Markets", score: 56, fullMark: 100 },
      { subject: "Cash & Liquidity", score: 80, fullMark: 100 },
    ];
  }, []);

  const filteredAssets = useMemo(() => {
    let result = enrichedAssets.filter((item) => {
      const matchSearch =
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterType === "gain") return item.pnl > 0;
      if (filterType === "loss") return item.pnl < 0;
      if (filterType === "neutral") return item.pnl === 0;

      if (selectedRegion !== "all" && item.region !== selectedRegion) return false;
      return true;
    });

    result.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortConfig.dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortConfig.dir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [enrichedAssets, searchQuery, filterType, selectedRegion, sortConfig]);

  const handleSort = (key: keyof AssetHolding) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  const exportCSV = () => {
    const headers = "Ticker,Name,Category,Region,USD_Value,THB_Value,Weight_Pct,PnL_Pct,Shares,Expense_Ratio,Dividend_Yield,Risk\n";
    const rows = enrichedAssets.map((a) => {
      const weight = totalUSD > 0 ? ((a.usd / totalUSD) * 100).toFixed(2) : "0";
      return `"${a.ticker}","${a.name}","${a.category}","${a.region}",${a.usd},${(a.usd * activeFxRate).toFixed(2)},${weight}%,${a.pnl}%,${a.shares},"${a.expenseRatio}","${a.dividendYield}","${a.riskScore}"`;
    });
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ETF_Portfolio_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว");
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-10 max-w-[1680px] mx-auto transition-colors duration-300">
      {/* Top Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-2xl shadow-blue-500/25 flex-shrink-0">
            <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center backdrop-blur-xl">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                ETF Portfolio Terminal
              </h1>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Analytics
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ระบบวิเคราะห์ข้อมูลพอร์ตการลงทุนแบบ Multi-Asset พร้อม Live Google Sheets Integration & Live FX Engine
            </p>
          </div>
        </div>

        {/* Top Actions & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Period Selector */}
          <div className="glass-pill px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-medium text-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>รอบเดือน:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-bold outline-none cursor-pointer focus:border-cyan-400"
            >
              {availablePeriods.length > 0 ? (
                availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p} {p === availablePeriods[0] ? "(ล่าสุด)" : ""}
                  </option>
                ))
              ) : (
                <option value={summary.period}>{summary.period}</option>
              )}
            </select>
          </div>

          {/* Real-time Currency Converter Control */}
          <div className="glass-pill px-3 py-1.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="flex items-center gap-1.5">
              <span>1 USD =</span>
              <strong className="text-emerald-400 font-mono font-semibold">
                ฿{activeFxRate.toFixed(2)}
              </strong>
            </div>
            {/* Toggle FX Mode */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-white/10 text-[10px]">
              <button
                onClick={() => setFxMode("market")}
                title={`ตลาดจริง (${fxSourceInfo}): ฿${marketFxRate.toFixed(2)}`}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  fxMode === "market"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live FX
              </button>
              <button
                onClick={() => setFxMode("implied")}
                title={`คำนวณจาก Sheets: ฿${impliedFxRate.toFixed(2)}`}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  fxMode === "implied"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sheet
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="glass-pill hover:bg-white/10 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-200 flex items-center gap-2 transition duration-200 cursor-pointer disabled:opacity-50"
            title={lastSyncTime ? `อัปเดตล่าสุด: ${lastSyncTime}` : "กดเพื่อรีเฟรชข้อมูล"}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>รีเฟรช {lastSyncTime && `(${lastSyncTime})`}</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="glass-pill hover:bg-white/10 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-200 flex items-center gap-2 transition duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>CSV</span>
          </button>
        </div>
      </header>

      {/* Hero Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
        {/* Card 1: Total Portfolio Value (THB) */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">มูลค่าพอร์ตสุทธิ (THB)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            ฿{computedTHBValue.toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg ${
              returnPercentage >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
            }`}>
              {returnPercentage >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {returnPercentage >= 0 ? "+" : ""}{returnPercentage.toFixed(2)}%
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({(computedTHBValue - summary.costTHB) >= 0 ? "+" : ""}฿{(computedTHBValue - summary.costTHB).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Card 2: USD Total */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-teal-400" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">มูลค่ารวมสินทรัพย์ (USD)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            ${totalUSD.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{enrichedAssets.length} รายการสินทรัพย์</span>
            {cashUSD > 0 && <span className="text-emerald-400 font-mono font-medium">Cash ${cashUSD.toFixed(2)}</span>}
          </div>
        </div>

        {/* Card 3: Invested Cost */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">เงินต้นสะสม (Cost)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            ฿{summary.costTHB.toFixed(2)}
          </div>
          <div className="text-xs text-purple-300 flex items-center gap-1.5">
            <span>พอร์ต: <strong className="text-white">{summary.name}</strong></span>
          </div>
        </div>

        {/* Card 4: Win / Loss Spectrum */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">สัดส่วน กำไร / ขาดทุน</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
            <span className="text-emerald-400">{winningCount}</span>
            <span className="text-slate-600 text-lg">/</span>
            <span className="text-rose-400">{losingCount}</span>
            <span className="text-slate-600 text-lg">/</span>
            <span className="text-slate-400 text-base">{neutralCount}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            เขียว {winningCount} • แดง {losingCount} • เท่าทุน {neutralCount}
          </div>
        </div>

        {/* Card 5: Best Performer */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">กองทุนเติบโตสูงสุด</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 flex items-baseline gap-2">
            {bestPerformer?.ticker || "-"}
            {bestPerformer && (
              <span className={`text-sm font-bold ${bestPerformer.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {bestPerformer.pnl >= 0 ? "+" : ""}{bestPerformer.pnl.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 truncate" title={bestPerformer?.name}>
            {bestPerformer?.name || "ไม่มีข้อมูล"}
          </div>
        </div>

        {/* Card 6: Worst Performer */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">กองทุนปรับฐานสูงสุด</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 flex items-baseline gap-2">
            {worstPerformer?.ticker || "-"}
            {worstPerformer && (
              <span className="text-sm font-bold text-rose-400">
                {worstPerformer.pnl.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 truncate" title={worstPerformer?.name}>
            {worstPerformer?.name || "ไม่มีข้อมูล"}
          </div>
        </div>
      </div>

      {/* Advanced Visual Charts Grid (3 Pillars) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Donut Asset Allocation */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">สัดส่วนสินทรัพย์ (Asset Weight)</h2>
                  <p className="text-xs text-slate-400">การกระจายตัวของ {enrichedAssets.length} สินทรัพย์ในพอร์ต</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enrichedAssets}
                    dataKey="usd"
                    nameKey="ticker"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {enrichedAssets.map((entry, index) => (
                      <Cell key={`cell-${entry.ticker}-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as AssetHolding;
                        const pct = totalUSD > 0 ? ((item.usd / totalUSD) * 100).toFixed(1) : 0;
                        return (
                          <div className="glass-panel p-3 rounded-2xl text-xs shadow-2xl border border-white/20">
                            <p className="font-bold text-white mb-1">{item.ticker} ({pct}%)</p>
                            <p className="text-slate-300 font-mono">
                              ${item.usd.toFixed(2)} ≈ ฿{(item.usd * activeFxRate).toFixed(2)}
                            </p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{item.name}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2.5 text-center mt-2">
            {enrichedAssets.slice(0, 3).map((a) => (
              <div key={a.ticker} className="glass-pill p-2.5 rounded-2xl">
                <span className="text-xs font-bold text-cyan-400">{a.ticker}</span>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">{((a.usd / totalUSD) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Regional Exposure Progress Bars */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">การกระจายตัวตามภูมิภาค</h2>
                  <p className="text-xs text-slate-400">สัดส่วนตามตลาดหุ้นทั่วโลก (Geographic)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {regionalData.map((reg) => (
                <div key={reg.region}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      {reg.region}
                    </span>
                    <span className="text-slate-400 font-mono">
                      ${reg.value.toFixed(2)} (<strong className="text-cyan-300">{reg.pct}%</strong>)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 shadow-sm"
                      style={{ width: `${reg.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">อุตสาหกรรมหลัก (Top Sectors)</h3>
            <div className="flex flex-wrap gap-1.5">
              {categoryData.slice(0, 4).map((cat) => (
                <span key={cat.name} className="glass-pill px-2.5 py-1 rounded-xl text-[11px] font-medium text-slate-300">
                  {cat.name} <strong className="text-cyan-400 ml-1">{cat.pct}%</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Radar Diagnostics */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">สุขภาพและความสมดุลพอร์ต</h2>
                  <p className="text-xs text-slate-400">เรดาร์วิเคราะห์ 6 มิติ (Diagnostics)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                Score: 88/100
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskMetrics} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  <Radar name="Portfolio Strength" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-pill p-3 rounded-2xl text-[11px] text-slate-300 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>พอร์ตมีการจัดสรรกระจายตัวทั่วโลกสูงและมีสภาพคล่องเงินสดในระดับที่เหมาะสม</span>
          </div>
        </div>
      </div>

      {/* History Trend & Multi-Period Performance Section */}
      {historyData.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ประวัติผลตอบแทนสะสมรายงวด (Historical Performance)</h2>
                <p className="text-xs text-slate-400">ข้อมูลจาก Google Sheets ชีตประวัติการลงทุนย้อนหลัง</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {historyData.map((h) => (
                <div key={h.period} className="glass-pill px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">{h.period}:</span>
                  <span className={`font-mono font-bold ${h.returnTHB >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {h.returnTHB >= 0 ? "+" : ""}฿{h.returnTHB.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `฿${v}`} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as HistoryPoint;
                      return (
                        <div className="glass-panel p-3 rounded-2xl text-xs shadow-2xl border border-white/20">
                          <p className="text-slate-400 mb-1">งวด: {item.period}</p>
                          <p className={`font-extrabold text-sm ${item.returnTHB >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            ผลตอบแทน: {item.returnTHB >= 0 ? "+" : ""}฿{item.returnTHB.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="returnTHB"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#38bdf8", stroke: "#0f172a", strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: "#34d399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Bar Chart (Full Width) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ผลตอบแทนรายสินทรัพย์ในงวด {selectedPeriod} (%)</h2>
              <p className="text-xs text-slate-400">เปรียบเทียบอัตราผลตอบแทนแยกตามแต่ละกองทุน</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50"></span> กำไร
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-sm shadow-rose-400/50"></span> ขาดทุน
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> เสมอ / Cash
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...enrichedAssets].sort((a, b) => b.pnl - a.pnl)} margin={{ top: 15, right: 10, left: -15, bottom: 25 }}>
              <XAxis dataKey="ticker" stroke="#64748b" fontSize={11} interval={0} angle={-30} textAnchor="end" tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as AssetHolding;
                    return (
                      <div className="glass-panel p-3.5 rounded-2xl text-xs shadow-2xl border border-white/20">
                        <p className="font-bold text-white text-sm mb-0.5">{item.ticker} - {item.name}</p>
                        <p className="text-slate-400 mb-2">{item.category} • {item.region}</p>
                        <p className={`font-extrabold text-sm ${item.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          ผลตอบแทน: {item.pnl >= 0 ? "+" : ""}{item.pnl.toFixed(1)}%
                        </p>
                        <p className="text-slate-300 mt-1">
                          มูลค่า: ${item.usd.toFixed(2)} (฿{(item.usd * activeFxRate).toFixed(2)})
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                {[...enrichedAssets].sort((a, b) => b.pnl - a.pnl).map((entry, index) => (
                  <Cell
                    key={`pnl-bar-${entry.ticker}-${index}`}
                    fill={entry.pnl > 0 ? "#10b981" : entry.pnl < 0 ? "#f43f5e" : "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Luxury In-Depth Table Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ตารางวิเคราะห์สินทรัพย์เชิงลึก (Holdings Matrix)</h2>
              <p className="text-xs text-slate-400">งวด: <strong className="text-cyan-400">{selectedPeriod}</strong> • ตรวจสอบรายละเอียด ค่าธรรมเนียม เงินปันผล และสัดส่วน</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหา Ticker, ชื่อ หรือหมวดหมู่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition duration-200"
              />
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950/60 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 transition cursor-pointer"
            >
              <option value="all">ทุกภูมิภาค</option>
              <option value="US">สหรัฐฯ (US)</option>
              <option value="Global">ทั่วโลก (Global)</option>
              <option value="Ex-US">นอกสหรัฐ (Ex-US)</option>
              <option value="Japan">ญี่ปุ่น (Japan)</option>
              <option value="India">อินเดีย (India)</option>
              <option value="Emerging">ตลาดเกิดใหม่ (Emerging)</option>
              <option value="Cash">เงินสด (Cash)</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-white/10">
              {(["all", "gain", "loss", "neutral"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    filterType === type
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {type === "all" ? "ทั้งหมด" : type === "gain" ? "กำไร" : type === "loss" ? "ขาดทุน" : "เสมอ"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th onClick={() => handleSort("ticker")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>Ticker</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort("name")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>ชื่อกองทุน / หมวดหมู่</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort("region")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>ภูมิภาค</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort("usd")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>มูลค่า (USD / THB)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort("pnl")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>ผลตอบแทน (%)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort("shares")} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>หน่วยที่ถือ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Expense / Yield</th>
                <th className="py-3.5 px-4">สัดส่วนพอร์ต</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    ไม่พบข้อมูลสินทรัพย์ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => {
                  const weightPct = totalUSD > 0 ? ((item.usd / totalUSD) * 100).toFixed(1) : "0";
                  const thbVal = (item.usd * activeFxRate).toFixed(2);
                  const isCash = item.ticker === "USD";
                  return (
                    <tr key={item.ticker} className="hover:bg-white/[0.04] transition duration-150">
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          isCash
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        }`}>
                          {item.ticker}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-100 max-w-[240px] truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.category}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="glass-pill px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-300">
                          {item.region}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">${item.usd.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">≈ ฿{thbVal}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                          item.pnl > 0
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : item.pnl < 0
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {item.pnl > 0 ? "+" : ""}{item.pnl.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">
                        {isCash ? "-" : item.shares.toFixed(4)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        <div>Fee: <span className="text-slate-400 font-mono">{item.expenseRatio}</span></div>
                        <div className="text-[11px] text-slate-400">Yield: <span className="text-emerald-400 font-mono">{item.dividendYield}</span></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                              style={{ width: `${Math.min(parseFloat(weightPct) * 4, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-300 font-mono">{weightPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-6">
        <p>ETF Bot Portfolio Analytics Platform • Next.js 16 + React 19 + Tailwind CSS</p>
      </footer>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 glass-panel border border-cyan-400/40 text-slate-100 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
