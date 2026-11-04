export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMINISTRATION: "ADMINISTRATION",
  COACH: "COACH",
  DIRIGEANT: "DIRIGEANT",
  PLAYER: "PLAYER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const LOGIN_ROLES = [Role.SUPER_ADMIN, Role.ADMINISTRATION, Role.COACH] as const;
export type LoginRole = (typeof LOGIN_ROLES)[number];
export function canAuthenticateRole(role: Role): role is LoginRole {
  return (LOGIN_ROLES as readonly Role[]).includes(role);
}

export const PreferredLanguage = { FR: "FR", AR: "AR" } as const;
export type PreferredLanguage = (typeof PreferredLanguage)[keyof typeof PreferredLanguage];

export const MembershipType = {
  PLAYER: "PLAYER",
  COACH: "COACH",
  DIRIGEANT: "DIRIGEANT",
} as const;
export type MembershipType = (typeof MembershipType)[keyof typeof MembershipType];

export const SessionType = {
  TRAINING: "TRAINING",
  MATCH: "MATCH",
  MEETING: "MEETING",
  OTHER: "OTHER",
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  LATE: "LATE",
  ABSENT: "ABSENT",
  EXCUSED: "EXCUSED",
  INJURED: "INJURED",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];
