import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'
import { getTenant } from '@/services/centros.service'

export default async function CentroInventarioPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  const tenant = await getTenant(user.tenantId)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Inventario - {tenant?.name}</h1>
      <p className="text-slate-600 mt-2">Gestiona el inventario de tu centro educativo</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold">Total Elementos</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold">Disponibles</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold">En Reparación</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
        </div>
      </div>
    </div>
  )
}
