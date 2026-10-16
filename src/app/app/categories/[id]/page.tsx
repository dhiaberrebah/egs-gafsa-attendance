import { notFound } from "next/navigation";
import { requireAdministration } from "@/lib/admin/access";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getCategoryRoster } from "@/lib/services/roster";

export const instant = false;

export default async function CategoryPage({params}:{params:Promise<{id:string}>}){const actor=await requireAdministration();const locale=localeFromPreference(actor.preferredLanguage);const m=getMessages(locale);const id=(await params).id;const[category,roster]=await Promise.all([prisma.category.findUnique({where:{id},select:{nameFr:true,nameAr:true}}),getCategoryRoster(id,new Date())]);if(!category)notFound();const groups=[[m.Categories.players,roster.players],[m.Categories.coaches,roster.coaches],[m.Categories.dirigeants,roster.dirigeants]] as const;
return <div className="space-y-5"><h1 className="text-2xl font-bold">{locale==="ar"?category.nameAr:category.nameFr}</h1><div className="grid gap-4 lg:grid-cols-3">{groups.map(([label,people])=><section key={label} className="rounded-xl border border-egs-border bg-egs-surface p-4 shadow-sm"><h2 className="font-semibold">{label} ({people.length})</h2><div className="mt-3 divide-y divide-zinc-100">{people.length?people.map(person=><div key={person.id} className="py-2.5"><p className="font-medium">{person.firstName} {person.lastName}</p><p className="text-sm text-zinc-500">@{person.username}</p></div>):<p className="py-4 text-sm text-zinc-500">{m.Categories.empty}</p>}</div></section>)}</div></div>;
}
