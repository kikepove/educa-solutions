import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function AdminTecnicosPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Gestión de Técnicos</h1>
      <p className="text-slate-600 mt-2">Administra los técnicos del centro</p>
      <div className="mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-slate-600">No hay técnicos registrados</p>
        </div>
      </div>
    </div>
  )
}
