import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: string
  username?: string
  isAdmin?: boolean
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'tripdecider-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}
