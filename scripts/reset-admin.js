const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // Delete existing user if exists
    await prisma.user.deleteMany({
      where: { email: 'kike.poveda@gmail.com' }
    })
    console.log('Usuario anterior eliminado (si existía)')

    // Get or create tenant
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

    // Create fresh admin user
    const plainPassword = '1a2bKike'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    
    console.log('Contraseña plana:', plainPassword)
    console.log('Hash generado:', hashedPassword)
    
    // Verify hash works
    const testCompare = await bcrypt.compare(plainPassword, hashedPassword)
    console.log('Verificación de hash:', testCompare ? 'EXITOSA' : 'FALLIDA')

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

    console.log('\n=== USUARIO ADMINISTRADOR CREADO ===')
    console.log('Email:', user.email)
    console.log('Password: 1a2bKike')
    console.log('ID:', user.id)
    console.log('Tenant ID:', tenant.id)
    console.log('Rol:', user.role)
    console.log('Activo:', user.isActive)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
