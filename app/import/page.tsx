"use client"

import { useState } from "react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://100.72.223.89:8000";

interface ParsedEmail {
  email: string;
  status: "new" | "existing";
}

type ImportMode = "email" | "url";

export default function ImportPage() {
  const [importMode, setImportMode] = useState<ImportMode>("url")
  
  // Email import state
  const [emailText, setEmailText] = useState("")
  const [parsedEmails, setParsedEmails] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [error, setError] = useState("")
  
  // URL import state
  const [retailerUrl, setRetailerUrl] = useState("")
  const [retailerName, setRetailerName] = useState("")
  const [isAddingUrl, setIsAddingUrl] = useState(false)
  const [urlResult, setUrlResult] = useState<any>(null)

  const handleParse = async () => {
    if (!emailText.trim()) {
      setError("Please enter some email addresses")
      return
    }

    setError("")
    setIsParsing(true)
    setImportResults(null)

    try {
      const response = await fetch(`${API_BASE}/api/import/parse-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to parse emails")
      }

      const data = await response.json()
      setParsedEmails(data.emails || [])

      if (data.found_count === 0) {
        setError("No valid email addresses found. Please check your input.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse emails")
      setParsedEmails([])
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (parsedEmails.length === 0) {
      setError("No emails to import")
      return
    }

    if (!confirm(`Import ${parsedEmails.length} email(s)? We'll enrich each with company info and add to your database.`)) {
      return
    }

    setError("")
    setIsImporting(true)

    try {
      console.log("Sending import request to:", `${API_BASE}/api/import/enrich-and-add`)
      console.log("Email text:", emailText)
      
      const response = await fetch(`${API_BASE}/api/import/enrich-and-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText })
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to import emails"
        try {
          const error = await response.json()
          errorMessage = error.detail || error.message || errorMessage
          console.error("Server error:", error)
        } catch (e) {
          const textError = await response.text()
          console.error("Server response:", textError)
          errorMessage = `Server error (${response.status}): ${textError.substring(0, 100)}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Import results:", data)
      setImportResults(data)

      // Clear form on success
      if (data.added > 0 || data.skipped > 0) {
        setEmailText("")
        setParsedEmails([])
      }
    } catch (err: any) {
      console.error("Import error:", err)
      setError(err.message || "Failed to import emails. Check console for details.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddByUrl = async () => {
    if (!retailerUrl.trim()) {
      setError("Please enter a retailer URL")
      return
    }

    // Validate URL format
    let url = retailerUrl.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    setError("")
    setIsAddingUrl(true)
    setUrlResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/import/add-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: url,
          name: retailerName.trim() || undefined
        })
      })

      if (!response.ok) {
        let errorMessage = "Failed to add retailer"
        try {
          const error = await response.json()
          errorMessage = error.detail || error.message || errorMessage
        } catch (e) {
          errorMessage = `Server error (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setUrlResult(data)

      // Clear form on success
      if (data.success) {
        setRetailerUrl("")
        setRetailerName("")
      }
    } catch (err: any) {
      console.error("Add by URL error:", err)
      setError(err.message || "Failed to add retailer")
    } finally {
      setIsAddingUrl(false)
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
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/import" className="text-white font-medium">Import</Link>
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
            Import <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Retailers</span>
          </h2>
          <p className="text-gray-400">Add retailers by URL or email address - we'll automatically enrich with contact info</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setImportMode("url"); setError(""); setUrlResult(null); }}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              importMode === "url"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Add by URL
          </button>
          <button
            onClick={() => { setImportMode("email"); setError(""); setImportResults(null); }}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              importMode === "email"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Import Email List
          </button>
        </div>

        {/* URL Import Mode */}
        {importMode === "url" && (
          <>
            {/* URL Success */}
            {urlResult && urlResult.success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Retailer Added!</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><strong>Name:</strong> {urlResult.retailer?.name}</p>
                      <p><strong>URL:</strong> {urlResult.retailer?.url}</p>
                      {urlResult.retailer?.emails && urlResult.retailer.emails.length > 0 && (
                        <p><strong>Emails Found:</strong> {urlResult.retailer.emails.join(", ")}</p>
                      )}
                      {urlResult.retailer?.country && (
                        <p><strong>Country:</strong> {urlResult.retailer.country}</p>
                      )}
                      <p><strong>Status:</strong> {urlResult.is_new ? "New retailer added" : "Retailer already exists (updated)"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link 
                    href="/retailers"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition text-sm"
                  >
                    View Retailers →
                  </Link>
                  <button
                    onClick={() => setUrlResult(null)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition text-sm"
                  >
                    Add Another
                  </button>
                </div>
              </div>
            )}

            {/* URL Input Form */}
            {!urlResult && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Retailer Website URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={retailerUrl}
                      onChange={(e) => setRetailerUrl(e.target.value)}
                      placeholder="https://www.example-store.com"
                      disabled={isAddingUrl}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Retailer Name <span className="text-gray-500">(optional - we'll auto-detect)</span>
                    </label>
                    <input
                      type="text"
                      value={retailerName}
                      onChange={(e) => setRetailerName(e.target.value)}
                      placeholder="Store Name"
                      disabled={isAddingUrl}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                
                <button
                  onClick={handleAddByUrl}
                  disabled={isAddingUrl || !retailerUrl.trim()}
                  className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAddingUrl ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Adding & Enriching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Retailer & Find Contacts
                    </>
                  )}
                </button>
                
                <p className="mt-4 text-sm text-gray-500 text-center">
                  We'll scrape the website to find contact emails, phone numbers, and other info
                </p>
              </div>
            )}

            {/* How URL Import Works */}
            {!urlResult && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                <h3 className="text-lg font-semibold mb-4">How it works</h3>
                <div className="space-y-4 text-gray-400">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Paste the URL</p>
                      <p className="text-sm">Enter the retailer's website URL (e.g., https://www.areboursparfums.it)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Auto-Enrichment</p>
                      <p className="text-sm">We crawl contact pages, footer, JS bundles to find emails</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Added to Database</p>
                      <p className="text-sm">Retailer is added to Airtable with all found contact info</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Email Import Mode */}
        {importMode === "email" && (
          <>
        {/* Import Success */}
        {importResults && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Import Complete!</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Found</p>
                    <p className="text-2xl font-bold text-white">{importResults.found}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Added</p>
                    <p className="text-2xl font-bold text-green-400">{importResults.added}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Skipped</p>
                    <p className="text-2xl font-bold text-yellow-400">{importResults.skipped}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/retailers"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition text-sm"
              >
                View Retailers →
              </Link>
              <button
                onClick={() => setImportResults(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition text-sm"
              >
                Import More
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Paste Email Addresses
          </label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Enter email addresses in any format:&#10;&#10;buyer@store1.com&#10;contact@store2.com, info@store3.com&#10;sales@store4.com; buyer@store5.com&#10;&#10;We support CSV, semicolon-separated, line-by-line, or mixed formats!"
            rows={12}
            disabled={isImporting || isParsing}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono text-sm"
          />
          {error && (
            <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 font-medium mb-1">Error:</p>
              <p className="text-sm text-red-300">{error}</p>
              <p className="text-xs text-red-400 mt-2">
                💡 Tip: Make sure the backend server is running. Try restarting it with:<br/>
                <code className="bg-black/50 px-2 py-1 rounded mt-1 inline-block">
                  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
                </code>
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleParse}
              disabled={isParsing || isImporting || !emailText.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isParsing ? "Parsing..." : "Preview Emails"}
            </button>
            {parsedEmails.length > 0 && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : `Import ${parsedEmails.length} Email${parsedEmails.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            We'll automatically extract emails from any text format (CSV, semicolons, line breaks, etc.)
          </p>
        </div>

        {/* Parsed Emails Preview */}
        {parsedEmails.length > 0 && !importResults && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Found {parsedEmails.length} Email{parsedEmails.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono text-sm">{email}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Click "Import" to enrich these emails with company information and add them to your database.
            </p>
          </div>
        )}

        {/* Import Results */}
        {importResults && importResults.retailers && importResults.retailers.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Imported Retailers ({importResults.retailers.length})
            </h3>
            <div className="space-y-3">
              {importResults.retailers.map((retailer: any, idx: number) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{retailer.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          retailer.status === "new" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {retailer.status === "new" ? "New" : "Existing"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>📧 {retailer.email}</p>
                        {retailer.company && <p>🏢 {retailer.company}</p>}
                        {retailer.website && (
                          <p>
                            🌐 <a href={`https://${retailer.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              {retailer.website}
                            </a>
                          </p>
                        )}
                        {retailer.location && <p>📍 {retailer.location}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it Works */}
        {!parsedEmails.length && !importResults && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h3 className="text-lg font-semibold mb-4">How it works</h3>
            <div className="space-y-4 text-gray-400">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Paste Email Addresses</p>
                  <p className="text-sm">Copy/paste emails from any source - we support all formats (CSV, semicolons, line breaks, mixed)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Preview Extraction</p>
                  <p className="text-sm">We automatically extract and validate all email addresses found in your text</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Auto-Enrichment</p>
                  <p className="text-sm">We enrich each email with company name, website, and location using Clearbit/Hunter.io</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Smart Deduplication</p>
                  <p className="text-sm">Existing retailers are preserved - we only add new ones to avoid duplicates</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>💡 Tip:</strong> This is perfect for importing lists that Alex sends you. Just paste the email addresses and we'll handle the rest!
              </p>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
