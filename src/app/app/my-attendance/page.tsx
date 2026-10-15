import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { StatsCards } from "@/components/reports/stats-cards";
import { requireUser } from "@/lib/auth/index";
import { formatDate } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { getPersonAttendanceReport } from "@/lib/services/reporting";

export const instant=false;
export default async function MyAttendancePage(){const actor=await requireUser();if(actor.role!==Role.PLAYER)notFound();const locale=localeFromPreference(actor.preferredLanguage);const m=getMessages(locale);const report=await getPersonAttendanceReport(actor,actor.id,{});return <div className="space-y-6"><h1 className="text-2xl font-bold">{m.Nav.myAttendance}</h1><StatsCards stats={report.stats} labels={m.Reports}/>{report.integrityWarning?<p className="rounded-lg bg-amber-50 p-3 text-amber-800">{m.Reports.integrityWarning}</p>:null}<section className="rounded-xl bg-white shadow-sm"><h2 className="p-4 font-bold">{m.Reports.history}</h2><div className="divide-y divide-zinc-100">{report.history.length?report.history.slice(0,20).map((entry,index)=><div key={`${entry.date.toISOString()}-${index}`} className="grid gap-1 p-4 sm:grid-cols-4"><span>{formatDate(entry.date,locale)}</span><span>{locale==="ar"?entry.category.nameAr:entry.category.nameFr}</span><span>{m.Sessions[entry.type]}</span><strong>{m.Reports[entry.status]}</strong></div>):<p className="p-5 text-zinc-500">{m.Reports.noData}</p>}</div></section></div>;}
