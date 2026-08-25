import { redirect } from "next/navigation";

// The old admin-login page has been superseded.
// All users (admins and clients) authenticate at /auth/login.
export default function OldLoginPage() {
  redirect("/auth/login");
}
