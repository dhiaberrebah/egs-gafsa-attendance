import Link from "next/link";
import { Role } from "@prisma/client";
import { getAccessibleCategories, requireUser } from "@/lib/auth/index";
import { formatDate } from "@/lib/date-time";
import { getMessages, localeFromPreference } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getSessionsForUser } from "@/lib/services/sessions";

export const instant = false;

function dayBounds(date:Date){const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);return{start,end};}

function Hero({club,season,title,subtitle,chip}:{club:string;season:string;title:string;subtitle:string;chip?:string}){
  return <section className="rounded-2xl bg-egs-green-950 p-5 sm:p-6">
    <p className="text-sm font-bold text-egs-yellow-400">{club} · {season}</p>
    <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
    <p className="mt-0.5 text-sm text-egs-green-100">{subtitle}</p>
    {chip?<span className="mt-3 inline-block rounded-full border border-egs-green-700 bg-egs-green-900 px-3 py-1 text-xs font-semibold text-egs-green-100">{chip}</span>:null}
    <div className="mt-4 h-px bg-egs-green-800"><div className="h-px w-20 bg-egs-yellow-400"/></div>
  </section>;
}

export default async function AppHomePage() {
  const user = await requireUser(); const locale = localeFromPreference(user.preferredLanguage); const messages = getMessages(locale);
  const isAdministration = user.role === Role.SUPER_ADMIN || user.role === Role.ADMINISTRATION;
  const season = await prisma.season.findFirst({ where: { current: true }, select: { name: true } }); const today=dayBounds(new Date());
  const seasonName = season?.name ?? "—";
  const greeting = messages.Auth.greeting.replace("{name}", user.firstName);

  if (isAdministration) {
    const [players, coaches, dirigeants, activeCategories,todaySessions] = await Promise.all([
      prisma.user.count({ where: { role: Role.PLAYER, active: true } }), prisma.user.count({ where: { role: Role.COACH, active: true } }),
      prisma.user.count({ where: { role: Role.DIRIGEANT, active: true } }), prisma.category.count({ where: { active: true } }),
      prisma.session.findMany({where:{startsAt:{gte:today.start,lt:today.end}},orderBy:{startsAt:"asc"},include:{category:{select:{nameFr:true,nameAr:true}}}}),
    ]);
    const summaries = [[messages.Home.players,players],[messages.Home.coaches,coaches],[messages.Home.dirigeants,dirigeants],[messages.Home.activeCategories,activeCategories]] as const;
    return <div className="space-y-6">
      <Hero club={messages.Common.club} season={seasonName} title={greeting} subtitle={messages.Roles[user.role]}/>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaries.map(([label,value])=><div key={label} className="rounded-xl border border-egs-border bg-egs-surface p-4"><p className="text-sm font-medium text-zinc-700">{label}</p><p className="mt-1 text-2xl font-bold text-egs-green-900">{value}</p></div>)}</div>
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3"><Link href="/app/users/new" className="flex min-h-11 items-center justify-center rounded-xl bg-egs-green-800 px-4 text-center font-semibold text-white hover:bg-egs-green-700">{messages.Home.addPerson}</Link><Link href="/app/memberships" className="flex min-h-11 items-center justify-center rounded-xl border border-egs-border bg-egs-surface px-4 text-center font-semibold text-egs-green-900 hover:bg-egs-green-50">{messages.Home.manageMemberships}</Link><Link href="/app/categories" className="flex min-h-11 items-center justify-center rounded-xl border border-egs-border bg-egs-surface px-4 text-center font-semibold text-egs-green-900 hover:bg-egs-green-50">{messages.Home.viewCategories}</Link></div>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-egs-green-950">{messages.Sessions.today}</h2><Link href="/app/sessions" className="text-sm font-semibold text-egs-green-700">{messages.Sessions.title}</Link></div><div className="space-y-2">{todaySessions.length?todaySessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex items-center justify-between rounded-xl border border-egs-border bg-egs-surface p-4"><span className="font-medium">{locale==="ar"?session.category.nameAr:session.category.nameFr} · {messages.Sessions[session.type]}</span><span className="text-sm font-semibold text-egs-green-800">{messages.Sessions[session.status]}</span></Link>):<p className="rounded-xl border border-egs-border bg-egs-surface p-4 text-zinc-500">{messages.Sessions.waiting}</p>}</div></section>
    </div>;
  }

  const categories = user.role===Role.COACH||user.role===Role.DIRIGEANT?await getAccessibleCategories(user,new Date()):[];const sessions=user.role===Role.COACH||user.role===Role.DIRIGEANT?await getSessionsForUser(user,8):[];const todaySessions=sessions.filter(session=>session.startsAt>=today.start&&session.startsAt<today.end);const primary=todaySessions[0]?`/app/sessions/${todaySessions[0].id}/attendance`:"/app/sessions/new";
  return <div className="space-y-6">
    <Hero club={messages.Common.club} season={seasonName} title={greeting} subtitle={messages.Roles[user.role]} chip={categories.length===1?(locale==="ar"?categories[0].nameAr:categories[0].nameFr):undefined}/>
    {categories.length>1?<section><h2 className="mb-3 font-semibold text-egs-green-950">{messages.Home.assignedCategories}</h2><div className="grid gap-3 sm:grid-cols-2">{categories.map(category=><div key={category.id} className="rounded-xl border border-egs-border border-s-4 border-s-egs-green-700 bg-egs-surface p-4 font-semibold text-egs-green-950">{locale==="ar"?category.nameAr:category.nameFr}</div>)}</div></section>:null}
    {user.role===Role.COACH?<Link href={primary} className="block min-h-14 rounded-xl border-b-4 border-egs-yellow-400 bg-egs-green-800 p-4 text-center text-lg font-bold text-white hover:bg-egs-green-700">{messages.Sessions.markAttendance}</Link>:null}
    {user.role!==Role.PLAYER?<section><h2 className="mb-3 font-semibold text-egs-green-950">{messages.Sessions.today}</h2><div className="space-y-2">{todaySessions.map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex justify-between rounded-xl border border-egs-border bg-egs-surface p-4"><span className="font-medium">{locale==="ar"?session.category.nameAr:session.category.nameFr}</span><span className="text-sm font-semibold text-egs-green-800">{messages.Sessions[session.status]}</span></Link>)}</div><h2 className="mb-3 mt-6 font-semibold text-egs-green-950">{messages.Sessions.recent}</h2><div className="space-y-2">{sessions.slice(0,5).map(session=><Link key={session.id} href={`/app/sessions/${session.id}`} className="flex justify-between rounded-xl border border-egs-border bg-egs-surface p-4"><span className="font-medium">{locale==="ar"?session.category.nameAr:session.category.nameFr} · {messages.Sessions[session.type]}</span><span className="text-sm text-zinc-600">{formatDate(session.startsAt,locale)}</span></Link>)}</div></section>:<div className="rounded-xl border border-egs-border bg-egs-surface p-5">{messages.Home.welcome}, {user.firstName}.</div>}
  </div>;
}
