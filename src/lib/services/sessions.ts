import "server-only";

import { MembershipType, type Prisma, Role, SessionStatus, SessionType } from "@prisma/client";
import { z } from "zod";
import { canAccessCategory } from "@/lib/auth/authorization";
import { AuthorizationError, type CurrentUser } from "@/lib/auth/session";
import { parseClubDateTime } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";
import { assertSessionTransition } from "./session-transitions";

const optionalDateTime=z.union([z.string().datetime({local:true}),z.literal("")]).transform(value=>value?parseClubDateTime(value):null);
export const createSessionSchema=z.object({categoryId:z.string().min(1),type:z.nativeEnum(SessionType),startsAt:z.string().datetime({local:true}).transform(parseClubDateTime),endsAt:optionalDateTime,location:z.string().trim().max(160).optional().transform(value=>value||null),notes:z.string().trim().max(1000).optional().transform(value=>value||null)}).refine(value=>!value.endsAt||value.endsAt>value.startsAt,{message:"INVALID_END_TIME"});

export async function canManageCategoryWithDb(db:Prisma.TransactionClient|typeof prisma,actor:CurrentUser,categoryId:string,targetDate:Date){if(actor.role===Role.SUPER_ADMIN||actor.role===Role.ADMINISTRATION)return true;if(actor.role!==Role.COACH)return false;return Boolean(await db.categoryMembership.findFirst({where:{userId:actor.id,categoryId,membershipType:MembershipType.COACH,startDate:{lte:targetDate},OR:[{endDate:null},{endDate:{gte:targetDate}}]},select:{id:true}}));}

export async function createSession(actor:CurrentUser,input:unknown){const data=createSessionSchema.parse(input);if(!await canManageCategoryWithDb(prisma,actor,data.categoryId,data.startsAt))throw new AuthorizationError();const season=await prisma.season.findFirst({where:{current:true,startDate:{lte:data.startsAt},endDate:{gte:data.startsAt}},select:{id:true}});if(!season)throw new Error("NO_CURRENT_SEASON");return prisma.session.create({data:{...data,seasonId:season.id,createdById:actor.id,status:SessionStatus.DRAFT},select:{id:true}});}

export async function getSessionForUser(actor:CurrentUser,id:string){const session=await prisma.session.findUnique({where:{id},include:{category:{select:{nameFr:true,nameAr:true}},season:{select:{name:true}},_count:{select:{attendanceRecords:true}}}});if(!session)return null;const canRead=actor.role===Role.SUPER_ADMIN||actor.role===Role.ADMINISTRATION||await canAccessCategory(actor,session.categoryId,session.startsAt);if(!canRead)throw new AuthorizationError();return session;}

export async function getSessionsForUser(actor:CurrentUser,limit=30){const sessions=await prisma.session.findMany({orderBy:{startsAt:"desc"},take:actor.role===Role.SUPER_ADMIN||actor.role===Role.ADMINISTRATION?limit:100,include:{category:{select:{nameFr:true,nameAr:true}},_count:{select:{attendanceRecords:true}}}});if(actor.role===Role.SUPER_ADMIN||actor.role===Role.ADMINISTRATION)return sessions.slice(0,limit);if(actor.role!==Role.COACH&&actor.role!==Role.DIRIGEANT)return[];const allowed=await Promise.all(sessions.map(async session=>await canAccessCategory(actor,session.categoryId,session.startsAt)?session:null));return allowed.filter(session=>session!==null).slice(0,limit);}

export async function cancelSession(actor:CurrentUser,id:string){return prisma.$transaction(async tx=>{const session=await tx.session.findUnique({where:{id},select:{id:true,categoryId:true,startsAt:true,status:true}});if(!session)throw new Error("SESSION_NOT_FOUND");if(!await canManageCategoryWithDb(tx,actor,session.categoryId,session.startsAt))throw new AuthorizationError();assertSessionTransition(session.status,SessionStatus.CANCELLED);return tx.session.update({where:{id},data:{status:SessionStatus.CANCELLED}});});}
