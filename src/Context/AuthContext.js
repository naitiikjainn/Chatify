import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../Firebase/Firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Optimistically set user
                setCurrentUser(user);

                // Update user record in Firestore
                try {
                    await setDoc(doc(db, "users", user.uid), {
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        lastSeen: serverTimestamp()
                    }, { merge: true });
                } catch (error) {
                    console.error("Error updating user record:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => signOut(auth);

    const value = {
        currentUser,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
