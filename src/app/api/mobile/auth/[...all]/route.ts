import { toNextJsHandler } from "better-auth/next-js";
import { mobileAuth } from "@/lib/auth";
import { hideInternalAuthEmails } from "@/lib/auth/response";

const handlers = toNextJsHandler(mobileAuth);

export async function GET(request: Request) {
  return hideInternalAuthEmails(await handlers.GET(request));
}

export async function POST(request: Request) {
  return hideInternalAuthEmails(await handlers.POST(request));
}
