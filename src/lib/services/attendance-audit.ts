import "server-only";

import { AttendanceStatus, Role, SessionStatus } from "@prisma/client";
import { z } from "zod";
import { AuthorizationError, type CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const administrativeRoles:Role[]=[Role.SUPER_ADMIN,Role.ADMINISTRATION];
const optionalText=z.union([z.string().trim().max(500),z.null(),z.undefined()]).transform(value=>value||null);
export const correctionSchema=z.object({recordId:z.string().min(1),newStatus:z.nativeEnum(AttendanceStatus),newNote:optionalText,reason:optionalText});

function requireAuditAccess(actor:CurrentUser){if(!administrativeRoles.includes(actor.role))throw new AuthorizationError();}

export async function correctAttendance(actor:CurrentUser,input:unknown){requireAuditAccess(actor);const data=correctionSchema.parse(input);return prisma.$transaction(async tx=>{const record=await tx.attendanceRecord.findUnique({where:{id:data.recordId},select:{id:true,sessionId:true,userId:true,status:true,note:true,session:{select:{status:true}}}});if(!record)throw new Error("ATTENDANCE_RECORD_NOT_FOUND");if(record.session.status===SessionStatus.CANCELLED)throw new Error("SESSION_CANCELLED");if(record.session.status!==SessionStatus.SUBMITTED&&record.session.status!==SessionStatus.LOCKED)throw new Error("SESSION_NOT_SUBMITTED");const previousNote=record.note||null;if(record.status===data.newStatus&&previousNote===data.newNote)throw new Error("NO_CHANGES");await tx.attendanceRecord.update({where:{id:record.id},data:{status:data.newStatus,note:data.newNote}});const audit=await tx.attendanceAuditLog.create({data:{attendanceRecordId:record.id,sessionId:record.sessionId,userId:record.userId,changedById:actor.id,previousStatus:record.status,newStatus:data.newStatus,previousNote,newNote:data.newNote,reason:data.reason},select:{id:true}});return audit;});}

export async function getAttendanceAuditHistory(actor:CurrentUser,attendanceRecordId:string){requireAuditAccess(actor);return prisma.attendanceAuditLog.findMany({where:{attendanceRecordId},orderBy:{changedAt:"asc"},select:{previousStatus:true,newStatus:true,previousNote:true,newNote:true,reason:true,changedAt:true,user:{select:{firstName:true,lastName:true}},changedBy:{select:{firstName:true,lastName:true}}}});}

export async function getSessionAuditHistory(actor:CurrentUser,sessionId:string){requireAuditAccess(actor);return prisma.attendanceAuditLog.findMany({where:{sessionId},orderBy:{changedAt:"asc"},select:{previousStatus:true,newStatus:true,previousNote:true,newNote:true,reason:true,changedAt:true,user:{select:{firstName:true,lastName:true}},changedBy:{select:{firstName:true,lastName:true}}}});}
