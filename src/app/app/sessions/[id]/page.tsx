import Link from "next/link";
import { Role,SessionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { cancelSessionAction } from "../actions";
import { lockAttendanceAction } from "./attendance/actions";
import { requireUser } from "@/lib/auth/index";
import { formatDateTime } from "@/lib/date-time";
import { getMessages,localeFromPreference } from "@/lib/i18n";
import { getSessionForUser } from "@/lib/services/sessions";

export const instant=false;
export default async function SessionPage({params}:{params:Promise<{id:string}>}){const user=await requireUser();const id=(await params).id;const session=await getSessionForUser(user,id);if(!session)notFound();const locale=localeFromPreference(user.preferredLanguage);const m=getMessages(locale);const admin=user.role===Role.SUPER_ADMIN||user.role===Role.ADMINISTRATION;const editable=session.status!==SessionStatus.LOCKED&&session.status!==SessionStatus.CANCELLED&&(admin||user.role===Role.COACH);return <div className="space-y-5"><div className="rounded-xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{locale==="ar"?session.category.nameAr:session.category.nameFr}</h1><p className="text-zinc-600">{m.Sessions[session.type]} · {formatDateTime(session.startsAt,locale)}</p>{session.location?<p className="mt-1 text-sm text-zinc-500">{session.location}</p>:null}</div><span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold">{m.Sessions[session.status]}</span></div></div><div className="flex flex-wrap gap-3"><Link href={`/app/sessions/${id}/attendance`} className="min-h-12 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white">{editable?m.Sessions.markAttendance:m.Sessions.open}</Link>{admin&&session.status===SessionStatus.SUBMITTED?<form action={lockAttendanceAction}><input type="hidden" name="sessionId" value={id}/><button className="min-h-12 rounded-lg bg-zinc-900 px-5 font-semibold text-white">{m.Attendance.lock}</button></form>:null}{editable&&([SessionStatus.DRAFT,SessionStatus.SUBMITTED] as SessionStatus[]).includes(session.status)?<form action={cancelSessionAction}><input type="hidden" name="id" value={id}/><button className="min-h-12 rounded-lg border border-red-300 px-5 font-semibold text-red-700">{m.Sessions.cancel}</button></form>:null}</div></div>;}
