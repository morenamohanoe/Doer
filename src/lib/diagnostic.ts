export const debugServiceUpdate = (serviceId: string, payload: any) => {
  console.log('[DIAGNOSTIC] Updating Service:', serviceId);
  console.log('[DIAGNOSTIC] Full Payload:', JSON.stringify(payload, null, 2));
  
  // Verify specific field
  if (payload.featuredImageUrl !== undefined) {
    console.log('[DIAGNOSTIC] featuredImageUrl exists in payload. Length:', payload.featuredImageUrl.length);
  } else {
    console.log('[DIAGNOSTIC] featuredImageUrl is MISSING in payload.');
  }
};
