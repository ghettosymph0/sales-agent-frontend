"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAirtableStats, AirtableStats } from "@/lib/api"

export default function OverviewPage() {
  const [stats, setStats] = useState<AirtableStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getAirtableStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
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
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">ALEXMONHART</h1>
              <div className="flex gap-6">
                <Link href="/overview" className="text-white font-medium">Dashboard</Link>
                <Link href="/campaigns" className="text-gray-400 hover:text-white transition">Campaigns</Link>
                <Link href="/retailers" className="text-gray-400 hover:text-white transition">Retailers</Link>
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/import" className="text-gray-400 hover:text-white transition">Import</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-6">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              B2B Outreach
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Discover retailers, generate personalized emails, and scale your wholesale pipeline with artificial intelligence
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/campaigns" 
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition"
            >
              View Campaigns
            </Link>
            <Link 
              href="/retailers" 
              className="px-8 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Browse Retailers
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Total Campaigns"
            value={stats.campaigns.total}
            subtitle={`${stats.campaigns.pending} pending`}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            label="Campaigns Sent"
            value={stats.campaigns.sent}
            subtitle={`${stats.campaigns.responded} responded`}
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard
            label="Total Retailers"
            value={stats.retailers.total}
            subtitle={`${stats.retailers.with_emails} with contacts`}
            gradient="from-green-500 to-emerald-500"
          />
          <StatCard
            label="Response Rate"
            value={stats.performance.response_rate}
            subtitle="Overall performance"
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<RobotIcon />}
            title="AI Email Generation"
            description="Generate 3 personalized email variations for each retailer using Claude AI"
            stat={`${stats.campaigns.total} campaigns created`}
          />
          <FeatureCard
            icon={<TargetIcon />}
            title="Smart Retailer Discovery"
            description="Find and enrich potential retail partners with contact information"
            stat={`${stats.retailers.total} retailers discovered`}
          />
          <FeatureCard
            icon={<ChartIcon />}
            title="Analytics & Tracking"
            description="Track email performance, responses, and conversion rates in real-time"
            stat={`${stats.retailers.enrichment_rate} enriched`}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, subtitle, gradient }: { label: string; value: number | string; subtitle: string; gradient: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-gray-600 text-xs">{subtitle}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, stat }: { icon: React.ReactNode; title: string; description: string; stat: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="text-blue-400 text-sm font-medium">{stat}</div>
    </div>
  )
}

// SVG Icons
function RobotIcon() {
  return (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="10" rx="2" stroke="url(#blue-gradient)" strokeWidth="2"/>
      <circle cx="10" cy="12" r="1.5" fill="url(#blue-gradient)"/>
      <circle cx="14" cy="12" r="1.5" fill="url(#blue-gradient)"/>
      <path d="M8 16h8" stroke="url(#blue-gradient)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 8V5M12 5L10 7M12 5L14 7" stroke="url(#blue-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="url(#green-gradient)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke="url(#green-gradient)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="url(#green-gradient)"/>
      <defs>
        <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
      <path d="M3 17L9 11L13 15L21 7" stroke="url(#purple-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 7H21V11" stroke="url(#purple-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}
