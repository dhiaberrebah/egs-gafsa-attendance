"use client";

import { useActionState } from "react";
import { PreferredLanguage, Role } from "@/lib/domain";
import { createUserAction, updateUserAction, type UserActionState } from "@/app/app/users/actions";

type UserValues = { id:string; firstName:string; lastName:string; username:string; role:Role; preferredLanguage:PreferredLanguage; email:string|null; phone:string|null; dateOfBirth:Date|null; licenseNumber:string|null; active:boolean };
type Labels = Record<string, string>;
type UserFormProps = { labels: Labels; roleLabels: Record<Role,string>; languageLabels: Record<PreferredLanguage,string>; roles: Role[]; user?: UserValues };

export function UserForm({ labels, roleLabels, languageLabels, roles, user }: UserFormProps) {
  const action = user ? updateUserAction : createUserAction;
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(action, {});
  const fields = [
    ["firstName", labels.firstName, "text", user?.firstName], ["lastName", labels.lastName, "text", user?.lastName],
    ["username", labels.username, "text", user?.username], ["email", labels.email, "email", user?.email],
    ["phone", labels.phone, "tel", user?.phone], ["dateOfBirth", labels.birthDate, "date", user?.dateOfBirth?.toISOString().slice(0,10)],
    ["licenseNumber", labels.license, "text", user?.licenseNumber],
  ] as const;

  return <form action={formAction} className="space-y-5 rounded-xl border border-egs-border bg-egs-surface p-5 shadow-sm">
    {user ? <input type="hidden" name="id" value={user.id} /> : null}
    <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label,type,value]) => <label key={name} className="flex flex-col gap-1.5 text-sm font-medium">{label}<input name={name} type={type} defaultValue={value ?? ""} required={["firstName","lastName","username"].includes(name)} className="h-11 rounded-lg border border-zinc-300 px-3 font-normal" /></label>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium">{labels.role}<select name="role" defaultValue={user?.role ?? Role.PLAYER} className="h-11 rounded-lg border border-zinc-300 px-3 font-normal">{roles.map((role)=><option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">{labels.language}<select name="preferredLanguage" defaultValue={user?.preferredLanguage ?? PreferredLanguage.FR} className="h-11 rounded-lg border border-zinc-300 px-3 font-normal">{Object.values(PreferredLanguage).map((language)=><option key={language} value={language}>{languageLabels[language]}</option>)}</select></label>
    </div>
    {!user ? <label className="flex flex-col gap-1.5 text-sm font-medium">{labels.password}<input name="password" type="password" minLength={8} required autoComplete="new-password" className="h-11 rounded-lg border border-zinc-300 px-3 font-normal" /></label> : <label className="flex items-center gap-2 text-sm font-medium"><input type="hidden" name="active" value="false" /><input name="active" type="checkbox" value="true" defaultChecked={user.active} />{labels.status}</label>}
    {state.error ? <p role="alert" className="text-sm text-red-700">{state.error === "duplicate" ? labels.duplicate : labels.invalid}</p> : null}
    <button disabled={pending} className="min-h-11 rounded-lg bg-egs-green-800 px-5 font-semibold text-white disabled:opacity-60">{user ? labels.update : labels.create}</button>
  </form>;
}
