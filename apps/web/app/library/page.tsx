import { redirect } from "next/navigation";
import { MediaLibraryBrowser } from "@/components/media/MediaLibraryBrowser";
import { getAuthUserId } from "@/lib/clerk-auth";
import { requireAppUser } from "@/lib/user";

export default async function LibraryPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  await requireAppUser();

  return (
    <div>
      <MediaLibraryBrowser />
    </div>
  );
}
