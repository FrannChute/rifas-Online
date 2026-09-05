import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, iterationsText, salt, hash] = storedHash.split("$");

  if (algorithm !== "pbkdf2_sha512" || !iterationsText || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(
    pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex"),
    "hex",
  );

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
