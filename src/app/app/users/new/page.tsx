import { Role } from "@prisma/client";
import { UserForm } from "@/components/admin/user-form";
import { requireAdministration } from "@/lib/admin/access";
import { getMessages, localeFromPreference } from "@/lib/i18n";

export const instant = false;

export default async function NewUserPage() {
  const actor=await requireAdministration(); const m=getMessages(localeFromPreference(actor.preferredLanguage));
  const roles=actor.role===Role.SUPER_ADMIN?Object.values(Role):[Role.PLAYER,Role.COACH,Role.DIRIGEANT];
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{m.Users.new}</h1><UserForm labels={m.Users} roleLabels={m.Roles} languageLabels={m.Languages} roles={roles}/></div>;
}
