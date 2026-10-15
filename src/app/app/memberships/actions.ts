"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireAdministration } from "@/lib/admin/access";
import { createMembership, endMembership } from "@/lib/services/memberships";
import { entityIdSchema } from "@/lib/validation";

export type MembershipState={error?:"invalid"|"overlap"};
export async function createMembershipAction(_:MembershipState,formData:FormData):Promise<MembershipState>{const actor=await requireAdministration();try{await createMembership(actor,Object.fromEntries(formData.entries()));}catch(error){if(error instanceof ZodError||error instanceof Error&&error.message==="INVALID_MEMBERSHIP")return{error:"invalid"};if(error instanceof Error&&error.message==="OVERLAPPING_MEMBERSHIP")return{error:"overlap"};throw error;}revalidatePath("/app/memberships");return{};}
export async function endMembershipAction(formData:FormData){const actor=await requireAdministration();await endMembership(actor,entityIdSchema.parse(formData.get("id")));revalidatePath("/app/memberships");}
