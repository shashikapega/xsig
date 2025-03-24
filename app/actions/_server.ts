"use server";

import { xorEncrypt } from "@/lib/encryption";
import { readFileSync, unlinkSync } from "fs";
import { cookies } from "next/headers";
import { join, resolve } from "path";

export const getCookies = async (key: string) => {
  const data = cookies().get(key);
  return data;
};

export const getPdfFile = async (id: string) => {
  const tempPath = await resolve("/data/documents");
  const buffer = await readFileSync(join(tempPath, `${id}.pdf`));
  // const json = await readFileSync(join(tempPath, `${id}.json`));

  return {
    pdf: xorEncrypt(buffer.toString("base64")),
  };
};

export const deletePdfFile = async (id: string) => {
  const tempPath = await resolve("/data/documents");
  // const buffer = await readFileSync(join(tempPath, `${id}.pdf`));
  try {
    unlinkSync(join(tempPath, `${id}.pdf`));
  } catch (error) {}
  // const json = await readFileSync(join(tempPath, `${id}.json`));

  return {
    success: true,
  };
};

export const verifyUnique = async (id: string, uid: string) => {
  const tempPath = await resolve(`/temp/key/${id}`);
  const buffer = await readFileSync(join(tempPath, `${uid}`));

  unlinkSync(join(tempPath, `${uid}`));

  if (!buffer) {
    return {
      success: false,
    };
  }

  return {
    success: true,
  };
};
