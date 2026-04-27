import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function ProfesorReservasPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mis Reservas</h1>
      <p className="text-slate-600 mt-2">Consulta y gestiona tus reservas de aulas</p>
      <div className="mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-slate-600">No tienes reservas activas</p>
        </div>
      </div>
    </div>
  )
}
