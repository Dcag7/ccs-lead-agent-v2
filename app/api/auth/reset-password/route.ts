
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { passwordResetTokenStore } from '@/lib/password-reset-tokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Get token data from store
    const tokenData = passwordResetTokenStore.get(token)

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if token has expired
    if (tokenData.expires < new Date()) {
      passwordResetTokenStore.delete(token)
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { password: hashedPassword }
    })

    // Delete the used token
    passwordResetTokenStore.delete(token)

    return NextResponse.json({ 
      message: 'Password reset successfully' 
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
