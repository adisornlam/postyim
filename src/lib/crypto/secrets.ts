import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getMasterKey(): Buffer {
  const configured = process.env.SETTINGS_ENCRYPTION_KEY?.trim();

  if (configured) {
    const key = Buffer.from(configured, "base64");

    if (key.length !== KEY_LENGTH) {
      throw new Error(
        "SETTINGS_ENCRYPTION_KEY must be 32 bytes encoded as base64",
      );
    }

    return key;
  }

  const authSecret = process.env.AUTH_SECRET?.trim();

  if (authSecret) {
    return createHash("sha256")
      .update(`postyim-settings:${authSecret}`)
      .digest();
  }

  if (process.env.NODE_ENV === "development") {
    return createHash("sha256")
      .update("postyim-dev-settings-key")
      .digest();
  }

  throw new Error(
    "SETTINGS_ENCRYPTION_KEY or AUTH_SECRET is required to encrypt stored credentials",
  );
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, ivEncoded, authTagEncoded, ciphertextEncoded] =
    payload.split(":");

  if (
    version !== "v1" ||
    !ivEncoded ||
    !authTagEncoded ||
    !ciphertextEncoded
  ) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(ivEncoded, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagEncoded, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
