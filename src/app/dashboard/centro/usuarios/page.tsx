'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Pencil, Trash2, RefreshCw, UserCog } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { User } from '@prisma/client'

interface UserWithDetails extends User {
  tenant?: { id: string; name: string }
}

export default function CentroUsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<UserWithDetails[]>('/usuarios')
      // Filtrar solo usuarios TIC del centro
      const ticUsers = data.filter(u => u.role === 'TIC')
      setUsers(ticUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.surname || !formData.email || !formData.password) {
      toast.error('Completa todos los campos')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          role: 'TIC',
          tenantId: session?.user?.tenantId,
        })
      })
      setShowModal(false)
      resetForm()
      loadUsers()
      toast.success('Usuario TIC creado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (user: UserWithDetails) => {
    if (!confirm(`¿Resetear la contraseña de ${user.name} ${user.surname}?`)) return
    
    try {
      const tempPassword = await fetchApi<{ temporaryPassword: string }>(`/usuarios/${user.id}/reset-password`, {
        method: 'POST',
      })
      toast.success(`Contraseña reseteada: ${tempPassword.temporaryPassword}`)
    } catch (error: any) {
      toast.error(error.message || 'Error al resetear contraseña')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetchApi<any>(`/usuarios/${selectedUser?.id}`, { method: 'DELETE' })
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers()
      toast.success('Usuario eliminado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', surname: '', email: '', password: '' })
  }

  const openEditModal = (user: UserWithDetails) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || '',
      surname: user.surname || '',
      email: user.email || '',
      password: '',
    })
    setShowModal(true)
  }

  const columns: Column<UserWithDetails>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (u) => <span className="font-medium">{u.name} {u.surname}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-slate-500">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (u) => <Badge variant="info">{u.role}</Badge>,
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'error'}>
          {u.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (u) => (
        <div className="flex gap-2">
          <button onClick={() => handleResetPassword(u)} className="p-1 hover:bg-slate-100 rounded" title="Resetear contraseña">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => openEditModal(u)} className="p-1 hover:bg-slate-100 rounded" title="Editar">
            <Pencil className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true) }} className="p-1 hover:bg-slate-100 rounded" title="Eliminar">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ]

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.surname?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios TIC</h1>
          <p className="text-slate-500 mt-1">Gestiona los usuarios TIC del centro</p>
        </div>
        <Button onClick={() => { resetForm(); setSelectedUser(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo TIC
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredUsers}
          columns={columns}
          keyExtractor={(u) => u.id}
          loading={loading}
          emptyMessage="No hay usuarios TIC registrados"
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedUser(null); resetForm() }} 
        title={selectedUser ? 'Editar Usuario TIC' : 'Nuevo Usuario TIC'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Juan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Apellidos"
              placeholder="Pérez"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="tic@centro.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={selectedUser ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>Cancelar</Button>
            <Button onClick={handleCreate} loading={saving}>
              {selectedUser ? 'Actualizar' : 'Crear Usuario TIC'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p>¿Estás seguro de eliminar al usuario <strong>{selectedUser?.name} {selectedUser?.surname}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
