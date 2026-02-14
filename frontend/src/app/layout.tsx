import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clover BI - Preguntá, no programes',
  description: 'Business Intelligence con lenguaje natural',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
