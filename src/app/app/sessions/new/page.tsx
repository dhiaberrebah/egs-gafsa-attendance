import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { SessionForm } from "@/components/attendance/session-form";
import { getAccessibleCategories,requireUser } from "@/lib/auth/index";
import { getMessages,localeFromPreference } from "@/lib/i18n";

export const instant=false;
export default async function NewSessionPage(){const user=await requireUser();if(!([Role.SUPER_ADMIN,Role.ADMINISTRATION,Role.COACH] as Role[]).includes(user.role))notFound();const locale=localeFromPreference(user.preferredLanguage);const m=getMessages(locale);const categories=await getAccessibleCategories(user,new Date());return <div className="space-y-5"><h1 className="text-2xl font-bold">{m.Sessions.new}</h1><SessionForm labels={{...m.Sessions,invalid:m.Users.invalid}} typeLabels={m.Sessions} categories={categories.map(category=>({id:category.id,label:locale==="ar"?category.nameAr:category.nameFr}))}/></div>;}
