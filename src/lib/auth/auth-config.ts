import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const staff = await db.staff.findUnique({
          where: { email: credentials.email },
        })

        if (!staff) {
          return null
        }

        if (!staff.isActive) {
          return null
        }

        // Support both bcrypt-hashed passwords and legacy plain text passwords
        let passwordValid = false
        if (staff.password.startsWith('$2') || staff.password.startsWith('$2a') || staff.password.startsWith('$2b')) {
          passwordValid = await bcrypt.compare(credentials.password, staff.password)
        } else {
          passwordValid = staff.password === credentials.password
        }

        if (!passwordValid) {
          return null
        }

        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          department: staff.department,
          specialization: staff.specialization,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = user.role || 'STAFF'
        token.department = user.department
        token.specialization = user.specialization
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.department = token.department as string | undefined
        session.user.specialization = token.specialization as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'oxygen-health-care-secret-key-2024',
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      department?: string
      specialization?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    department?: string
    specialization?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    department?: string
    specialization?: string
  }
}
