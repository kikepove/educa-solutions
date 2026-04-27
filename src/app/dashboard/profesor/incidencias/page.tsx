import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function ProfesorIncidenciasPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mis Incidencias</h1>
      <p className="text-slate-600 mt-2">Consulta y reporta incidencias</p>
      <div className="mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-slate-600">No has reportado incidencias</p>
        </div>
      </div>
    </div>
  )
}
