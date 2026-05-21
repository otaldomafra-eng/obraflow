import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/server/db/client";
import { getFileStream } from "@/server/storage/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { portalToken: token },
    select: { id: true, portalEnabled: true },
  });

  if (!service?.portalEnabled) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      serviceId: service.id,
      visibility: "CLIENT_VISIBLE",
    },
    select: { storagePath: true, fileName: true, mimeType: true },
  });

  if (!doc?.storagePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const stream = await getFileStream(doc.storagePath);
    const headers = new Headers();
    headers.set("Content-Type", doc.mimeType ?? "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${doc.fileName ?? "file"}"`);

    return new NextResponse(stream, { headers });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 500 });
  }
}
