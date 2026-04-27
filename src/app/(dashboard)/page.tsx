'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Building2, Users, Package, Wrench, Ticket, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role
      switch (role) {
        case 'ADMIN':
          router.push('/dashboard/admin/centros')
          break
        case 'DIRECTOR':
        case 'TIC':
          router.push('/dashboard/centro')
          break
        case 'TECNICO':
          router.push('/dashboard/tic')
          break
        case 'PROFESOR':
        default:
          router.push('/dashboard/profesor')
      }
    }
  }, [status, session, router])

  return null
}