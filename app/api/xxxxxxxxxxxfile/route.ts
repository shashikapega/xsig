import { readFileSync, unlinkSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? null;

  if (!id) {
    return NextResponse.json({ pdf: null });
  }

  const tempPath = await resolve(__dirname, "../../../temp");
  const buffer = await readFileSync(join(tempPath, `${id}.pdf`));
  // const json = await readFileSync(join(tempPath, `${id}.json`));

  return NextResponse.json({
    pdf: buffer.toString("base64"),
    // services: JSON.parse(json.toString("utf-8")),
  });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? null;

  if (!id) {
    return NextResponse.json({ error: true });
  }

  const tempPath = await resolve(__dirname, "../../../temp");
  unlinkSync(join(tempPath, `${id}.pdf`));
  // const buffer = await readFileSync(join(tempPath, `${id}.pdf`));
  // const json = await readFileSync(join(tempPath, `${id}.json`));

  return NextResponse.json({ error: false });
}
