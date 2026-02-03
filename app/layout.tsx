import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ALEXMONHART Sales Agent",
  description: "B2B Sales Outreach Automation",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
