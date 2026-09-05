import dnsPromises from "node:dns/promises";
import dnsSync from "node:dns";
import { env } from "../config/env";

// Pastikan resolver mengarah ke public DNS tepercaya (Google & Cloudflare)
try {
  dnsSync.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Abaikan jika runtime environment membatasi konfigurasi resolver
}

// Daftar domain email sementara (disposable / temp mail) terpopuler
const DISPOSABLE_DOMAINS = new Set([
  "yopmail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "sharklasers.com",
  "10minutemail.com",
  "trashmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "getairmail.com",
  "throwawaymail.com",
  "mohmal.com",
  "generator.email",
  "crazymailing.com",
]);

export interface EmailValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validasi Lapis 1: Cek format email, filter disposable domain, dan verifikasi DNS MX Record.
 */
export async function validateEmailDomain(email: string): Promise<EmailValidationResult> {
  const cleanEmail = email.toLowerCase().trim();
  const parts = cleanEmail.split("@");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, message: "Format email tidak valid" };
  }

  const domain = parts[1];

  // Domain harus memiliki ekstensi (.com, .id, dll)
  if (!domain.includes(".") || domain.endsWith(".")) {
    return { valid: false, message: `Domain email "@${domain}" tidak valid` };
  }

  // Cek daftar disposable/temporary mail
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: `Domain email "@${domain}" adalah email sementara (disposable) dan tidak diizinkan`,
    };
  }

  // Bypass DNS query saat running test suite untuk domain testing
  if (env.NODE_ENV === "test" && (domain === "zalde.dev" || domain === "zalde.com" || domain === "test.local")) {
    return { valid: true };
  }

  // Verifikasi DNS MX Record dengan timeout 3.5 detik
  try {
    const mxLookup = dnsPromises.resolveMx(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3500)
    );

    const records = (await Promise.race([mxLookup, timeoutPromise])) as any[];

    // RFC 7505: Null MX record ditandai dengan exchange kosong atau "." (domain menolak email)
    const activeMx = records.filter(
      (rec) => rec.exchange && rec.exchange.trim().length > 0 && rec.exchange.trim() !== "."
    );

    if (!activeMx || activeMx.length === 0) {
      return {
        valid: false,
        message: `Domain email "@${domain}" tidak memiliki server email aktif (MX Record)`,
      };
    }

    return { valid: true };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA" || error.code === "NXDOMAIN") {
      return {
        valid: false,
        message: `Domain email "@${domain}" tidak ditemukan atau tidak aktif`,
      };
    }

    // Jika timeout atau network DNS error, jangan blokir user yang valid
    // ponytail: biarkan lewat saat koneksi DNS publik timeout agar tidak false-negative
    console.warn(`[EmailValidator] DNS check warning for ${domain}:`, error.message);
    return { valid: true };
  }
}
