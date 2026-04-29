const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTenantAndUser() {
  try {
    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { code: 'EDUCA' },
      data: { 
        name: 'arpainformaticos',
        email: 'arpainformaticos@arpainformaticos.com'
      }
    });
    console.log('Tenant actualizado:', tenant.id, tenant.name);

    // Hash password
    const hashedPassword = await bcrypt.hash('1a2bKike', 10);

    // Update user email and password
    const user = await prisma.user.update({
      where: { email: 'kike.poveda@gmail.com' },
      data: { 
        email: 'arpainformaticos@arpainformaticos.com',
        password: hashedPassword
      }
    });
    console.log('Usuario actualizado:');
    console.log('Email: arpainformaticos@arpainformaticos.com');
    console.log('Password: 1a2bKike');
    console.log('User ID:', user.id);
    console.log('Tenant ID:', user.tenantId);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTenantAndUser();
