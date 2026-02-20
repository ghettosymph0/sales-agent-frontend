"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://100.72.223.89:8000";

export default function DiscoveryPage() {
  const [brandUrl, setBrandUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [progress, setProgress] = useState({
    stage: "",
    found: 0,
    enriched: 0,
    total: 0,
    message: ""
  })
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentProgress, setEnrichmentProgress] = useState("")

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`${API_BASE}/api/discovery/history`)
      
      // If 500 error (table doesn't exist), silently ignore
      if (response.status === 500) {
        console.log("Discovery History table not yet created in Airtable - this is normal for new setups")
        setHistory([])
        return
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error("Failed to load history:", err)
      // Don't show error to user - just log it
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const enrichAll = async () => {
    const newRetailerIds = results
      .filter(r => r.status === "New" && r.id)
      .map(r => r.id)
    
    if (newRetailerIds.length === 0) {
      alert("No new retailers to enrich")
      return
    }

    setIsEnriching(true)
    setEnrichmentProgress(`Enriching ${newRetailerIds.length} retailers...`)

    try {
      const response = await fetch(`${API_BASE}/api/retailers/enrich-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailer_ids: newRetailerIds })
      })

      if (!response.ok) {
        throw new Error("Enrichment failed")
      }

      const data = await response.json()
      setEnrichmentProgress(`✓ Enriched ${data.enriched} retailers, ${data.failed} failed`)
      
      // Refresh results to show updated email status
      setTimeout(() => setEnrichmentProgress(""), 3000)
    } catch (err: any) {
      setEnrichmentProgress(`Error: ${err.message}`)
      setTimeout(() => setEnrichmentProgress(""), 5000)
    } finally {
      setIsEnriching(false)
    }
  }

  const startScraping = async () => {
    if (!brandUrl.trim()) {
      setError("Please enter a brand URL")
      return
    }

    // Validate URL format
    try {
      new URL(brandUrl)
    } catch {
      setError("Please enter a valid URL (e.g., https://byredo.com)")
      return
    }

    setError("")
    setIsScraping(true)
    setProgress({ stage: "Starting...", found: 0, enriched: 0, total: 0, message: "" })
    setResults([])

    try {
      // Call real backend API
      setProgress({ stage: "Scraping stockist page", found: 0, enriched: 0, total: 0, message: "Looking for retailers..." })
      
      const response = await fetch(`${API_BASE}/api/discovery/scrape-brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_url: brandUrl })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to scrape brand")
      }
      
      const data = await response.json()
      
      setProgress({ 
        stage: "Complete", 
        found: data.found, 
        enriched: data.added, 
        total: data.found, 
        message: `Added ${data.added} new retailers, skipped ${data.skipped} existing` 
      })
      
      // Transform backend response to UI format
      setResults(data.retailers.map((r: any) => ({
        id: r.airtable_id,
        name: r.name,
        country: r.country || "Unknown",
        email: r.email || "",
        status: r.status === "new" ? "New" : "Existing"
      })))
      
      // Reload history to show the new scrape
      loadHistory()
      
    } catch (err: any) {
      setError(err.message || "Failed to scrape retailers")
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/overview">
                <h1 className="text-xl font-bold cursor-pointer">ALEXMONHART</h1>
              </Link>
              <div className="flex gap-6">
                <Link href="/overview" className="text-gray-400 hover:text-white transition">Dashboard</Link>
                <Link href="/campaigns" className="text-gray-400 hover:text-white transition">Campaigns</Link>
                <Link href="/retailers" className="text-gray-400 hover:text-white transition">Retailers</Link>
                <Link href="/discovery" className="text-white font-medium">Discovery</Link>
                <Link href="/import" className="text-gray-400 hover:text-white transition">Import</Link>
                <Link href="/analytics" className="text-gray-400 hover:text-white transition">Analytics</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            Discover <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">New Retailers</span>
          </h2>
          <p className="text-gray-400">Scrape retailers from competitor brand stockist pages</p>
        </div>

        {/* History Log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Scraping History {!loadingHistory && `(${history.length} sessions)`}
          </h3>
          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
              <p className="text-gray-400 text-sm">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No scraping sessions yet. Start by entering a brand URL below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session: any) => (
                <div key={session.id} className="bg-gray-800/50 rounded-lg overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-800/80 transition"
                    onClick={() => setExpandedHistory(expandedHistory === session.id ? null : session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{session.brand_name}</h4>
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(session.scraped_at).toLocaleString()} • Found {session.found_count}, Added {session.added_count}, Skipped {session.skipped_count}
                        </p>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedHistory === session.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {expandedHistory === session.id && (
                    <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Brand URL</p>
                          <a 
                            href={session.brand_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {session.brand_url}
                          </a>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Stockists Page</p>
                          <a 
                            href={session.stockists_page_url || session.brand_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {session.stockists_page_url || "N/A"}
                          </a>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm mb-2">
                          {session.retailer_ids?.length || 0} retailers linked to this session
                        </p>
                        <Link href="/retailers" className="text-xs text-blue-400 hover:underline">
                          View all retailers →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Brand Stockist URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              placeholder="https://byredo.com/stockists"
              disabled={isScraping}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={startScraping}
              disabled={isScraping}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScraping ? "Scraping..." : "Scrape Retailers"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Enter the stockist/retailers page URL of a competitor brand. We'll extract all retailers and add them to your database.
          </p>
        </div>

        {/* Progress Display */}
        {isScraping && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Scraping Progress</h3>
            
            {/* Stage */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{progress.stage}</span>
                <span className="text-sm font-medium text-blue-400">{progress.message}</span>
              </div>
              
              {/* Progress Bar */}
              {progress.total > 0 && (
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.enriched / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Found</p>
                <p className="text-2xl font-bold text-blue-400">{progress.found}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Enriched</p>
                <p className="text-2xl font-bold text-purple-400">{progress.enriched}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-green-400">{progress.total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Results: {results.length} Retailers
              </h3>
              <button
                onClick={enrichAll}
                disabled={isEnriching || results.filter(r => r.status === "New").length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isEnriching ? "Enriching..." : `Enrich All New (${results.filter(r => r.status === "New").length})`}
              </button>
            </div>
            {enrichmentProgress && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400">
                {enrichmentProgress}
              </div>
            )}
            <div className="space-y-3">
              {results.map((retailer, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                  <div>
                    <p className="font-medium">{retailer.name}</p>
                    <p className="text-sm text-gray-400">{retailer.country} • {retailer.email || "No email"}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    retailer.status === "New" 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}>
                    {retailer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isScraping && results.length === 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h3 className="text-lg font-semibold mb-4">How it works</h3>
            <div className="space-y-4 text-gray-400">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Enter Brand URL</p>
                  <p className="text-sm">Paste the stockist/retailers page URL from a competitor brand</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Automatic Scraping</p>
                  <p className="text-sm">We extract all retailers from the page (names, locations, websites)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Contact Enrichment</p>
                  <p className="text-sm">We visit each retailer's website to find contact emails</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Smart Deduplication</p>
                  <p className="text-sm">Existing retailers are preserved - we only add new ones</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
