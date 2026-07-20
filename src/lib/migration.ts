import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Migration script to consolidate legacy collections into the new production schema.
 * Keeps only: users, doer_profiles, user_verifications, portfolio_projects, locations
 */
export async function migrateExistingUser(uid: string) {
  if (!uid) return;

  try {
    console.log(`[Migration] Starting migration for user ${uid}...`);

    // References to old collections
    const skillsRef = doc(db, 'user_skills', uid);
    const languagesRef = doc(db, 'user_languages', uid);
    const interestsRef = doc(db, 'user_interests', uid);
    const availabilityRef = doc(db, 'user_availability', uid);
    const certificationsRef = doc(db, 'user_certifications', uid);
    const socialLinksRef = doc(db, 'user_social_links', uid);
    const referencesRef = doc(db, 'user_references', uid);
    const trustScoresRef = doc(db, 'trust_scores', uid);
    const profileCompletionRef = doc(db, 'profile_completion', uid);

    // Fetch old data in parallel
    const [
      skillsDoc,
      languagesDoc,
      interestsDoc,
      availabilityDoc,
      certificationsDoc,
      socialLinksDoc,
      referencesDoc,
      trustScoresDoc
    ] = await Promise.all([
      getDoc(skillsRef),
      getDoc(languagesRef),
      getDoc(interestsRef),
      getDoc(availabilityRef),
      getDoc(certificationsRef),
      getDoc(socialLinksRef),
      getDoc(referencesRef),
      getDoc(trustScoresRef)
    ]);

    // Gather existing doer profile
    const doerRef = doc(db, 'doer_profiles', uid);
    const doerDoc = await getDoc(doerRef);
    const currentDoerData = doerDoc.exists() ? doerDoc.data() : {};

    // Map fields cleanly, avoiding empty or placeholder values
    const skills: string[] = [
      ...(currentDoerData.skills || []),
      ...(skillsDoc.exists() ? (skillsDoc.data().skills || []) : [])
    ].filter(s => s && s.trim() !== '' && s !== 'User');

    const languages: string[] = [
      ...(currentDoerData.languages || []),
      ...(languagesDoc.exists() ? (languagesDoc.data().languagesSpoken || []) : [])
    ].filter(l => l && l.trim() !== '' && l !== 'User');

    const certifications: string[] = [
      ...(currentDoerData.certifications || []),
      ...(certificationsDoc.exists() ? (certificationsDoc.data().certifications || []) : [])
    ].filter(c => c && c.trim() !== '' && c !== 'User');

    const interests: string[] = [
      ...(currentDoerData.interests || []),
      ...(interestsDoc.exists() ? (interestsDoc.data().interests || []) : [])
    ].filter(i => i && i.trim() !== '' && i !== 'User');

    // Consolidate Trust Score
    let trustScoreObj = currentDoerData.trustScore || {
      score: 10,
      level: 'New User',
      verificationScore: 10,
      reputationScore: 0,
      reliabilityScore: 0,
      activityScore: 0
    };

    if (trustScoresDoc.exists()) {
      const oldTrust = trustScoresDoc.data();
      trustScoreObj = {
        score: oldTrust.score ?? trustScoreObj.score,
        level: oldTrust.level ?? trustScoreObj.level,
        verificationScore: oldTrust.verificationTrust ?? trustScoreObj.verificationScore,
        reputationScore: oldTrust.reviewTrust ?? trustScoreObj.reputationScore,
        reliabilityScore: oldTrust.completionTrust ?? trustScoreObj.reliabilityScore,
        activityScore: oldTrust.activityTrust ?? trustScoreObj.activityScore
      };
    }

    // Parse availability details
    const availabilityData = availabilityDoc.exists() ? availabilityDoc.data() : {};
    const socialLinksData = socialLinksDoc.exists() ? socialLinksDoc.data() : {};
    const referencesData = referencesDoc.exists() ? referencesDoc.data() : {};

    // Build consolidated profile payload, removing placeholder/empty values
    const newDoerProfile: Record<string, any> = {
      uid,
      userId: uid,
      displayName: currentDoerData.displayName || '',
      bio: currentDoerData.bio || '',
      occupation: currentDoerData.occupation || '',
      yearsOfExperience: Number(currentDoerData.yearsOfExperience || 0),
      education: currentDoerData.education || currentDoerData.highestEducation || '',
      skills,
      languages,
      categories: currentDoerData.categories || [],
      servicesOffered: currentDoerData.servicesOffered || [],
      hourlyRate: Number(currentDoerData.hourlyRate || 0),
      reviewCount: Number(currentDoerData.reviewCount ?? 0),
      isActive: currentDoerData.isActive ?? true,
      createdAt: currentDoerData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Merge non-empty optional keys
    if (interests.length > 0) newDoerProfile.interests = interests;
    if (certifications.length > 0) newDoerProfile.certifications = certifications;
    if (availabilityData.workingHours) newDoerProfile.workingHours = availabilityData.workingHours;
    if (availabilityData.preferredWorkDays?.length > 0) {
      newDoerProfile.preferredWorkDays = availabilityData.preferredWorkDays.filter((d: string) => d && d.trim() !== '');
    }
    if (availabilityData.emergencyAvailability !== undefined) {
      newDoerProfile.emergencyAvailability = availabilityData.emergencyAvailability;
    }
    if (availabilityData.responseTime) newDoerProfile.responseTime = availabilityData.responseTime;

    if (socialLinksData.linkedin) newDoerProfile.linkedin = socialLinksData.linkedin;
    if (socialLinksData.personalWebsite) newDoerProfile.personalWebsite = socialLinksData.personalWebsite;

    if (referencesData.referenceContacts?.length > 0) {
      newDoerProfile.referenceContacts = referencesData.referenceContacts;
    }
    if (referencesData.emergencyContact) {
      newDoerProfile.emergencyContact = referencesData.emergencyContact;
    }

    // Clean payload of empty strings and empty arrays before saving
    const cleanedProfilePayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(newDoerProfile)) {
      if (value === undefined || value === null || value === '' || value === 'User') continue;
      if (Array.isArray(value)) {
        const filteredArray = value.filter(item => item !== '' && item !== 'User');
        if (filteredArray.length === 0) continue;
        cleanedProfilePayload[key] = filteredArray;
      } else {
        cleanedProfilePayload[key] = value;
      }
    }

    // Save consolidated profile
    await setDoc(doerRef, cleanedProfilePayload, { merge: true });
    console.log(`[Migration] Consolidated doer profile saved for ${uid}`);

    // Migrate user_verifications if any old data existed, keeping only what's needed
    const verRef = doc(db, 'user_verifications', uid);
    const verDoc = await getDoc(verRef);
    if (!verDoc.exists()) {
      await setDoc(verRef, {
        uid,
        backgroundCheckStatus: 'not_submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Update the main user document to set profileCompleted
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { profileCompleted: true }, { merge: true });

    // Delete legacy collection documents to clean up database space
    const deleteOldPromises = [
      skillsDoc.exists() ? deleteDoc(skillsRef) : Promise.resolve(),
      languagesDoc.exists() ? deleteDoc(languagesRef) : Promise.resolve(),
      interestsDoc.exists() ? deleteDoc(interestsRef) : Promise.resolve(),
      availabilityDoc.exists() ? deleteDoc(availabilityRef) : Promise.resolve(),
      certificationsDoc.exists() ? deleteDoc(certificationsRef) : Promise.resolve(),
      socialLinksDoc.exists() ? deleteDoc(socialLinksRef) : Promise.resolve(),
      referencesDoc.exists() ? deleteDoc(referencesRef) : Promise.resolve(),
      trustScoresDoc.exists() ? deleteDoc(trustScoresRef) : Promise.resolve(),
      getDoc(profileCompletionRef).then(d => d.exists() ? deleteDoc(profileCompletionRef) : Promise.resolve())
    ];

    await Promise.all(deleteOldPromises);
    console.log(`[Migration] Successfully cleaned up legacy documents for ${uid}`);

  } catch (error) {
    console.error(`[Migration] Failed migrating user ${uid}:`, error);
  }
}
