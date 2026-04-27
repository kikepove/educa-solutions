import { UserRole } from '@prisma/client'

type PermissionModule = 
  | 'centros' 
  | 'usuarios' 
  | 'tecnicos' 
  | 'aulas' 
  | 'profesores' 
  | 'incidencias' 
  | 'inventario' 
  | 'reservas' 
  | 'guardias' 
  | 'horarios' 
  | 'subscription' 
  | 'qr'

type PermissionAction = 'create' | 'read' | 'update' | 'delete'

type Permissions = Record<PermissionModule, PermissionAction[]>

const PERMISSIONS: Record<UserRole, Permissions> = {
  ADMIN: {
    centros: ['create', 'read', 'update', 'delete'],
    usuarios: ['create', 'read', 'update', 'delete'],
    tecnicos: ['create', 'read', 'update', 'delete'],
    aulas: ['create', 'read', 'update', 'delete'],
    profesores: ['create', 'read', 'update', 'delete'],
    incidencias: ['create', 'read', 'update', 'delete'],
    inventario: ['create', 'read', 'update', 'delete'],
    reservas: ['create', 'read', 'update', 'delete'],
    guardias: ['create', 'read', 'update', 'delete'],
    horarios: ['create', 'read', 'update', 'delete'],
    subscription: ['create', 'read', 'update', 'delete'],
    qr: ['read', 'update'],
  },
  TIC: {
    centros: ['read'],
    usuarios: ['read'],
    tecnicos: ['read'],
    aulas: ['read'],
    profesores: ['read'],
    incidencias: ['create', 'read', 'update'],
    inventario: ['create', 'read', 'update', 'delete'],
    reservas: ['read'],
    guardias: ['read'],
    horarios: ['read'],
    subscription: [],
    qr: [],
  },
  PROFESOR: {
    centros: ['read'],
    usuarios: [],
    tecnicos: [],
    aulas: ['read'],
    profesores: ['read'],
    incidencias: ['create', 'read', 'update'],
    inventario: ['read'],
    reservas: ['create', 'read', 'update', 'delete'],
    guardias: ['read'],
    horarios: ['read'],
    subscription: [],
    qr: [],
  },
  TECNICO: {
    centros: ['read'],
    usuarios: [],
    tecnicos: ['read'],
    aulas: ['read'],
    profesores: ['read'],
    incidencias: ['create', 'read', 'update'],
    inventario: ['create', 'read', 'update', 'delete'],
    reservas: ['read'],
    guardias: ['read'],
    horarios: ['read'],
    subscription: [],
    qr: [],
  },
  DIRECTOR: {
    centros: ['read', 'update'],
    usuarios: ['create', 'read', 'update', 'delete'],
    tecnicos: ['create', 'read', 'update', 'delete'],
    aulas: ['create', 'read', 'update', 'delete'],
    profesores: ['create', 'read', 'update', 'delete'],
    incidencias: ['create', 'read', 'update', 'delete'],
    inventario: ['create', 'read', 'update', 'delete'],
    reservas: ['create', 'read', 'update', 'delete'],
    guardias: ['create', 'read', 'update', 'delete'],
    horarios: ['create', 'read', 'update', 'delete'],
    subscription: [],
    qr: [],
  },
}

export function hasPermission(
  role: UserRole,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const rolePermissions = PERMISSIONS[role]
  if (!rolePermissions) return false
  const modulePermissions = rolePermissions[module]
  if (!modulePermissions) return false
  return modulePermissions.includes(action)
}

export function requirePermission(
  role: UserRole,
  module: PermissionModule,
  action: PermissionAction
): void {
  if (!hasPermission(role, module, action)) {
    throw new Error(`No tienes permiso para ${action} ${module}`)
  }
}