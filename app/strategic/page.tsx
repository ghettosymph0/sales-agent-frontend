"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAirtableRetailers, AirtableRetailer } from "@/lib/api"

export default function StrategicRetailersPage() {
  const [retailers, setRetailers] = useState<AirtableRetailer[]>([])
  const [filteredRetailers, setFilteredRetailers] = useState<AirtableRetailer[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [cityFilter, setCityFilter] = useState("")
  const [storeTypeFilter, setStoreTypeFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [fitScoreFilter, setFitScoreFilter] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    loadRetailers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cityFilter, storeTypeFilter, priorityFilter, fitScoreFilter, retailers])

  const loadRetailers = async () => {
    setLoading(true)
    try {
      const data = await getAirtableRetailers(0, 1000)
      setRetailers(data.retailers || [])
    } catch (error) {
      console.error("Failed to load retailers:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...retailers]

    if (cityFilter) {
      filtered = filtered.filter(r => r.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    }

    if (storeTypeFilter) {
      filtered = filtered.filter(r => r.store_type === storeTypeFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter(r => r.strategic_priority === priorityFilter)
    }

    if (fitScoreFilter) {
      filtered = filtered.filter(r => r.fit_score && r.fit_score >= fitScoreFilter)
    }

    // Sort by fit score (high to low), then priority
    filtered.sort((a, b) => {
      const scoreA = a.fit_score || 0
      const scoreB = b.fit_score || 0
      if (scoreB !== scoreA) return scoreB - scoreA
      
      const priorityOrder = { 'A': 3, 'B': 2, 'C': 1 }
      const prioA = priorityOrder[a.strategic_priority as keyof typeof priorityOrder] || 0
      const prioB = priorityOrder[b.strategic_priority as keyof typeof priorityOrder] || 0
      return prioB - prioA
    })

    setFilteredRetailers(filtered)
  }

  const renderFitStars = (score: number | null) => {
    if (!score) return <span className="text-gray-600">No score</span>
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < score ? "text-yellow-400" : "text-gray-700"}>
            ⭐
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-400">{score}/5</span>
      </div>
    )
  }

  const getPriorityColor = (priority: string | null) => {
    switch(priority) {
      case 'A': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'B': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'C': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-800 text-gray-500 border-gray-700'
    }
  }

  const getStatusColor = (status: string | null) => {
    switch(status) {
      case 'Research': return 'bg-gray-500/20 text-gray-400'
      case 'Contacted': return 'bg-blue-500/20 text-blue-400'
      case 'Follow-up': return 'bg-yellow-500/20 text-yellow-400'
      case 'Negotiation': return 'bg-orange-500/20 text-orange-400'
      case 'Active': return 'bg-green-500/20 text-green-400'
      case 'Rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-800 text-gray-500'
    }
  }

  // Get unique values for filters
  const cities = Array.from(new Set(retailers.map(r => r.city).filter(Boolean))).sort()
  const storeTypes = Array.from(new Set(retailers.map(r => r.store_type).filter(Boolean))).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-gray-400">Loading strategic retailers...</p>
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
              <Link href="/overview">
                <h1 className="text-xl font-bold cursor-pointer">ALEXMONHART</h1>
              </Link>
              <div className="flex gap-6">
                <Link href="/overview" className="text-gray-400 hover:text-white transition">Dashboard</Link>
                <Link href="/campaigns" className="text-gray-400 hover:text-white transition">Campaigns</Link>
                <Link href="/retailers" className="text-gray-400 hover:text-white transition">All Retailers</Link>
                <Link href="/strategic" className="text-white font-medium">Strategic View</Link>
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/settings" className="text-gray-400 hover:text-white transition">Settings</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            Strategic <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">Retailer View</span>
          </h2>
          <p className="text-gray-400">Curated list prioritized by brand fit and strategic importance</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Store Type</label>
              <select
                value={storeTypeFilter}
                onChange={(e) => setStoreTypeFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Types</option>
                {storeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Priorities</option>
                <option value="A">A - Strategic</option>
                <option value="B">B - Realistic</option>
                <option value="C">C - Experimental</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Fit Score</label>
              <select
                value={fitScoreFilter || ""}
                onChange={(e) => setFitScoreFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Scores</option>
                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                <option value="4">⭐⭐⭐⭐ (4+)</option>
                <option value="3">⭐⭐⭐ (3+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">View</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    viewMode === "grid" 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    viewMode === "list" 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {filteredRetailers.length} of {retailers.length} retailers
            </p>
            <button
              onClick={() => {
                setCityFilter("")
                setStoreTypeFilter("")
                setPriorityFilter("")
                setFitScoreFilter(null)
              }}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Retailers Grid/List */}
        {filteredRetailers.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400 mb-4">No retailers match these filters</p>
            <p className="text-sm text-gray-500">Try adjusting your filter criteria</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredRetailers.map(retailer => (
              <div key={retailer.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{retailer.name}</h3>
                    <p className="text-sm text-gray-400">{retailer.city}, {retailer.country}</p>
                  </div>
                  {retailer.strategic_priority && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(retailer.strategic_priority)}`}>
                      {retailer.strategic_priority}
                    </span>
                  )}
                </div>

                {/* Fit Score */}
                <div className="mb-4">
                  {renderFitStars(retailer.fit_score)}
                </div>

                {/* Store Type & Status */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {retailer.store_type && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {retailer.store_type}
                    </span>
                  )}
                  {retailer.strategic_status && (
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(retailer.strategic_status)}`}>
                      {retailer.strategic_status}
                    </span>
                  )}
                </div>

                {/* Products Suitable */}
                {retailer.products_suitable && retailer.products_suitable.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Products:</p>
                    <div className="flex flex-wrap gap-1">
                      {retailer.products_suitable.map((product, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Notes */}
                {retailer.strategic_notes && (
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Strategic Notes:</p>
                    <p className="text-sm text-gray-300 line-clamp-3">{retailer.strategic_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/retailers?search=${retailer.name}`}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-center text-sm font-medium transition"
                  >
                    View Details
                  </Link>
                  {retailer.has_campaign && (
                    <Link
                      href="/campaigns"
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      View Campaign
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
