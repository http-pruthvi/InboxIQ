import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
try {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

export const db = admin.firestore();
export default admin;
