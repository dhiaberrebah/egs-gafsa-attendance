import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth/index";
import { formatDateTime } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { getSessionsForUser } from "@/lib/services/sessions";

export const instant=false;
export default async function SessionsPage(){const user=await requireUser();const locale=localeFromPreference(user.preferredLanguage);const m=getMessages(locale);const sessions=await getSessionsForUser(user);const canCreate=([Role.SUPER_ADMIN,Role.ADMINISTRATION,Role.COACH] as Role[]).includes(user.role);return <div className="space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{m.Sessions.title}</h1>{canCreate?<Link href="/app/sessions/new" className="rounded-lg bg-emerald-800 px-4 py-2.5 font-semibold text-white">{m.Sessions.new}</Link>:null}</div><div className="space-y-3">{sessions.length?sessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="grid gap-2 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-semibold">{locale==="ar"?session.category.nameAr:session.category.nameFr}</p><p className="text-sm text-zinc-600">{m.Sessions[session.type]}</p></div><span className="text-sm">{formatDateTime(session.startsAt,locale)}</span><span className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold">{m.Sessions[session.status]}</span></Link>):<p className="rounded-xl bg-white p-6 text-center text-zinc-500">{m.Sessions.empty}</p>}</div></div>;}
