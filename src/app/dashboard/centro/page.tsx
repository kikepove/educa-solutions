'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { LayoutDashboard, Ticket, Package, Calendar, Clock, Users, DoorOpen, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function CentroDashboardPage() {
  const { data: session } = useSession()
  const { addNotification } = useApp()
  const router = useRouter()
  const role = (session?.user as any)?.role

  useEffect(() => {
    if (role && role !== 'DIRECTOR' && role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [role, router])

  const stats = [
    { label: 'Incidencias abiertas', value: 12, icon: Ticket, color: 'bg-blue-500' },
    { label: 'Inventario', value: 156, icon: Package, color: 'bg-green-500' },
    { label: 'Reservas hoy', value: 8, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Profesores', value: 45, icon: Users, color: 'bg-orange-500' },
  ]

  const menuItems = [
    { label: 'Aulas', href: '/dashboard/centro/aulas', icon: DoorOpen },
    { label: 'Profesores', href: '/dashboard/centro/profesores', icon: Users },
    { label: 'Inventario', href: '/dashboard/centro/inventario', icon: Package },
    { label: 'Horarios', href: '/dashboard/centro/horarios', icon: Clock },
    { label: 'Reservas', href: '/dashboard/centro/reservas', icon: Calendar },
    { label: 'Incidencias', href: '/dashboard/centro/incidencias', icon: Ticket },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card title="Accesos rápidos">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer">
                    <item.icon className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card title="Información del centro">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Centro</span>
                <span className="font-medium">{(session?.user as any)?.tenantName || 'Mi Centro'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium text-green-600">Profesional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado</span>
                <span className="badge-success">Activo</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
