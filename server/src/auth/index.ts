// Re-export all authentication utilities
export { 
  requireAuth, 
  optionalAuth, 
  devAuth, 
  requireRole,
  getReplitUser,
  type ReplitUser,
  type AuthenticatedRequest 
} from './replitAuth.js'

export { 
  sessionMiddleware, 
  sessionConfig,
  destroyUserSessions,
  getActiveSessionCount,
  cleanupExpiredSessions 
} from './session.js'