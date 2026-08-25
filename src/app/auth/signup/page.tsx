import { Suspense } from "react";
import SignupClient from "./_components/SignupClient";

export const metadata = { title: "Create Account | Stockifyy Data Portal" };

export default function SignupPage() {
  return <Suspense><SignupClient /></Suspense>;
}
