import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { importInventory } from "@/lib/orders";

const schema = z.object({ entries: z.string().max(200000) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin();
    const { id } = await params; const { entries } = schema.parse(await request.json());
    const count = await importInventory(id, entries.split(/\r?\n/));
    return NextResponse.json({ imported: count });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Import stok gagal." }, { status: 400 }); }
}
