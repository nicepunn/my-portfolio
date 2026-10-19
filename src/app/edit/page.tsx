import { Suspense } from "react";
import { connection } from "next/server";
import { EditLogin } from "@/components/edit/EditLogin";
import { ResumeEditor } from "@/components/edit/ResumeEditor";
import { resume } from "@/data/resume";
import { isEditAuthenticated } from "@/lib/edit-auth";
import {
  canPersistResumeToDisk,
  readResumeFromDisk,
} from "@/lib/resume-file";

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

  const data = canPersistResumeToDisk()
    ? await readResumeFromDisk()
    : resume;

  return (
    <ResumeEditor
      initialData={data}
      canPersist={canPersistResumeToDisk()}
    />
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
