"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAirtableCampaigns, AirtableCampaign, updateCampaignDate, sendCampaignEmail, markCampaignResponded, getCampaignsCsvExportUrl } from "@/lib/api"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AirtableCampaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<AirtableCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<AirtableCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'overdue' | 'waiting'>('all')

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [filter, campaigns])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const data = await getAirtableCampaigns()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error("Failed to load campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCampaignInState = (campaignId: string, field: string, value: string) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(c => {
        if (c.id === campaignId) {
          // Map field names to campaign properties
          const fieldMap: Record<string, keyof AirtableCampaign> = {
            'sent': 'sent_timestamp',
            'followup1': 'followup1_sent_date',
            'followup2': 'followup2_sent_date',
            'followup3': 'followup3_sent_date',
          }
          const campaignField = fieldMap[field]
          if (campaignField) {
            return { ...c, [campaignField]: value }
          }
        }
        return c
      })
    )
  }

  const applyFilter = () => {
    let filtered = [...campaigns]
    
    if (filter === 'sent') {
      filtered = filtered.filter(c => c.sent_timestamp)
    } else if (filter === 'overdue') {
      filtered = filtered.filter(c => {
        if (!c.sent_timestamp) return false
        const status = calculateFollowUpStatus(c.sent_timestamp, null, null, null, null)
        return status.isOverdue
      })
    } else if (filter === 'waiting') {
      filtered = filtered.filter(c => c.sent_timestamp && !c.retailer_responded)
    }
    
    setFilteredCampaigns(filtered)
  }

  const calculateFollowUpStatus = (
    sentDate: string | null,
    followup1Date: string | null,
    followup2Date: string | null, 
    followup3Date: string | null,
    respondedDate: string | null
  ) => {
    if (!sentDate) {
      return { 
        status: 'Not Sent', 
        nextAction: 'Send initial email',
        timeRemaining: null,
        isOverdue: false,
        overdueBy: null
      }
    }

    if (respondedDate) {
      return { 
        status: 'Responded', 
        nextAction: 'Response received',
        timeRemaining: null,
        isOverdue: false,
        overdueBy: null
      }
    }

    const sent = new Date(sentDate)
    const now = new Date()
    const daysSinceSent = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))

    // Follow-up 1 (Day 7)
    if (!followup1Date) {
      const followup1Due = new Date(sent.getTime() + 7 * 24 * 60 * 60 * 1000)
      const timeUntilDue = followup1Due.getTime() - now.getTime()
      
      if (timeUntilDue > 0) {
        return {
          status: 'Initial Sent',
          nextAction: 'Follow-up 1 due',
          timeRemaining: timeUntilDue,
          isOverdue: false,
          overdueBy: null
        }
      } else {
        return {
          status: 'Follow-up 1 Overdue',
          nextAction: 'Send follow-up 1 NOW',
          timeRemaining: null,
          isOverdue: true,
          overdueBy: Math.abs(timeUntilDue)
        }
      }
    }

    // Follow-up 2 (Day 14 from initial)
    if (!followup2Date) {
      const followup2Due = new Date(sent.getTime() + 14 * 24 * 60 * 60 * 1000)
      const timeUntilDue = followup2Due.getTime() - now.getTime()
      
      if (timeUntilDue > 0) {
        return {
          status: 'Follow-up 1 Sent',
          nextAction: 'Follow-up 2 due',
          timeRemaining: timeUntilDue,
          isOverdue: false,
          overdueBy: null
        }
      } else {
        return {
          status: 'Follow-up 2 Overdue',
          nextAction: 'Send follow-up 2 NOW',
          timeRemaining: null,
          isOverdue: true,
          overdueBy: Math.abs(timeUntilDue)
        }
      }
    }

    // Follow-up 3 (Day 21 from initial)
    if (!followup3Date) {
      const followup3Due = new Date(sent.getTime() + 21 * 24 * 60 * 60 * 1000)
      const timeUntilDue = followup3Due.getTime() - now.getTime()
      
      if (timeUntilDue > 0) {
        return {
          status: 'Follow-up 2 Sent',
          nextAction: 'Follow-up 3 due',
          timeRemaining: timeUntilDue,
          isOverdue: false,
          overdueBy: null
        }
      } else {
        return {
          status: 'Follow-up 3 Overdue',
          nextAction: 'Send follow-up 3 NOW',
          timeRemaining: null,
          isOverdue: true,
          overdueBy: Math.abs(timeUntilDue)
        }
      }
    }

    return {
      status: 'All Sent',
      nextAction: 'Sequence complete',
      timeRemaining: null,
      isOverdue: false,
      overdueBy: null
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
                <Link href="/campaigns" className="text-white font-medium">Campaigns</Link>
                <Link href="/retailers" className="text-gray-400 hover:text-white transition">Retailers</Link>
                <Link href="/discovery" className="text-gray-400 hover:text-white transition">Discovery</Link>
                <Link href="/import" className="text-gray-400 hover:text-white transition">Import</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold mb-2">
              Email <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Campaigns</span>
            </h2>
            <p className="text-gray-400">Track and manage email campaigns with real-time follow-up reminders</p>
          </div>
          <a
            href={getCampaignsCsvExportUrl()}
            download="campaigns_export.csv"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            All Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'sent'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Sent ({campaigns.filter(c => c.sent_timestamp).length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'overdue'
                ? 'bg-gradient-to-r from-red-600 to-orange-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Overdue ({campaigns.filter(c => {
              if (!c.sent_timestamp) return false
              const status = calculateFollowUpStatus(c.sent_timestamp, null, null, null, null)
              return status.isOverdue
            }).length})
          </button>
          <button
            onClick={() => setFilter('waiting')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'waiting'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Waiting Response ({campaigns.filter(c => c.sent_timestamp && !c.retailer_responded).length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
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
            <p className="text-gray-400">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400 mb-4">No campaigns match this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                calculateStatus={calculateFollowUpStatus}
                onViewDetails={() => setSelectedCampaign(campaign)}
                onUpdateCampaign={updateCampaignInState}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedCampaign && (
          <CampaignModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
        )}
      </div>
    </div>
  )
}

function CampaignCard({ campaign, calculateStatus, onViewDetails, onUpdateCampaign }: any) {
  const [sentDate, setSentDate] = useState(campaign.sent_timestamp || '')
  const [followup1Date, setFollowup1Date] = useState(campaign.followup1_sent_date || '')
  const [followup2Date, setFollowup2Date] = useState(campaign.followup2_sent_date || '')
  const [followup3Date, setFollowup3Date] = useState(campaign.followup3_sent_date || '')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [, setTick] = useState(0)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<"A" | "B" | "C">("A")
  const [markingResponded, setMarkingResponded] = useState(false)

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync with parent state when campaign prop changes
  useEffect(() => {
    setSentDate(campaign.sent_timestamp || '')
    setFollowup1Date(campaign.followup1_sent_date || '')
    setFollowup2Date(campaign.followup2_sent_date || '')
    setFollowup3Date(campaign.followup3_sent_date || '')
  }, [campaign])

  const followUpStatus = calculateStatus(sentDate, followup1Date, followup2Date, followup3Date, campaign.retailer_responded ? new Date().toISOString() : null)
  
  const saveDate = async (field: string, value: string) => {
    if (!value) {
      alert('Please select a date and time')
      return
    }
    
    setSaving(true)
    try {
      await updateCampaignDate(campaign.id, field, value)
      console.log(`✅ Saved ${field}:`, value)
      
      // Update parent state (no reload!)
      onUpdateCampaign(campaign.id, field, value)
      
      setEditingField(null)
    } catch (error) {
      console.error(`Failed to save ${field}:`, error)
      alert(`Failed to save date: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    if (!campaign.retailer_email) {
      alert('No email address found for this retailer. Please add contact email first.')
      return
    }

    setSendingEmail(true)
    try {
      const result = await sendCampaignEmail({
        campaign_id: campaign.id,
        variation: selectedVariant,
        from_email: "alex@alexmonhart.com",
        from_name: "Alex Monhart"
      })
      
      alert(`✅ Email sent successfully!\n\nTo: ${result.sent_to}\nSubject: ${result.subject}\n\nEmail ID: ${result.email_id}`)
      setShowSendDialog(false)
      
      // Reload campaigns to get updated data
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to send email:', error)
      alert(`❌ Failed to send email: ${error.message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  const handleMarkResponded = async () => {
    if (!confirm('Mark this campaign as responded?')) return

    setMarkingResponded(true)
    try {
      await markCampaignResponded(campaign.id)
      alert('✅ Campaign marked as responded!')
      
      // Reload campaigns to get updated data
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to mark as responded:', error)
      alert(`❌ Failed to mark as responded: ${error.message}`)
    } finally {
      setMarkingResponded(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-semibold mb-2">{campaign.retailer_name}</h3>
          <p className="text-gray-400 text-sm">{campaign.retailer_country} • {campaign.brand_name}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-1 rounded-full text-sm font-medium ${
            sentDate
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {sentDate ? 'Initial Sent' : 'Draft'}
          </span>
          {campaign.retailer_responded && (
            <span className="px-4 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Responded
            </span>
          )}
        </div>
      </div>

      {/* Tracking Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
        <h4 className="font-semibold mb-3">Campaign Tracking</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Initial Email Sent Date */}
          <DateField
            label="Initial Email Sent"
            value={sentDate}
            isEditing={editingField === 'sent'}
            isSaving={saving}
            onEdit={() => setEditingField('sent')}
            onChange={setSentDate}
            onSave={() => saveDate('sent', sentDate)}
            onCancel={() => setEditingField(null)}
          />

          {/* Follow-up 1 Date */}
          {sentDate && (
            <DateField
              label="Follow-up 1 Sent (Day 7)"
              value={followup1Date}
              isEditing={editingField === 'followup1'}
              isSaving={saving}
              onEdit={() => setEditingField('followup1')}
              onChange={setFollowup1Date}
              onSave={() => saveDate('followup1', followup1Date)}
              onCancel={() => setEditingField(null)}
            />
          )}

          {/* Follow-up 2 Date */}
          {followup1Date && (
            <DateField
              label="Follow-up 2 Sent (Day 14)"
              value={followup2Date}
              isEditing={editingField === 'followup2'}
              isSaving={saving}
              onEdit={() => setEditingField('followup2')}
              onChange={setFollowup2Date}
              onSave={() => saveDate('followup2', followup2Date)}
              onCancel={() => setEditingField(null)}
            />
          )}

          {/* Follow-up 3 Date */}
          {followup2Date && (
            <DateField
              label="Follow-up 3 Sent (Day 21)"
              value={followup3Date}
              isEditing={editingField === 'followup3'}
              isSaving={saving}
              onEdit={() => setEditingField('followup3')}
              onChange={setFollowup3Date}
              onSave={() => saveDate('followup3', followup3Date)}
              onCancel={() => setEditingField(null)}
            />
          )}
        </div>

        {/* Status and Countdown */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  followUpStatus.status === 'Responded' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : followUpStatus.isOverdue
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : followUpStatus.status === 'Initial Sent'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {followUpStatus.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">{followUpStatus.nextAction}</p>
            </div>
            
            {/* Live Countdown */}
            {(followUpStatus.timeRemaining || followUpStatus.overdueBy) && (
              <div className="text-right">
                <CountdownTimer 
                  milliseconds={followUpStatus.timeRemaining || followUpStatus.overdueBy} 
                  isOverdue={followUpStatus.isOverdue}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retailer Notes */}
      {campaign.retailer_notes && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Retailer Notes</h4>
          <p className="text-sm text-gray-300">{campaign.retailer_notes}</p>
        </div>
      )}

      {/* Email Variations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <EmailVariationPreview 
          variant="A" 
          email={campaign.intro_email_a}
          gradient="from-blue-500 to-cyan-500"
        />
        <EmailVariationPreview 
          variant="B" 
          email={campaign.intro_email_b}
          gradient="from-purple-500 to-pink-500"
        />
        <EmailVariationPreview 
          variant="C" 
          email={campaign.intro_email_c}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <button
          onClick={() => setShowSendDialog(true)}
          disabled={!campaign.retailer_email || sendingEmail}
          className="py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingEmail ? 'Sending...' : '📧 Send Email'}
        </button>

        <button
          onClick={handleMarkResponded}
          disabled={campaign.retailer_responded || markingResponded}
          className="py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {markingResponded ? 'Updating...' : campaign.retailer_responded ? '✅ Responded' : '✓ Mark Responded'}
        </button>

        <button
          onClick={onViewDetails}
          className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm font-medium"
        >
          View Full Campaign →
        </button>
      </div>

      {/* Send Email Dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSendDialog(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Send Email</h3>
            <p className="text-gray-400 mb-4">
              To: <span className="text-white font-medium">{campaign.retailer_email}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Choose Email Variant:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['A', 'B', 'C'] as const).map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setSelectedVariant(variant)}
                    className={`py-2 px-4 rounded-lg font-medium transition ${
                      selectedVariant === variant
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    Variant {variant}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition disabled:opacity-50"
              >
                {sendingEmail ? 'Sending...' : 'Send Now'}
              </button>
              <button
                onClick={() => setShowSendDialog(false)}
                disabled={sendingEmail}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DateField({ label, value, isEditing, isSaving, onEdit, onChange, onSave, onCancel }: any) {
  // Parse existing value or set to current date/time
  const getInitialDateTime = () => {
    if (value) {
      const d = new Date(value);
      return {
        year: d.getFullYear().toString(),
        month: (d.getMonth() + 1).toString().padStart(2, '0'),
        day: d.getDate().toString().padStart(2, '0'),
        hour: d.getHours().toString().padStart(2, '0'),
        minute: d.getMinutes().toString().padStart(2, '0')
      };
    }
    const now = new Date();
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      hour: now.getHours().toString().padStart(2, '0'),
      minute: now.getMinutes().toString().padStart(2, '0')
    };
  };

  const [dateTime, setDateTime] = useState(getInitialDateTime);

  const updateDateTime = (field: string, val: string) => {
    // Only allow numbers
    const numericValue = val.replace(/\D/g, '');
    const newDateTime = { ...dateTime, [field]: numericValue };
    setDateTime(newDateTime);
    
    // Construct ISO string with padded values for the ISO format
    const paddedMonth = newDateTime.month.padStart(2, '0');
    const paddedDay = newDateTime.day.padStart(2, '0');
    const paddedHour = newDateTime.hour.padStart(2, '0');
    const paddedMinute = newDateTime.minute.padStart(2, '0');
    
    const isoString = `${newDateTime.year}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinute}:00.000Z`;
    onChange(isoString);
  };

  const handleSave = () => {
    // Validate date
    const { year, month, day, hour, minute } = dateTime;
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    const h = parseInt(hour);
    const min = parseInt(minute);
    
    if (!year || !month || !day || !hour || !minute) {
      alert('Please fill in all date/time fields');
      return;
    }
    if (y < 2020 || y > 2030) {
      alert('Please enter a valid year (2020-2030)');
      return;
    }
    if (m < 1 || m > 12) {
      alert('Please enter a valid month (01-12)');
      return;
    }
    if (d < 1 || d > 31) {
      alert('Please enter a valid day (01-31)');
      return;
    }
    if (h < 0 || h > 23) {
      alert('Please enter a valid hour (00-23)');
      return;
    }
    if (min < 0 || min > 59) {
      alert('Please enter a valid minute (00-59)');
      return;
    }
    
    onSave();
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      {isEditing ? (
        <div className="space-y-2">
          {/* Date Input */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="YYYY"
              value={dateTime.year}
              onChange={(e) => updateDateTime('year', e.target.value)}
              disabled={isSaving}
              maxLength={4}
              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-center"
            />
            <span className="text-gray-500">/</span>
            <input
              type="text"
              placeholder="MM"
              value={dateTime.month}
              onChange={(e) => updateDateTime('month', e.target.value)}
              disabled={isSaving}
              maxLength={2}
              className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-center"
            />
            <span className="text-gray-500">/</span>
            <input
              type="text"
              placeholder="DD"
              value={dateTime.day}
              onChange={(e) => updateDateTime('day', e.target.value)}
              disabled={isSaving}
              maxLength={2}
              className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-center"
            />
            <span className="text-gray-500 mx-2">at</span>
            <input
              type="text"
              placeholder="HH"
              value={dateTime.hour}
              onChange={(e) => updateDateTime('hour', e.target.value)}
              disabled={isSaving}
              maxLength={2}
              className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-center"
            />
            <span className="text-gray-500">:</span>
            <input
              type="text"
              placeholder="MM"
              value={dateTime.minute}
              onChange={(e) => updateDateTime('minute', e.target.value)}
              disabled={isSaving}
              maxLength={2}
              className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-center"
            />
          </div>
          <p className="text-xs text-gray-500">Format: YYYY/MM/DD at HH:MM (24-hour time)</p>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-3 py-2 bg-blue-600 rounded text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={onCancel} 
              disabled={isSaving}
              className="px-4 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {value ? new Date(value).toLocaleString() : 'Not sent'}
          </span>
          <button onClick={onEdit} className="text-xs text-blue-400 hover:text-blue-300">
            {value ? 'Edit' : 'Set Date'}
          </button>
        </div>
      )}
    </div>
  )
}

function CountdownTimer({ milliseconds, isOverdue }: { milliseconds: number; isOverdue: boolean }) {
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

  return (
    <div className="text-right">
      <div className={`text-3xl font-bold mb-1 ${
        isOverdue 
          ? 'text-red-400' 
          : 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
      }`}>
        {days > 0 && `${days}d `}
        {hours}h {minutes}m {seconds}s
      </div>
      <div className="text-xs text-gray-400">
        {isOverdue ? 'OVERDUE' : 'remaining'}
      </div>
    </div>
  )
}

function EmailVariationPreview({ variant, email, gradient }: { variant: string; email: string; gradient: string }) {
  const lines = email?.split('\n') || []
  const subject = lines[0]?.replace('Subject: ', '') || ''
  const body = lines.slice(2).join('\n').slice(0, 150)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className={`text-sm font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        Variation {variant}
      </div>
      <p className="text-xs text-gray-500 mb-1">Subject:</p>
      <p className="text-sm font-medium mb-3 line-clamp-2">{subject}</p>
      <p className="text-xs text-gray-400 line-clamp-3">{body}...</p>
    </div>
  )
}

function CampaignModal({ campaign, onClose }: { campaign: AirtableCampaign; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'intro' | 'followups'>('intro')

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{campaign.retailer_name}</h2>
              <p className="text-gray-400">{campaign.retailer_country} • {campaign.brand_name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">×</button>
          </div>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('intro')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'intro' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Intro Emails (3)
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'followups' 
                ? 'text-white border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Follow-ups (3)
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'intro' ? (
            <div className="space-y-6">
              <EmailFull email={campaign.intro_email_a} title="Variation A" gradient="from-blue-500 to-cyan-500" />
              <EmailFull email={campaign.intro_email_b} title="Variation B" gradient="from-purple-500 to-pink-500" />
              <EmailFull email={campaign.intro_email_c} title="Variation C" gradient="from-green-500 to-emerald-500" />
            </div>
          ) : (
            <div className="space-y-6">
              <EmailFull email={campaign.followup_1} title="Follow-up 1 (Day 7)" gradient="from-orange-500 to-red-500" />
              <EmailFull email={campaign.followup_2} title="Follow-up 2 (Day 14)" gradient="from-pink-500 to-rose-500" />
              <EmailFull email={campaign.followup_3} title="Follow-up 3 (Day 21)" gradient="from-violet-500 to-purple-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmailFull({ email, title, gradient }: { email: string; title: string; gradient: string }) {
  const lines = email?.split('\n') || []
  const subject = lines[0]?.replace('Subject: ', '') || ''
  const body = lines.slice(2).join('\n')
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <div className={`font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{title}</div>
        <button onClick={copyEmail} className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">Subject:</p>
        <p className="font-semibold mb-4">{subject}</p>
        <p className="text-xs text-gray-500 mb-1">Body:</p>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{body}</pre>
      </div>
    </div>
  )
}
