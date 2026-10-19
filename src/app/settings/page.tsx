import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "Settings",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsRoute() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--bg)]">
      <SettingsPage />
    </main>
  );
}
