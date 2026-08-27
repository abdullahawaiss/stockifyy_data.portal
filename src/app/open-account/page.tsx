import type { Metadata } from "next";
import OpenAccountClient from "./OpenAccountClient";

export const metadata: Metadata = {
  title: "Open an Account — Stockifyy",
  description: "Start investing on PSX in minutes. Open your brokerage account with Stockifyy today.",
};

export default function OpenAccountPage() {
  return <OpenAccountClient />;
}
