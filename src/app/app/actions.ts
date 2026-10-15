"use server";

import { PreferredLanguage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/index";
import { prisma } from "@/lib/prisma";

const languageSchema = z.nativeEnum(PreferredLanguage);

export async function switchLanguageAction(formData: FormData) {
  const user = await requireUser();
  const language = languageSchema.parse(formData.get("language"));
  await prisma.user.update({ where: { id: user.id }, data: { preferredLanguage: language } });
  revalidatePath("/app", "layout");
}
