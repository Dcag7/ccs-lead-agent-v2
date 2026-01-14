
// Simple in-memory token store for password resets
// In production, this should be replaced with a database table
// Format: { token: { userId: string, email: string, expires: Date } }
export const passwordResetTokenStore = new Map<string, { userId: string; email: string; expires: Date }>()

// Clean up expired tokens periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = new Date()
    for (const [token, data] of passwordResetTokenStore.entries()) {
      if (data.expires < now) {
        passwordResetTokenStore.delete(token)
      }
    }
  }, 60000) // Clean up every minute
}
