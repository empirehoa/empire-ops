import type { Metadata } from 'next'
import { Poppins, Roboto, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['500', '600'] })
const roboto = Roboto({ variable: '--font-roboto', subsets: ['latin'], weight: ['400', '500', '700'] })
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500'] })

export const metadata: Metadata = {
  title: 'Empire Ops',
  description: 'Riance LLC operations intelligence',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${roboto.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-roboto)]">{children}</body>
    </html>
  )
}
