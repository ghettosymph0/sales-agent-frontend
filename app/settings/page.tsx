"use client"

import { useState, useEffect } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface EmailSettings {
  configured: boolean
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  from_email: string | null
  from_name: string | null
  use_ssl: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Form state
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPassword, setSmtpPassword] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("Adam Hanula")
  const [useSsl, setUseSsl] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/email`)
      const data = await res.json()
      setSettings(data)
      
      // Pre-fill form if configured
      if (data.configured) {
        setSmtpHost(data.smtp_host || "")
        setSmtpPort(data.smtp_port || 587)
        setSmtpUser(data.smtp_user || "")
        setFromEmail(data.from_email || "")
        setFromName(data.from_name || "Adam Hanula")
        setUseSsl(data.use_ssl || false)
      }
    } catch (error) {
      console.error("Failed to fetch email settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch(`${API_BASE}/api/settings/email/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser,
          smtp_password: smtpPassword,
          from_email: fromEmail,
          from_name: fromName,
          use_ssl: useSsl
        })
      })
      const data = await res.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, message: "Failed to test connection" })
    } finally {
      setTesting(false)
    }
  }

  const sendTestEmail = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch(`${API_BASE}/api/settings/email/test-send?test_email=${fromEmail}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser,
          smtp_password: smtpPassword,
          from_email: fromEmail,
          from_name: fromName,
          use_ssl: useSsl
        })
      })
      const data = await res.json()
      setTestResult({ 
        success: data.success, 
        message: data.success ? `Test email sent to ${data.sent_to}` : data.message 
      })
    } catch (error) {
      setTestResult({ success: false, message: "Failed to send test email" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
        <p className="text-gray-600 mb-4">
          Configure your SMTP settings to send campaigns directly from your email account.
        </p>

        {settings?.configured && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700">Email is configured and ready to send!</span>
          </div>
        )}

        <div className="space-y-4">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Host
            </label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="mail.yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your email provider&apos;s SMTP server address
            </p>
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Port
            </label>
            <select
              value={smtpPort}
              onChange={(e) => {
                const port = parseInt(e.target.value)
                setSmtpPort(port)
                setUseSsl(port === 465)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={587}>587 (STARTTLS - Recommended)</option>
              <option value={465}>465 (SSL/TLS)</option>
              <option value={25}>25 (No encryption - Not recommended)</option>
            </select>
          </div>

          {/* SMTP User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Username
            </label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="adam@alexmonhart.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Password
            </label>
            <input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="Your email password or app password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is stored securely as an environment variable
            </p>
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Email
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="adam@alexmonhart.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Name
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Adam Hanula"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              {testResult.message}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={testConnection}
            disabled={testing || !smtpHost || !smtpUser || !smtpPassword}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          
          <button
            onClick={sendTestEmail}
            disabled={testing || !smtpHost || !smtpUser || !smtpPassword || !fromEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? "Sending..." : "Send Test Email"}
          </button>
        </div>

        {/* Environment Variables Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Railway Environment Variables</h3>
          <p className="text-sm text-gray-600 mb-2">
            To make these settings permanent, add these environment variables to your Railway backend:
          </p>
          <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`SMTP_HOST=${smtpHost || 'mail.yourdomain.com'}
SMTP_PORT=${smtpPort}
SMTP_USER=${smtpUser || 'your@email.com'}
SMTP_PASSWORD=your_password
FROM_EMAIL=${fromEmail || 'your@email.com'}
FROM_NAME=${fromName || 'Adam Hanula'}
SMTP_USE_SSL=${useSsl ? 'true' : 'false'}`}
          </pre>
        </div>
      </div>

      {/* Brandbook & Order Form Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Attachment Links</h2>
        <p className="text-gray-600 mb-4">
          Google Drive links for brandbook and order form (included in campaign emails).
        </p>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Coming soon: Configure brandbook and order form links here.
            <br />
            For now, update these in the backend config file.
          </p>
        </div>
      </div>
    </div>
  )
}
