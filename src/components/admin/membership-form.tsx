"use client";

import { useActionState } from "react";
import { MembershipType } from "@/lib/domain";
import { createMembershipAction,type MembershipState } from "@/app/app/memberships/actions";

type Option={id:string;label:string};
export function MembershipForm({labels,typeLabels,users,categories,seasons}:{labels:Record<string,string>;typeLabels:Record<MembershipType,string>;users:Option[];categories:Option[];seasons:Option[]}){const[state,action,pending]=useActionState<MembershipState,FormData>(createMembershipAction,{});return <form action={action} className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.person}<select name="userId" required className="h-11 rounded-lg border border-zinc-300 px-3 font-normal"><option value=""></option>{users.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.category}<select name="categoryId" required className="h-11 rounded-lg border border-zinc-300 px-3 font-normal">{categories.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.type}<select name="membershipType" className="h-11 rounded-lg border border-zinc-300 px-3 font-normal">{Object.values(MembershipType).map(x=><option key={x} value={x}>{typeLabels[x]}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.season}<select name="seasonId" className="h-11 rounded-lg border border-zinc-300 px-3 font-normal">{seasons.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.startDate}<input name="startDate" type="date" required className="h-11 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
<label className="flex flex-col gap-1.5 text-sm font-medium">{labels.endDate}<input name="endDate" type="date" className="h-11 rounded-lg border border-zinc-300 px-3 font-normal" /></label>
{state.error?<p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error==="overlap"?labels.overlap:labels.invalid}</p>:null}<button disabled={pending} className="min-h-11 rounded-lg bg-emerald-800 px-5 font-semibold text-white disabled:opacity-60">{labels.assign}</button>
</form>;}
