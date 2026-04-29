'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Search, Filter, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { InventoryItem, Classroom } from '@/types/frontend'

export default function CentroInventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serialNumber: '',
    assetTag: '',
    category: '',
    status: 'DISPONIBLE',
    purchaseDate: '',
    warrantyEnd: '',
    location: '',
    classroomId: '',
  })

  useEffect(() => {
    loadItems()
    loadClassrooms()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterCategory) params.append('category', filterCategory)
      if (filterStatus) params.append('status', filterStatus)
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const result = await fetchApi<{ data: InventoryItem[]; total: number }>(`/inventario${query}`)
      setItems(result.data || result || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClassrooms = async () => {
    try {
      const data = await fetchApi<Classroom[]>('/aulas')
      setClassrooms(data)
    } catch (error) {
      console.error('Error loading classrooms:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.category) {
      toast.error('El nombre y la categoría son obligatorios')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>('/inventario', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          purchaseDate: formData.purchaseDate || undefined,
          warrantyEnd: formData.warrantyEnd || undefined,
        }),
      })
      setShowModal(false)
      resetForm()
      loadItems()
      toast.success('Elemento creado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear elemento')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedItem) return

    setSaving(true)
    try {
      await fetchApi<any>(`/inventario/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      setShowModal(false)
      setSelectedItem(null)
      resetForm()
      loadItems()
      toast.success('Elemento actualizado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar elemento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return

    try {
      await fetchApi<any>(`/inventario/${id}`, { method: 'DELETE' })
      loadItems()
      toast.success('Elemento eliminado')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    }
  }

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name || '',
      description: item.description || '',
      serialNumber: item.serialNumber || '',
      assetTag: item.assetTag || '',
      category: item.category || '',
      status: item.status || 'DISPONIBLE',
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
      warrantyEnd: item.warrantyEnd ? new Date(item.warrantyEnd).toISOString().split('T')[0] : '',
      location: item.location || '',
      classroomId: item.classroomId || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serialNumber: '',
      assetTag: '',
      category: '',
      status: 'DISPONIBLE',
      purchaseDate: '',
      warrantyEnd: '',
      location: '',
      classroomId: '',
    })
  }

  const columns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <div>
          <p className="font-medium">{item.name}</p>
          {item.serialNumber && <p className="text-xs text-slate-500">{item.serialNumber}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (item) => <Badge variant="info">{item.category}</Badge>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
          'DISPONIBLE': 'success',
          'EN_USO': 'info',
          'EN_REPARACION': 'warning',
          'BAJA': 'error',
        }
        return <Badge variant={colors[item.status] || 'neutral'}>{item.status}</Badge>
      },
    },
    {
      key: 'classroom',
      header: 'Ubicación',
      render: (item) => item.classroom?.name || item.location || '-',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(item)} className="p-1 hover:bg-slate-100 rounded">
            <Eye className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-slate-100 rounded">
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ]

  const filteredItems = items.filter((item) => {
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !filterCategory || item.category === filterCategory
    const matchesStatus = !filterStatus || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = [
    { label: 'Total', value: items.length, icon: Package, color: 'bg-slate-500' },
    { label: 'Disponibles', value: items.filter(i => i.status === 'DISPONIBLE').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'En uso', value: items.filter(i => i.status === 'EN_USO').length, icon: Package, color: 'bg-blue-500' },
    { label: 'En reparación', value: items.filter(i => i.status === 'EN_REPARACION').length, icon: AlertTriangle, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona los elementos del centro</p>
        </div>
        <Button onClick={() => { resetForm(); setSelectedItem(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo Elemento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nombre o número de serie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: '', label: 'Todas las categorías' },
              ...Array.from(new Set(items.map(i => i.category))).map(cat => ({ value: cat, label: cat })),
            ]}
            className="w-48"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'DISPONIBLE', label: 'Disponible' },
              { value: 'EN_USO', label: 'En uso' },
              { value: 'EN_REPARACION', label: 'En reparación' },
              { value: 'BAJA', label: 'Baja' },
            ]}
            className="w-48"
          />
          <Button variant="outline" onClick={loadItems}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredItems}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="No hay elementos en el inventario"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedItem(null); resetForm() }}
        title={selectedItem ? 'Editar Elemento' : 'Nuevo Elemento'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Ej: Portátil Dell"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Categoría"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: 'Selecciona categoría' },
                { value: 'Ordenador', label: 'Ordenador' },
                { value: 'Portátil', label: 'Portátil' },
                { value: 'Proyector', label: 'Proyector' },
                { value: 'Tablet', label: 'Tablet' },
                { value: 'Impresora', label: 'Impresora' },
                { value: 'Otro', label: 'Otro' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número de serie"
              placeholder="SN123456"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
            <Input
              label="Etiqueta de activo"
              placeholder="AST-001"
              value={formData.assetTag}
              onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'DISPONIBLE', label: 'Disponible' },
                { value: 'EN_USO', label: 'En uso' },
                { value: 'EN_REPARACION', label: 'En reparación' },
                { value: 'BAJA', label: 'Baja' },
              ]}
            />
            <Select
              label="Aula (opcional)"
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              options={[
                { value: '', label: 'Ninguna' },
                ...classrooms.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Input
            label="Ubicación (opcional)"
            placeholder="Ej: 2ª planta, despacho..."
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha compra (opcional)"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
            <Input
              label="Garantía hasta (opcional)"
              type="date"
              value={formData.warrantyEnd}
              onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Detalles del elemento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); setSelectedItem(null); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={selectedItem ? handleUpdate : handleCreate} loading={saving}>
              {selectedItem ? 'Actualizar' : 'Crear Elemento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
