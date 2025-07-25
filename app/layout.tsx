import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Purge 2.0",
  description: "Rust Cloud Scripting",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const selected = localStorage.getItem('selectedTheme');
    const themes = {
      default: {
        primary: '142 76% 36%',
        secondary: '203 39% 20%',
        accent: '142 76% 46%',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #1e3a8a 45%, #1e3a8a 55%, #1e293b 80%, #0f172a 100%)'
      },
      sunset: {
        primary: '14 90% 50%',
        secondary: '30 90% 40%',
        accent: '45 100% 60%',
        gradient: 'linear-gradient(135deg, #451a03 0%, #7c2d12 18%, #ea580c 38%, #ea580c 62%, #7c2d12 82%, #451a03 100%)'
      },
      ocean: {
        primary: '198 90% 50%',
        secondary: '171 80% 40%',
        accent: '180 100% 50%',
        gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 18%, #0ea5e9 38%, #0ea5e9 62%, #0369a1 82%, #0c4a6e 100%)'
      },
      amethyst: {
        primary: '262 52% 47%',
        secondary: '292 60% 40%',
        accent: '320 70% 60%',
        gradient: 'linear-gradient(135deg, #581c87 0%, #7c3aed 18%, #a855f7 38%, #a855f7 62%, #7c3aed 82%, #581c87 100%)'
      },
      mono: {
        primary: '0 0% 50%',
        secondary: '0 0% 30%',
        accent: '0 0% 70%',
        gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 18%, #4b5563 38%, #4b5563 62%, #374151 82%, #1f2937 100%)'
      }
    };
    if (selected && themes[selected]) {
      const th = themes[selected];
      const root = document.documentElement;
      root.style.setProperty('--primary', th.primary);
      root.style.setProperty('--secondary', th.secondary);
      root.style.setProperty('--accent', th.accent);
      root.style.setProperty('--background-gradient', th.gradient);
    }
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className={inter.className} style={{ background: "var(--background-gradient)" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="purge-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
