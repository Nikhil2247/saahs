import { listInstitutions } from "@/app/actions/admin/institutions";
import { InstitutionsClient } from "./institutions-client";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  const result = await listInstitutions();

  if (!result.success) {
    return <div className="text-red-500 p-6">{result.error ?? "Failed to load institutions."}</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <InstitutionsClient institutions={result.data ?? []} />
    </div>
  );
}
