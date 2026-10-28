/**
 * J.A.R.V.I.S. Customer Management & Device Association Engine
 * Allows Admin to track who downloaded Jarvis, manage customer records (Name, Number, Email, Device),
 * edit personalized Admin/Owner names, and link device ownership so Jarvis greetings dynamically address the registered customer.
 */

import { saveMemory } from './smartMemoryEngine';

export interface CustomerRecord {
  id: string;
  name: string;
  number: string; // Customer phone number
  email: string;
  deviceModel?: string; // e.g., "Samsung Galaxy S24 Ultra", "OnePlus 12"
  city?: string; // e.g., "New Delhi", "Mumbai"
  downloadStatus: 'downloaded' | 'active' | 'pending';
  downloadDate: string; // ISO date string or formatted date
  isLinkedDeviceOwner: boolean; // Indicates if this customer is the registered active user of this Jarvis device!
  serviceNotes?: string;
  plan: 'Lifetime VIP' | 'Standard Access' | 'Enterprise Pro';
  licenseKey: string;
  createdAt: string;
}

export const CUSTOMERS_STORAGE_KEY = 'jarvis_customers';
export const ADMIN_NAME_STORAGE_KEY = 'jarvis_admin_name';
export const ACTIVE_CUSTOMER_STORAGE_KEY = 'jarvis_active_customer_id';

const DEFAULT_ADMIN_NAME = 'Rovin Pal';

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-1',
    name: 'Rovin Pal',
    number: '+91 98765 43210',
    email: 'rovinsing12222@gmail.com',
    deviceModel: 'Samsung Galaxy S24 Ultra (Android 15)',
    city: 'New Delhi',
    downloadStatus: 'active',
    downloadDate: '2026-10-18',
    isLinkedDeviceOwner: true,
    serviceNotes: 'Master Creator & Primary Admin of JARVIS AI',
    plan: 'Lifetime VIP',
    licenseKey: 'JARVIS-ADMIN-7860-RP',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Vikramaditya Sharma',
    number: '+91 98111 55443',
    email: 'vikram.sharma@example.com',
    deviceModel: 'OnePlus 12 (OxygenOS 15)',
    city: 'Gurugram',
    downloadStatus: 'active',
    downloadDate: '2026-10-21',
    isLinkedDeviceOwner: false,
    serviceNotes: 'Full voice control & executive assistant setup activated',
    plan: 'Lifetime VIP',
    licenseKey: 'JARVIS-VIP-4432-VS',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Ananya Verma',
    number: '+91 97234 88990',
    email: 'ananya.verma@example.com',
    deviceModel: 'Redmi Note 13 Pro 5G',
    city: 'Lucknow',
    downloadStatus: 'downloaded',
    downloadDate: '2026-10-23',
    isLinkedDeviceOwner: false,
    serviceNotes: 'Downloaded via Play Store APK build, Hindi voice enabled',
    plan: 'Standard Access',
    licenseKey: 'JARVIS-STD-8890-AV',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'cust-4',
    name: 'Rajesh Patel',
    number: '+91 99012 33445',
    email: 'rajesh.patel@example.com',
    deviceModel: 'Vivo V30 Pro',
    city: 'Ahmedabad',
    downloadStatus: 'active',
    downloadDate: '2026-10-24',
    isLinkedDeviceOwner: false,
    serviceNotes: 'Farm & business management automation installed',
    plan: 'Enterprise Pro',
    licenseKey: 'JARVIS-ENT-3445-RP',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

/**
 * Validates customer details (Name, Phone number, Email)
 */
export function validateCustomerDetails(
  name: string,
  number: string,
  email: string
): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Customer name must be at least 2 characters.' };
  }
  const cleanPhone = number.replace(/[\s\-\(\)\+]/g, '');
  if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 15) {
    return { valid: false, error: 'Please enter a valid phone number (7 to 15 digits).' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

/**
 * Retrieves all stored customer records from localStorage
 */
export function getStoredCustomers(): CustomerRecord[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored customers', e);
  }
  // Initialize default customer list
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
  } catch {}
  return INITIAL_CUSTOMERS;
}

/**
 * Persists customers to localStorage and broadcasts global update event
 */
export function persistCustomers(customers: CustomerRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    window.dispatchEvent(
      new CustomEvent('jarvis:customers-updated', { detail: { customers } })
    );
  } catch (e) {
    console.error('Failed to persist customers', e);
  }
}

/**
 * Saves a new customer record
 */
export function saveCustomer(
  data: Omit<CustomerRecord, 'id' | 'createdAt' | 'licenseKey'>
): CustomerRecord {
  const customers = getStoredCustomers();
  const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const licenseKey = `JARVIS-${data.plan === 'Enterprise Pro' ? 'ENT' : data.plan === 'Lifetime VIP' ? 'VIP' : 'STD'}-${Math.floor(1000 + Math.random() * 9000)}-${data.name.substring(0, 2).toUpperCase()}`;

  let newRecord: CustomerRecord = {
    ...data,
    id,
    licenseKey,
    createdAt: new Date().toISOString(),
  };

  // If this customer is linked as device owner, update all others to false
  if (data.isLinkedDeviceOwner) {
    customers.forEach((c) => {
      c.isLinkedDeviceOwner = false;
    });
    setJarvisDeviceActiveUserName(data.name);
    try {
      localStorage.setItem(ACTIVE_CUSTOMER_STORAGE_KEY, id);
    } catch {}
  }

  const updated = [newRecord, ...customers];
  persistCustomers(updated);
  return newRecord;
}

/**
 * Updates an existing customer record
 */
export function updateCustomer(
  id: string,
  updates: Partial<CustomerRecord>
): CustomerRecord | null {
  const customers = getStoredCustomers();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = customers[idx];

  // If setting this customer as linked device owner
  if (updates.isLinkedDeviceOwner) {
    customers.forEach((c) => {
      c.isLinkedDeviceOwner = false;
    });
    const targetName = updates.name || current.name;
    setJarvisDeviceActiveUserName(targetName);
    try {
      localStorage.setItem(ACTIVE_CUSTOMER_STORAGE_KEY, id);
    } catch {}
  } else if (updates.isLinkedDeviceOwner === false && current.isLinkedDeviceOwner) {
    // If unlinking, fallback to custom Admin Name
    const adminName = getAdminPersonalizedName();
    setJarvisDeviceActiveUserName(adminName);
    try {
      localStorage.removeItem(ACTIVE_CUSTOMER_STORAGE_KEY);
    } catch {}
  } else if (current.isLinkedDeviceOwner && updates.name) {
    // If linked customer's name is being edited, update greeting name immediately!
    setJarvisDeviceActiveUserName(updates.name);
  }

  const updatedRecord: CustomerRecord = {
    ...current,
    ...updates,
  };

  customers[idx] = updatedRecord;
  persistCustomers(customers);
  return updatedRecord;
}

/**
 * Deletes a customer record
 */
export function deleteCustomer(id: string): boolean {
  const customers = getStoredCustomers();
  const target = customers.find((c) => c.id === id);
  const filtered = customers.filter((c) => c.id !== id);

  if (target?.isLinkedDeviceOwner) {
    // If deleting active device owner, reset device owner to Admin Name
    const adminName = getAdminPersonalizedName();
    setJarvisDeviceActiveUserName(adminName);
    try {
      localStorage.removeItem(ACTIVE_CUSTOMER_STORAGE_KEY);
    } catch {}
  }

  persistCustomers(filtered);
  return true;
}

/**
 * Links a customer record to this device as the active owner.
 * Jarvis greetings and voice responses will dynamically address this customer!
 */
export function linkCustomerToJarvisDevice(id: string): { success: boolean; customerName: string } {
  const customers = getStoredCustomers();
  const target = customers.find((c) => c.id === id);
  if (!target) {
    return { success: false, customerName: '' };
  }

  customers.forEach((c) => {
    c.isLinkedDeviceOwner = c.id === id;
  });

  persistCustomers(customers);

  try {
    localStorage.setItem(ACTIVE_CUSTOMER_STORAGE_KEY, id);
  } catch {}

  setJarvisDeviceActiveUserName(target.name);
  return { success: true, customerName: target.name };
}

/**
 * Unlinks device ownership from all customers and restores the Admin Name
 */
export function resetDeviceOwnerToAdmin(): void {
  const customers = getStoredCustomers();
  customers.forEach((c) => {
    c.isLinkedDeviceOwner = false;
  });
  persistCustomers(customers);
  try {
    localStorage.removeItem(ACTIVE_CUSTOMER_STORAGE_KEY);
  } catch {}
  const adminName = getAdminPersonalizedName();
  setJarvisDeviceActiveUserName(adminName);
}

/**
 * Retrieves the currently linked customer record, if any
 */
export function getActiveDeviceOwner(): CustomerRecord | null {
  const customers = getStoredCustomers();
  return customers.find((c) => c.isLinkedDeviceOwner) || null;
}

/**
 * Retrieves the personalized Admin Name from localStorage or default
 */
export function getAdminPersonalizedName(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_NAME;
  try {
    const saved = localStorage.getItem(ADMIN_NAME_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {}
  return DEFAULT_ADMIN_NAME;
}

/**
 * Updates the personalized Admin Name.
 * If no customer is currently linked as a specific device owner,
 * this name is also immediately synced to Jarvis's active greeting!
 */
export function setAdminPersonalizedName(newName: string): void {
  if (typeof window === 'undefined') return;
  const clean = newName.trim() || DEFAULT_ADMIN_NAME;
  try {
    localStorage.setItem(ADMIN_NAME_STORAGE_KEY, clean);
    window.dispatchEvent(
      new CustomEvent('jarvis:admin-name-updated', { detail: { name: clean } })
    );
  } catch (e) {
    console.error('Failed to save admin name', e);
  }

  // If no customer is actively overriding ownership, sync to device greetings
  const activeOwner = getActiveDeviceOwner();
  if (!activeOwner) {
    setJarvisDeviceActiveUserName(clean);
  }
}

/**
 * Internal helper to sync active device user name into localStorage, smartMemory, and broadcast
 */
function setJarvisDeviceActiveUserName(name: string): void {
  if (typeof window === 'undefined') return;
  const clean = name.trim();
  try {
    localStorage.setItem('jarvis_active_user_name', clean);
    // Also sync to smart memory core so AI prompts & memory queries know who is speaking
    saveMemory('name', clean, 'identity');
    saveMemory('preferred_title', `${clean} Sir`, 'identity');
    saveMemory('user_identity', `${clean} (Primary Registered Device User)`, 'identity');

    window.dispatchEvent(
      new CustomEvent('jarvis:device-user-updated', { detail: { name: clean } })
    );
    window.dispatchEvent(
      new CustomEvent('jarvis_memory_updated', { detail: { name: clean } })
    );
  } catch (e) {
    console.error('Failed to sync device user name', e);
  }
}

/**
 * Returns the effective greeting name to use across Jarvis (Voice control, greetings, headers)
 * 1. Checks if a customer is linked as the active device owner
 * 2. Checks personalized Admin Name
 * 3. Falls back to "Rovin Pal"
 */
export function getJarvisGreetingName(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_NAME;
  try {
    // 1. Linked customer owner
    const activeCustomer = getActiveDeviceOwner();
    if (activeCustomer && activeCustomer.name.trim()) {
      return activeCustomer.name.trim();
    }

    // 2. Active user name in localStorage
    const storedActiveName = localStorage.getItem('jarvis_active_user_name');
    if (storedActiveName && storedActiveName.trim()) {
      return storedActiveName.trim();
    }

    // 3. Admin personalized name
    const adminName = localStorage.getItem(ADMIN_NAME_STORAGE_KEY);
    if (adminName && adminName.trim()) {
      return adminName.trim();
    }
  } catch {}
  return DEFAULT_ADMIN_NAME;
}
