import { listInstitutions } from "@/app/actions/admin/institutions";
import { InstitutionsClient } from "./institutions-client";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  const result = await listInstitutions();

  if (!result.success) {
    return <div className="text-red-500 p-6">{result.error ?? "Failed to load institutions."}</div>;
  }

  return (
    <div className="dashboard-container max-w-4xl">
      <InstitutionsClient institutions={result.data ?? []} />
    </div>
  );
}
