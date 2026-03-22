import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const auth = admin.auth();
export const db = admin.firestore();

// Helper to get user doc ref
export function userRef(userId: string) {
  return db.collection('users').doc(userId);
}

export function carsRef(userId: string) {
  return userRef(userId).collection('cars');
}

export function servicesRef(userId: string) {
  return userRef(userId).collection('services');
}

export function salesRef(userId: string) {
  return userRef(userId).collection('comparableSales');
}
