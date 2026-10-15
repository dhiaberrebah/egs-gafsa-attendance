"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/index";
import { createSession,cancelSession } from "@/lib/services/sessions";
import { entityIdSchema } from "@/lib/validation";

export type SessionActionState={error?:"invalid"};
export async function createSessionAction(_:SessionActionState,formData:FormData):Promise<SessionActionState>{const actor=await requireUser();let session;try{session=await createSession(actor,Object.fromEntries(formData.entries()));}catch(error){if(error instanceof ZodError)return{error:"invalid"};throw error;}redirect(`/app/sessions/${session.id}`);}
export async function cancelSessionAction(formData:FormData){const actor=await requireUser();const id=entityIdSchema.parse(formData.get("id"));await cancelSession(actor,id);revalidatePath(`/app/sessions/${id}`);revalidatePath("/app/sessions");}
