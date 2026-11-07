import type { SeedCompany } from "./seed-data";

// Leads sourced from X on 2026-11-07. Each post was found through public web
// search over x.com, then read from X itself (oEmbed) to confirm its exact
// text and date. Each company's own site was then fetched, and registries were
// checked where one is public (Companies House, the Finnish PRH register).
//
// Every X post here is by a news account, a fund or an angel, not by the
// company. So the posts are third-party reports, and a round they mention is
// "stated by a third party", never verified.

export const X_SOURCED_ON = "2026-11-07";

const antlerPost = {
  key: "x-antler",
  url: "https://x.com/TFNBreakingNews/status/2110258903774867800",
  kind: "x_post" as const,
  title: "Post by @TFNBreakingNews (Tech Funding News)",
  author: "@TFNBreakingNews",
  publishedOn: "2026-10-14",
  excerpt:
    "#Exclusive: 🚀 @AntlerGlobal invests £2.2M in 10 UK pre-seed startups.https://t.co/6vW7qS3di2#startups #venturecapital #physicalai #industrialautomation #funding #uktech #investment #innovation",
};
const antlerArticle = {
  key: "tfn",
  url: "https://techfundingnews.com/antler-invests-2m-uk-startups-physical-ai-industrial-automation",
  kind: "press" as const,
  title: "Exclusive: Antler invests £2.2M in 10 UK startups as physical AI gains ground",
  author: "Tech Funding News (Sofia Chesnokova)",
  publishedOn: "2026-10-14",
  notes: "Linked from the X post. Names 8 of the 10 companies; two are in stealth. Gives no cities or founders. The site refuses automated reads; quotes were taken from the page through a web reader on 7 Nov 2026.",
};

export const X_SEED_COMPANIES: SeedCompany[] = [
  {
    name: "siliXon",
    website: "https://silixon.io",
    nextQuestion:
      "Who is using it on real boards today — hobbyists on the free plan or hardware teams — and how often does a generated PCB pass review without manual rerouting?",
    sources: [
      antlerPost,
      antlerArticle,
      { key: "site", url: "https://silixon.io/", kind: "company_website", title: "siliXon: Design and learn electronics, plain English to PCB", author: "siliXon", publishedOn: null },
      {
        key: "ch",
        url: "https://find-and-update.company-information.service.gov.uk/company/16614979",
        kind: "registry",
        title: "SILIXON LIMITED (16614979) — Companies House",
        author: "Companies House",
        publishedOn: "2025-07-30",
        notes: "Found by name. Not yet linked to the product through a director or the website.",
      },
    ],
    facts: [
      { source: "site", field: "product", value: "Describe a device in plain English and get an editable PCB built from real parts; its own algorithms place, route and check the board.", quote: "Text to electronics: describe a device in plain English, get an editable PCB built from real parts. Our own algorithms place, route and check the board.", provenance: "company_claim" },
      { source: "tfn", field: "signal", value: "One of 10 UK pre-seed startups Antler invested in (£2.2M across all 10), reported 14 Oct 2026.", quote: "converts natural language requests into working electronics", provenance: "third_party" },
      { source: "tfn", field: "stage", value: "Pre-seed, per Tech Funding News on Antler's investment.", quote: "Antler invests £2.2M in 10 UK startups", provenance: "third_party", note: "The article gives no amount for siliXon itself." },
      { source: "x-antler", field: "location", value: "United Kingdom", quote: "10 UK pre-seed startups", provenance: "third_party", note: "No city stated. The name-matched Companies House record is in London SE1." },
      { source: "ch", field: "other", value: "A Companies House record exists for SILIXON LIMITED (16614979), incorporated 30 July 2025, registered in London SE1.", quote: "SILIXON LIMITED", provenance: "verified", note: "Name match only. Confirm it is this company before relying on it." },
    ],
  },
  {
    name: "Lir Labs",
    website: "https://www.lirlabs.com",
    nextQuestion:
      "How many treatment plants run the inline microscopes today, who pays (the water utility or the plant operator), and how is the aeration-energy saving measured?",
    sources: [
      antlerPost,
      antlerArticle,
      { key: "site", url: "https://www.lirlabs.com/", kind: "company_website", title: "Lir Labs | Optimize with AI Microscopy - Get Insights", author: "Lir Labs", publishedOn: null },
      {
        key: "ch",
        url: "https://find-and-update.company-information.service.gov.uk/company/16554279",
        kind: "registry",
        title: "LIR LABS LTD (16554279) — Companies House",
        author: "Companies House",
        publishedOn: "2025-07-01",
        notes: "Found by name. Not yet linked to the product through a director or the website.",
      },
    ],
    facts: [
      { source: "site", field: "product", value: "AI inline microscopy for biological wastewater treatment that predicts problems days ahead and cuts aeration energy.", quote: "Lir Labs automates biological wastewater treatment with AI inline microscopy, predicting problems days ahead and cutting aeration energy.", provenance: "company_claim" },
      { source: "site", field: "customer", value: "Operators of biological wastewater treatment plants.", quote: "automates biological wastewater treatment", provenance: "company_claim", note: "No customer named." },
      { source: "tfn", field: "signal", value: "One of 10 UK pre-seed startups Antler invested in, reported 14 Oct 2026.", quote: "automates biological water treatment", provenance: "third_party" },
      { source: "tfn", field: "stage", value: "Pre-seed, per Tech Funding News on Antler's investment.", quote: "Antler invests £2.2M in 10 UK startups", provenance: "third_party" },
      { source: "x-antler", field: "location", value: "United Kingdom", quote: "10 UK pre-seed startups", provenance: "third_party", note: "No city stated. The name-matched Companies House record is in London SW10." },
      { source: "ch", field: "other", value: "A Companies House record exists for LIR LABS LTD (16554279), incorporated 1 July 2025, registered in London SW10.", quote: "LIR LABS LTD", provenance: "verified", note: "Name match only." },
      { source: "site", field: "contact_route", value: "hello@lirlabs.com", quote: "mailto:hello@lirlabs.com", provenance: "verified", note: "Published on the company's own site." },
    ],
  },
  {
    name: "Plenex",
    website: "https://plenex.ai",
    nextQuestion:
      "What is the Rainham production facility in the customer story — a paying customer or a pilot — and what data does Plenex need from a site to answer questions about it?",
    sources: [
      antlerPost,
      antlerArticle,
      { key: "site", url: "https://plenex.ai/", kind: "company_website", title: "Plenex · Query the physical world", author: "Plenex", publishedOn: null },
      {
        key: "ch",
        url: "https://find-and-update.company-information.service.gov.uk/company/17219701",
        kind: "registry",
        title: "PLENEX LTD (17219701) — Companies House",
        author: "Companies House",
        publishedOn: "2026-05-14",
        notes: "Found by name. A different, dissolved PLENEX LTD (14677727) also exists.",
      },
    ],
    facts: [
      { source: "site", field: "product", value: "Lets people and software ask questions about physical sites and turns the answers into reports the team reviews and shares.", quote: "Plenex lets people and software query the physical world. Ask questions about your sites, get grounded answers, and turn them into reports your team reviews and shares. Physical reporting, automated.", provenance: "company_claim" },
      { source: "site", field: "customer", value: "Teams running physical sites; the site's customer story is a production facility in Rainham, London.", quote: "Rainham, London · from Berlin I asked our production facility a question yesterday.", provenance: "company_claim", note: "The customer is not named." },
      { source: "tfn", field: "signal", value: "One of 10 UK pre-seed startups Antler invested in, reported 14 Oct 2026.", quote: "lets users query the physical world", provenance: "third_party" },
      { source: "tfn", field: "stage", value: "Pre-seed, per Tech Funding News on Antler's investment.", quote: "Antler invests £2.2M in 10 UK startups", provenance: "third_party" },
      { source: "x-antler", field: "location", value: "United Kingdom", quote: "10 UK pre-seed startups", provenance: "third_party", note: "No city stated. The name-matched Companies House record is in London SW4." },
      { source: "ch", field: "other", value: "A Companies House record exists for PLENEX LTD (17219701), incorporated 14 May 2026, registered in London SW4.", quote: "PLENEX LTD", provenance: "verified", note: "Name match only." },
      { source: "site", field: "contact_route", value: "lewis.fail@plenex.ai", quote: "mailto:lewis.fail@plenex.ai", provenance: "verified", note: "Published on the company's own site." },
    ],
  },
  {
    name: "Marco",
    website: "https://getmarco.xyz",
    nextQuestion: "Which machines does it run on first — robots, drones or vehicles — and does it replace a sensor or sit on top of existing ones?",
    sources: [
      antlerPost,
      antlerArticle,
      { key: "site", url: "https://getmarco.xyz/", kind: "company_website", title: "Marco. | A sense of place. For every machine.", author: "Marco", publishedOn: null },
    ],
    facts: [
      { source: "site", field: "product", value: "Learning systems for positioning and motion estimation in machines.", quote: "Marco builds learning systems for positioning and motion estimation.", provenance: "company_claim" },
      { source: "tfn", field: "signal", value: "One of 10 UK pre-seed startups Antler invested in, reported 14 Oct 2026.", quote: "a learning layer for physical intelligence", provenance: "third_party" },
      { source: "tfn", field: "stage", value: "Pre-seed, per Tech Funding News on Antler's investment.", quote: "Antler invests £2.2M in 10 UK startups", provenance: "third_party" },
      { source: "x-antler", field: "location", value: "United Kingdom", quote: "10 UK pre-seed startups", provenance: "third_party", note: "No city stated; no Companies House match found under that name." },
    ],
  },
  {
    name: "Rotomate",
    website: "https://rotomate.ai",
    nextQuestion: "How many plants and rotating assets are monitored today, and does it plug into existing vibration-monitoring vendors or compete with them?",
    sources: [
      {
        key: "x",
        url: "https://x.com/GrishinRobotics/status/2065028385177272456",
        kind: "x_post",
        title: "Post by @GrishinRobotics (Grishin Robotics)",
        author: "@GrishinRobotics",
        publishedOn: "2026-06-11",
        excerpt:
          "Rotomate raised EUR 2.1 million in pre-seed funding to build an AI reliability assistant for industrial maintenance teams.\n\nKvanted led the round, backing a Helsinki team that is turning machine data, maintenance records, and operating context into clearer recommendations for…",
      },
      { key: "site", url: "https://rotomate.ai/", kind: "company_website", title: "Rotomate | Your AI colleague for condition monitoring", author: "Rotomate", publishedOn: null },
      {
        key: "prh",
        url: "https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=3437155-5",
        kind: "registry",
        title: "Rotomate Oy (3437155-5) — Finnish Trade Register (PRH)",
        author: "Finnish Patent and Registration Office",
        publishedOn: "2024-04-09",
        notes: "Linked by the website footer, which gives the same business ID.",
      },
    ],
    facts: [
      { source: "site", field: "product", value: "An AI colleague for condition monitoring of rotating equipment that combines monitoring, process and maintenance data to find developing faults before they reach production.", quote: "Rotomate's AI colleague combines your existing condition monitoring with process and maintenance data, and finds developing faults before they reach production.", provenance: "company_claim" },
      { source: "x", field: "customer", value: "Industrial maintenance teams.", quote: "an AI reliability assistant for industrial maintenance teams", provenance: "third_party" },
      { source: "x", field: "signal", value: "Raised €2.1M pre-seed led by Kvanted, per Grishin Robotics on 11 Jun 2026.", quote: "Rotomate raised EUR 2.1 million in pre-seed funding", provenance: "third_party" },
      { source: "x", field: "stage", value: "Pre-seed, per Grishin Robotics.", quote: "pre-seed funding", provenance: "third_party" },
      { source: "site", field: "location", value: "Helsinki, Finland", quote: "Rotomate Oy, 3437155-5 Helsinki, Finland", provenance: "company_claim" },
      { source: "prh", field: "legal_entity", value: "Rotomate Oy (Rotomate Ltd), business ID 3437155-5, registered 9 April 2024, software development.", quote: "\"name\":\"Rotomate Oy\"", provenance: "verified" },
    ],
  },
  {
    name: "Zympler",
    website: "https://zympler.com",
    nextQuestion: "Who is the paying customer — charge-point operators, fleet depots or EPCs — and how much grid capacity has the software freed at a named site?",
    sources: [
      {
        key: "x",
        url: "https://x.com/wrahim/status/2102329215290921277",
        kind: "x_post",
        title: "Post by @wrahim (Wahid Rahim)",
        author: "@wrahim",
        publishedOn: "2026-09-22",
        excerpt: "Utrecht energy software startup Zympler raises €1.5 million seed round to expand tool... pic.twitter.com/cnuW5OWgp7",
      },
      { key: "site", url: "https://zympler.com/", kind: "company_website", title: "Zympler | Slimme energiemanagement software tegen netcongestie", author: "Zympler", publishedOn: null },
    ],
    facts: [
      { source: "site", field: "product", value: "Energy-management software that works around grid congestion and cuts energy costs (translated from Dutch).", quote: "Zympler is slimme energiemanagement software die netcongestie oplost, energiekosten verlaagt en groei ondersteunt.", provenance: "company_claim", note: "Translated. The quote is the site's Dutch original." },
      { source: "site", field: "customer", value: "Charge-point operators, EPCs and enterprises with sites; uses include depot charging for electric fleets, public DC charging and microgrids.", quote: "Depot charging Slim laden van een elektrische vloot op eigen terrein", provenance: "company_claim" },
      { source: "x", field: "signal", value: "Raised a €1.5M seed round, per a post on 22 Sep 2026.", quote: "Zympler raises €1.5 million seed round", provenance: "third_party" },
      { source: "x", field: "stage", value: "Seed, per the post.", quote: "seed round", provenance: "third_party" },
      { source: "x", field: "location", value: "Utrecht, Netherlands", quote: "Utrecht energy software startup Zympler", provenance: "third_party", note: "Dutch registry (KvK) not checked." },
      { source: "site", field: "contact_route", value: "info@zympler.com", quote: "mailto:info@zympler.com", provenance: "verified", note: "Published on the company's own site." },
    ],
  },
  {
    name: "Invertix",
    website: "https://invertix.ai",
    nextQuestion: "Which energy operators run its agents in production, and on what data — SCADA, maintenance logs, or both?",
    sources: [
      {
        key: "x",
        url: "https://x.com/raisingfi/status/2057150993997959296",
        kind: "x_post",
        title: "Post by @raisingfi (Raising.fi)",
        author: "@raisingfi",
        publishedOn: "2026-05-20",
        excerpt: "🏛️ Company: Invertix\n🔗 Website: https://t.co/yTm362DpLo\n📊 Amount: €1.7 Million\n🔄 Round: Pre-Seed\n⚙️ Industry: AI, Renewable Energy\n🌍 Location: Munich, Bavaria, Germany",
      },
      { key: "site", url: "https://www.invertix.ai/", kind: "company_website", title: "Invertix | AI Agents for Energy Infrastructure", author: "Invertix", publishedOn: null },
    ],
    facts: [
      { source: "site", field: "product", value: "Connects operational data and deploys AI agents to monitor assets, investigate problems and coordinate work across energy-infrastructure teams.", quote: "Connect operational data and deploy custom AI agents across energy infrastructure.", provenance: "company_claim" },
      { source: "site", field: "customer", value: "Teams running energy operations, asset management, power generation and data centres.", quote: "Explore Invertix for energy operations, asset management, and data-center workflows.", provenance: "company_claim" },
      { source: "x", field: "signal", value: "Raised €1.7M pre-seed, per Raising.fi on 20 May 2026.", quote: "📊 Amount: €1.7 Million", provenance: "third_party" },
      { source: "x", field: "stage", value: "Pre-seed, per Raising.fi.", quote: "🔄 Round: Pre-Seed", provenance: "third_party" },
      { source: "x", field: "location", value: "Munich, Germany", quote: "🌍 Location: Munich, Bavaria, Germany", provenance: "third_party", note: "German register not checked." },
    ],
  },
  {
    name: "Bleu Robotics",
    website: "https://bleu-robotics.com",
    nextQuestion: "Which humanoid hardware does it run on, which factories are deploying it, and is WEPA (an investor) also a customer?",
    sources: [
      {
        key: "x",
        url: "https://x.com/lukas_m_ziegler/status/2115747153305915801",
        kind: "x_post",
        title: "Post by @lukas_m_ziegler (Lukas Ziegler)",
        author: "@lukas_m_ziegler",
        publishedOn: "2026-10-29",
        excerpt:
          "🚨 BREAKING:@BleuRobotics01 has raised €5M pre-seed to solve the humanoid robot deployments.\n\nCo-led by Contrarian Ventures and OVNI Capital, with participation from Kvanted, WEPA and Charlie Songhurst, technology investor and Meta board member, and I'm also an angel \n\nFunny… pic.twitter.com/YeKJnFPgCU",
        notes: "The author says he is an angel investor in the company.",
      },
      { key: "site", url: "https://bleu-robotics.com/", kind: "company_website", title: "Bleu Robotics — Teaching humanoid robots to work in factories", author: "Bleu Robotics", publishedOn: null },
    ],
    facts: [
      { source: "site", field: "product", value: "AI that teaches a humanoid robot a manual task on a production line in under an hour from a few demonstrations.", quote: "Bleu Robotics builds the AI that lets a humanoid robot take on manual tasks on your line: taught in under an hour with a few demonstrations, and a new task at each changeover.", provenance: "company_claim" },
      { source: "site", field: "customer", value: "Factories with manual tasks on their production lines.", quote: "take on manual tasks on your line", provenance: "company_claim", note: "No customer named." },
      { source: "x", field: "signal", value: "Raised €5M pre-seed co-led by Contrarian Ventures and OVNI Capital, per a post on 29 Oct 2026.", quote: "has raised €5M pre-seed to solve the humanoid robot deployments", provenance: "third_party", note: "The author discloses he is an angel in the round." },
      { source: "x", field: "stage", value: "Pre-seed, per the post.", quote: "€5M pre-seed", provenance: "third_party" },
      { source: "site", field: "location", value: "Paris, France", quote: "Robotics Software Engineer [ Tech ] [ Full time ] [ Paris ]", provenance: "company_claim", note: "From its job listings." },
      { source: "site", field: "contact_route", value: "contact@bleu-robotics.com", quote: "mailto:contact@bleu-robotics.com", provenance: "verified", note: "Published on the company's own site." },
    ],
  },
  {
    name: "Rebaba",
    website: "https://rebaba.se",
    nextQuestion: "Where do the second-life cells come from, what warranty does it give on them, and who are the first sites buying the systems?",
    sources: [
      {
        key: "x",
        url: "https://x.com/arcticstartup/status/2099841543230112216",
        kind: "x_post",
        title: "Post by @arcticstartup (ArcticStartup)",
        author: "@arcticstartup",
        publishedOn: "2026-09-15",
        excerpt:
          "Swedish startup raises $4.6 million seed to turn retired EV batteries into energy storage systems https://t.co/W0BPkXPLue @SistaFund @EITUrbanMob #nordicmade #Sweden #funding #startups #energytech #electricvehicles #climatetech #cleantech #circulareconomy #trending pic.twitter.com/cP9nYfQG3G",
      },
      { key: "site", url: "https://rebaba.se/", kind: "company_website", title: "Circular Battery Energy Storage Systems | Rebaba", author: "Rebaba", publishedOn: null },
    ],
    facts: [
      { source: "site", field: "product", value: "Battery energy storage systems built from second-life EV cells.", quote: "Rebaba builds circular battery energy storage systems from second-life EV cells — lower energy costs, backup power and strong data safety.", provenance: "company_claim" },
      { source: "x", field: "signal", value: "Raised a $4.6M seed round, per ArcticStartup on 15 Sep 2026.", quote: "Swedish startup raises $4.6 million seed to turn retired EV batteries into energy storage systems", provenance: "third_party" },
      { source: "x", field: "stage", value: "Seed, per ArcticStartup.", quote: "$4.6 million seed", provenance: "third_party" },
      { source: "x", field: "location", value: "Sweden", quote: "Swedish startup", provenance: "third_party", note: "No city stated." },
    ],
  },
];
