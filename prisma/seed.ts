import { PrismaClient } from '../src/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with clean data...\n');

  // Clear all existing data in reverse dependency order
  console.log('🗑️  Clearing existing data...');
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.sample.deleteMany(),
    prisma.stockTransaction.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.dutyRoster.deleteMany(),
    prisma.salary.deleteMany(),
    prisma.testType.deleteMany(),
    prisma.doctorSchedule.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.staff.deleteMany(),
  ]);
  console.log('✅ Cleared existing data\n');

  // Create the admin account
  console.log('👤 Creating admin account...');

  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const admin = await prisma.staff.create({
    data: {
      name: 'Clinic Admin',
      email: 'admin@clinic.com',
      phone: '+1 234 567 890',
      role: 'SUPER_ADMIN',
      department: 'Administration',
      specialization: null,
      isActive: true,
      password: hashedPassword,
    },
  });

  console.log(`✅ Created admin account:`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${plainPassword}`);
  console.log(`   Role:     ${admin.role}`);
  console.log('\n🎉 Seed completed! The system is ready for use.');
  console.log('   You can now log in and start adding your own data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
