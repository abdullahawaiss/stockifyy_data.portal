import type { Metadata } from "next";
import WatchlistClient from "./WatchlistClient";

export const metadata: Metadata = { title: "Watchlist — Stockifyy" };

export default function WatchlistPage() {
  return <WatchlistClient />;
}
