"use client";

import { useActionState } from "react";
import { SessionType } from "@prisma/client";
import { createSessionAction,type SessionActionState } from "@/app/app/sessions/actions";
import { toClubDateTimeInput } from "@/lib/date-time";

type Category={id:string;label:string};
export function SessionForm({labels,typeLabels,categories}:{labels:Record<string,string>;typeLabels:Record<SessionType,string>;categories:Category[]}){const[state,action,pending]=useActionState<SessionActionState,FormData>(createSessionAction,{});const defaultStart=toClubDateTimeInput(new Date());return <form action={action} className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.category}<select name="categoryId" defaultValue={categories.length===1?categories[0].id:""} required className="h-12 rounded-lg border border-zinc-300 px-3 font-normal"><option value=""></option>{categories.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.type}<select name="type" defaultValue={SessionType.TRAINING} className="h-12 rounded-lg border border-zinc-300 px-3 font-normal">{Object.values(SessionType).map(x=><option key={x} value={x}>{typeLabels[x]}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.startsAt}<input name="startsAt" type="datetime-local" defaultValue={defaultStart} required className="h-12 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.endsAt}<input name="endsAt" type="datetime-local" className="h-12 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.location}<input name="location" className="h-12 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.notes}<input name="notes" className="h-12 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
{state.error?<p className="text-sm text-red-700">{labels.invalid}</p>:null}<button disabled={pending} className="min-h-12 rounded-lg bg-emerald-800 px-5 font-semibold text-white disabled:opacity-60">{labels.create}</button>
</form>;}
