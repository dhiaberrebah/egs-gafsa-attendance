"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdministration } from "@/lib/admin/access";
import { createUser, updateUser } from "@/lib/services/users";

export type UserActionState = { error?: "invalid" | "duplicate" };

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createUserAction(_: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdministration();
  try {
    await createUser(actor, formValues(formData));
  } catch (error) {
    if (error instanceof ZodError) return { error: "invalid" };
    if (error instanceof Error && error.message === "DUPLICATE_USER") return { error: "duplicate" };
    throw error;
  }
  revalidatePath("/app/users");
  redirect("/app/users");
}

export async function updateUserAction(_: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdministration();
  try {
    await updateUser(actor, formValues(formData));
  } catch (error) {
    if (error instanceof ZodError) return { error: "invalid" };
    throw error;
  }
  revalidatePath("/app/users");
  revalidatePath(`/app/users/${String(formData.get("id"))}`);
  return {};
}
