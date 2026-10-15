import ar from "../../messages/ar.json";
import fr from "../../messages/fr.json";

export type AppLocale = "fr" | "ar";

export function localeFromPreference(preference: "FR" | "AR"): AppLocale {
  return preference === "AR" ? "ar" : "fr";
}

export function getMessages(locale: AppLocale) {
  return locale === "ar" ? ar : fr;
}
