import { redirect } from "next/navigation";

// BeautyMeet currently uses a unified /login entry point.
// Keep /signup as a compatibility route (and to avoid 404s from old links, crawlers, or ads).
export default function SignupRedirectPage() {
  redirect("/login?mode=signup");
}
