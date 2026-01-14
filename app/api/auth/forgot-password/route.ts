
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { passwordResetTokenStore } from '@/lib/password-reset-tokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        message: 'If a user with that email exists, a password reset link will be sent.' 
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in memory store
    passwordResetTokenStore.set(token, {
      userId: user.id,
      email: user.email,
      expires
    })

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000')
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

    // TODO: Send password reset email
    // For now, in development, we'll log the token
    console.log(`Password reset token for ${email}: ${token}`)
    console.log(`Reset URL: ${resetUrl}`)

    // In development, return the token so you can test
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        message: 'If a user with that email exists, a password reset link will be sent.',
        dev_token: token,
        dev_url: resetUrl
      })
    }

    return NextResponse.json({ 
      message: 'If a user with that email exists, a password reset link will be sent.'
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
