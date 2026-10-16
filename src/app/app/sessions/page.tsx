import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth/index";
import { formatDateTime } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { getSessionsForUser } from "@/lib/services/sessions";

export const instant=false;
export default async function SessionsPage(){const user=await requireUser();const locale=localeFromPreference(user.preferredLanguage);const m=getMessages(locale);const sessions=await getSessionsForUser(user);const canCreate=([Role.SUPER_ADMIN,Role.ADMINISTRATION,Role.COACH] as Role[]).includes(user.role);const statusStyles={SUBMITTED:"bg-egs-green-100 text-egs-green-900",LOCKED:"bg-egs-green-900 text-white",CANCELLED:"bg-red-100 text-red-800",DRAFT:"bg-zinc-100 text-zinc-700"} as const;
return <div className="space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-egs-green-950">{m.Sessions.title}</h1>{canCreate?<Link href="/app/sessions/new" className="rounded-lg bg-egs-green-800 px-4 py-2.5 font-semibold text-white hover:bg-egs-green-700">{m.Sessions.new}</Link>:null}</div><div className="space-y-3">{sessions.length?sessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="grid gap-2 rounded-xl border border-egs-border bg-egs-surface p-4 transition hover:bg-egs-green-50 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-semibold text-egs-green-950">{locale==="ar"?session.category.nameAr:session.category.nameFr}</p><p className="text-sm text-zinc-600">{m.Sessions[session.type]}</p></div><span className="text-sm text-zinc-600">{formatDateTime(session.startsAt,locale)}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[session.status]}`}>{m.Sessions[session.status]}</span></Link>):<p className="rounded-xl border border-egs-border bg-egs-surface p-6 text-center text-zinc-500">{m.Sessions.empty}</p>}</div></div>;}
