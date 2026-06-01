const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "guerrillamail.com", "throwaway.email",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamail.net", "guerrillamail.org", "spam4.me", "trashmail.com",
  "trashmail.me", "trashmail.net", "trashmail.at", "trashmail.org",
  "trashmail.io", "dispostable.com", "mailnull.com", "spamgourmet.com",
  "discard.email", "fakeinbox.com", "mailnesia.com", "maildrop.cc",
  "spamfree24.org", "spamgourmet.net", "spamgourmet.org", "spamspot.com",
  "tempr.email", "throwam.com", "temp-mail.org", "tempinbox.com",
  "10minutemail.com", "tempmail.net", "getnada.com", "safetymail.info",
  "sogetthis.com", "spamgrab.com", "spammotel.com", "spoofmail.de",
  "wegwerfemail.de", "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
  "zoemail.net", "zoemail.org", "mailexpire.com", "spamex.com",
  "trashdevil.com", "trashdevil.de", "filzmail.com", "deadaddress.com",
  "binkmail.com", "bobmail.info", "chammy.info", "devnullmail.com",
  "egg.agency", "fastacura.com", "frapmail.com", "getonemail.com",
  "getonemail.net", "haltospam.com", "jetable.fr.nf", "junk1.tk",
  "kasmail.com", "mailblocks.com", "mailscrap.com", "mailzilla.com",
  "mega.zik.dj", "meltmail.com", "mierdamail.com", "mintemail.com",
  "mt2009.com", "mx0.wwwnew.eu", "netmails.net", "noclickemail.com",
  "odnorazovoe.ru", "pookmail.com", "rklips.com", "s0ny.net",
  "sandelf.de", "shiftmail.com", "shortmail.net", "sibmail.com",
  "skeefmail.com", "slopsbox.com", "smellfear.com", "snkmail.com",
  "sofort-mail.de", "soodonims.com", "spam.la", "spamavert.com",
  "spambob.com", "spambox.us", "spamcannon.com", "spamcannon.net",
  "spamcon.org", "spamfree.eu", "spamherelots.com", "spamhereplease.com",
  "spaml.com", "spaml.de", "spamoff.de", "spamthisplease.com",
  "spamtroll.net", "spamzombie.com", "supergreatmail.com", "tafmail.com",
  "tagyourself.com", "tempalias.com", "tempmail.it", "tempmail2.com",
  "thankyou2010.com", "thisisnotmyrealemail.com", "trashcanmail.com",
  "trashmailer.com", "turual.com", "umail.net", "uggsrock.com",
  "upliftnow.com", "veryrealemail.com", "viditag.com", "viralplays.com",
  "watchfull.net", "webemail.me", "wilemail.com", "willselfdestruct.com",
  "winemaven.info", "wronghead.com", "wuzupmail.net", "www.e4ward.com",
  "wwwnew.eu", "xagloo.com", "xemaps.com", "xents.com", "xmaily.com",
  "xoxy.net", "yepmail.net", "yert.ye.vc", "yogamaven.com", "yopmail.fr",
  "yopmail.gq", "yopmail.net", "youmail.ga", "yourtempmail.com",
  "yuurok.com", "z1p.biz", "za.com", "zehnminuten.de", "zehnminutenmail.de",
  "zetmail.com", "zoemail.com", "zomg.info",
]);

const SUSPICIOUS_LOCAL =
  /^(test|fake|spam|noreply|no-reply|dummy|asdf|qwerty|abc|xyz|aaa|bbb|ccc|111|000|admin|delete|null|undefined|sample|example|user|email|name|info|blah|temp|trash|junk|random|nothing|nobody|someone|anyone|whatever|please|ignore|notreal)\d*$/i;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: "Email address is required." };
  }

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  const [local, domain] = trimmed.split("@");

  if (/\.{2,}/.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  if (local.startsWith(".") || local.endsWith(".")) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: "Temporary or disposable email addresses are not accepted. Please use your real email.",
    };
  }

  if (SUSPICIOUS_LOCAL.test(local)) {
    return {
      valid: false,
      error: "Please enter your real email address so we can send your results.",
    };
  }

  return { valid: true };
}
