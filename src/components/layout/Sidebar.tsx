'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  GraduationCap, 
  LayoutDashboard, 
  Building2, 
  Users, 
  DoorOpen, 
  Wrench, 
  Package, 
  Calendar, 
  Clock,
  Settings,
  ChevronLeft,
  Ticket,
  UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'

const adminLinks = [
  { href: '/dashboard/admin/centros', label: 'Centros', icon: Building2 },
  { href: '/dashboard/admin/tecnicos', label: 'Técnicos', icon: UserCog },
]

const centroLinks = [
  { href: '/dashboard/centro', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/centro/aulas', label: 'Aulas', icon: DoorOpen },
  { href: '/dashboard/centro/profesores', label: 'Profesores', icon: Users },
  { href: '/dashboard/centro/inventario', label: 'Inventario', icon: Package },
  { href: '/dashboard/centro/horarios', label: 'Horarios', icon: Clock },
  { href: '/dashboard/centro/reservas', label: 'Reservas', icon: Calendar },
  { href: '/dashboard/centro/incidencias', label: 'Incidencias', icon: Ticket },
]

const ticLinks = [
  { href: '/dashboard/tic', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tic/incidencias', label: 'Incidencias', icon: Ticket },
  { href: '/dashboard/tic/inventario', label: 'Inventario', icon: Package },
]

const profesorLinks = [
  { href: '/dashboard/profesor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/profesor/horario', label: 'Mi Horario', icon: Clock },
  { href: '/dashboard/profesor/guardias', label: 'Guardias', icon: Calendar },
  { href: '/dashboard/profesor/reservas', label: 'Reservas', icon: Calendar },
  { href: '/dashboard/profesor/incidencias', label: 'Incidencias', icon: Ticket },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { sidebarOpen, setSidebarOpen } = useApp()

  const role = (session?.user as any)?.role || 'PROFESOR'

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return adminLinks
      case 'DIRECTOR':
        return centroLinks
      case 'TIC':
        return ticLinks
      case 'PROFESOR':
      default:
        return profesorLinks
    }
  }

  const links = getLinks()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-40 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg whitespace-nowrap">Educa</span>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50',
          !sidebarOpen && 'justify-center'
        )}>
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {session?.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || 'Usuario'}</p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}