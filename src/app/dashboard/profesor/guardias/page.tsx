import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function ProfesorGuardiasPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mis Guardias</h1>
      <p className="text-slate-600 mt-2">Consulta y gestiona tus guardias</p>
      <div className="mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-slate-600">No tienes guardias asignadas</p>
        </div>
      </div>
    </div>
  )
}
