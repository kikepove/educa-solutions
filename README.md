# Educasolutions - Backend SaaS para Centros Educativos

## Stack
- **Framework**: Next.js 14 (App Router)
- **ORM**: Prisma
- **Base de datos**: Neon PostgreSQL
- **Auth**: NextAuth.js
- **Pagos**: Stripe

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Autenticación
│   │   └── v1/
│   │       ├── centros/           # Gestión de centros
│   │       ├── usuarios/          # Gestión de usuarios
│   │       ├── incidencias/       # Gestión de incidencias
│   │       ├── inventario/        # Inventario
│   │       ├── reservas/          # Reservas de aulas
│   │       ├── guardias/          # Guardias
│   │       ├── horarios/          # Horarios
│   │       ├── aulas/             # Aulas
│   │       ├── profesores/        # Profesores
│   │       ├── csv/               # Importación CSV
│   │       ├── public/            # Endpoints públicos (QR)
│   │       └── stripe/            # Pagos
│   └── layout.tsx
├── lib/
│   ├── auth.ts                    # Config NextAuth
│   ├── db.ts                      # Prisma client
│   ├── stripe.ts                  # Stripe SDK
│   └── qr.ts                      # Generación QR
├── middleware/
│   └── auth.ts                    # Middleware protección
├── services/                      # Lógica de negocio
├── types/
│   └── index.ts                   # Tipos compartidos
└── utils/
    ├── permissions.ts             # RBAC
    ├── validation.ts              # Zod schemas
    └── csv-parser.ts              # Parser CSV
```

## Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Database (Neon)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# NextAuth (genera uno con: openssl rand -base64 32)
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
BASE_URL=http://localhost:3000
```

### 2. Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:push
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Desarrollo Local

```bash
npm run dev
```

## Endpoints Principales

### Auth
- `POST /api/auth/[...nextauth]` - Login/logout

### Centros (Admin)
- `GET /api/v1/centros` - Listar centros
- `POST /api/v1/centros` - Crear centro
- `POST /api/v1/centros/[id]/qr` - Regenerar QR

### Incidencias
- `GET /api/v1/incidencias` - Listar incidencias
- `POST /api/v1/incidencias` - Crear incidencia
- `GET /api/v1/public/incidencias/[code]` - Ver/crear (público QR)

### Importación CSV
- `POST /api/v1/csv?type=aulas` - Importar aulas
- `POST /api/v1/csv?type=profesores` - Importar profesores

### Stripe
- `POST /api/v1/stripe/checkout` - Crear sesión de pago
- `POST /api/v1/stripe/webhook` - Webhook de Stripe

## Roles y Permisos

| Rol | Permisos |
|-----|----------|
| ADMIN | CRUD total, gestionar técnicos, reset contraseñas |
| DIRECTOR | CRUD completo del centro |
| TIC | Incidencias, inventario |
| PROFESOR | Incidencias propias, reservas, horarios, guardias |
| TECNICO | Incidencias, inventario |

## Despliegue en Vercel

### 1. Crear Proyecto en Vercel
```bash
npm i -g vercel
vercel
```

### 2. Configurar Neon
1. Crear proyecto en [Neon](https://neon.tech)
2. Obtener connection string
3. Añadir en Vercel Dashboard → Settings → Environment Variables

### 3. Variables en Vercel
Añadir todas las variables de `.env.example` en el dashboard de Vercel.

### 4. Desplegar
```bash
vercel --prod
```

## Webhook Stripe en Producción

1. Crear endpoint en Stripe Dashboard → Developers → Webhooks
2. Añadir URL: `https://tu-dominio.com/api/v1/stripe/webhook`
3. Eventos a seleccionar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Free-Tier Optimizations

- **Neon**: Hasta 0.5GB storage, 1 proyecto
- **Vercel**: 100GB bandwidth/mes, Server Functions
- **Stripe**: Modo test sin costo

## Comandos Útiles

```bash
npm run dev              # Desarrollo
npm run build            # Producción
npm run db:studio        # Prisma Studio
npm run db:generate      # Generar cliente
npm run db:push          # Sincronizar schema
```