import { afterAll,beforeAll,describe,expect,it,vi } from "vitest";

vi.mock("server-only",()=>({}));

import { AttendanceStatus,SessionStatus,SessionType } from "@prisma/client";
import { AuthorizationError,type CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { lockSession,saveAttendanceDraft,submitAttendance } from "./attendance";
import { markAllPresent } from "./attendance-state";
import { getCategoryRoster } from "./roster";
import { cancelSession,createSession } from "./sessions";

let coach:CurrentUser;let admin:CurrentUser;let dirigeant:CurrentUser;let cadetsAId:string;let minimeAId:string;let coachSessionId:string;let adminSessionId:string;let expectedIds:string[]=[];
const toUser=async(username:string):Promise<CurrentUser>=>prisma.user.findUniqueOrThrow({where:{username},select:{id:true,username:true,email:true,firstName:true,lastName:true,preferredLanguage:true,role:true}});

beforeAll(async()=>{[coach,admin,dirigeant]=await Promise.all([toUser("dev.coach.cadetsa"),toUser("dev.admin01"),toUser("dev.dirigeant.cadetsa")]);const[cadets,minime]=await Promise.all([prisma.category.findUniqueOrThrow({where:{code:"CADET_A"}}),prisma.category.findUniqueOrThrow({where:{code:"MINIME_A"}})]);cadetsAId=cadets.id;minimeAId=minime.id;coachSessionId=(await createSession(coach,{categoryId:cadetsAId,type:SessionType.TRAINING,startsAt:"2027-05-01T17:00:00",endsAt:"",location:"Test",notes:""})).id;adminSessionId=(await createSession(admin,{categoryId:minimeAId,type:SessionType.TRAINING,startsAt:"2027-05-02T17:00:00",endsAt:"",location:"Test",notes:""})).id;const roster=await getCategoryRoster(cadetsAId,new Date("2027-05-01T17:00:00"));expectedIds=[...roster.players,...roster.coaches,...roster.dirigeants].map(user=>user.id);});

afterAll(async()=>{await prisma.attendanceRecord.deleteMany({where:{sessionId:{in:[coachSessionId,adminSessionId].filter(Boolean)}}});await prisma.session.deleteMany({where:{id:{in:[coachSessionId,adminSessionId].filter(Boolean)}}});await prisma.$disconnect();});

describe.sequential("core attendance workflow",()=>{
  it("lets a coach create a draft session for an assigned category",async()=>{const session=await prisma.session.findUniqueOrThrow({where:{id:coachSessionId}});expect(session.status).toBe(SessionStatus.DRAFT);expect(session.categoryId).toBe(cadetsAId);});
  it("rejects coach session creation for another category",async()=>{await expect(createSession(coach,{categoryId:minimeAId,type:SessionType.TRAINING,startsAt:"2027-05-03T17:00:00",endsAt:"",location:"",notes:""})).rejects.toBeInstanceOf(AuthorizationError);});
  it("lets administration create a session for any category",async()=>{const session=await prisma.session.findUniqueOrThrow({where:{id:adminSessionId}});expect(session.categoryId).toBe(minimeAId);});
  it("saves partial draft attendance without filling unmarked people",async()=>{await saveAttendanceDraft(coach,{sessionId:coachSessionId,entries:[{userId:expectedIds[0],status:AttendanceStatus.PRESENT}]});expect(await prisma.attendanceRecord.count({where:{sessionId:coachSessionId}})).toBe(1);});
  it("marks every roster member present in client state",()=>{const state=markAllPresent(expectedIds);expect(Object.keys(state)).toHaveLength(expectedIds.length);expect(Object.values(state).every(status=>status===AttendanceStatus.PRESENT)).toBe(true);});
  it("rejects incomplete submission",async()=>{await expect(submitAttendance(coach,{sessionId:coachSessionId,entries:[{userId:expectedIds[0],status:AttendanceStatus.PRESENT}]})).rejects.toThrow("INCOMPLETE_ATTENDANCE");});
  it("submits complete attendance with one record per expected user",async()=>{const entries=expectedIds.map((userId,index)=>({userId,status:index===0?AttendanceStatus.ABSENT:AttendanceStatus.PRESENT}));await submitAttendance(coach,{sessionId:coachSessionId,entries});const session=await prisma.session.findUniqueOrThrow({where:{id:coachSessionId}});const records=await prisma.attendanceRecord.findMany({where:{sessionId:coachSessionId}});expect(session.status).toBe(SessionStatus.SUBMITTED);expect(session.submittedAt).not.toBeNull();expect(records).toHaveLength(expectedIds.length);expect(records.filter(record=>record.status===AttendanceStatus.ABSENT)).toHaveLength(1);expect(new Set(records.map(record=>record.userId)).size).toBe(expectedIds.length);});
  it("lets the coach edit complete submitted attendance before lock",async()=>{const entries=expectedIds.map(userId=>({userId,status:AttendanceStatus.PRESENT}));await saveAttendanceDraft(coach,{sessionId:coachSessionId,entries});expect(await prisma.attendanceRecord.count({where:{sessionId:coachSessionId,status:AttendanceStatus.PRESENT}})).toBe(expectedIds.length);});
  it("prevents dirigeant and IDOR edits",async()=>{const entries=expectedIds.map(userId=>({userId,status:AttendanceStatus.PRESENT}));await expect(saveAttendanceDraft(dirigeant,{sessionId:coachSessionId,entries})).rejects.toBeInstanceOf(AuthorizationError);await expect(saveAttendanceDraft(coach,{sessionId:adminSessionId,entries:[]})).rejects.toBeInstanceOf(AuthorizationError);});
  it("prevents edits to a cancelled session",async()=>{await cancelSession(admin,adminSessionId);await expect(saveAttendanceDraft(admin,{sessionId:adminSessionId,entries:[]})).rejects.toThrow("SESSION_CANCELLED");});
  it("lets administration lock complete submitted attendance",async()=>{await lockSession(admin,coachSessionId);const session=await prisma.session.findUniqueOrThrow({where:{id:coachSessionId}});expect(session.status).toBe(SessionStatus.LOCKED);expect(session.lockedAt).not.toBeNull();});
  it("prevents the coach from editing locked attendance",async()=>{const entries=expectedIds.map(userId=>({userId,status:AttendanceStatus.PRESENT}));await expect(saveAttendanceDraft(coach,{sessionId:coachSessionId,entries})).rejects.toThrow("SESSION_LOCKED");});
});
