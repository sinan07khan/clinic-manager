import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import bcrypt from 'bcryptjs'

// POST /api/auth/change-password - Change the logged-in user's password
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirmation are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: 'New password must be less than 128 characters' },
        { status: 400 }
      )
    }

    // Fetch current staff record with password
    const staff = await db.staff.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    // Verify current password (support both bcrypt and legacy plain text)
    let currentPasswordValid = false
    if (staff.password.startsWith('$2') || staff.password.startsWith('$2a') || staff.password.startsWith('$2b')) {
      currentPasswordValid = await bcrypt.compare(currentPassword, staff.password)
    } else {
      currentPasswordValid = staff.password === currentPassword
    }

    if (!currentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash the new password with bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await db.staff.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
