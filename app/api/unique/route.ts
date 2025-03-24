import { createCipheriv, randomBytes } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const fileName = randomBytes(32).toString("hex");
  const tempPath = await resolve(`/temp/key/${body.id}`);

  if (!(await existsSync(tempPath))) {
    await mkdirSync(tempPath, { recursive: true });
  }

  await writeFileSync(join(tempPath, fileName), fileName);

  return NextResponse.json({
    uid: fileName,
  });
}

// export async function GET(request: NextRequest) {
//   const id = request.nextUrl.searchParams.get("id") ?? null;
//   const uid = request.nextUrl.searchParams.get("uid") ?? null;

//   if (!id) {
//     return NextResponse.json({ pdf: null });
//   }

//   const tempPath = await resolve(__dirname, `/temp/key/${id}`);
//   const buffer = await readFileSync(join(tempPath, `${uid}`));

//   //   unlinkSync(join(tempPath, `${uid}`));

//   if (!buffer) {
//     return NextResponse.json({ success: false });
//   }

//   return NextResponse.json({ success: true });
// }

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? null;
  const uid = request.nextUrl.searchParams.get("uid") ?? null;

  if (!id || !uid) {
    return NextResponse.json({ success: false });
  }

  const tempPath = await resolve(`/temp/key/${id}`);
  const buffer = await readFileSync(join(tempPath, `${uid}`));

  unlinkSync(join(tempPath, `${uid}`));

  if (!buffer) {
    return NextResponse.json({ success: false });
  }

  return NextResponse.json({ success: true });
}
