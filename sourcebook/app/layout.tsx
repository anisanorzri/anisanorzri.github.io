import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Mark } from "@/components/Icons";
import { Nav } from "@/components/Nav";
import { getThesis, listCompanies } from "@/lib/repo";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Sourcebook", template: "%s · Sourcebook" },
  description: "Public signals in, evidence-backed company briefs out. Open-source sourcing for small VC funds.",
};
export const viewport: Viewport = { themeColor: "#f2f4f7" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [thesis, companies] = await Promise.all([getThesis(), listCompanies()]);
  const toReview = companies.filter((c) => c.status === "new").length;
  const shortlisted = companies.filter((c) => c.status === "shortlist").length;
  const db = (process.env.DATABASE_URL || "file:").startsWith("file:") ? "Local SQLite file" : "Hosted libSQL database";
  return (
    <html lang="en-GB" className={geist.variable}>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link href="/" className="brand">
              <Mark /> <span className="brand-name">Sourcebook</span>
            </Link>
            <Link href="/thesis" className="scope">
              <div className="scope-label">Thesis</div>
              <div className="scope-name">{thesis.name}</div>
            </Link>
            <Nav toReview={toReview} shortlisted={shortlisted} />
            <div className="sidebar-foot">
              <span>{db}</span>
              <span>Briefs, not recommendations.</span>
            </div>
          </aside>
          <header className="topbar">
            <Link href="/" className="brand" style={{ padding: 0 }}>
              <Mark size={20} /> <span className="brand-name">Sourcebook</span>
            </Link>
            <details>
              <summary>Menu</summary>
              <div className="menu-sheet">
                <Link href="/thesis" className="scope" style={{ margin: 0 }}>
                  <div className="scope-label">Thesis</div>
                  <div className="scope-name">{thesis.name}</div>
                </Link>
                <Nav toReview={toReview} shortlisted={shortlisted} />
              </div>
            </details>
          </header>
          <main className="canvas" id="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
