"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getAnalyticsSummary,
  getProductAnalytics,
  getRevenueByDoor,
  getMonthlyTrends,
  AnalyticsSummary,
  ProductAnalytics,
  RevenueByDoor,
  MonthlyTrend,
} from "@/lib/api"

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [products, setProducts] = useState<ProductAnalytics | null>(null)
  const [byDoor, setByDoor] = useState<RevenueByDoor | null>(null)
  const [monthly, setMonthly] = useState<MonthlyTrend | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedQuarter, setSelectedQuarter] = useState("Q4")
  const [selectedYear, setSelectedYear] = useState(2025)

  useEffect(() => {
    loadAnalytics()
  }, [selectedQuarter, selectedYear])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [summaryData, productsData, doorData, monthlyData] = await Promise.all([
        getAnalyticsSummary(selectedQuarter, selectedYear),
        getProductAnalytics(selectedQuarter, selectedYear),
        getRevenueByDoor(selectedQuarter, selectedYear),
        getMonthlyTrends(selectedYear),
      ])
      setSummary(summaryData)
      setProducts(productsData)
      setByDoor(doorData)
      setMonthly(monthlyData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading || !summary || !products || !byDoor || !monthly) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-6xl mb-4">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="url(#gradient)" strokeWidth="4"/>
              <path className="opacity-75" fill="url(#gradient)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const avgOrderValue = summary.invoice_count > 0 
    ? summary.total_revenue_czk / summary.invoice_count 
    : 0

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">ALEXMONHART</h1>
              <div className="flex gap-6">
                <Link href="/overview" className="text-gray-400 hover:text-white transition">Dashboard</Link>
                <Link href="/campaigns" className="text-gray-400 hover:text-white transition">Campaigns</Link>
                <Link href="/retailers" className="text-gray-400 hover:text-white transition">Retailers</Link>
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/import" className="text-gray-400 hover:text-white transition">Import</Link>
                <Link href="/analytics" className="text-white font-medium">Analytics</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                WHS Analytics
              </span>
            </h2>
            <p className="text-gray-400">Wholesale business performance and insights</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex gap-4">
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(summary.total_revenue_czk)}
            subtitle={`${summary.invoice_count} invoices`}
            gradient="from-blue-500 to-cyan-500"
          />
          <MetricCard
            label="Active Doors"
            value={summary.unique_customers.toString()}
            subtitle="unique customers"
            gradient="from-purple-500 to-pink-500"
          />
          <MetricCard
            label="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            subtitle="per invoice"
            gradient="from-green-500 to-emerald-500"
          />
          <MetricCard
            label="Top Product"
            value={products.products[0]?.name.split(" ")[1] || "N/A"}
            subtitle={`${products.products[0]?.units || 0} units sold`}
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Customer */}
          <ChartCard title="Revenue by Customer" icon={<DoorIcon />}>
            <div className="space-y-3">
              {byDoor.doors.slice(0, 8).map((door, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate">{door.customer}</span>
                      <span className="text-sm font-semibold">{formatCurrency(door.revenue_czk)}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{
                          width: `${(door.revenue_czk / byDoor.doors[0].revenue_czk) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Top Products */}
          <ChartCard title="Top Selling Products" icon={<ProductIcon />}>
            <div className="space-y-3">
              {products.products.slice(0, 8).map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate">{product.name}</span>
                      <span className="text-sm font-semibold">{product.units} units</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{
                          width: `${(product.units / products.products[0].units) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Product Lines & Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Product Line */}
          <ChartCard title="Revenue by Product Line" icon={<LineChartIcon />}>
            <div className="space-y-4">
              {Object.entries(products.by_product_line)
                .sort((a, b) => b[1] - a[1])
                .map(([line, revenue], index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">{line}</span>
                      <span className="text-sm font-semibold">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{
                          width: `${(revenue / Math.max(...Object.values(products.by_product_line))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </ChartCard>

          {/* Monthly Trends */}
          <ChartCard title="Monthly Revenue Trends" icon={<TrendIcon />}>
            <div className="space-y-4">
              {monthly.months.map((month, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{month.month}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold block">{formatCurrency(month.revenue_czk)}</span>
                      <span className="text-xs text-gray-500">{month.invoice_count} invoices</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      style={{
                        width: `${(month.revenue_czk / Math.max(...monthly.months.map(m => m.revenue_czk))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Country Breakdown */}
        <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Revenue by Country" icon={<GlobeIcon />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(summary.by_country)
                .sort((a, b) => b[1] - a[1])
                .map(([country, revenue], index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl mb-1">
                      {country === "Czechia" && "🇨🇿"}
                      {country === "Lithuania" && "🇱🇹"}
                      {country === "Sweden" && "🇸🇪"}
                      {country === "Poland" && "🇵🇱"}
                      {country === "Germany" && "🇩🇪"}
                      {country === "France" && "🇫🇷"}
                    </div>
                    <div className="font-semibold text-lg mb-1">{formatCurrency(revenue)}</div>
                    <div className="text-xs text-gray-400">{country}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((revenue / summary.total_revenue_czk) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subtitle, gradient }: { 
  label: string; 
  value: string; 
  subtitle: string; 
  gradient: string 
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className={`text-3xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-gray-600 text-xs">{subtitle}</div>
    </div>
  )
}

function ChartCard({ title, icon, children }: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// Icons
function DoorIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="3" width="12" height="18" rx="2" stroke="url(#blue-grad)" strokeWidth="2"/>
      <circle cx="15" cy="12" r="1" fill="url(#blue-grad)"/>
      <defs>
        <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ProductIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h7l2 4h9v12H3V3z" stroke="url(#green-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LineChartIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="4" height="13" rx="1" fill="url(#purple-grad)"/>
      <rect x="10" y="5" width="4" height="16" rx="1" fill="url(#purple-grad)"/>
      <rect x="17" y="11" width="4" height="10" rx="1" fill="url(#purple-grad)"/>
      <defs>
        <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l6-6 4 4 8-8" stroke="url(#orange-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 7h4v4" stroke="url(#orange-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="url(#cyan-grad)" strokeWidth="2"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="url(#cyan-grad)" strokeWidth="2"/>
      <defs>
        <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
