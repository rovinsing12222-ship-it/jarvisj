import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Contact } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Force consent prompt so user is prompted to check the contacts permission box
provider.setCustomParameters({
  prompt: 'consent select_account',
  access_type: 'offline',
});

// Cache the access token in memory only - NEVER persist in localStorage/sessionStorage
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be acquired via interactive sign-in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from an explicit user action (button click)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Contacts OAuth access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Contacts sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};

export interface GoogleContactPerson {
  resourceName?: string;
  etag?: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
  }>;
  phoneNumbers?: Array<{
    value?: string;
    type?: string;
    canonicalForm?: string;
  }>;
  emailAddresses?: Array<{
    value?: string;
    type?: string;
  }>;
  photos?: Array<{
    url?: string;
    default?: boolean;
  }>;
  organizations?: Array<{
    name?: string;
    title?: string;
    department?: string;
  }>;
  userDefined?: Array<{
    key?: string;
    value?: string;
  }>;
}

const AVATAR_COLORS = [
  '#0891b2', // cyan
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#ea580c', // orange
  '#16a34a', // emerald
  '#d97706', // amber
  '#4f46e5', // indigo
];

const pickAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Fetch contacts from Google People API using the in-memory access token
 */
export const fetchGoogleContacts = async (accessToken: string): Promise<Contact[]> => {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?' +
    new URLSearchParams({
      pageSize: '500',
      personFields: 'names,phoneNumbers,emailAddresses,photos,organizations,userDefined',
      sortOrder: 'FIRST_NAME_ASCENDING',
    });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      cachedAccessToken = null;
    }
    const errorText = await response.text();
    let errorDetail = '';
    try {
      const parsed = JSON.parse(errorText);
      errorDetail = parsed.error?.message || errorText;
    } catch {
      errorDetail = errorText;
    }
    if (response.status === 403) {
      throw new Error(
        `Google Contacts API error (403): Request had insufficient authentication scopes. Please sign in again and check the box to grant Contacts access.`
      );
    }
    throw new Error(`Google Contacts API error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const connections: GoogleContactPerson[] = data.connections || [];

  const convertedContacts: Contact[] = [];

  connections.forEach((person, index) => {
    const primaryName =
      person.names?.[0]?.displayName ||
      [person.names?.[0]?.givenName, person.names?.[0]?.familyName].filter(Boolean).join(' ') ||
      'Unnamed Contact';

    const phones = person.phoneNumbers || [];
    const primaryPhoneObj = phones[0];
    const secondaryPhoneObj = phones[1];

    // Format phone numbers
    const cleanPrimaryPhone = (primaryPhoneObj?.value || '').trim();
    if (!cleanPrimaryPhone && !person.emailAddresses?.[0]?.value) {
      // Skip contacts with zero phone or email
      return;
    }

    const mapPhoneType = (rawType?: string): 'mobile' | 'work' | 'home' => {
      const lower = (rawType || '').toLowerCase();
      if (lower.includes('work') || lower.includes('office') || lower.includes('biz')) return 'work';
      if (lower.includes('home') || lower.includes('landline') || lower.includes('residence')) return 'home';
      return 'mobile';
    };

    const primaryType = mapPhoneType(primaryPhoneObj?.type);
    const secondaryType = mapPhoneType(secondaryPhoneObj?.type);

    const email = person.emailAddresses?.[0]?.value || '';
    const org = person.organizations?.[0]?.name;
    const title = person.organizations?.[0]?.title;
    const userRole = title ? `${title}${org ? ` at ${org}` : ''}` : org || '';

    // Check relationship from user-defined fields or notes
    const relationField = person.userDefined?.find(
      (u) =>
        u.key?.toLowerCase().includes('relation') ||
        u.key?.toLowerCase().includes('relationship') ||
        u.key?.toLowerCase().includes('group')
    )?.value;

    const contactId =
      person.resourceName?.replace('people/', 'google-') || `google-${Date.now()}-${index}`;

    convertedContacts.push({
      id: contactId,
      name: primaryName,
      phone: cleanPrimaryPhone || 'N/A',
      phoneType: primaryType,
      secondaryPhone: secondaryPhoneObj?.value ? secondaryPhoneObj.value.trim() : undefined,
      secondaryPhoneType: secondaryPhoneObj?.value ? secondaryType : undefined,
      email: email || undefined,
      relation: relationField || userRole || 'Google Contact',
      notes: org ? `Organization: ${org}` : 'Imported from Google Contacts',
      avatarColor: pickAvatarColor(primaryName),
    });
  });

  return convertedContacts;
};
