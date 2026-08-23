import crypto from "crypto";

// Allowed MIME types and corresponding magic byte signatures
const ALLOWED_IMAGE_TYPES: Record<string, { ext: string; magic: number[] }> = {
  "image/jpeg": { ext: ".jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: ".png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/webp": { ext: ".webp", magic: [0x52, 0x49, 0x46, 0x46] }, // 'RIFF'
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const DANGEROUS_EXTENSIONS = [
  ".php", ".phtml", ".php3", ".php4", ".php5", ".phps",
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".ps1",
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".rb", ".pl", ".cgi", ".asp", ".aspx", ".jsp",
  ".htm", ".html", ".svg", ".xml", ".htaccess",
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  safeFilename?: string;
  mimeType?: string;
}

export function validateUploadedBuffer(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType: string
): ValidationResult {
  // 1. File Size Check
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds 5MB limit." };
  }
  if (buffer.length < 12) {
    return { valid: false, error: "Invalid or empty file." };
  }

  // 2. Dangerous Extension Check
  const lowerOriginal = originalFilename.toLowerCase();
  for (const dangerous of DANGEROUS_EXTENSIONS) {
    if (lowerOriginal.endsWith(dangerous)) {
      return { valid: false, error: "Executable or hazardous file extensions are prohibited." };
    }
  }

  // 3. MIME Type & Magic Bytes Verification
  const typeConfig = ALLOWED_IMAGE_TYPES[declaredMimeType];
  if (!typeConfig) {
    return { valid: false, error: "Only JPEG, PNG, and WebP image formats are permitted." };
  }

  // Verify magic bytes
  const bytes = Array.from(buffer.subarray(0, typeConfig.magic.length));
  const matchesMagic = typeConfig.magic.every((byte, idx) => byte === bytes[idx]);

  if (!matchesMagic) {
    return { valid: false, error: "File content does not match declared image format signature." };
  }

  // 4. Generate Cryptographically Random Safe Filename (Prevents Path Traversal)
  const randomPrefix = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const safeFilename = `upload_${timestamp}_${randomPrefix}${typeConfig.ext}`;

  return {
    valid: true,
    safeFilename,
    mimeType: declaredMimeType,
  };
}
