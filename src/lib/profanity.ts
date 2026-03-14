const BLOCKED = [
  'ass','asshole','bastard','bitch','blowjob','bollocks','cock','crap',
  'cunt','damn','dick','dildo','douche','fag','faggot','fuck','goddamn',
  'handjob','hell','homo','jerkoff','kike','milf','motherfucker','nazi',
  'nigga','nigger','penis','piss','porn','pussy','retard','sex','shit',
  'slut','spic','tits','twat','vagina','whore','wank',
];

export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
  return BLOCKED.some(w => normalized.includes(w));
}

export function isValidDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters.' };
  if (trimmed.length > 50) return { valid: false, error: 'Name must be 50 characters or less.' };
  if (containsProfanity(trimmed)) return { valid: false, error: 'Please choose an appropriate display name.' };
  if (!/^[a-zA-Z0-9 ._'\-]+$/.test(trimmed)) return { valid: false, error: 'Name can only contain letters, numbers, spaces, periods, hyphens, and apostrophes.' };
  return { valid: true };
}
