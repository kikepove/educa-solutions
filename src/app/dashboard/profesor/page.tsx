'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, Calendar, Ticket, Search, Filter } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Table, Column } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useMutationApi } from '@/hooks/useApi'
import { fetchApi } from '@/lib/api'
import { useApp } from '@/contexts/AppContext'
import type { Schedule, GuardDuty, Reservation, Incident } from '@/types/frontend'

const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']

export default function ProfesorDashboardPage() {
  const { data: session } = useSession()
  const { addNotification } = useApp()
  const [horario, setHorario] = useState<Schedule[]>([])
  const [guardias, setGuardias] = useState<GuardDuty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [h, g] = await Promise.all([
        fetchApi<Schedule[]>('/horarios?teacherSchedule=true'),
        fetchApi<{ data: GuardDuty[] }>('/guardias'),
      ])
      setHorario(h)
      setGuardias(g.data || g)
    } catch (error) {
      console.error('Error:', error)
    } finally { setLoading(false) }
  }

  const today = days[new Date().getDay() - 1]
  const todayClasses = horario.filter(h => h.day === today)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{todayClasses.length}</p>
            <p className="text-sm text-slate-500">Clases hoy</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{guardias.filter(g => new Date(g.date) >= new Date()).length}</p>
            <p className="text-sm text-slate-500">Guardias pendientes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-slate-500">Reservas activas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-slate-500">Mis incidencias</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Horario de hoy">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando...</div>
          ) : todayClasses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay clases programadas para hoy</div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((clase) => (
                <div key={clase.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="text-center w-20">
                    <p className="text-lg font-bold text-primary-600">{clase.startTime}</p>
                    <p className="text-xs text-slate-500">{clase.endTime}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{clase.subject?.name || 'Asignatura'}</p>
                    <p className="text-sm text-slate-500">{clase.classroom?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Próximas guardias">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando...</div>
          ) : guardias.filter(g => new Date(g.date) >= new Date()).length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay guardias programadas</div>
          ) : (
            <div className="space-y-3">
              {guardias.filter(g => new Date(g.date) >= new Date()).slice(0, 5).map((guardia) => (
                <div key={guardia.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="text-center w-20">
                    <p className="text-lg font-bold text-red-600">{new Date(guardia.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</p>
                    <p className="text-xs text-slate-500">{guardia.startTime}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{guardia.type}</p>
                    <p className="text-sm text-slate-500">Sustituto: {guardia.substitute?.name || 'Por asignar'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
