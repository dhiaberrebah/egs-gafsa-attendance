import { getRequestConfig } from "next-intl/server";
import fr from "../../messages/fr.json";

export default getRequestConfig(async () => ({
  locale: "fr",
  messages: fr,
}));
