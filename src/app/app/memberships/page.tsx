import { endMembershipAction } from "./actions";
import { MembershipForm } from "@/components/admin/membership-form";
import { requireAdministration } from "@/lib/admin/access";
import { formatDate } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { assignableRoles,listMemberships } from "@/lib/services/memberships";

export const instant = false;

export default async function MembershipsPage(){const actor=await requireAdministration();const locale=localeFromPreference(actor.preferredLanguage);const m=getMessages(locale);const[users,categories,seasons,memberships]=await Promise.all([
prisma.user.findMany({where:{active:true,role:{in:assignableRoles}},orderBy:[{lastName:"asc"}],select:{id:true,firstName:true,lastName:true,role:true}}),
prisma.category.findMany({where:{active:true},orderBy:{displayOrder:"asc"},select:{id:true,nameFr:true,nameAr:true}}),prisma.season.findMany({orderBy:{startDate:"desc"},select:{id:true,name:true}}),listMemberships()]);
return <div className="space-y-6"><h1 className="text-2xl font-bold">{m.Memberships.title}</h1><MembershipForm labels={m.Memberships} typeLabels={m.MembershipTypes} users={users.map(u=>({id:u.id,label:`${u.firstName} ${u.lastName} · ${m.Roles[u.role]}`}))} categories={categories.map(c=>({id:c.id,label:locale==="ar"?c.nameAr:c.nameFr}))} seasons={seasons.map(s=>({id:s.id,label:s.name}))}/><section className="rounded-xl bg-white shadow-sm"><h2 className="p-4 font-semibold">{m.Memberships.current}</h2><div className="divide-y divide-zinc-100">{memberships.length?memberships.map(x=><div key={x.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"><span className="font-medium">{x.user.firstName} {x.user.lastName}</span><span>{locale==="ar"?x.category.nameAr:x.category.nameFr} · {m.MembershipTypes[x.membershipType]}</span><span className="text-sm text-zinc-600">{formatDate(x.startDate,locale)} — {x.endDate ? formatDate(x.endDate,locale) : "…"}</span>{x.endDate===null?<form action={endMembershipAction}><input type="hidden" name="id" value={x.id}/><button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">{m.Memberships.end}</button></form>:<span className="text-sm text-zinc-500">{m.Memberships.history}</span>}</div>):<p className="p-5 text-zinc-500">{m.Common.none}</p>}</div></section></div>;
}
