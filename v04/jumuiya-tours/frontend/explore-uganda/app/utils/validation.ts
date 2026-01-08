// src/utils/validation.ts
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string): boolean {
  console.log("📞 Validating phone:", value);
  const cleaned = value.replace(/\s+/g, "").replace(/^\+/, "");
  
  // Allow: +2567xxxxxxxx, 2567xxxxxxxx, 07xxxxxxxx
  const regex = /^(?:\+?256|0)?7\d{8}$/;
  const isValid = regex.test(cleaned);
  
  console.log("📞 Validation result:", isValid);
  return isValid;
}

export function validatePassword(value: string): string | null {
  if (value.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(value)) return "Include at least one uppercase letter";
  if (!/[0-9]/.test(value)) return "Include at least one number";
  return null;
}