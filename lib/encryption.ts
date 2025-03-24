const KEY = "@1PM-tS.S4b6[{s";

export const xorEncrypt = (input: string) => {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
    output += String.fromCharCode(charCode);
  }
  return output;
};

export const xorDecrypt = (input: string) => {
  return xorEncrypt(input); // XOR encryption is symmetric
};

// export { xorEncrypt, xorDecrypt };

// export const encryptData = (plaintext: string) => {
//   const iv = randomBytes(16);
//   const key = randomBytes(32);

//   const cipher = createCipheriv("aes-256-cbc", key, iv);

//   return Buffer.concat([
//     key,
//     iv,
//     cipher.update(plaintext),
//     cipher.final(),
//   ]).toString("hex");
// };

// export const decryptData = (cipherText: string) => {
//   const cipherBuffer = Buffer.from(cipherText, "hex");
//   const iv = cipherBuffer.subarray(0, 32);
//   const key = cipherBuffer.subarray(32, 48);
//   const encryptedText = cipherBuffer.subarray(48);
//   const decipher = createDecipheriv("aes-256-cbc", key, iv);

//   return Buffer.concat([
//     decipher.update(encryptedText),
//     decipher.final(),
//   ]).toString();
// };
