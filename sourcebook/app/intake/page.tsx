import { listCompanies } from "@/lib/repo";
import { IntakeForm } from "./IntakeForm";

export const metadata = { title: "Add a link" };

export default async function IntakePage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { company } = await searchParams;
  const companies = (await listCompanies()).map((c) => ({ id: c.id, name: c.name, domain: c.domain }));
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Add a link</h1>
          <p className="finding">
            One public link per signal. Sourcebook checks it against everything already captured before it saves anything.
          </p>
        </div>
      </div>
      <IntakeForm companies={companies} defaultCompanyId={company ?? ""} />
    </>
  );
}
