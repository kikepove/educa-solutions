'use client'

import Link from 'next/link'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { GraduationCap, Users, Calendar, Wrench, BarChart3, Shield, Check, ArrowRight, Menu, X, AlertCircle, CheckCircle2, Laptop, Tablet, Clock, UsersRound, TrendingUp, Circle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type TabType = 'incidencias' | 'inventario' | 'reservas' | 'horarios'

const mockIncidencias = [
  { id: 1, title: 'Proyector aula 203 no funciona', status: 'ABIERTA', priority: 'ALTA', time: '2h' },
  { id: 2, title: 'WiFi lento en biblioteca', status: 'EN_PROCESO', priority: 'MEDIA', time: '4h' },
  { id: 3, title: 'Impresora atascada', status: 'RESUELTA', priority: 'BAJA', time: '1d' },
]

const mockInventario = [
  { name: 'Ordenadores', total: 45, available: 38, category: 'hardware' },
  { name: 'Tablets', total: 30, available: 25, category: 'hardware' },
  { name: 'Proyectores', total: 12, available: 10, category: 'hardware' },
  { name: 'Impresoras', total: 8, available: 7, category: 'hardware' },
]

const mockReservas = [
  { aula: 'Aula 101', hora: '09:00 - 10:00', profesor: 'M. García', materia: 'Matemáticas' },
  { aula: 'Aula 203', hora: '10:00 - 11:00', profesor: 'L. Martínez', materia: 'Física' },
  { aula: 'Lab Chemistry', hora: '11:30 - 13:00', profesor: 'S. López', materia: 'Química' },
]

const mockHorarios = [
  { day: 'LUNES', slots: [{ hora: '08:00', clase: 'Matemáticas', aula: '101' }, { hora: '09:00', clase: 'Física', aula: '203' }, { hora: '10:00', clase: 'Historia', aula: '102' }] },
  { day: 'MARTES', slots: [{ hora: '08:00', clase: 'Historia', aula: '104' }, { hora: '09:00', clase: 'Matemáticas', aula: '101' }, { hora: '10:00', clase: 'Química', aula: 'Lab' }] },
  { day: 'MIÉRCOLES', slots: [{ hora: '08:00', clase: 'Física', aula: '203' }, { hora: '09:00', clase: 'Historia', aula: '102' }, { hora: '10:00', clase: 'Matemáticas', aula: '101' }] },
]

function DashboardMockup() {
  const [activeTab, setActiveTab] = useState<TabType>('incidencias')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'incidencias', label: 'Incidencias', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventario', icon: <Laptop className="w-4 h-4" /> },
    { id: 'reservas', label: 'Reservas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'horarios', label: 'Horarios', icon: <Clock className="w-4 h-4" /> },
  ]

  return (
    <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl">
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-700/80 px-4 py-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            {activeTab === 'incidencias' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Tickets recientes</h4>
                  <div className="space-y-2">
                    {mockIncidencias.map((inc) => (
                      <div key={inc.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Circle className={`w-2 h-2 ${inc.status === 'ABIERTA' ? 'fill-red-500 text-red-500' : inc.status === 'EN_PROCESO' ? 'fill-yellow-500 text-yellow-500' : 'fill-green-500 text-green-500'}`} />
                          <span className="text-sm text-slate-200">{inc.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${inc.priority === 'ALTA' ? 'bg-red-500/20 text-red-400' : inc.priority === 'MEDIA' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {inc.priority}
                          </span>
                          <span className="text-xs text-slate-500">{inc.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Estado</h4>
                  <div className="flex items-end justify-around h-20">
                    <div className="text-center">
                      <div className="w-8 h-12 bg-red-500/30 rounded-t-lg flex items-end justify-center">
                        <div className="w-full bg-red-500 h-3 rounded-t-sm" style={{ height: '40%' }} />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">5</span>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-12 bg-yellow-500/30 rounded-t-lg flex items-end justify-center">
                        <div className="w-full bg-yellow-500 h-4 rounded-t-sm" style={{ height: '60%' }} />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">3</span>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-12 bg-green-500/30 rounded-t-lg flex items-end justify-center">
                        <div className="w-full bg-green-500 h-6 rounded-t-sm" style={{ height: '80%' }} />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">12</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Abiertos</span>
                    <span>Proceso</span>
                    <span>Resueltos</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventario' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockInventario.map((item, i) => (
                  <div key={item.name} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Laptop className="w-4 h-4 text-primary-400" />
                      <span className="text-sm text-slate-300">{item.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{item.total}</div>
                    <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(item.available / item.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">{item.available} disponibles</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reservas' && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300">Reservas de hoy</h4>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    Ver todas <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {mockReservas.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-200">{res.aula}</div>
                          <div className="text-xs text-slate-500">{res.hora}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">{res.profesor}</div>
                        <div className="text-xs text-slate-500">{res.materia}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'horarios' && (
              <div className="bg-slate-700/50 rounded-lg p-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-3 min-w-[350px]">
                  <h4 className="text-sm font-medium text-slate-300">Horario semanal</h4>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-slate-600 rounded">
                      <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                    </button>
                    <button className="p-1 hover:bg-slate-600 rounded">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 min-w-[350px]">
                  {mockHorarios.map((day) => (
                    <div key={day.day} className="bg-slate-600/30 rounded-lg p-2">
                      <div className="text-xs font-medium text-slate-400 mb-2 text-center">{day.day}</div>
                      <div className="space-y-1">
                        {day.slots.map((slot, i) => (
                          <div key={i} className="text-xs bg-primary-600/30 rounded p-1.5 flex justify-between">
                            <span className="text-slate-300">{slot.hora}</span>
                            <span className="text-slate-200 truncate">{slot.clase}</span>
                            <span className="text-slate-500">{slot.aula}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Educasolutions</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-primary-600 transition-colors">Características</a>
              <a href="#pricing" className="text-slate-600 hover:text-primary-600 transition-colors">Precios</a>
              <a href="#contact" className="text-slate-600 hover:text-primary-600 transition-colors">Contacto</a>
              <Link href="/login">
                <Button variant="outline" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="#contact">
                <Button size="sm">Empezar ahora</Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 py-4 px-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Características</a>
              <a href="#pricing" className="text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Precios</a>
              <a href="#contact" className="text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Contacto</a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Iniciar sesión</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
              Gestiona tu centro educativo
              <span className="text-primary-600"> de forma inteligente</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
              La plataforma todo-en-uno para gestionar incidencias, inventario, horarios, reservas y guardias de tu centro educativo.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#contact">
                <Button size="lg" className="w-full sm:w-auto">
                  Solicitar demo
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Acceder al panel
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Todo lo que necesitas
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Herramientas completas para la gestión diaria de tu centro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Wrench className="w-6 h-6" />}
              title="Gestión de Incidencias"
              description="Reporta y controla todas las incidencias del centro. Código QR para reportes rápidos."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Reservas de Aulas"
              description="Sistema de reservas online con calendario interactivo y gestión de disponibilidad."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Gestión de Profesores"
              description="Importación masiva de profesores desde CSV. Control de horarios y guardias."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Inventario"
              description="Control total del equipamiento del centro. Historial y mantenimiento."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Horarios"
              description="Generación automática de horarios con IA. Edición visual semanal."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Multi-tenant"
              description="Gestiona múltiples centros desde una sola plataforma con roles diferenciados."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Precio único y transparente
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Todo incluido por solo 59€/mes
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-center">
                <p className="text-primary-100 font-medium">Plan Profesional</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">59€</span>
                  <span className="text-primary-100">/mes</span>
                </div>
                <p className="mt-2 text-primary-100 text-sm">IVA no incluido</p>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Usuarios ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Gestión de incidencias</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Reservas de aulas</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Gestión de inventario</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Horarios y guardias</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary-200" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>

              <Link href="#contact">
                <Button variant="secondary" size="lg" className="w-full mt-8 bg-white text-primary-600 hover:bg-primary-50">
                  Contratar ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                ¿Interesado? Hablemos
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Rellena el formulario y te contactaremos en breve
              </p>
            </div>

            <form className="bg-white rounded-2xl p-8 shadow-card">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" className="input" placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="label">Apellidos</label>
                  <input type="text" className="input" placeholder="Tus apellidos" />
                </div>
              </div>
              <div className="mt-6">
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="tu@email.com" />
              </div>
              <div className="mt-6">
                <label className="label">Centro educativo</label>
                <input type="text" className="input" placeholder="Nombre del centro" />
              </div>
              <div className="mt-6">
                <label className="label">Mensaje</label>
                <textarea className="input min-h-[120px]" placeholder="¿En qué podemos ayudarte?" />
              </div>
              <Button className="w-full mt-6" size="lg">
                Enviar mensaje
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/34600000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
      >
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Educasolutions</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 Educasolutions. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  )
}
