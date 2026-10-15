import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/admin/user-form";
import { requireAdministration } from "@/lib/admin/access";
import { getMessages, localeFromPreference } from "@/lib/i18n";
import { getUserProfile } from "@/lib/services/users";

export const instant = false;

export default async function UserProfilePage({params}:{params:Promise<{id:string}>}) {
  const actor=await requireAdministration(); const user=await getUserProfile(actor,(await params).id); if(!user)notFound();
  if(actor.role!==Role.SUPER_ADMIN&&([Role.SUPER_ADMIN,Role.ADMINISTRATION] as Role[]).includes(user.role))notFound();
  const m=getMessages(localeFromPreference(actor.preferredLanguage)); const roles=actor.role===Role.SUPER_ADMIN?Object.values(Role):[Role.PLAYER,Role.COACH,Role.DIRIGEANT];
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{m.Users.profile}: {user.firstName} {user.lastName}</h1><UserForm labels={m.Users} roleLabels={m.Roles} languageLabels={m.Languages} roles={roles} user={user}/></div>;
}
