'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Custom hook to get current user
export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
}

// Sign up with email and password
export async function signUp(email: string, password: string, name: string) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with name
        await updateProfile(result.user, { displayName: name });

        // Create user document in Firestore
        await createUserDocument(result.user, name);

        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
}

// Sign in with Google
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        // Check if user document exists, create if not
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await createUserDocument(result.user, result.user.displayName || 'User');
        }

        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
}

// Sign out
export async function signOut() {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Create user document in Firestore
async function createUserDocument(user: User, name: string) {
    const userRef = doc(db, 'users', user.uid);

    await setDoc(userRef, {
        profile: {
            name,
            email: user.email,
            theme: 'system',
            calendarStartHour: 6,
            calendarEndHour: 23,
        },
        createdAt: serverTimestamp(),
    });
}

// Get current user ID (sync)
export function getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
}

// Get current user (sync)
export function getCurrentUser(): User | null {
    return auth.currentUser;
}
