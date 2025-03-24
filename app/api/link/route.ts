import { existsSync, mkdirSync, writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `${Date.now()}`;
  const fileName = `${id}.pdf`;
  const tempPath = await resolve("/data/documents");

  if (!(await existsSync(tempPath))) {
    await mkdirSync(tempPath, { recursive: true });
  }

  // await writeFileSync(
  //   join(tempPath, `${id}.json`),
  //   JSON.stringify(body.services.split(","))
  // );

  await writeFileSync(
    join(tempPath, fileName),
    Buffer.from(body.pdf, "base64")
  );

  return NextResponse.json({
    id: id,
  });
}
