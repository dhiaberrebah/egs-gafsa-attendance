import Link from "next/link";
import { requireAdministration } from "@/lib/admin/access";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getCategoryRoster } from "@/lib/services/roster";

export const instant = false;

export default async function CategoriesPage(){const actor=await requireAdministration();const locale=localeFromPreference(actor.preferredLanguage);const m=getMessages(locale);const categories=await prisma.category.findMany({where:{active:true},orderBy:{displayOrder:"asc"},select:{id:true,nameFr:true,nameAr:true}});const rows=await Promise.all(categories.map(async category=>({category,roster:await getCategoryRoster(category.id,new Date())})));
return <div className="space-y-5"><h1 className="text-2xl font-bold text-egs-green-950">{m.Categories.title}</h1><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(({category,roster})=><Link key={category.id} href={`/app/categories/${category.id}`} className="rounded-xl border border-egs-border border-s-4 border-s-egs-green-700 bg-egs-surface p-5 transition hover:bg-egs-green-50"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-egs-green-950">{locale==="ar"?category.nameAr:category.nameFr}</h2><span aria-hidden="true" className="text-egs-green-700 rtl:-scale-x-100">→</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm text-zinc-600"><div><b className="block text-lg text-egs-green-900">{roster.players.length}</b>{m.Categories.players}</div><div><b className="block text-lg text-egs-green-900">{roster.coaches.length}</b>{m.Categories.coaches}</div><div><b className="block text-lg text-egs-green-900">{roster.dirigeants.length}</b>{m.Categories.dirigeants}</div></div></Link>)}</div></div>;
}
