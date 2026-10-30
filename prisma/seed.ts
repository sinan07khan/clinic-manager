import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with clean, comprehensive Clinic Manager data...\n');

  // 1. Clear existing data safely in dependency order
  console.log('🗑️  Clearing existing records...');
  try {
    await prisma.auditLog.deleteMany();
    await prisma.notificationLog.deleteMany();
    await prisma.refundVoucher.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.dischargeSummary.deleteMany();
    await prisma.otProcedure.deleteMany();
    await prisma.bedAdmission.deleteMany();
    await prisma.bed.deleteMany();
    await prisma.supplierReturn.deleteMany();
    await prisma.stockTransaction.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.doctorCommission.deleteMany();
    await prisma.dailyClosing.deleteMany();
    await prisma.labReport.deleteMany();
    await prisma.sample.deleteMany();
    await prisma.testType.deleteMany();
    await prisma.medicalDocument.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.telemedicineSession.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicalHistory.deleteMany();
    await prisma.vitals.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.branch.deleteMany();
  } catch (e) {
    console.log('Initial cleanup note:', e);
  }

  // 2. Branches
  console.log('🏥 Creating Clinic Branches...');
  const branchCentral = await prisma.branch.create({
    data: {
      name: 'Main Clinic - Central',
      code: 'MCC-01',
      address: 'Plot 14, Road 7, Dhanmondi, Dhaka',
      phone: '+880 1711-000111',
      isActive: true,
    },
  });

  const branchNorth = await prisma.branch.create({
    data: {
      name: 'North City Diagnostic Branch',
      code: 'NDB-02',
      address: 'Sector 3, Uttara, Dhaka',
      phone: '+880 1722-000222',
      isActive: true,
    },
  });

  // 3. Staff & RBAC Accounts
  console.log('👥 Creating Role-Based Staff Accounts...');
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordDefault = await bcrypt.hash('clinic123', 10);

  const admin = await prisma.staff.create({
    data: {
      name: 'Dr. Sinan Admin',
      email: 'admin@clinic.com',
      phone: '+880 1700-000000',
      role: 'SUPER_ADMIN',
      department: 'Administration',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordAdmin,
    },
  });

  const manager = await prisma.staff.create({
    data: {
      name: 'Rafiqul Islam',
      email: 'manager@clinic.com',
      phone: '+880 1700-000001',
      role: 'CLINIC_MANAGER',
      department: 'Operations',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  const doctor = await prisma.staff.create({
    data: {
      name: 'Dr. Mahmudur Rahman',
      email: 'doctor@clinic.com',
      phone: '+880 1700-000002',
      role: 'DOCTOR',
      department: 'Internal Medicine',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  const receptionist = await prisma.staff.create({
    data: {
      name: 'Fatima Tuz Zohra',
      email: 'reception@clinic.com',
      phone: '+880 1700-000003',
      role: 'RECEPTIONIST',
      department: 'Front Desk',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  const labTech = await prisma.staff.create({
    data: {
      name: 'Shahidul Alam',
      email: 'lab@clinic.com',
      phone: '+880 1700-000004',
      role: 'LAB_TECHNICIAN',
      department: 'Diagnostic Pathology',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  const pharmacist = await prisma.staff.create({
    data: {
      name: 'Tanzina Akhter',
      email: 'pharmacist@clinic.com',
      phone: '+880 1700-000005',
      role: 'PHARMACIST',
      department: 'Pharmacy Dispensary',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  const nurse = await prisma.staff.create({
    data: {
      name: 'Nasrin Sultana',
      email: 'nurse@clinic.com',
      phone: '+880 1700-000006',
      role: 'NURSE',
      department: 'Triage & Inpatient',
      branchId: branchCentral.id,
      isActive: true,
      password: hashedPasswordDefault,
    },
  });

  // Doctor Schedule setup
  await prisma.doctorSchedule.create({
    data: {
      staffId: doctor.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 20,
      maxPatients: 25,
      consultationFee: 1000,
      notes: 'Morning & Afternoon OPD Consultation',
    },
  });

  // 4. Patients with UHID Smart Cards
  console.log('🧑‍⚕️ Creating Patients with UHID Smart Cards...');
  const p1 = await prisma.patient.create({
    data: {
      patientId: 'UHID-10001',
      name: 'Mohammad Rahim Uddin',
      phone: '01711223344',
      email: 'rahim@example.com',
      gender: 'MALE',
      bloodGroup: 'B_POSITIVE',
      address: 'House 42, Road 9, Dhanmondi, Dhaka',
      emergencyContact: 'Mrs. Begum (Wife)',
      emergencyPhone: '01711998877',
      branchId: branchCentral.id,
    },
  });

  const p2 = await prisma.patient.create({
    data: {
      patientId: 'UHID-10002',
      name: 'Sharmin Sultana',
      phone: '01822334455',
      email: 'sharmin@example.com',
      gender: 'FEMALE',
      bloodGroup: 'A_POSITIVE',
      address: 'Block C, Banani, Dhaka',
      emergencyContact: 'Mr. Hossain (Husband)',
      emergencyPhone: '01822887766',
      branchId: branchCentral.id,
    },
  });

  const p3 = await prisma.patient.create({
    data: {
      patientId: 'UHID-10003',
      name: 'Tanvir Hasan (Fast-Track Emergency)',
      phone: '01933445566',
      email: 'tanvir@example.com',
      gender: 'MALE',
      bloodGroup: 'O_POSITIVE',
      address: 'Mirpur 10, Dhaka',
      emergencyContact: 'Brother',
      emergencyPhone: '01933776655',
      branchId: branchCentral.id,
    },
  });

  // 5. Vitals & Clinical History (EMR)
  console.log('🩺 Adding Vitals & Clinical EMR History...');
  await prisma.vitals.create({
    data: {
      patientId: p1.id,
      bpSystolic: 138,
      bpDiastolic: 86,
      pulse: 76,
      spO2: 98,
      temperature: 98.4,
      heightCm: 172,
      weightKg: 74.5,
      bmi: 25.2,
      bloodSugar: 6.8,
      triagePriority: 'NORMAL',
      recordedBy: nurse.name,
      notes: 'Patient feels mild fatigue after work hours. Fasting blood sugar checked.',
    },
  });

  await prisma.clinicalHistory.create({
    data: {
      patientId: p1.id,
      allergies: 'Penicillin, Cephalosporins (causes rash)',
      chronicConditions: 'Diabetes Mellitus Type 2, Essential Hypertension (Stage 1)',
      surgicalHistory: 'Appendectomy in 2018 (uneventful)',
      familyHistory: 'Father: Type 2 Diabetes, Mother: Hypertension & Osteoarthritis',
      notes: 'Non-smoker, walks 30 mins 4 days a week, follows low-salt diet',
    },
  });

  // 6. Appointments & Live Queue Tokens
  console.log('📅 Setting up Appointments & Queue Tokens...');
  const apptToday = new Date();
  apptToday.setHours(10, 0, 0, 0);

  const appt1 = await prisma.appointment.create({
    data: {
      patientId: p1.id,
      doctorId: doctor.id,
      date: apptToday,
      timeSlot: '10:00 AM - 10:20 AM',
      status: 'CONFIRMED',
      type: 'CONSULTATION',
      tokenNumber: 1,
      queueStatus: 'IN_CONSULTATION',
      bookingChannel: 'WALK_IN',
      triageTag: 'NORMAL',
      notes: 'Follow-up for diabetes & routine cardiac review',
      branchId: branchCentral.id,
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      patientId: p2.id,
      doctorId: doctor.id,
      date: apptToday,
      timeSlot: '10:30 AM - 10:50 AM',
      status: 'CONFIRMED',
      type: 'TELEMEDICINE',
      tokenNumber: 2,
      queueStatus: 'WAITING',
      bookingChannel: 'ONLINE',
      triageTag: 'NORMAL',
      notes: 'Remote video consultation with online payment',
      branchId: branchCentral.id,
    },
  });

  // 7. Telemedicine Session
  console.log('💻 Setting up Telemedicine Video Portal...');
  await prisma.telemedicineSession.create({
    data: {
      appointmentId: appt2.id,
      patientId: p2.id,
      doctorId: doctor.id,
      roomCode: 'tele-room-sharmin-8891',
      status: 'WAITING',
      paymentVerified: true,
      paymentAmount: 1000,
      paymentMethod: 'BKASH',
      notes: 'Pre-paid telemedicine consultation link dispatched to patient mobile',
    },
  });

  // 8. Electronic Prescription
  console.log('💊 Adding Electronic Prescription Pad Demo...');
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  await prisma.prescription.create({
    data: {
      appointmentId: appt1.id,
      doctorId: doctor.id,
      patientId: p1.id,
      chiefComplaints: 'Occasional dizziness, mild fatigue in evening',
      clinicalFindings: 'Pulse regular, chest clear, no ankle edema',
      diagnosis: 'Controlled Type 2 Diabetes, Mild Stage-1 Hypertension',
      medicines: JSON.stringify([
        { name: 'Metformin HCl 500mg (Comet)', dosage: '1+0+1', route: 'Oral', duration: '30 days', instructions: 'After meals' },
        { name: 'Amlodipine 5mg (Amlocal)', dosage: '0+0+1', route: 'Oral', duration: '30 days', instructions: 'At bedtime' },
        { name: 'Rosuvastatin 10mg', dosage: '0+0+1', route: 'Oral', duration: '30 days', instructions: 'After dinner' },
      ]),
      investigations: JSON.stringify([
        'Complete Blood Count (CBC)',
        'Fasting Blood Sugar (FBS)',
        'HbA1c',
        'Serum Creatinine',
      ]),
      adviceTemplates: 'Low carb, low salt diet. Daily 30 min brisk walk. Monitor fasting blood glucose weekly.',
      followUpDate: nextMonth,
      isDispatched: true,
      dispatchChannel: 'WHATSAPP',
    },
  });

  // 9. Diagnostic Test Catalog, Sample & Lab Report
  console.log('🧪 Creating Diagnostic Test Catalog & Lab Reports...');
  const testCbc = await prisma.testType.create({
    data: {
      name: 'Complete Blood Count (CBC)',
      category: 'HEMATOLOGY',
      department: 'Pathology',
      price: 500,
      unit: 'Various',
      referenceRanges: 'Hb: 13.5-17.5 g/dL, WBC: 4.5-11.0, Platelets: 150-450',
      description: 'Hemoglobin, RBC, WBC, Platelets, Differential Count, Hematocrit',
      isActive: true,
    },
  });

  await prisma.testType.create({
    data: {
      name: 'Fasting Blood Sugar (FBS)',
      category: 'BIOCHEMISTRY',
      department: 'Biochemistry',
      price: 200,
      unit: 'mmol/L',
      referenceRanges: '3.9 - 6.1 mmol/L',
      description: 'Fasting blood glucose level for diabetes diagnosis and monitoring',
      isActive: true,
    },
  });

  await prisma.testType.create({
    data: {
      name: 'Lipid Profile Full Panel',
      category: 'BIOCHEMISTRY',
      department: 'Biochemistry',
      price: 800,
      unit: 'mg/dL',
      referenceRanges: 'Cholesterol <200, Triglycerides <150, HDL >40',
      description: 'Total Cholesterol, HDL, LDL, Triglycerides',
      isActive: true,
    },
  });

  await prisma.testType.create({
    data: {
      name: 'Digital Chest X-Ray PA View',
      category: 'RADIOLOGY',
      department: 'Radiology & Imaging',
      price: 850,
      description: 'High-resolution digital radiography of thoracic cavity and lungs',
      isActive: true,
    },
  });

  // Sample tube with barcode
  const sample1 = await prisma.sample.create({
    data: {
      sampleId: 'SMP-88001',
      patientId: p1.id,
      status: 'COLLECTED',
      collectedBy: labTech.id,
    },
  });

  // Lab report with biological reference ranges & digital signature
  await prisma.labReport.create({
    data: {
      reportNo: 'LR-10001',
      patientId: p1.id,
      testTypeId: testCbc.id,
      technicianId: labTech.id,
      sampleId: sample1.id,
      status: 'REVIEWED',
      isAbnormal: false,
      abnormalFlag: 'NORMAL',
      digitalSignature: true,
      signatureName: 'Dr. Mahmudur Rahman (Verified MD)',
      signatureDate: new Date(),
      notes: 'All hematology indices within normal reference ranges. Sysmex analyzer verified.',
      results: JSON.stringify([
        { parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.5-17.5', isAbnormal: false },
        { parameter: 'WBC Count', value: '7.4', unit: '×10³/µL', referenceRange: '4.5-11.0', isAbnormal: false },
        { parameter: 'Platelet Count', value: '230', unit: '×10³/µL', referenceRange: '150-450', isAbnormal: false },
        { parameter: 'Hematocrit (PCV)', value: '42.0', unit: '%', referenceRange: '38.8-50.0', isAbnormal: false },
      ]),
    },
  });

  // 10. Pharmacy & Stock Inventory
  console.log('💊 Adding Pharmacy Inventory & FEFO Batches...');
  const suppSquare = await prisma.supplier.create({
    data: {
      name: 'Square Pharmaceuticals PLC',
      contactPerson: 'Mr. Jahangir Alam',
      email: 'jahangir@squarepharma.com',
      phone: '01711002233',
      address: 'Square Centre, 48 Mohakhali C/A, Dhaka',
    },
  });

  const suppBeximco = await prisma.supplier.create({
    data: {
      name: 'Beximco Pharmaceuticals Ltd',
      contactPerson: 'Kazi Anisur Rahman',
      email: 'orders@beximcopharma.com',
      phone: '01811445566',
      address: '19 Dhanmondi R/A, Road 7, Dhaka',
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'Paracetamol 500mg (Napa)',
        category: 'MEDICINE',
        quantity: 850,
        unit: 'Tablets',
        minStock: 100,
        unitPrice: 2.5,
        batchNumber: 'B-NPA-2024',
        expiryDate: new Date('2026-11-30'),
        supplierId: suppBeximco.id,
      },
      {
        name: 'Amoxicillin 500mg (Moxacil)',
        category: 'MEDICINE',
        quantity: 340,
        unit: 'Capsules',
        minStock: 50,
        unitPrice: 8.0,
        batchNumber: 'B-MXL-99',
        expiryDate: new Date('2026-08-15'),
        supplierId: suppSquare.id,
      },
      {
        name: 'Omeprazole 20mg (Seclo)',
        category: 'MEDICINE',
        quantity: 35, // Trigger low stock!
        unit: 'Capsules',
        minStock: 100,
        unitPrice: 6.0,
        batchNumber: 'B-SCL-14',
        expiryDate: new Date('2026-07-20'),
        supplierId: suppSquare.id,
      },
      {
        name: 'Sterile Disposable Syringe 5ml',
        category: 'CONSUMABLE',
        quantity: 400,
        unit: 'Pieces',
        minStock: 50,
        unitPrice: 15.0,
        batchNumber: 'B-SYR-01',
        expiryDate: new Date('2027-05-30'),
        supplierId: suppSquare.id,
      },
    ],
  });

  // 11. Daycare Beds, OT Procedures & Discharge
  console.log('🛏️ Creating Daycare Observation Beds, Cabins & OT Procedures...');
  const bedCabin = await prisma.bed.create({
    data: {
      bedNumber: 'CABIN-101',
      ward: 'CABIN_1',
      type: 'CABIN',
      dailyRate: 2200,
      status: 'OCCUPIED',
      currentPatientId: p1.id,
    },
  });

  await prisma.bed.create({
    data: {
      bedNumber: 'DAYCARE-01',
      ward: 'DAYCARE',
      type: 'DAYCARE',
      dailyRate: 800,
      status: 'AVAILABLE',
    },
  });

  await prisma.bed.create({
    data: {
      bedNumber: 'ICU-BED-02',
      ward: 'ICU',
      type: 'ICU',
      dailyRate: 5500,
      status: 'AVAILABLE',
    },
  });

  // Bed admission
  await prisma.bedAdmission.create({
    data: {
      bedId: bedCabin.id,
      patientId: p1.id,
      admittedAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'ACTIVE',
      diagnosis: 'Chest pain observation; post-ECG stability confirmation',
      doctorNotes: 'BP stabilized, SpO2 98%. Safe for discharge tomorrow morning.',
    },
  });

  // Minor OT procedure booking
  await prisma.otProcedure.create({
    data: {
      procedureNo: 'OTP-99001',
      patientId: p3.id,
      procedureName: 'Excision of Sebaceous Cyst (Minor)',
      leadSurgeonId: doctor.id,
      otRoom: 'MINOR_OT_1',
      scheduledDate: new Date(Date.now() + 86400000),
      startTime: '11:00',
      endTime: '11:45',
      status: 'SCHEDULED',
      notes: 'Local anesthesia 2% lidocaine. Sterile minor set reserved.',
    },
  });

  // Discharge Summary
  await prisma.dischargeSummary.create({
    data: {
      summaryNo: 'DS-10001',
      patientId: p1.id,
      doctorId: doctor.id,
      admissionDate: new Date(Date.now() - 86400000),
      dischargeDate: new Date(),
      finalDiagnosis: 'Non-cardiac chest wall muscle spasm, Type 2 DM, Mild HTN',
      treatmentGiven: 'Sublingual nitrates ruled out ACS; Troponin-I negative, ECG normal sinus rhythm.',
      conditionOnDischarge: 'Stable, ambulatory, vitals normal.',
      medicationsOnDischarge: '1. Tab Napa 500mg PRN for pain\n2. Tab Comet 500mg (1+0+1)\n3. Tab Amlocal 5mg (0+0+1)',
      followUpAdvice: 'Visit OPD in 2 weeks or immediately if red flags arise.',
      emergencyRedFlags: 'Immediate ER visit if acute squeezing chest pain radiating to left arm, sweating, or severe breathlessness.',
    },
  });

  // 12. Invoices, Multi-Gateway Split Payments, Due Ledger & Refunds
  console.log('🧾 Creating Invoices, Split Payments, Due Ledger & Refunds...');
  // Invoice 1: Fully Paid with Split Payment (Cash + bKash)
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-10001',
      patientId: p1.id,
      appointmentId: appt1.id,
      totalAmount: 1500,
      discount: 200,
      netAmount: 1300,
      status: 'PAID',
      items: {
        create: [
          { description: 'Specialist Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 1000, total: 1000 },
          { description: 'Complete Blood Count (CBC)', category: 'LAB_TEST', quantity: 1, unitPrice: 500, total: 500 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 500,
      method: 'CASH',
      reference: 'Split 1/2 Cash Counter',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 800,
      method: 'BKASH',
      reference: 'Split 2/2 TrxID: BK9948102',
    },
  });

  // Invoice 2: Partially Paid (Appears on Due Ledger with Outstanding Balance)
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-10002',
      patientId: p2.id,
      totalAmount: 2800,
      discount: 300,
      netAmount: 2500,
      status: 'PARTIALLY_PAID',
      items: {
        create: [
          { description: 'Ultrasonography Whole Abdomen', category: 'PROCEDURE', quantity: 1, unitPrice: 1500, total: 1500 },
          { description: 'Lipid Profile Full Panel', category: 'LAB_TEST', quantity: 1, unitPrice: 800, total: 800 },
          { description: 'Daycare Bed Observation (4 hrs)', category: 'PROCEDURE', quantity: 1, unitPrice: 500, total: 500 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      amount: 1000,
      method: 'CARD',
      reference: 'POS Visa Slip #8812',
    },
  });

  // Refund Voucher
  await prisma.refundVoucher.create({
    data: {
      invoiceId: inv1.id,
      voucherNo: 'REF-88001',
      amount: 200,
      reason: 'Billing adjustment concession - corporate coupon applied post-payment',
      approvedBy: 'Clinic Manager (Rafiqul)',
    },
  });

  // 13. Doctor Commissions & Daily Cash Closing
  console.log('💰 Setting up Doctor Commissions & Daily Cash Reconciliation...');
  await prisma.doctorCommission.create({
    data: {
      doctorId: doctor.id,
      appointmentId: appt1.id,
      patientName: p1.name,
      consultationFee: 1000,
      commissionPercent: 40,
      commissionAmount: 400,
      status: 'PENDING',
    },
  });

  await prisma.doctorCommission.create({
    data: {
      doctorId: doctor.id,
      patientName: p2.name,
      consultationFee: 1200,
      commissionPercent: 40,
      commissionAmount: 480,
      status: 'PAID',
      paidDate: new Date(),
    },
  });

  // Yesterday's Daily Closing Ledger Record
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.dailyClosing.create({
    data: {
      closingDate: yesterday,
      shift: 'FULL_DAY',
      cashCollected: 24000,
      cardCollected: 12500,
      digitalCollected: 12000,
      totalExpenses: 4200,
      expectedCashInHand: 19800,
      actualCashInHand: 19800,
      discrepancy: 0.0,
      closedBy: 'Fatima Tuz Zohra (Reception)',
      notes: 'Evening shift cash reconciled with 0 variance. Bank deposit prepared.',
    },
  });

  // 14. Notifications Log
  console.log('📲 Logging Automated Notifications (SMS / WhatsApp)...');
  await prisma.notificationLog.create({
    data: {
      patientId: p1.id,
      recipient: p1.phone,
      channel: 'WHATSAPP',
      type: 'APPOINTMENT_CONFIRMATION',
      message: `Dear ${p1.name}, your appointment with Dr. Mahmudur Rahman is confirmed for today. Token #1.`,
      status: 'DELIVERED',
    },
  });

  await prisma.notificationLog.create({
    data: {
      patientId: p2.id,
      recipient: p2.phone,
      channel: 'SMS',
      type: 'REMINDER',
      message: `Dear ${p2.name}, your tele-consultation is scheduled in 2 hours. Link: https://meet.clinic.local/tele-room-sharmin-8891`,
      status: 'DELIVERED',
    },
  });

  // 15. Audit Trail Logs
  console.log('🔒 Populating Immutable Security Audit Trail...');
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'LOGIN',
        module: 'AUTH',
        userName: admin.name,
        userRole: 'SUPER_ADMIN',
        userId: admin.email,
        details: 'Super Admin signed into Clinic Manager Central Terminal',
        ipAddress: '127.0.0.1',
      },
      {
        action: 'CREATE',
        module: 'PATIENTS',
        userName: receptionist.name,
        userRole: 'RECEPTIONIST',
        recordId: p1.id,
        details: 'Registered patient Mohammad Rahim Uddin with Smart Card UHID-10001',
        userId: receptionist.email,
        ipAddress: '192.168.1.15',
      },
      {
        action: 'CREATE',
        module: 'BILLING',
        userName: receptionist.name,
        userRole: 'RECEPTIONIST',
        recordId: inv1.id,
        details: 'Generated consolidated invoice #INV-10001 for BDT 1,300 with split payment',
        userId: receptionist.email,
        ipAddress: '192.168.1.15',
      },
      {
        action: 'UPDATE',
        module: 'DIAGNOSTICS',
        userName: doctor.name,
        userRole: 'DOCTOR',
        recordId: 'LR-10001',
        details: 'Pathologist verified digital signature applied with token CMS-DS-99214',
        userId: doctor.email,
        ipAddress: '192.168.1.20',
      },
    ],
  });

  console.log('\n======================================================');
  console.log('🎉 ALL 10 CMS SECTIONS SEEDED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('Default Demo Accounts:');
  console.log('  👑 Super Admin:    admin@clinic.com      / admin123');
  console.log('  👔 Clinic Manager: manager@clinic.com    / clinic123');
  console.log('  👨‍⚕️ Doctor:         doctor@clinic.com     / clinic123');
  console.log('  👩‍💼 Receptionist:   reception@clinic.com  / clinic123');
  console.log('  💊 Pharmacist:     pharmacist@clinic.com / clinic123');
  console.log('  🔬 Lab Tech:       lab@clinic.com        / clinic123');
  console.log('  🩺 Nurse:          nurse@clinic.com      / clinic123');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
