import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function TecPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Panel TIC</h1>
      <p className="text-slate-600 mt-2">Gestiona las incidencias técnicas</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold">Incidencias Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold">Inventario</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
      </div>
    </div>
  )
}
