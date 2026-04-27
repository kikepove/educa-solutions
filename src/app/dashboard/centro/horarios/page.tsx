import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/types'

export default async function CentroHorariosPage() {
  const user = await getCurrentUser()
  
  if (!user?.tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Horarios</h1>
      <p className="text-slate-600 mt-2">Gestiona los horarios del centro</p>
      <div className="mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Generar Horario</h3>
          <p className="text-slate-600 mb-4">Usa nuestro motor de generación inteligente</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Generar Horario Automático
          </button>
        </div>
      </div>
    </div>
  )
}
