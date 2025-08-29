import * as CryptoJS from 'crypto-js';

export type Base64UrlPattern = { plus?: string; slash?: string; pad?: string };

// --- Basic AES ---
export const encrypt = (text: string, key: string) =>
  CryptoJS.AES.encrypt(text, key).toString();

export const decrypt = (encrypted: string, key: string) =>
  CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);

// --- AES + Base64 URL with custom pattern ---
export const encryptUrl = (text: string, key: string, pattern?: Base64UrlPattern) =>
  base64UrlEncode(encrypt(text, key), pattern);

export const decryptUrl = (encrypted: string, key: string, pattern?: Base64UrlPattern) =>
  decrypt(base64UrlDecode(encrypted, pattern), key);

// --- Base64 URL helpers with custom pattern ---
export const base64UrlEncode = (str: string, pattern: Base64UrlPattern = {}) => {
  const { plus = "-", slash = "_", pad = "" } = pattern;
  return CryptoJS.enc.Base64.parse(str)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, plus)
    .replace(/\//g, slash)
    .replace(/=+$/, pad);
};

export const base64UrlDecode = (str: string, pattern: Base64UrlPattern = {}) => {
  const { plus = "-", slash = "_", pad = "" } = pattern;
  let base64 = str.replace(new RegExp(plus, "g"), "+").replace(new RegExp(slash, "g"), "/");
  const missing = (4 - (base64.length % 4)) % 4;
  base64 += pad.repeat(missing);
  return base64;
};
