import { Suspense } from "react";
import { connection } from "next/server";
import { EditLogin } from "@/components/edit/EditLogin";
import { ResumeReviewEditor } from "@/components/edit/ResumeReviewEditor";
import { isEditAuthenticated } from "@/lib/edit-auth";

export const metadata = {
  title: "Review resume translations",
  robots: {
    index: false,
    follow: false,
  },
};

async function ReviewContent() {
  await connection();

  if (!(await isEditAuthenticated())) {
    return <EditLogin />;
  }

  return <ResumeReviewEditor />;
}

export default function EditReviewPage() {
  return (
    <main className="min-h-full bg-[var(--bg)]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-[var(--muted)]">
            Loading review…
          </div>
        }
      >
        <ReviewContent />
      </Suspense>
    </main>
  );
}
