"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { getAirtableRetailers, AirtableRetailer, generateCampaignsBulk, enrichRetailersBulk } from "@/lib/api"

export default function RetailersPage() {
  const [allRetailers, setAllRetailers] = useState<AirtableRetailer[]>([])
  const [filteredRetailers, setFilteredRetailers] = useState<AirtableRetailer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set())
  const [generatingCampaigns, setGeneratingCampaigns] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  
  // Filters
  const [countryFilter, setCountryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [relationshipFilter, setRelationshipFilter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")

  useEffect(() => {
    loadRetailers()
  }, [])

  // Sync scroll between top and bottom scrollbars
  useEffect(() => {
    const tableScroll = tableScrollRef.current
    const topScroll = topScrollRef.current
    
    if (!tableScroll || !topScroll) return

    // Match the scrollable width of top scrollbar to table
    const syncWidth = () => {
      const table = tableScroll.querySelector('table')
      if (table) {
        const scrollDiv = topScroll.querySelector('div')
        if (scrollDiv) {
          scrollDiv.style.width = `${table.scrollWidth}px`
        }
      }
    }

    // Initial sync
    syncWidth()

    const handleTableScroll = () => {
      topScroll.scrollLeft = tableScroll.scrollLeft
    }

    const handleTopScroll = () => {
      tableScroll.scrollLeft = topScroll.scrollLeft
    }

    tableScroll.addEventListener('scroll', handleTableScroll)
    topScroll.addEventListener('scroll', handleTopScroll)

    // Re-sync width on window resize
    window.addEventListener('resize', syncWidth)

    return () => {
      tableScroll.removeEventListener('scroll', handleTableScroll)
      topScroll.removeEventListener('scroll', handleTopScroll)
      window.removeEventListener('resize', syncWidth)
    }
  }, [filteredRetailers])

  useEffect(() => {
    applyFilters()
  }, [countryFilter, statusFilter, relationshipFilter, brandFilter, allRetailers])

  const loadRetailers = async () => {
    setLoading(true)
    try {
      // Load ALL retailers
      const data = await getAirtableRetailers(0, 1000)
      setAllRetailers(data.retailers || [])
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to load retailers:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allRetailers]

    if (countryFilter) {
      filtered = filtered.filter(r => r.country === countryFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(r => r.enrichment_status === statusFilter)
    }

    if (relationshipFilter) {
      filtered = filtered.filter(r => r.relationship_status === relationshipFilter)
    }

    if (brandFilter) {
      filtered = filtered.filter(r => 
        r.source_brands && r.source_brands.includes(brandFilter)
      )
    }

    setFilteredRetailers(filtered)
  }

  const toggleSelectRetailer = (retailerId: string) => {
    const newSelected = new Set(selectedRetailers)
    if (newSelected.has(retailerId)) {
      newSelected.delete(retailerId)
    } else {
      newSelected.add(retailerId)
    }
    setSelectedRetailers(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRetailers.size === filteredRetailers.length) {
      setSelectedRetailers(new Set())
    } else {
      setSelectedRetailers(new Set(filteredRetailers.map(r => r.id)))
    }
  }

  const handleGenerateCampaigns = async () => {
    if (selectedRetailers.size === 0) {
      alert('Please select at least one retailer')
      return
    }

    if (!confirm(`Generate campaigns for ${selectedRetailers.size} retailer(s)?`)) return

    setGeneratingCampaigns(true)
    try {
      const result = await generateCampaignsBulk(Array.from(selectedRetailers))
      alert(`✅ Successfully generated ${result.created} campaigns!\n\nCheck the Campaigns page to view them.`)
      setSelectedRetailers(new Set())
    } catch (error: any) {
      console.error('Failed to generate campaigns:', error)
      alert(`❌ Failed to generate campaigns: ${error.message}`)
    } finally {
      setGeneratingCampaigns(false)
    }
  }

  const handleEnrichRetailers = async () => {
    if (selectedRetailers.size === 0) {
      alert('Please select at least one retailer')
      return
    }

    if (!confirm(`Enrich ${selectedRetailers.size} retailer(s)? This will attempt to find contact emails.`)) return

    setEnriching(true)
    try {
      const result = await enrichRetailersBulk(Array.from(selectedRetailers))
      alert(`✅ Enrichment complete!\n\nSuccess: ${result.success}\nFailed: ${result.failed}`)
      await loadRetailers() // Reload to show updated data
      setSelectedRetailers(new Set())
    } catch (error: any) {
      console.error('Failed to enrich retailers:', error)
      alert(`❌ Failed to enrich retailers: ${error.message}`)
    } finally {
      setEnriching(false)
    }
  }

  const countries = Array.from(new Set(allRetailers.map(r => r.country).filter((c): c is string => Boolean(c)))).sort()
  const statuses = Array.from(new Set(allRetailers.map(r => r.enrichment_status).filter((s): s is string => Boolean(s)))).sort()
  const relationships = Array.from(new Set(allRetailers.map(r => r.relationship_status).filter((r): r is string => Boolean(r)))).sort()
  
  // Extract all unique brands from source_brands arrays
  const brands = Array.from(
    new Set(
      allRetailers.flatMap(r => r.source_brands || [])
    )
  ).sort()

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
                <Link href="/retailers" className="text-white font-medium">Retailers</Link>
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/import" className="text-gray-400 hover:text-white transition">Import</Link>
                <Link href="/analytics" className="text-gray-400 hover:text-white transition">Analytics</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-4xl font-bold mb-2">
                Retailer <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Database</span>
              </h2>
              <p className="text-gray-400">
                Showing {filteredRetailers.length} of {total} total retailers
                {selectedRetailers.size > 0 && (
                  <span className="ml-2 text-blue-400 font-medium">
                    • {selectedRetailers.size} selected
                  </span>
                )}
              </p>
            </div>

            {/* Bulk Actions */}
            {selectedRetailers.size > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleEnrichRetailers}
                  disabled={enriching}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {enriching ? 'Enriching...' : `🔍 Enrich ${selectedRetailers.size}`}
                </button>
                <button
                  onClick={handleGenerateCampaigns}
                  disabled={generatingCampaigns}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {generatingCampaigns ? 'Generating...' : `✨ Generate Campaigns (${selectedRetailers.size})`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">All Countries ({allRetailers.length})</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country} ({allRetailers.filter(r => r.country === country).length})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Enrichment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status} ({allRetailers.filter(r => r.enrichment_status === status).length})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Relationship Status</label>
              <select
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">All Relationships</option>
                {relationships.map(rel => (
                  <option key={rel} value={rel}>
                    {rel} ({allRetailers.filter(r => r.relationship_status === rel).length})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Source Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand} ({allRetailers.filter(r => r.source_brands?.includes(brand)).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(countryFilter || statusFilter || relationshipFilter || brandFilter) && (
            <button
              onClick={() => {
                setCountryFilter("")
                setStatusFilter("")
                setRelationshipFilter("")
                setBrandFilter("")
              }}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin text-6xl mb-4">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="url(#gradient)" strokeWidth="4"/>
                <path className="opacity-75" fill="url(#gradient)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-gray-400">Loading retailers...</p>
          </div>
        ) : filteredRetailers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No retailers match your filters</p>
          </div>
        ) : (
          <>
            {/* Top Scrollbar - Synced with table */}
            <div 
              ref={topScrollRef}
              className="bg-gray-900 border border-gray-800 rounded-t-xl overflow-x-auto overflow-y-hidden mb-1 sticky top-0 z-10"
            >
              <div style={{ height: '1px' }}>
                {/* This div's width will be set dynamically to match table width */}
              </div>
            </div>

            {/* Main Table with Bottom Scrollbar */}
            <div ref={tableScrollRef} className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-4 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRetailers.size === filteredRetailers.length && filteredRetailers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">Retailer</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">Location</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">All Contacts</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">Relationship</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">Source</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRetailers.map((retailer) => (
                  <tr key={retailer.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRetailers.has(retailer.id)}
                        onChange={() => toggleSelectRetailer(retailer.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold whitespace-nowrap">{retailer.name}</div>
                      {retailer.url ? (
                        <a 
                          href={retailer.url.startsWith('http') ? retailer.url : `https://${retailer.url}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline whitespace-nowrap inline-flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {retailer.url.replace('https://', '').replace('http://', '').slice(0, 35)}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">No website</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-400 whitespace-nowrap">
                      {[retailer.city, retailer.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4">
                      {retailer.contact_emails && retailer.contact_emails.length > 0 ? (
                        <div className="space-y-1">
                          {retailer.contact_emails.map((email, idx) => (
                            <div key={idx} className="text-sm text-green-400 flex items-center gap-2 whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M10 3L4.5 8.5L2 6"/>
                              </svg>
                              {email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm whitespace-nowrap">No contacts</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {retailer.relationship_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {retailer.source_brands && retailer.source_brands.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {retailer.source_brands.map((brand, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap"
                            >
                              {brand}
                            </span>
                          ))}
                        </div>
                      ) : retailer.source ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                          {retailer.source}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm whitespace-nowrap">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        retailer.enrichment_status === 'enriched'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : retailer.enrichment_status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {retailer.enrichment_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
