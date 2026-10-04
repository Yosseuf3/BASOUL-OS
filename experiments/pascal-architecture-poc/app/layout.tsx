import type { ReactNode } from 'react'
import './styles.css'

export const metadata = {
  title: 'BASOUL Architecture PoC',
  description: 'Isolated Pascal integration proof of concept for BASOUL.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
