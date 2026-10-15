"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/index";
import { lockSession,saveAttendanceDraft,submitAttendance } from "@/lib/services/attendance";
import { correctAttendance } from "@/lib/services/attendance-audit";
import { entityIdSchema } from "@/lib/validation";

export type AttendanceActionState={error?:"invalid"|"incomplete"|"locked";success?:"saved"|"submitted"|"locked"};
export async function attendanceAction(_:AttendanceActionState,formData:FormData):Promise<AttendanceActionState>{const actor=await requireUser();const intent=String(formData.get("intent"));let input;try{input={sessionId:String(formData.get("sessionId")),entries:JSON.parse(String(formData.get("entries")||"[]"))};const result=intent==="submit"?await submitAttendance(actor,input):await saveAttendanceDraft(actor,input);revalidatePath(`/app/sessions/${input.sessionId}`);revalidatePath(`/app/sessions/${input.sessionId}/attendance`);return{success:intent==="submit"?"submitted":"saved",...(result.marked<result.expected?{}:{})};}catch(error){if(error instanceof ZodError||error instanceof SyntaxError)return{error:"invalid"};if(error instanceof Error&&error.message==="INCOMPLETE_ATTENDANCE")return{error:"incomplete"};if(error instanceof Error&&["SESSION_LOCKED","SESSION_CANCELLED"].includes(error.message))return{error:"locked"};throw error;}}
export async function lockAttendanceAction(formData:FormData){const actor=await requireUser();const id=entityIdSchema.parse(formData.get("sessionId"));await lockSession(actor,id);revalidatePath(`/app/sessions/${id}`);revalidatePath(`/app/sessions/${id}/attendance`);}

export type CorrectionActionState={error?:"invalid"|"noChange";success?:true};
export async function correctAttendanceAction(_:CorrectionActionState,formData:FormData):Promise<CorrectionActionState>{const actor=await requireUser();try{await correctAttendance(actor,{recordId:formData.get("recordId"),newStatus:formData.get("newStatus"),newNote:formData.get("newNote"),reason:formData.get("reason")});}catch(error){if(error instanceof ZodError)return{error:"invalid"};if(error instanceof Error&&error.message==="NO_CHANGES")return{error:"noChange"};throw error;}const sessionId=String(formData.get("sessionId"));revalidatePath(`/app/sessions/${sessionId}/attendance`);revalidatePath(`/app/sessions/${sessionId}/audit`);return{success:true};}
