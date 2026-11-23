import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-dvh">
      <div className="app-shell">{children}</div>
      <BottomNav />
    </div>
  );
}
