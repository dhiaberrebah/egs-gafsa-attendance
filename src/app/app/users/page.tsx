import Link from "next/link";
import { Role } from "@prisma/client";
import { requireAdministration } from "@/lib/admin/access";
import { getMessages, localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { listUsers } from "@/lib/services/users";

export const instant = false;

type Props = { searchParams: Promise<{ q?:string; role?:string; category?:string; active?:string }> };
export default async function UsersPage({ searchParams }: Props) {
  const actor = await requireAdministration();
  const locale = localeFromPreference(actor.preferredLanguage); const m = getMessages(locale); const params = await searchParams;
  const role = Object.values(Role).includes(params.role as Role) ? params.role as Role : undefined;
  const active = params.active === "true" ? true : params.active === "false" ? false : undefined;
  const [users,categories] = await Promise.all([listUsers(actor,{query:params.q,role,categoryId:params.category||undefined,active}),prisma.category.findMany({where:{active:true},orderBy:{displayOrder:"asc"},select:{id:true,nameFr:true,nameAr:true}})]);
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">{m.Users.title}</h1><Link href="/app/users/new" className="rounded-lg bg-egs-green-800 px-4 py-2.5 font-semibold text-white">{m.Users.new}</Link></div>
    <form className="grid gap-3 rounded-xl border border-egs-border bg-egs-surface p-4 shadow-sm sm:grid-cols-4">
      <input name="q" defaultValue={params.q} placeholder={m.Common.search} className="h-11 rounded-lg border border-zinc-300 px-3" />
      <select name="role" defaultValue={params.role??""} className="h-11 rounded-lg border border-zinc-300 px-3"><option value="">{m.Common.all}</option>{Object.values(Role).map(r=><option key={r} value={r}>{m.Roles[r]}</option>)}</select>
      <select name="category" defaultValue={params.category??""} className="h-11 rounded-lg border border-zinc-300 px-3"><option value="">{m.Common.all}</option>{categories.map(c=><option key={c.id} value={c.id}>{locale==="ar"?c.nameAr:c.nameFr}</option>)}</select>
      <div className="flex gap-2"><select name="active" defaultValue={params.active??""} className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 px-2"><option value="">{m.Common.all}</option><option value="true">{m.Common.active}</option><option value="false">{m.Common.inactive}</option></select><button className="rounded-lg bg-zinc-900 px-4 text-white">{m.Common.search}</button></div>
    </form>
    <div className="overflow-hidden rounded-xl border border-egs-border bg-egs-surface shadow-sm">{users.length ? <div className="divide-y divide-zinc-100">{users.map(user=><Link href={`/app/users/${user.id}`} key={user.id} className="grid gap-2 p-4 hover:bg-zinc-50 sm:grid-cols-[1.3fr_1fr_1.5fr_auto] sm:items-center"><div><p className="font-semibold">{user.firstName} {user.lastName}</p><p className="text-sm text-zinc-500">@{user.username}</p></div><span className="text-sm">{m.Roles[user.role]}</span><span className="text-sm text-zinc-600">{user.categoryMemberships.map(x=>locale==="ar"?x.category.nameAr:x.category.nameFr).join(", ")||"—"}</span><span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${user.active?"bg-egs-green-100 text-egs-green-800":"bg-zinc-200 text-zinc-700"}`}>{user.active?m.Common.active:m.Common.inactive}</span></Link>)}</div>:<p className="p-6 text-center text-zinc-500">{m.Common.none}</p>}</div>
  </div>;
}
