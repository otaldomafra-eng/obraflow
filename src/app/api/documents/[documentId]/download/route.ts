import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { getFileStream } from "@/server/storage/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const tenantId = session.user.tenantId;

  const doc = await prisma.document.findFirst({
    where: { tenantId, id: documentId },
    select: { storagePath: true, fileName: true, mimeType: true, visibility: true },
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
