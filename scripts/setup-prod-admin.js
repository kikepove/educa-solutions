const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'arpainformaticos',
        slug: 'arpainformaticos',
        code: 'ARPA',
        email: 'arpainformaticos@arpainformaticos.com',
        isActive: true,
        subscriptionStatus: 'ACTIVA',
      }
    });
    console.log('Tenant creado:', tenant.id, tenant.name);

    // Hash password
    const hashedPassword = await bcrypt.hash('1a2bKike', 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'arpainformaticos@arpainformaticos.com',
        password: hashedPassword,
        name: 'Admin',
        surname: 'Arpainformaticos',
        role: 'ADMIN',
        isActive: true,
        tenantId: tenant.id,
      }
    });

    console.log('Usuario admin creado exitosamente:');
    console.log('Email: arpainformaticos@arpainformaticos.com');
    console.log('Password: 1a2bKike');
    console.log('User ID:', user.id);
    console.log('Tenant ID:', tenant.id);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
