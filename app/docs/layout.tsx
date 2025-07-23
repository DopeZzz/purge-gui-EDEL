import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Purge Docs',
  description: 'Purge 2.0 Documentation',
}

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="h-full">{children}</div>
}
