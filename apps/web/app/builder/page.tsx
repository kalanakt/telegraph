import { redirect } from "next/navigation";
export default async function LegacyBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  redirect(params.edit ? `/flows?edit=${encodeURIComponent(params.edit)}` : "/flows");
}
