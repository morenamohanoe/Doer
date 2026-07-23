// Utility function to get a proper, personalized avatar for any user or doer profile
// Replaces static single-photo fallbacks with dynamic, distinct, high-quality profile images.

const MOCK_DOER_AVATARS: Record<string, string> = {
  'doer-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&fit=crop&q=80', // Sipho (Male)
  'doer-2': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&fit=crop&q=80', // Anika (Female)
  'doer-3': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&fit=crop&q=80', // David (Male)
  'doer-4': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&fit=crop&q=80', // Naledi (Female)
};

const DIVERSE_MALE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&fit=crop&q=80',
];

const DIVERSE_FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&fit=crop&q=80',
];

const BACKGROUND_COLORS = [
  '0f172a', '4f46e5', '2563eb', '0d9488', '059669', 'd97706', 'dc2626', '7c3aed', 'c026d3'
];

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProperAvatar(url?: string | null, name?: string | null, id?: string | null, gender?: string | null): string {
  // If id matches a known mock doer, use their dedicated image
  if (id && MOCK_DOER_AVATARS[id]) {
    return MOCK_DOER_AVATARS[id];
  }

  // Check if URL is valid user-uploaded image (data URI or non-generic remote URL)
  if (url && typeof url === 'string') {
    const trimmed = url.trim();
    // Exclude the old single hardcoded female avatar and Volkswagen logo
    const isGenericFallback = trimmed.includes('photo-1534528741775-53994a69daeb');
    const isBrokenVw = trimmed.includes('1599305445671-ac291c95aaa9');

    if (trimmed !== '' && !isGenericFallback && !isBrokenVw) {
      return trimmed;
    }
  }

  // If gender is explicitly known, pick a deterministic portrait from the corresponding pool
  const key = id || name || 'default';
  const hash = stringHash(key);

  if (gender) {
    const normalizedGender = gender.toLowerCase().trim();
    if (normalizedGender === 'male' || normalizedGender === 'man' || normalizedGender === 'm') {
      return DIVERSE_MALE_AVATARS[hash % DIVERSE_MALE_AVATARS.length];
    }
    if (normalizedGender === 'female' || normalizedGender === 'woman' || normalizedGender === 'f') {
      return DIVERSE_FEMALE_AVATARS[hash % DIVERSE_FEMALE_AVATARS.length];
    }
  }

  // Default to a crisp UI Avatar using their full name so it's personalized and clean
  const displayName = (name && name.trim()) ? name.trim() : 'User';
  const bgColor = BACKGROUND_COLORS[hash % BACKGROUND_COLORS.length];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${bgColor}&color=ffffff&bold=true&size=250`;
}
