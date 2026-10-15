import "server-only";

import { MembershipType, Role } from "@prisma/client";
import { z } from "zod";
import type { CurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { membershipTypeForRole } from "@/lib/services/users";

const optionalDate = z.union([z.iso.date(), z.literal("")]).transform((value) => value ? new Date(`${value}T00:00:00.000Z`) : null);
export const membershipSchema = z.object({
  userId:z.string().min(1), categoryId:z.string().min(1), seasonId:z.string().min(1), membershipType:z.nativeEnum(MembershipType),
  startDate:z.iso.date().transform((value)=>new Date(`${value}T00:00:00.000Z`)), endDate:optionalDate,
}).refine((value)=>!value.endDate||value.endDate>=value.startDate,{message:"INVALID_DATE_RANGE"});

export function dateRangesOverlap(startA:Date,endA:Date|null,startB:Date,endB:Date|null){return (endB===null||startA<=endB)&&(endA===null||startB<=endA);}

export async function createMembership(actor:CurrentUser,input:unknown){
  if(!canManageUsers(actor))throw new AuthorizationError(); const data=membershipSchema.parse(input);
  const [user,category,season]=await Promise.all([
    prisma.user.findUnique({where:{id:data.userId},select:{role:true}}), prisma.category.findUnique({where:{id:data.categoryId},select:{id:true}}), prisma.season.findUnique({where:{id:data.seasonId},select:{id:true}}),
  ]);
  if(!user||!category||!season||membershipTypeForRole[user.role]!==data.membershipType)throw new Error("INVALID_MEMBERSHIP");
  const overlap=await prisma.categoryMembership.findFirst({where:{userId:data.userId,categoryId:data.categoryId,seasonId:data.seasonId,membershipType:data.membershipType,startDate:{lte:data.endDate??new Date("9999-12-31T00:00:00.000Z")},OR:[{endDate:null},{endDate:{gte:data.startDate}}]},select:{id:true}});
  if(overlap)throw new Error("OVERLAPPING_MEMBERSHIP");
  return prisma.categoryMembership.create({data:{...data,active:!data.endDate||data.endDate>=new Date()}});
}

export async function endMembership(actor:CurrentUser,id:string,endDate=new Date()){
  if(!canManageUsers(actor))throw new AuthorizationError();
  const membership=await prisma.categoryMembership.findUnique({where:{id},select:{startDate:true}}); if(!membership)throw new Error("MEMBERSHIP_NOT_FOUND");
  if(endDate<membership.startDate)throw new Error("INVALID_DATE_RANGE");
  return prisma.categoryMembership.update({where:{id},data:{endDate,active:false}});
}

export async function listMemberships(){return prisma.categoryMembership.findMany({orderBy:[{active:"desc"},{startDate:"desc"}],select:{id:true,membershipType:true,startDate:true,endDate:true,active:true,user:{select:{firstName:true,lastName:true}},category:{select:{nameFr:true,nameAr:true}},season:{select:{name:true}}}});}

export const assignableRoles=[Role.PLAYER,Role.COACH,Role.DIRIGEANT];
