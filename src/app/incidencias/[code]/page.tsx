'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Ticket, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'

export default function PublicIncidenciasPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIA',
    category: 'OTRO',
    location: '',
  })

  useEffect(() => {
    if (code) {
      loadTenant()
    }
  }, [code])

  const loadTenant = async () => {
    try {
      const data = await fetchApi<{ id: string; name: string }>(`/public/centros/${code}`)
      setTenant(data)
    } catch (error: any) {
      console.error('Error loading tenant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description) {
      toast.error('El título y la descripción son obligatorios')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>(`/public/incidencias/${code}`, {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setSuccess(true)
      toast.success('Incidencia enviada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar incidencia')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Cargando...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Centro no encontrado</h2>
          <p className="text-slate-600">
            El código QR no es válido o el centro no está disponible.
          </p>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">¡Incidencia Enviada!</h2>
          <p className="text-slate-600 mb-6">
            Tu incidencia ha sido registrada correctamente. El equipo del centro la revisará pronto.
          </p>
          <Button onClick={() => {
            setSuccess(false)
            setFormData({
              title: '',
              description: '',
              priority: 'MEDIA',
              category: 'OTRO',
              location: '',
            })
          }}>
            Enviar otra incidencia
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reportar Incidencia</h1>
          <p className="text-slate-600 mt-2">Centro: {tenant.name}</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert variant="info">
              <p className="text-sm">
                Esta es una página pública. No necesitas iniciar sesión para reportar una incidencia.
              </p>
            </Alert>

            <Input
              label="Título"
              placeholder="Describe brevemente el problema"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Describe detalladamente la incidencia..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Prioridad"
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value })}
                options={[
                  { value: 'BAJA', label: 'Baja' },
                  { value: 'MEDIA', label: 'Media' },
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'CRITICA', label: 'Crítica' },
                ]}
              />
              <Select
                label="Categoría"
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={[
                  { value: 'HARDWARE', label: 'Hardware' },
                  { value: 'SOFTWARE', label: 'Software' },
                  { value: 'RED', label: 'Red' },
                  { value: 'AULA', label: 'Aula' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
              />
            </div>

            <Input
              label="Ubicación (opcional)"
              placeholder="Ej: 2ª planta, biblioteca..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            <Button type="submit" className="w-full" size="lg" loading={saving}>
              <Send className="w-4 h-4" />
              Enviar Incidencia
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          Powered by Educa Solutions
        </p>
      </div>
    </div>
  )
}
