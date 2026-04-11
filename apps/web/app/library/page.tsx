import { redirect } from "next/navigation";
import { MediaLibraryBrowser } from "@/components/media/MediaLibraryBrowser";
import { PageHeading } from "@/components/PageHeading";
import { getAuthUserId } from "@/lib/clerk-auth";
import { areMediaUploadsEnabled } from "@/lib/s3";
import { requireAppUser } from "@/lib/user";

export default async function LibraryPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  await requireAppUser();
  const uploadsEnabled = areMediaUploadsEnabled();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Library"
        subtitle={
          uploadsEnabled
            ? "Browse uploaded media, copy reusable URLs, and keep action assets in one place."
            : "Media uploads are disabled in this environment. Enable S3 uploads to use the file library."
        }
      />

      <MediaLibraryBrowser />
    </div>
  );
}
