import "server-only";

import { AttendanceStatus, Role, SessionStatus } from "@prisma/client";
import { z } from "zod";
import { AuthorizationError, type CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCategoryRoster } from "./roster";
import { assertSessionTransition } from "./session-transitions";
import { canManageCategoryWithDb, getSessionForUser } from "./sessions";

const entrySchema=z.object({userId:z.string().min(1),status:z.nativeEnum(AttendanceStatus),note:z.string().trim().max(500).nullable().optional()});
export const attendanceInputSchema=z.object({sessionId:z.string().min(1),entries:z.array(entrySchema)}).superRefine((value,ctx)=>{if(new Set(value.entries.map(entry=>entry.userId)).size!==value.entries.length)ctx.addIssue({code:"custom",message:"DUPLICATE_ATTENDANCE_USER"});});

function rosterUsers(roster:Awaited<ReturnType<typeof getCategoryRoster>>){return[...roster.players,...roster.coaches,...roster.dirigeants];}
function assertExpectedEntries(expectedIds:string[],entries:{userId:string}[],complete:boolean){const expected=new Set(expectedIds);if(entries.some(entry=>!expected.has(entry.userId)))throw new Error("UNEXPECTED_ATTENDANCE_USER");if(complete&&entries.length!==expected.size)throw new Error("INCOMPLETE_ATTENDANCE");}

export async function getAttendanceSheet(actor:CurrentUser,sessionId:string){const session=await getSessionForUser(actor,sessionId);if(!session) return null;if(actor.role===Role.PLAYER)throw new AuthorizationError();const roster=await getCategoryRoster(session.categoryId,session.startsAt);const records=await prisma.attendanceRecord.findMany({where:{sessionId},select:{id:true,userId:true,status:true,note:true,_count:{select:{auditLogs:true}}}});return{session,roster,records};}

async function writeAttendance(actor:CurrentUser,input:unknown,submit:boolean){const data=attendanceInputSchema.parse(input);return prisma.$transaction(async tx=>{const session=await tx.session.findUnique({where:{id:data.sessionId},select:{id:true,categoryId:true,startsAt:true,status:true}});if(!session)throw new Error("SESSION_NOT_FOUND");if(!await canManageCategoryWithDb(tx,actor,session.categoryId,session.startsAt))throw new AuthorizationError();if(session.status===SessionStatus.LOCKED)throw new Error("SESSION_LOCKED");if(session.status===SessionStatus.CANCELLED)throw new Error("SESSION_CANCELLED");if(session.status===SessionStatus.SUBMITTED&&(actor.role===Role.SUPER_ADMIN||actor.role===Role.ADMINISTRATION))throw new Error("ADMIN_CORRECTION_REQUIRED");const roster=await getCategoryRoster(session.categoryId,session.startsAt,tx);const expectedIds=rosterUsers(roster).map(user=>user.id);const mustBeComplete=submit||session.status===SessionStatus.SUBMITTED;assertExpectedEntries(expectedIds,data.entries,mustBeComplete);
if(session.status===SessionStatus.DRAFT){const markedIds=data.entries.map(entry=>entry.userId);await tx.attendanceRecord.deleteMany({where:{sessionId:session.id,userId:markedIds.length?{in:expectedIds,notIn:markedIds}:{in:expectedIds}}});}
for(const entry of data.entries)await tx.attendanceRecord.upsert({where:{sessionId_userId:{sessionId:session.id,userId:entry.userId}},create:{sessionId:session.id,userId:entry.userId,status:entry.status,note:entry.note||null,markedById:actor.id},update:{status:entry.status,note:entry.note||null,markedById:actor.id,markedAt:new Date()}});
if(submit&&session.status===SessionStatus.DRAFT){assertSessionTransition(session.status,SessionStatus.SUBMITTED);await tx.session.update({where:{id:session.id},data:{status:SessionStatus.SUBMITTED,submittedAt:new Date()}});}return{expected:expectedIds.length,marked:data.entries.length};});}

export function saveAttendanceDraft(actor:CurrentUser,input:unknown){return writeAttendance(actor,input,false);}
export function submitAttendance(actor:CurrentUser,input:unknown){return writeAttendance(actor,input,true);}

export async function lockSession(actor:CurrentUser,sessionId:string){if(actor.role!==Role.SUPER_ADMIN&&actor.role!==Role.ADMINISTRATION)throw new AuthorizationError();return prisma.$transaction(async tx=>{const session=await tx.session.findUnique({where:{id:sessionId},select:{id:true,categoryId:true,startsAt:true,status:true}});if(!session)throw new Error("SESSION_NOT_FOUND");assertSessionTransition(session.status,SessionStatus.LOCKED);const roster=await getCategoryRoster(session.categoryId,session.startsAt,tx);const expectedIds=rosterUsers(roster).map(user=>user.id);const count=await tx.attendanceRecord.count({where:{sessionId,userId:{in:expectedIds}}});if(count!==expectedIds.length)throw new Error("INCOMPLETE_ATTENDANCE");return tx.session.update({where:{id:sessionId},data:{status:SessionStatus.LOCKED,lockedAt:new Date()}});});}
