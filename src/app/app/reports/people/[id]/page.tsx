import { notFound } from "next/navigation";
import { ReportFilters } from "@/components/reports/report-filters";
import { StatsCards } from "@/components/reports/stats-cards";
import { requireUser } from "@/lib/auth/index";
import { AuthorizationError } from "@/lib/auth/session";
import { formatDate } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getPersonAttendanceReport } from "@/lib/services/reporting";

export const instant=false;type Params={seasonId?:string;month?:string;startDate?:string;endDate?:string};
export default async function PersonReportPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Params>}){const actor=await requireUser();const values=await searchParams;const locale=localeFromPreference(actor.preferredLanguage);const m=getMessages(locale);let report;try{report=await getPersonAttendanceReport(actor,(await params).id,values);}catch(error){if(error instanceof AuthorizationError)notFound();throw error;}const seasons=await prisma.season.findMany({orderBy:{startDate:"desc"},select:{id:true,name:true}});return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{report.person.firstName} {report.person.lastName}</h1><p className="text-zinc-600">{m.Roles[report.person.role]}</p></div><ReportFilters labels={m.Reports} seasons={seasons.map(s=>({id:s.id,label:s.name}))} categories={[]} values={values} showCategory={false}/><StatsCards stats={report.stats} labels={m.Reports}/>{report.integrityWarning?<p className="rounded-lg bg-amber-50 p-3 text-amber-800">{m.Reports.integrityWarning}</p>:null}<section className="rounded-xl border border-egs-border bg-egs-surface shadow-sm"><h2 className="p-4 font-bold">{m.Reports.history}</h2><div className="divide-y divide-zinc-100">{report.history.length?report.history.map((entry,index)=><div key={`${entry.date.toISOString()}-${index}`} className="grid gap-1 p-4 sm:grid-cols-4"><span>{formatDate(entry.date,locale)}</span><span>{locale==="ar"?entry.category.nameAr:entry.category.nameFr}</span><span>{m.Sessions[entry.type]}</span><strong>{m.Reports[entry.status]}</strong></div>):<p className="p-5 text-zinc-500">{m.Reports.noData}</p>}</div></section></div>;}
