const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: 'kike.poveda@gmail.com' }
    })

    if (existingUser) {
      console.log('El usuario administrador ya existe')
      return
    }

    // Verificar si existe un tenant, si no, crear uno
    let tenant = await prisma.tenant.findFirst({
      where: { code: 'EDUCA' }
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Educa Solutions Demo',
          slug: 'educa-demo',
          code: 'EDUCA',
          email: 'kike.poveda@gmail.com',
          isActive: true,
          subscriptionStatus: 'ACTIVA',
        }
      })
      console.log('Tenant creado:', tenant.id)
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('1a2bKike', 10)

    // Crear usuario administrador
    const user = await prisma.user.create({
      data: {
        email: 'kike.poveda@gmail.com',
        password: hashedPassword,
        name: 'Kike',
        surname: 'Poveda',
        role: 'ADMIN',
        isActive: true,
        tenantId: tenant.id,
      }
    })

    console.log('Usuario administrador creado exitosamente:')
    console.log('Email: kike.poveda@gmail.com')
    console.log('Password: 1a2bKike')
    console.log('User ID:', user.id)
    console.log('Tenant ID:', tenant.id)

  } catch (error) {
    console.error('Error al crear usuario administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
