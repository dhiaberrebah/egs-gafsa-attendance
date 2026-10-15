import Link from "next/link";
import { Role,SessionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { CorrectionForm } from "@/components/attendance/correction-form";
import { requireUser } from "@/lib/auth/index";
import { formatDateTime } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { getAttendanceSheet } from "@/lib/services/attendance";

export const instant=false;
export default async function AttendancePage({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();const sheet=await getAttendanceSheet(user,(await params).id);if(!sheet)notFound();
  const locale=localeFromPreference(user.preferredLanguage);const m=getMessages(locale);const{session,roster,records}=sheet;
  const admin=user.role===Role.SUPER_ADMIN||user.role===Role.ADMINISTRATION;
  const readOnly=session.status===SessionStatus.LOCKED||session.status===SessionStatus.CANCELLED||user.role===Role.DIRIGEANT||(admin&&session.status===SessionStatus.SUBMITTED);
  const people=[...roster.players,...roster.coaches,...roster.dirigeants];const names=new Map(people.map(person=>[person.id,`${person.firstName} ${person.lastName}`]));
  const correctionsVisible=admin&&(session.status===SessionStatus.SUBMITTED||session.status===SessionStatus.LOCKED);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{locale==="ar"?session.category.nameAr:session.category.nameFr}</h1><p className="text-zinc-600">{m.Sessions[session.type]} · {formatDateTime(session.startsAt,locale)}</p><span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">{m.Sessions[session.status]}</span></div><AttendanceForm sessionId={session.id} players={roster.players} staff={[...roster.coaches,...roster.dirigeants]} records={records} labels={{...m.Attendance,invalid:m.Users.invalid}} readOnly={readOnly}/>{correctionsVisible?<section className="space-y-3 border-t border-zinc-300 pt-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{m.Audit.correctAttendance}</h2><Link href={`/app/sessions/${session.id}/audit`} className="text-sm font-semibold text-emerald-800">{m.Audit.history}</Link></div>{records.map(record=><CorrectionForm key={record.id} sessionId={session.id} personName={names.get(record.userId)??"—"} record={{id:record.id,status:record.status,note:record.note,auditCount:record._count.auditLogs}} labels={m.Audit} locked={session.status===SessionStatus.LOCKED}/>)}</section>:null}</div>;
}
