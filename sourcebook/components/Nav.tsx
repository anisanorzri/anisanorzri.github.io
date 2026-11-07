"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconExport, IconLink, IconQueue, IconRules, IconThesis, IconX } from "./Icons";

export function Nav({ toReview, shortlisted }: { toReview: number; shortlisted: number }) {
  const path = usePathname();
  const current = (href: string) => (href === "/" ? path === "/" || path.startsWith("/companies") : path.startsWith(href)) ? "page" : undefined;
  return (
    <nav className="nav" aria-label="Main">
      <Link href="/" aria-current={current("/")}>
        <IconQueue /> Review queue {toReview > 0 && <span className="count">{toReview}</span>}
      </Link>
      <Link href="/intake" aria-current={current("/intake")}>
        <IconLink /> Add a link
      </Link>
      <Link href="/x" aria-current={current("/x")}>
        <IconX /> X signals
      </Link>
      <Link href="/thesis" aria-current={current("/thesis")}>
        <IconThesis /> Thesis
      </Link>
      <Link href="/export" aria-current={current("/export")}>
        <IconExport /> Shortlist export {shortlisted > 0 && <span className="count">{shortlisted}</span>}
      </Link>
      <Link href="/method" aria-current={current("/method")}>
        <IconRules /> Evidence rules
      </Link>
    </nav>
  );
}
