import './globals.css'
import { Inter } from 'next/font/google'
import PWAInstaller from './components/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Cevheri',
  description: 'Cevheri drone control system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
