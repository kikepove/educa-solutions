'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Plus, Search, Upload, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Alert } from '@/components/ui/Alert'
import { FileUpload } from '@/components/ui/FileUpload'
import { useMutationApi } from '@/hooks/useApi'
import { fetchApi } from '@/lib/api'
import { useApp } from '@/contexts/AppContext'
import type { Teacher, CSVImportResult } from '@/types/frontend'

export default function ProfesoresPage() {
  const { addNotification } = useApp()
  const [profesores, setProfesores] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [formData, setFormData] = useState({ name: '', surname: '', email: '', phone: '', department: '' })

  const { mutate: createProfesor } = useMutationApi(
    (data: typeof formData) => fetchApi('/profesores', { method: 'POST', body: JSON.stringify(data) })
  )

  const { mutate: importCSV } = useMutationApi(
    (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return fetch('/api/v1/csv?type=profesores', {
        method: 'POST',
        body: formData,
      }).then(r => r.json())
    }
  )

  useEffect(() => { loadProfesores() }, [])

  const loadProfesores = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Teacher[]>('/profesores')
      setProfesores(data)
    } catch (error) {
      console.error('Error:', error)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createProfesor(formData)
      setShowModal(false)
      setFormData({ name: '', surname: '', email: '', phone: '', department: '' })
      loadProfesores()
      addNotification({ type: 'success', message: 'Profesor creado correctamente' })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setCsvFile(null)
      setCsvPreview([])
      setCsvErrors([])
      return
    }
    setCsvFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        setCsvErrors(['El archivo está vacío o no tiene datos'])
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const required = ['name', 'surname', 'email']
      const missing = required.filter(r => !headers.includes(r))
      
      if (missing.length > 0) {
        setCsvErrors([`Faltan columnas requeridas: ${missing.join(', ')}`])
        return
      }
      
      const data = lines.slice(1, 11).map((line, i) => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((h, idx) => { obj[h] = values[idx] || '' })
        obj._row = i + 2
        return obj
      })
      
      setCsvPreview(data)
      setCsvErrors([])
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvFile) return
    setImporting(true)
    try {
      const result = await importCSV(csvFile)
      setShowCSVModal(false)
      setCsvFile(null)
      setCsvPreview([])
      loadProfesores()
      addNotification({ 
        type: result.success > 0 ? 'success' : 'error', 
        message: `Importados ${result.success} de ${result.total} registros${result.errors.length > 0 ? `. Errores: ${result.errors.length}` : ''}` 
      })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    } finally {
      setImporting(false)
    }
  }

  const columns: Column<Teacher>[] = [
    { key: 'code', header: 'Código', render: (p) => <code className="text-xs bg-slate-100 px-2 py-1 rounded">{p.code}</code> },
    { key: 'name', header: 'Nombre', render: (p) => <span className="font-medium">{p.name} {p.surname}</span> },
    { key: 'email', header: 'Email', render: (p) => <span className="text-slate-600">{p.email}</span> },
    { key: 'phone', header: 'Teléfono', render: (p) => p.phone || '-' },
    { key: 'department', header: 'Departamento', render: (p) => p.department || '-' },
    { key: 'status', header: 'Estado', render: (p) => <Badge variant={p.isActive ? 'success' : 'error'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const filteredProfesores = profesores.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.surname.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profesores</h1>
          <p className="text-slate-500 mt-1">Gestiona los profesores del centro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCSVModal(true)}>
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Nuevo profesor
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input placeholder="Buscar profesores..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          </div>
          <div className="text-sm text-slate-500">
            Total: {profesores.length} profesores
          </div>
        </div>
        <Table 
          data={filteredProfesores} 
          columns={columns} 
          keyExtractor={(p) => p.id} 
          loading={loading} 
          emptyMessage="No hay profesores. Importa desde CSV o crea uno manualmente." 
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Profesor" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="profesor@centro.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" placeholder="Juan" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Input label="Apellidos" placeholder="García López" value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" placeholder="600 000 000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <Input label="Departamento" placeholder="Matemáticas" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.surname || !formData.email}>Crear profesor</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCSVModal} onClose={() => { setShowCSVModal(false); setCsvFile(null); setCsvPreview([]); setCsvErrors([]) }} title="Importar Profesores desde CSV" size="lg">
        <div className="space-y-4">
          <Alert variant="warning">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Importación de profesores</p>
                <p className="text-sm mt-1">El archivo CSV debe contener las columnas: name, surname, email (requeridos), phone, department (opcionales)</p>
              </div>
            </div>
          </Alert>
          
          <FileUpload accept=".csv" label="Subir archivo CSV de profesores" onFileSelect={handleFileSelect} />

          {csvErrors.length > 0 && (
            <Alert variant="error">
              {csvErrors.map((err, i) => <p key={i}>{err}</p>)}
            </Alert>
          )}

          {csvPreview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Vista previa (primeros 10 registros):</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Fila</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Nombre</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Apellidos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {csvPreview.map((row) => (
                      <tr key={row._row} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{row._row}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.surname}</td>
                        <td className="px-3 py-2">{row.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowCSVModal(false); setCsvFile(null); setCsvPreview([]); setCsvErrors([]) }}>Cancelar</Button>
            <Button onClick={handleImport} loading={importing} disabled={!csvFile || csvErrors.length > 0}>
              <CheckCircle className="w-4 h-4" />
              Importar {csvPreview.length > 0 ? `${csvPreview.length} registros` : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
