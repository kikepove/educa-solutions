'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, Plus, Search, CheckCircle, UserPlus, Calendar, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { GuardDuty } from '@/types/frontend'

export default function ProfesorGuardiasPage() {
  const { data: session } = useSession()
  const [guardias, setGuardias] = useState<GuardDuty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'available' | 'my' | 'substitute'>('available')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'ORDINARIA',
    notes: '',
  })

  const userId = (session?.user as any)?.id

  const loadGuardias = useCallback(async () => {
    setLoading(true)
    try {
      let params = new URLSearchParams()
      
      if (activeTab === 'my') {
        params.append('teacherId', userId)
      }
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const result = await fetchApi<{ data: GuardDuty[]; total: number }>(`/guardias${query}`)
      setGuardias(result.data || result || [])
    } catch (error) {
      console.error('Error loading guardias:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, userId])

  useEffect(() => {
    loadGuardias()
  }, [loadGuardias])

  const handleSignUp = async (guardiaId: string) => {
    if (!confirm('¿Quieres inscribirte en esta guardia?')) return
    
    try {
      await fetchApi<any>(`/guardias/${guardiaId}`, {
        method: 'PUT',
        body: JSON.stringify({ substituteId: userId }),
      })
      loadGuardias()
      toast.success('Te has inscrito en la guardia')
    } catch (error: any) {
      toast.error(error.message || 'Error al inscribirse')
    }
  }

  const handleCreate = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>('/guardias', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          teacherId: userId,
        }),
      })
      setShowModal(false)
      resetForm()
      loadGuardias()
      toast.success('Guardia registrada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar guardia')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      type: 'ORDINARIA',
      notes: '',
    })
  }

  const columns: Column<GuardDuty>[] = [
    {
      key: 'date',
      header: 'Fecha',
      render: (g) => new Date(g.date).toLocaleDateString('es-ES'),
    },
    {
      key: 'time',
      header: 'Horario',
      render: (g) => `${g.startTime} - ${g.endTime}`,
    },
    {
      key: 'teacher',
      header: 'Profesor',
      render: (g) => g.teacher ? `${g.teacher.name} ${g.teacher.surname}` : '-',
    },
    {
      key: 'substitute',
      header: 'Sustituto',
      render: (g) => g.substitute ? `${g.substitute.name} ${g.substitute.surname}` : '-',
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (g) => <Badge variant="info">{g.type}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (g) => {
        if (activeTab === 'available' && !g.substituteId) {
          return (
            <Button size="sm" onClick={() => handleSignUp(g.id)}>
              <UserPlus className="w-3 h-3" />
              Inscribirse
            </Button>
          )
        }
        return null
      },
    },
  ]

  const filteredGuardias = guardias.filter((g) => {
    if (activeTab === 'available') {
      return !g.substituteId && g.teacherId !== userId
    } else if (activeTab === 'my') {
      return g.teacherId === userId
    } else if (activeTab === 'substitute') {
      return g.substituteId === userId
    }
    return true
  }).filter((g) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      g.teacher?.name?.toLowerCase().includes(searchLower) ||
      g.teacher?.surname?.toLowerCase().includes(searchLower) ||
      g.notes?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guardias</h1>
          <p className="text-slate-500 mt-1">Gestiona tus guardias y ausencias</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Registrar Ausencia
        </Button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'available'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-1" />
          Disponibles
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          Mis Guardias
        </button>
        <button
          onClick={() => setActiveTab('substitute')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'substitute'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Cubriendo
        </button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar guardias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <Table
          data={filteredGuardias}
          columns={columns}
          keyExtractor={(g) => g.id}
          loading={loading}
          emptyMessage={
            activeTab === 'available'
              ? 'No hay guardias disponibles para cubrir'
              : activeTab === 'my'
              ? 'No has registrado ausencias'
              : 'No estás cubriendo ninguna guardia'
          }
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="Registrar Ausencia (Guardia)"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="Hora fin"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <Select
            label="Tipo"
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
            options={[
              { value: 'ORDINARIA', label: 'Ordinaria' },
              { value: 'EXTRAORDINARIA', label: 'Extraordinaria' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notas (opcional)</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Motivo de la ausencia..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Registrar Ausencia
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
