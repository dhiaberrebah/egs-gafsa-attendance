import { AttendanceStatus } from "@/lib/domain";

export type AttendanceSelection = Record<string, AttendanceStatus | undefined>;

export function markAllPresent(userIds: readonly string[]): AttendanceSelection {
  return Object.fromEntries(userIds.map((userId) => [userId, AttendanceStatus.PRESENT]));
}

export function countMarked(selection: AttendanceSelection) {
  return Object.values(selection).filter(Boolean).length;
}
