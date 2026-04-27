# Educa Solutions - SaaS de Gestión Educativa

Sistema SaaS multi-tenant para gestión educativa con generación automática de horarios.

## 🚀 Estado Actual del Proyecto

### ✅ Completado
- Configuración inicial del proyecto Next.js 14 + Prisma + Neon PostgreSQL
- Despliegue en Vercel (https://educa-solutions.vercel.app)
- Autenticación con NextAuth (prisma adapter)
- Modelos base de datos: Tenant, User, Teacher, Classroom, Subject, Incident, Inventory, Reservation
- Modelos para sistema de horarios: Schedule, TeacherAvailability, ScheduleConstraint, ScheduleGeneration
- Usuario administrador creado: kike.poveda@gmail.com / 1a2bKike
- Motor de generación de horarios:
  - Algoritmo Greedy Heurístico
  - Priorización de materias por dificultad
  - Validación de Hard Constraints (sin solapamientos)
  - Optimización con Simulated Annealing
  - Puntuación de calidad del horario
- Endpoints API implementados:
  - `GET/POST /api/v1/horarios` - CRUD horarios manual
  - `POST /api/v1/horarios?generateAdvanced=true` - Generación avanzada
  - `POST /api/v1/horarios/generate` - Generación con seguimiento
  - `POST /api/v1/horarios/validate` - Validación de horarios
  - `GET/DELETE /api/v1/horarios/generations/[id]` - Gestión de generaciones

### 🔨 En Progreso
- Frontend para gestión de horarios (UI)
- Sistema de disponibilidad de profesores
- Configuración de restricciones personalizadas

## 📁 Estructura del Proyecto

```
educa-solutions/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Rutas del panel de control
│   │   │   ├── admin/        # Vistas de administrador
│   │   │   └── centro/       # Vistas de centro educativo
│   │   ├── api/
│   │   │   └── v1/          # API REST endpoints
│   │   │       ├── horarios/  # Endpoints de horarios
│   │   │       ├── profesores/
│   │   │       ├── aulas/
│   │   │       ├── asignaturas/
│   │   │       └── ...
│   │   ├── login/             # Página de login
│   │   └── layout.tsx
│   ├── components/            # Componentes React reutilizables
│   ├── services/              # Lógica de negocio
│   │   └── horarios.service.ts
│   ├── lib/
│   │   ├── db.ts             # Cliente Prisma
│   │   └── scheduling-engine.ts  # Motor de generación de horarios
│   ├── types/
│   │   ├── index.ts
│   │   └── scheduling.ts     # Tipos para sistema de horarios
│   └── utils/
├── scripts/
│   └── create-admin.ts        # Script de creación de admin
├── .env.local                 # Variables de entorno (NO subir a Git)
├── .env.example               # Ejemplo de variables de entorno
└── README.md
```

## 🗃️ Modelo de Datos (Prisma)

### Modelos Principales para Horarios

```prisma
model Schedule {
  id            String   @id @default(cuid())
  day           ScheduleDay
  startTime     String
  endTime       String
  weekNumber    Int?
  isGenerated   Boolean  @default(false)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenantId      String
  tenant        Tenant   @relation("TenantSchedules")

  classroomId   String
  classroom     Classroom @relation("ClassroomSchedules")

  subjectId     String
  subject       Subject  @relation("SubjectSchedules")

  teacherId     String
  teacher       Teacher  @relation("TeacherSchedules")

  createdById   String
  createdBy     User     @relation("ScheduleCreator")

  generationId  String?
  generation    ScheduleGeneration? @relation("ScheduleGeneration")

  @@unique([tenantId, classroomId, subjectId, teacherId, day, startTime])
}

model TeacherAvailability {
  id          String   @id @default(cuid())
  day         ScheduleDay
  hourStart   Int
  hourEnd     Int
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenantId    String
  tenant      Tenant   @relation("TenantTeacherAvailabilities")

  teacherId   String
  teacher     Teacher  @relation("TeacherAvailabilities")

  @@unique([tenantId, teacherId, day, hourStart])
}

model ScheduleGeneration {
  id              String   @id @default(cuid())
  status          String   @default("PENDING")
  progress        Int      @default(0)
  score           Float?
  conflictCount   Int      @default(0)
  generatedSlots  Int      @default(0)
  totalSlots      Int
  message         String?
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenantId        String
  tenant          Tenant   @relation("TenantScheduleGenerations")

  createdById     String
  createdBy       User     @relation("ScheduleGenerationCreator")

  schedules       Schedule[] @relation("ScheduleGeneration")
}
```

## 🚀 Motor de Generación de Horarios

### Arquitectura

1. **Fase Greedy (Heurística)**
   - Ordenar materias por dificultad (más restrictivas primero)
   - Para cada materia, encontrar el mejor slot disponible
   - Asignar slot si pasa validación de hard constraints
   - Backtracking limitado si falla

2. **Fase de Optimización**
   - Algoritmo: Simulated Annealing
   - Objetivo: Maximizar puntuación basada en soft constraints
   - Criterios: minimizar huecos, agrupar materias, balancear carga

3. **Validación**
   - Hard Constraints: Sin solapamientos, respetar disponibilidad
   - Soft Constraints: Puntuación de calidad (0-100)

### API Endpoints

#### Generar Horario
```bash
POST /api/v1/horarios/generate
Content-Type: application/json
{
  "config": {
    "maxConsecutiveHours": 3,
    "daysPerWeek": 5,
    "hoursPerDay": 7
  }
}
```

Respuesta:
```json
{
  "generationId": "cm...",
  "status": "COMPLETED",
  "score": 85.5,
  "conflictCount": 0,
  "generatedSlots": 25,
  "totalSlots": 30,
  "slots": [...]
}
```

#### Validar Horario
```bash
POST /api/v1/horarios/validate
Content-Type: application/json
{
  "scheduleId": "opcional"
}
```

## 🔧 Configuración y Despliegue

### Variables de Entorno (.env.local)

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="https://tu-dominio.vercel.app"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."

# App
BASE_URL="https://tu-dominio.vercel.app"
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma generate
npx prisma db push
npx prisma migrate dev --name nombre_migracion
npx prisma studio

# Build
npm run build

# Despliegue en Vercel
vercel --prod
```

## 📊 Estado de Despliegue

- **Repositorio GitHub**: https://github.com/kikepove/educa-solutions
- **Aplicación en Vercel**: https://educa-solutions.vercel.app
- **Estado**: ✅ Activo
- **Base de Datos**: Neon PostgreSQL (Serverless)

## 👤 Credenciales de Acceso

### Administrador
- **Email**: kike.poveda@gmail.com
- **Contraseña**: 1a2bKike
- **Rol**: ADMIN
- **Tenant**: Educa Solutions Demo (EDUCA)

## 🎯 Próximos Pasos Recomendados

1. **Frontend para Horarios**
   - Crear página de configuración de disponibilidad de profesores
   - UI para generar horarios con progreso en tiempo real
   - Vista de horario semanal (tipo GHC/Peñalara)
   - Edición manual de slots

2. **Mejoras al Motor**
   - Implementar Genetic Algorithm como alternativa
   - Añadir más soft constraints configurables
   - Sistema de pausa/cancelación de generación

3. **Multi-tenancy**
   - Completar aislación de datos por tenant
   - Configuración específica por centro educativo

4. **Integración con IA**
   - Usar IA para sugerir mejoras post-optimización
   - Resolución de conflictos complejos con LLM

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, Lucide React (iconos)
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: Neon PostgreSQL (Serverless)
- **Autenticación**: NextAuth.js con Prisma Adapter
- **Pagos**: Stripe
- **Despliegue**: Vercel (Serverless)
- **Validación**: Zod
- **Utilidades**: date-fns, bcryptjs, papaparse (CSV)

## ⚠️ Notas Importantes

1. **Seguridad**: Las credenciales compartidas en esta conversación deben ser rotadas antes de producción
2. **Multi-tenant**: Todos los modelos tienen `tenantId` para aislación
3. **Serverless**: El motor de horarios está optimizado para entornos serverless (Vercel)
4. **Límites**: El algoritmo actual es adecuado para centros pequeños/medianos (<50 profesores, <100 materias)

## 📝 Notas para Continuación

- El motor de horarios está en `src/lib/scheduling-engine.ts`
- Los tipos están en `src/types/scheduling.ts`
- La API de horarios está en `src/app/api/v1/horarios/`
- El esquema de Prisma está en `prisma/schema.prisma`
- Para extender el motor, modificar la clase `SchedulingEngine`
- Para nuevos endpoints, seguir el patrón en `src/app/api/v1/`

---

**Fecha de última actualización**: 27 de abril de 2026
**Versión**: 1.0.0 (Inicial con sistema de horarios)
