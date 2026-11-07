import type { FactField, Provenance, SourceKind } from "./types";

// Five real European companies, researched by hand on 2026-11-07 from the
// public pages linked below. Every quote was copied from the page as it read
// that day. They load as drafts: a person checks each one against its source
// and approves it before a brief is shown to anyone.
//
// What was looked at, and what was deliberately not done:
// - Y Combinator's company pages (an accelerator's own record of the batch;
//   the descriptions on them are written by the company, so they are claims).
// - Each company's own website (claims, and its published contact routes).
// - Companies House for the two UK companies (verified: entity, incorporation
//   date, registered office, directors). Directors' dates of birth are not copied.
// - No funding amounts, rounds or valuations: no page states one.
// - No LinkedIn or X scraping; the founders' X profiles are only listed where
//   YC links them.

export const RESEARCHED_ON = "2026-11-07";

interface SeedSource {
  key: string;
  url: string;
  kind: SourceKind;
  title: string;
  author: string;
  publishedOn: string | null;
  excerpt?: string;
  notes?: string;
}
interface SeedFact {
  source: string;
  field: FactField;
  value: string;
  quote: string;
  provenance: Provenance;
  note?: string;
}
export interface SeedCompany {
  name: string;
  website: string;
  nextQuestion: string;
  sources: SeedSource[];
  facts: SeedFact[];
}

export const SEED_COMPANIES: SeedCompany[] = [
  {
    name: "Squid",
    website: "https://squid.energy",
    nextQuestion:
      "“Live with National Grid DSO” — is that a paid contract, a funded pilot or a free trial, and who at the DSO owns the budget for it?",
    sources: [
      {
        key: "yc",
        url: "https://www.ycombinator.com/companies/squid",
        kind: "accelerator_cohort",
        title: "Squid: AI agents for power grid planning | Y Combinator",
        author: "Y Combinator company directory",
        publishedOn: null,
        notes: "Page shows no publication date. The batch is YC's own record; the description is written by the company.",
      },
      {
        key: "site",
        url: "https://www.squid.energy/",
        kind: "company_website",
        title: "Squid — The grid has a repo now",
        author: "Squid",
        publishedOn: null,
      },
      {
        key: "ch",
        url: "https://find-and-update.company-information.service.gov.uk/company/16925657",
        kind: "registry",
        title: "SQUID LABS LTD (16925657) — Companies House",
        author: "Companies House",
        publishedOn: "2025-12-22",
        notes: "Linked to the product by the website footer “Squid Labs Ltd (UK)” and by the directors matching YC's founder list.",
      },
    ],
    facts: [
      {
        source: "site",
        field: "product",
        value: "A shared, versioned model repository for power-system planning: imports PowerFactory, PSS®E, IPSA, CYME and ETAP models into one governed network that engineers and agents work from.",
        quote: "Squid turns models from existing analysis tools into one standard, versioned network, so engineers and agents can validate data, build scenarios, run studies and publish decisions from the same source.",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "customer",
        value: "Teams that plan and operate electricity networks.",
        quote: "the teams planning and operating networks need software that is as modern as the challenge",
        provenance: "company_claim",
      },
      {
        source: "site",
        field: "traction_claim",
        value: "Says it is live with National Grid DSO.",
        quote: "Live with National Grid DSO",
        provenance: "company_claim",
        note: "No date, scope or contract type given. Not confirmed by National Grid.",
      },
      {
        source: "site",
        field: "backers",
        value: "Names Y Combinator, 20VC, Leap Forward Ventures and 33East as backers. No round or amount stated.",
        quote: "Backed by Y Combinator · 20VC Leap Forward Ventures · 33East",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "signal",
        value: "In Y Combinator's Winter 2026 batch.",
        quote: "Winter 2026",
        provenance: "verified",
        note: "YC's batch listing is the accelerator's own record.",
      },
      {
        source: "yc",
        field: "location",
        value: "London, United Kingdom",
        quote: "London, United Kingdom",
        provenance: "company_claim",
      },
      {
        source: "ch",
        field: "legal_entity",
        value: "Squid Labs Ltd, company 16925657, incorporated 22 December 2025, registered office 12 Melcombe Place, London NW1 6JJ. The website also names a US parent, Squid Group, Inc.",
        quote: "Registered office address 12 Melcombe Place, London, England, NW1 6JJ Company status Active Company type Private limited Company Incorporated on 22 December 2025",
        provenance: "verified",
        note: "US parent named on the website footer only; not checked.",
      },
      {
        source: "ch",
        field: "team",
        value: "Two directors, Conor Jones and George Kolokotronis, both appointed 22 December 2025. YC lists them as founder-CEO and founder-CTO.",
        quote: "JONES, Conor Michael Patrick",
        provenance: "verified",
      },
      {
        source: "site",
        field: "contact_route",
        value: "hello@squid.energy",
        quote: "mailto:hello@squid.energy",
        provenance: "verified",
        note: "Published on the company's own site.",
      },
    ],
  },
  {
    name: "NODI Energy",
    website: "https://www.nodienergy.com",
    nextQuestion:
      "Does NODI own the batteries it deploys or orchestrate other people's — and which constrained site, with which network operator, is first?",
    sources: [
      {
        key: "yc",
        url: "https://www.ycombinator.com/companies/nodi-energy",
        kind: "accelerator_cohort",
        title: "NODI Energy: Distributed energy infrastructure unlocking grid power to data centers | Y Combinator",
        author: "Y Combinator company directory",
        publishedOn: null,
        notes: "YC's page links a LinkedIn company page at /company/pwrmx — an earlier name, PowerMatrix.",
      },
      {
        key: "site",
        url: "https://www.nodienergy.com/",
        kind: "company_website",
        title: "NODI — The Capacity Layer for the Grid",
        author: "NODI",
        publishedOn: null,
      },
      {
        key: "ch",
        url: "https://find-and-update.company-information.service.gov.uk/company/16411726",
        kind: "registry",
        title: "POWERMATRIX TECHNOLOGY LIMITED (16411726) — Companies House",
        author: "Companies House",
        publishedOn: "2025-04-28",
        notes: "The website footer names this company and number, which links the brand to the entity.",
      },
    ],
    facts: [
      {
        source: "yc",
        field: "product",
        value: "Deploys and aggregates batteries at the edge of the grid and runs them as distributed nodes to free up connection capacity at constrained locations.",
        quote: "We deploy and aggregate batteries at the edge and orchestrate them as distributed nodes, providing locational flexibility to the rigid grid",
        provenance: "company_claim",
      },
      {
        source: "site",
        field: "customer",
        value: "AI data centres that need a grid connection.",
        quote: "Providing grid connection capacity for AI data centers",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "traction_claim",
        value: "Claims data centres can connect in weeks rather than waiting for reinforcement. No deployment named.",
        quote: "so data centers can connect in weeks instead of waiting decades for reinforcement",
        provenance: "company_claim",
        note: "An outcome claim, not traction. No site, customer or capacity figure given.",
      },
      {
        source: "yc",
        field: "signal",
        value: "In Y Combinator's Spring 2025 batch.",
        quote: "Spring 2025",
        provenance: "verified",
      },
      {
        source: "yc",
        field: "location",
        value: "London, United Kingdom (as given to YC).",
        quote: "London, United Kingdom",
        provenance: "company_claim",
        note: "Companies House gives the registered office as Mildenhall, Suffolk. A registered office is not where the team works — ask.",
      },
      {
        source: "ch",
        field: "legal_entity",
        value: "PowerMatrix Technology Limited, company 16411726, incorporated 28 April 2025, SIC 72190 (research and experimental development).",
        quote: "Company number 16411726",
        provenance: "verified",
      },
      {
        source: "ch",
        field: "team",
        value: "One director, Dr Borong Hu, appointed 28 April 2025. YC lists him as founder-CEO.",
        quote: "HU, Borong, Dr",
        provenance: "verified",
      },
      {
        source: "site",
        field: "contact_route",
        value: "info@nodienergy.com",
        quote: "info@nodienergy.com",
        provenance: "verified",
        note: "Published on the company's own site.",
      },
    ],
  },
  {
    name: "Servo7",
    website: "https://servo7.com",
    nextQuestion:
      "Which of CEVA, Stord, DHL and PostNL are paying for robots today, at how many dock doors — and is BTS Logistics a paid deployment or an innovation pilot?",
    sources: [
      {
        key: "yc",
        url: "https://www.ycombinator.com/companies/servo7",
        kind: "accelerator_cohort",
        title: "Servo7: Container unloading robots for warehouses | Y Combinator",
        author: "Y Combinator company directory",
        publishedOn: null,
      },
      {
        key: "site",
        url: "https://servo7.com/",
        kind: "company_website",
        title: "Servo7 | Home",
        author: "Servo7",
        publishedOn: null,
      },
      {
        key: "bts",
        url: "https://servo7.com/resources/bts-logistics-partnership",
        kind: "press",
        title: "Servo7 | Partnership with BTS Logistics",
        author: "Servo7",
        publishedOn: "2026-09-07",
        excerpt: "Today, we’re announcing our innovation partnership with BTS Logistics. We’ve been working with BTS for a while, putting our robot to work in their warehouse.",
        notes: "The post links BTS Logistics' own LinkedIn announcement, which was not checked (no LinkedIn scraping).",
      },
    ],
    facts: [
      {
        source: "site",
        field: "product",
        value: "A robot that unloads loose-loaded shipping containers at the dock door, onto conveyor or pallet; boxes up to 23 kg.",
        quote: "Servo7 builds container unloading robots. Loose-loaded containers unloaded in under 2.5 hours, deployed at your dock door with only 45 minutes set-up time.",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "customer",
        value: "Names 3PLs (CEVA, Stord) and distributors (DHL, PostNL) as customers.",
        quote: "Our customers include 3PLs (CEVA, Stord), distributors (DHL, PostNL) and many more logistics companies.",
        provenance: "company_claim",
        note: "Named customers are the company's claim; none confirmed by the customer.",
      },
      {
        source: "bts",
        field: "signal",
        value: "Announced an innovation partnership with BTS Logistics; says it has unloaded multiple containers in BTS's warehouse.",
        quote: "We’ve successfully unloaded multiple containers with our robot Mammoth",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "signal",
        value: "In Y Combinator's Winter 2026 batch.",
        quote: "Winter 2026",
        provenance: "verified",
      },
      {
        source: "yc",
        field: "location",
        value: "Amsterdam, Netherlands",
        quote: "Amsterdam, Netherlands",
        provenance: "company_claim",
        note: "Dutch registry (KvK) not checked.",
      },
      {
        source: "yc",
        field: "team",
        value: "Founders listed by YC: Pieter Becking (CEO) and Jasper van Leuven (CTO). Team size given as 3.",
        quote: "Pieter Becking",
        provenance: "company_claim",
      },
      {
        source: "site",
        field: "contact_route",
        value: "Booking link: cal.com/team/servo7/30min",
        quote: "https://cal.com/team/servo7/30min",
        provenance: "verified",
        note: "Published on the company's own site. No email address is published.",
      },
    ],
  },
  {
    name: "Stillwind",
    website: "https://stillwind.ai",
    nextQuestion:
      "The company has been P2P Industries and Augento before Stillwind — what was learned from each pivot, and what share of library parts now ship without a manual fix?",
    sources: [
      {
        key: "yc",
        url: "https://www.ycombinator.com/companies/stillwind",
        kind: "accelerator_cohort",
        title: "Stillwind: PCB component librarian | Y Combinator",
        author: "Y Combinator company directory",
        publishedOn: null,
        notes: "YC's linked LinkedIn page is /company/augento — a former name.",
      },
      {
        key: "site",
        url: "https://stillwind.ai/",
        kind: "company_website",
        title: "Footprints and symbols, built to your standard | Stillwind",
        author: "Stillwind",
        publishedOn: null,
      },
      {
        key: "blog",
        url: "https://stillwind.ai/blog",
        kind: "press",
        title: "Blog | Stillwind",
        author: "Stillwind",
        publishedOn: "2026-06-30",
        excerpt: "June 30, 2026 · Stillwind Builder - From Idea to BOM in the order of minutes. June 11, 2026 · Stillwind Search - High resolution component search for PCBs.",
      },
      {
        key: "legal",
        url: "https://stillwind.ai/legal",
        kind: "company_website",
        title: "Legal | Stillwind",
        author: "Stillwind",
        publishedOn: null,
      },
    ],
    facts: [
      {
        source: "site",
        field: "product",
        value: "A PCB library service: send manufacturer part numbers, get KiCad or Altium footprints and symbols drawn to your team's library rules, each checked pin to pad.",
        quote: "Send us part numbers. We build KiCad and Altium footprints and symbols to your library standard, most within an hour. Every part is checked pin to pad.",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "customer",
        value: "Hardware startups designing PCBs.",
        quote: "Stillwind is a fractional librarian for startups.",
        provenance: "company_claim",
      },
      {
        source: "blog",
        field: "signal",
        value: "Launched Stillwind Builder, a design copilot for electrical design, 19 days after launching Stillwind Search (11 June 2026).",
        quote: "Launching Stillwind Builder - The Design Copilot For Electrical Design",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "signal",
        value: "In Y Combinator's Winter 2025 batch.",
        quote: "Winter 2025",
        provenance: "verified",
      },
      {
        source: "legal",
        field: "location",
        value: "Zürich, Switzerland — staff and office through Stillwind Labs GmbH, Hans-Huber-Strasse 4.",
        quote: "Stillwind Labs GmbH Hans-Huber-Strasse 4 8002 Zürich Switzerland",
        provenance: "company_claim",
        note: "Swiss register (Zefix) not checked.",
      },
      {
        source: "legal",
        field: "legal_entity",
        value: "The service is operated by P2P Industries Inc.; Stillwind Labs GmbH is its wholly-owned Swiss subsidiary.",
        quote: "P2P Industries Inc. has a wholly-owned Swiss subsidiary that employs personnel and maintains office space in Switzerland",
        provenance: "company_claim",
      },
      {
        source: "site",
        field: "contact_route",
        value: "contact@stillwind.ai",
        quote: "mailto:contact@stillwind.ai",
        provenance: "verified",
        note: "Published on the company's own site.",
      },
    ],
  },
  {
    name: "Macadamia",
    website: "https://macadamialabs.com",
    nextQuestion:
      "Which engineering firms use the agents on live projects, and does the Ghent team sell first in Europe or in the US, given the site names Macadamia Labs Inc. as operator?",
    sources: [
      {
        key: "yc",
        url: "https://www.ycombinator.com/companies/macadamia",
        kind: "accelerator_cohort",
        title: "Macadamia: AI Agents for Complex Engineering Projects | Y Combinator",
        author: "Y Combinator company directory",
        publishedOn: null,
      },
      {
        key: "site",
        url: "https://macadamialabs.com/",
        kind: "company_website",
        title: "Macadamia | AI Agents for Industrial Engineering Automation",
        author: "Macadamia",
        publishedOn: null,
      },
    ],
    facts: [
      {
        source: "site",
        field: "product",
        value: "AI agents for engineering firms: generating AutoCAD designs, checking dimensions, cross-referencing P&IDs against equipment lists and flagging inconsistencies in technical documents.",
        quote: "Generate AutoCAD designs, verify dimension accuracy, cross-reference P&IDs with equipment lists, and flag inconsistencies in technical documentation.",
        provenance: "company_claim",
      },
      {
        source: "yc",
        field: "customer",
        value: "Firms in mechanical engineering, manufacturing and construction.",
        quote: "Macadamia serves customers in mechanical engineering, manufacturing, and construction.",
        provenance: "company_claim",
        note: "No customer is named.",
      },
      {
        source: "site",
        field: "traction_claim",
        value: "Says it is SOC 2 Type 2 certified and GDPR compliant.",
        quote: "SOC 2 Type 2 certified, GDPR compliant.",
        provenance: "company_claim",
        note: "Ask for the SOC 2 report and the auditor's name.",
      },
      {
        source: "yc",
        field: "signal",
        value: "In Y Combinator's Winter 2025 batch.",
        quote: "Winter 2025",
        provenance: "verified",
      },
      {
        source: "yc",
        field: "location",
        value: "Ghent, Belgium",
        quote: "Ghent, Belgium",
        provenance: "company_claim",
        note: "Belgian register (KBO) not checked.",
      },
      {
        source: "site",
        field: "legal_entity",
        value: "The website footer names Macadamia Labs Inc.",
        quote: "© 2026 Macadamia Labs Inc.",
        provenance: "company_claim",
      },
      {
        source: "site",
        field: "contact_route",
        value: "founders@macadamialabs.com",
        quote: "Contact us at founders@macadamialabs.com",
        provenance: "verified",
        note: "Published on the company's own site.",
      },
    ],
  },
];
