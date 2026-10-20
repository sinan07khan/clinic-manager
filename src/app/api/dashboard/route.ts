import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Parallel queries for dashboard data
    const [
      todayAppointments,
      todayPatients,
      todayPayments,
      todayExpenses,
      lowStockItems,
      doctorAttendance,
      recentAppointments,
      upcomingAppointments,
      weeklyAppointmentsByDay,
      weeklyAppointmentsByDept,
      weeklyAppointmentStatus,
    ] = await Promise.all([
      // Today's appointment count
      db.appointment.count({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Today's unique patient count
      db.appointment.groupBy({
        by: ['patientId'],
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _count: true,
      }),

      // Today's revenue (sum of payments created today)
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Today's expenses
      db.expense.aggregate({
        _sum: { amount: true },
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Low stock items
      db.inventoryItem.findMany({
        where: {
          quantity: { lt: db.inventoryItem.fields.minStock },
        },
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
          minStock: true,
        },
        take: 10,
      }),

      // Doctor attendance today
      db.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          staff: {
            role: 'DOCTOR',
            isActive: true,
          },
        },
        include: {
          staff: {
            select: {
              name: true,
              department: true,
              specialization: true,
            },
          },
        },
      }),

      // Recent appointments (last 5 with patient and doctor info)
      db.appointment.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          patient: {
            select: { name: true },
          },
          doctor: {
            select: { name: true },
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      // Upcoming appointments (next 5 after now)
      db.appointment.findMany({
        where: {
          date: { gte: new Date() },
          status: { in: ['BOOKED', 'CONFIRMED'] },
        },
        include: {
          patient: {
            select: { name: true },
          },
          doctor: {
            select: { name: true },
          },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),

      // Weekly revenue trend (last 7 days)
      db.$queryRaw<Array<{ day: string; revenue: number }>>`
        WITH RECURSIVE dates(d) AS (
          SELECT date('now', '-6 days')
          UNION ALL
          SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
        )
        SELECT
          CASE cast(strftime('%w', dates.d) as integer)
            WHEN 0 THEN 'Sun'
            WHEN 1 THEN 'Mon'
            WHEN 2 THEN 'Tue'
            WHEN 3 THEN 'Wed'
            WHEN 4 THEN 'Thu'
            WHEN 5 THEN 'Fri'
            WHEN 6 THEN 'Sat'
          END as day,
          COALESCE(SUM(p.amount), 0) as revenue
        FROM dates
        LEFT JOIN Payment p ON date(p.createdAt) = dates.d
        GROUP BY dates.d
        ORDER BY dates.d
      `,

      // Weekly patient visits by department (last 7 days)
      db.$queryRaw<Array<{ department: string; visits: number }>>`
        SELECT 
          s.department,
          COUNT(*) as visits
        FROM Appointment a
        JOIN Staff s ON a.doctorId = s.id
        WHERE a.date >= datetime('now', '-7 days')
        AND s.department IS NOT NULL
        GROUP BY s.department
        ORDER BY visits DESC
        LIMIT 6
      `,

      // Weekly appointment status distribution
      db.$queryRaw<Array<{ status: string; count: number }>>`
        SELECT 
          status,
          COUNT(*) as count
        FROM Appointment
        WHERE date >= datetime('now', '-7 days')
        GROUP BY status
        ORDER BY count DESC
      `,
    ])

    // Map recent appointments
    const recentApts = recentAppointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient.name,
      doctorName: apt.doctor.name,
      time: apt.timeSlot,
      status: apt.status,
      type: apt.type,
    }))

    // Map upcoming appointments
    const upcomingApts = upcomingAppointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient.name,
      doctorName: apt.doctor.name,
      date: apt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: apt.timeSlot,
      type: apt.type,
    }))

    // Map doctor attendance
    const doctorAttendanceData = doctorAttendance.map((att) => ({
      id: att.id,
      doctorName: att.staff.name,
      department: att.staff.department || 'Unassigned',
      specialization: att.staff.specialization || 'General',
      status: att.status,
      checkIn: att.checkIn?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }))

    // Status fill colors for pie chart
    const statusFillMap: Record<string, string> = {
      COMPLETED: 'var(--color-completed)',
      CONFIRMED: 'var(--color-confirmed)',
      BOOKED: 'var(--color-booked)',
      CANCELLED: 'var(--color-cancelled)',
      NO_SHOW: 'var(--color-noshow)',
    }

    const statusLabels: Record<string, string> = {
      COMPLETED: 'Completed',
      CONFIRMED: 'Confirmed',
      BOOKED: 'Booked',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
    }

    const appointmentStatus = weeklyAppointmentStatus.map((s) => ({
      status: statusLabels[s.status] || s.status,
      count: s.count,
      fill: statusFillMap[s.status] || 'var(--color-booked)',
    }))

    const dashboardData = {
      stats: {
        todayAppointments: Number(todayAppointments),
        todayPatients: todayPatients.length,
        todayRevenue: Number(todayPayments._sum.amount || 0),
        todayExpenses: Number(todayExpenses._sum.amount || 0),
      },
      recentAppointments: recentApts,
      lowStockItems,
      doctorAttendance: doctorAttendanceData,
      upcomingAppointments: upcomingApts,
      weeklyRevenue: weeklyAppointmentsByDay.map((d) => ({
        day: String(d.day),
        revenue: Number(d.revenue),
      })),
      departmentVisits: weeklyAppointmentsByDept.map((d) => ({
        department: String(d.department),
        visits: Number(d.visits),
      })),
      appointmentStatus: appointmentStatus.map((s) => ({
        ...s,
        count: Number(s.count),
      })),
    }

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
