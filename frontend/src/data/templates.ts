import { mkMember, type TeamMember, FACE_OPTIONS } from "./experts";

export type TeamTemplate = {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
};

function face(name: string) {
  return FACE_OPTIONS.find((f) => f.name === name) ?? FACE_OPTIONS[0];
}

function member(
  name: string,
  duty: "writer" | "critic",
  role: string,
  model: string
): TeamMember {
  const f = face(name);
  return mkMember(name.toLowerCase(), name, f.avatar, model, duty, role);
}

// Ordered most → least popular by breadth of use case
export const TEAM_TEMPLATES: TeamTemplate[] = [
  {
    id: "programmer",
    name: "Programmer Team",
    description: "Architecture, implementation plans, and edge-case review.",
    members: [
      member("John", "writer", "Senior full-stack engineer — drafts implementation plans and architecture decisions", "openai/gpt-5.4"),
      member("Christy", "critic", "Security engineer — reviews for vulnerabilities, auth issues, and attack surface", "anthropic/claude-sonnet-4.6"),
      member("Mark", "critic", "DevOps engineer — reviews for scalability, deployment strategy, and observability", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "research-writing",
    name: "Research & Writing Team",
    description: "Long-form writing, research synthesis, and argument quality.",
    members: [
      member("Sue", "writer", "Senior researcher — synthesizes sources and builds the core argument", "anthropic/claude-sonnet-4.6"),
      member("Jue", "critic", "Editor — reviews clarity, structure, logical flow, and unsupported claims", "openai/gpt-5.4"),
      member("Jeff", "critic", "Fact-checker — challenges weak evidence, flags hedging, and tests conclusions", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "ux-product",
    name: "UX / Product Team",
    description: "Product decisions, user flows, and feature trade-offs.",
    members: [
      member("Emma", "writer", "Product lead — defines user stories, success metrics, and feature scope", "anthropic/claude-sonnet-4.6"),
      member("Natalie", "critic", "UX designer — reviews usability, flow clarity, and edge-case interactions", "openai/gpt-5.4"),
      member("Patricia", "critic", "Engineering lead — flags technical feasibility and integration complexity", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "startup-gtm",
    name: "Startup GTM Team",
    description: "Go-to-market strategy, positioning, and growth tactics.",
    members: [
      member("Juan", "writer", "Growth strategist — drafts GTM plan, positioning, and channel strategy", "openai/gpt-5.4"),
      member("Sandy", "critic", "Marketing lead — reviews messaging clarity, ICP fit, and competitive angle", "anthropic/claude-sonnet-4.6"),
      member("Erika", "critic", "Founder advisor — stress-tests assumptions, pricing, and market timing", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign Team",
    description: "Copy, campaign strategy, and audience targeting.",
    members: [
      member("Christy", "writer", "Creative director — develops campaign concept, copy, and emotional hook", "anthropic/claude-sonnet-4.6"),
      member("Sandy", "critic", "Media strategist — reviews channel mix, targeting, and budget allocation", "openai/gpt-5.4"),
      member("Natalie", "critic", "Brand guardian — ensures tone, consistency, and audience resonance", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "investment-debate",
    name: "Investment Debate Team",
    description: "Investment theses, risk vs reward, and market analysis.",
    members: [
      member("Brett", "writer", "Investment analyst — builds the bull case with data and market comps", "openai/gpt-5.4"),
      member("Josh", "critic", "Risk officer — challenges valuation, macro risks, and downside scenarios", "anthropic/claude-sonnet-4.6"),
      member("Mark", "critic", "Portfolio manager — reviews fit, sizing, and opportunity cost vs alternatives", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "resume-career",
    name: "Resume / Career Team",
    description: "Career moves, CV review, and interview preparation.",
    members: [
      member("Suzie", "writer", "Career coach — evaluates positioning, narrative, and impact framing", "anthropic/claude-sonnet-4.6"),
      member("Patricia", "critic", "Hiring manager — reviews from a recruiter's lens: clarity, keywords, red flags", "openai/gpt-5.4"),
      member("Emma", "critic", "Peer advisor — stress-tests the career move decision and growth trajectory", "google/gemini-2.5-flash"),
    ],
  },
  {
    id: "tech-architecture",
    name: "Technical Architecture Review",
    description: "System design, scalability, and infrastructure decisions.",
    members: [
      member("Jue", "writer", "Principal engineer — designs the system architecture and component boundaries", "openai/gpt-5.4"),
      member("John", "critic", "Backend specialist — reviews data models, API contracts, and failure modes", "anthropic/claude-sonnet-4.6"),
      member("Jerry", "critic", "Infrastructure engineer — reviews scaling, cost, latency, and operational burden", "google/gemini-2.5-flash"),
    ],
  },
];
