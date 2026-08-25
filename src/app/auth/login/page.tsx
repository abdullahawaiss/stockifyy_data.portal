import { Suspense } from "react";
import LoginClient from "./_components/LoginClient";

export const metadata = { title: "Client Login | Stockifyy Data Portal" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
