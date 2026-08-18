import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" as="image" href="/stockifyy-logo.svg" type="image/svg+xml" />
      {children}
    </>
  );
}
