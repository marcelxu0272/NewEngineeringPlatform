import { NextResponse } from "next/server";
import {
  CORE_PROJECTS_BY_ORG,
  STATUS_TOOLTIP,
  isOrgCoreActivitySlug,
} from "@/lib/data/org-core-project-activity";
import { SLUG_TO_SECTORS } from "@/lib/data/org-dashboard-meta";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: { slug: string } },
) {
  const { slug } = context.params;
  if (!isOrgCoreActivitySlug(slug)) {
    return NextResponse.json({ error: "Unknown org" }, { status: 404 });
  }

  const sectors = SLUG_TO_SECTORS[slug] ?? [];
  const projects = CORE_PROJECTS_BY_ORG[slug] ?? [];

  return NextResponse.json({
    sectors,
    statusTooltips: STATUS_TOOLTIP,
    projects,
  });
}
