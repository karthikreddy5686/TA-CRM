/**
 * Phone Number Normalizer & Dialer Utility for Campus Recruitment CRM
 * 
 * Solves telecom carrier IVR rejection ("The number you dialed is incorrect") by:
 * 1. Generating standard E.164 format (+919876543210) for international routing
 * 2. Providing clean 10-digit format (9876543210) for native local Indian SIM dialing
 * 3. Generating valid WhatsApp Click-to-Chat numbers without '+' prefix (919876543210)
 * 4. Handling leading trunk '0', spaces, hyphens, and country code prefixes
 */

export function normalizePhoneNumber(rawInput) {
  if (!rawInput) {
    return {
      raw: '',
      cleanDigits: '',
      local10: '',
      e164: '',
      telUrl: '',
      localTelUrl: '',
      waNumber: '',
      display: '',
      isValid: false,
    };
  }

  const rawStr = String(rawInput).trim();
  // Strip all non-digit characters
  let digits = rawStr.replace(/\D/g, '');

  if (!digits) {
    return {
      raw: rawStr,
      cleanDigits: '',
      local10: '',
      e164: '',
      telUrl: '',
      localTelUrl: '',
      waNumber: '',
      display: rawStr,
      isValid: false,
    };
  }

  // Handle Indian trunk prefix (leading '0', e.g. 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Extract clean 10-digit mobile number
  let local10 = '';
  if (digits.length === 12 && digits.startsWith('91')) {
    // 919876543210 -> 9876543210
    local10 = digits.slice(2);
  } else if (digits.length === 10) {
    local10 = digits;
  } else if (digits.length > 10 && digits.startsWith('91')) {
    local10 = digits.slice(2, 12);
  } else if (digits.length > 10) {
    local10 = digits.slice(-10);
  } else {
    local10 = digits;
  }

  const isIndian10 = local10.length === 10 && /^[6-9]\d{9}$/.test(local10);

  // CRITICAL FIX: Dialing without '+' (e.g. tel:919876543210) causes Indian mobile carriers
  // (Airtel, Jio, Vi) to interpret '91' as an invalid local area code, triggering:
  // "The number you dialed is incorrect, please check the number".
  // Adding '+' tells the smartphone dialer to use the international GSM escape (+91).
  const e164 = isIndian10
    ? `+91${local10}`
    : (rawStr.startsWith('+') ? `+${digits}` : `+91${local10 || digits}`);

  const telUrl = `tel:${e164}`;
  const localTelUrl = isIndian10 ? `tel:${local10}` : telUrl;

  // WhatsApp wa.me requires country code without the '+' symbol
  const waNumber = isIndian10 ? `91${local10}` : digits;

  // Pretty formatted display (e.g. +91 98765 43210)
  const display = isIndian10
    ? `+91 ${local10.slice(0, 5)} ${local10.slice(5)}`
    : rawStr;

  return {
    raw: rawStr,
    cleanDigits: digits,
    local10,
    e164,
    telUrl,
    localTelUrl,
    waNumber,
    display,
    isValid: isIndian10 || digits.length >= 7,
  };
}
