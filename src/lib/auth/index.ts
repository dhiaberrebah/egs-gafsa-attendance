export {
  AuthorizationError,
  getCurrentUser,
  requireAnyRole,
  requireRole,
  requireUser,
  type CurrentUser,
} from "./session";
export {
  canAccessCategory,
  canEditAttendance,
  canManageSession,
  canViewAttendance,
  getAccessibleCategories,
  requireCategoryAccess,
} from "./authorization";
