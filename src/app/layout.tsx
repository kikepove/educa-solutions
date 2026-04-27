import type { Metadata } from 'next'
import { Providers } from './providers'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Educasolutions - Gestión de Centros Educativos',
  description: 'Plataforma SaaS para la gestión de centros educativos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}