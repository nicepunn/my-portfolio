import { Suspense } from "react";
import { connection } from "next/server";
import { EditLogin } from "@/components/edit/EditLogin";
import { ResumeEditor } from "@/components/edit/ResumeEditor";
import { isEditAuthenticated } from "@/lib/edit-auth";
import { canPersistResume, getResume } from "@/lib/resume-file";

export const metadata = {
  title: "Edit resume",
  robots: {
    index: false,
    follow: false,
  },
};

async function EditContent() {
  await connection();

  if (!(await isEditAuthenticated())) {
    return <EditLogin />;
  }

  const data = await getResume();

  return (
    <ResumeEditor initialData={data} canPersist={canPersistResume()} />
  );
}

export default function EditPage() {
  return (
    <main className="min-h-full bg-[var(--bg)]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-[var(--muted)]">
            Loading editor…
          </div>
        }
      >
        <EditContent />
      </Suspense>
    </main>
  );
}
