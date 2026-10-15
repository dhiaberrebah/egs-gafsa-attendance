import { SessionStatus } from "@prisma/client";

const transitions: Record<SessionStatus, readonly SessionStatus[]> = {
  DRAFT: [SessionStatus.SUBMITTED, SessionStatus.CANCELLED],
  SUBMITTED: [SessionStatus.LOCKED, SessionStatus.CANCELLED],
  LOCKED: [],
  CANCELLED: [],
};

export function canTransitionSession(from: SessionStatus, to: SessionStatus) {
  return transitions[from].includes(to);
}

export function assertSessionTransition(from: SessionStatus, to: SessionStatus) {
  if (!canTransitionSession(from, to)) throw new Error("INVALID_SESSION_TRANSITION");
}
