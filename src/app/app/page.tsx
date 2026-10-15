import Link from "next/link";
import { Role } from "@prisma/client";
import { getAccessibleCategories, requireUser } from "@/lib/auth/index";
import { formatDate } from "@/lib/date-time";
import { getMessages, localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getSessionsForUser } from "@/lib/services/sessions";

export const instant = false;

function dayBounds(date:Date){const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);return{start,end};}

export default async function AppHomePage() {
  const user = await requireUser(); const locale = localeFromPreference(user.preferredLanguage); const messages = getMessages(locale);
  const isAdministration = user.role === Role.SUPER_ADMIN || user.role === Role.ADMINISTRATION;
  const season = await prisma.season.findFirst({ where: { current: true }, select: { name: true } }); const today=dayBounds(new Date());

  if (isAdministration) {
    const [players, coaches, dirigeants, activeCategories,todaySessions] = await Promise.all([
      prisma.user.count({ where: { role: Role.PLAYER, active: true } }), prisma.user.count({ where: { role: Role.COACH, active: true } }),
      prisma.user.count({ where: { role: Role.DIRIGEANT, active: true } }), prisma.category.count({ where: { active: true } }),
      prisma.session.findMany({where:{startsAt:{gte:today.start,lt:today.end}},orderBy:{startsAt:"asc"},include:{category:{select:{nameFr:true,nameAr:true}}}}),
    ]);
    const summaries = [[messages.Home.players,players],[messages.Home.coaches,coaches],[messages.Home.dirigeants,dirigeants],[messages.Home.activeCategories,activeCategories]] as const;
    return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{messages.Common.club}</h1><p className="text-zinc-600">{messages.Common.season}: {season?.name??"—"}</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaries.map(([label,value])=><div key={label} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-zinc-600">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div><div className="grid gap-3 sm:grid-cols-3"><Link href="/app/users/new" className="rounded-xl bg-emerald-800 p-4 text-center font-semibold text-white">{messages.Home.addPerson}</Link><Link href="/app/memberships" className="rounded-xl bg-white p-4 text-center font-semibold shadow-sm">{messages.Home.manageMemberships}</Link><Link href="/app/categories" className="rounded-xl bg-white p-4 text-center font-semibold shadow-sm">{messages.Home.viewCategories}</Link></div><section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{messages.Sessions.today}</h2><Link href="/app/sessions" className="text-sm font-semibold text-emerald-800">{messages.Sessions.title}</Link></div><div className="space-y-2">{todaySessions.length?todaySessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"><span>{locale==="ar"?session.category.nameAr:session.category.nameFr} · {messages.Sessions[session.type]}</span><span className="text-sm font-semibold">{messages.Sessions[session.status]}</span></Link>):<p className="rounded-xl bg-white p-4 text-zinc-500">{messages.Sessions.waiting}</p>}</div></section></div>;
  }

  const categories = user.role===Role.COACH||user.role===Role.DIRIGEANT?await getAccessibleCategories(user,new Date()):[];const sessions=user.role===Role.COACH||user.role===Role.DIRIGEANT?await getSessionsForUser(user,8):[];const todaySessions=sessions.filter(session=>session.startsAt>=today.start&&session.startsAt<today.end);const primary=todaySessions[0]?`/app/sessions/${todaySessions[0].id}/attendance`:"/app/sessions/new";
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{messages.Auth.greeting.replace("{name}",user.firstName)}</h1><p className="text-zinc-600">{messages.Common.season}: {season?.name??"—"}</p></div>{categories.length?<section><h2 className="mb-3 font-semibold">{messages.Home.assignedCategories}</h2><div className="grid gap-3 sm:grid-cols-2">{categories.map(category=><div key={category.id} className="rounded-xl bg-white p-4 shadow-sm">{locale==="ar"?category.nameAr:category.nameFr}</div>)}</div></section>:null}{user.role===Role.COACH?<Link href={primary} className="block min-h-14 rounded-xl bg-emerald-800 p-4 text-center text-lg font-bold text-white">{messages.Sessions.markAttendance}</Link>:null}{user.role!==Role.PLAYER?<section><h2 className="mb-3 font-semibold">{messages.Sessions.today}</h2><div className="space-y-2">{todaySessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex justify-between rounded-xl bg-white p-4 shadow-sm"><span>{locale==="ar"?session.category.nameAr:session.category.nameFr}</span><span>{messages.Sessions[session.status]}</span></Link>)}</div><h2 className="mb-3 mt-6 font-semibold">{messages.Sessions.recent}</h2><div className="space-y-2">{sessions.slice(0,5).map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex justify-between rounded-xl bg-white p-4 shadow-sm"><span>{locale==="ar"?session.category.nameAr:session.category.nameFr} · {messages.Sessions[session.type]}</span><span className="text-sm">{formatDate(session.startsAt,locale)}</span></Link>)}</div></section>:<div className="rounded-xl bg-white p-5 shadow-sm">{messages.Home.welcome}, {user.firstName}.</div>}</div>;
}
