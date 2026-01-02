import { useState, useEffect } from "react";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    setDoc
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { useAuth } from "../Context/AuthContext";

export const useRooms = () => {
    const { currentUser } = useAuth();
    const [joinedRooms, setJoinedRooms] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load ALL rooms
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "channels"), (snap) => {
            setAllRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // Load joined rooms
    useEffect(() => {
        if (!currentUser) {
            setJoinedRooms([]);
            setLoading(false);
            return;
        }

        // Real-time listener for joined channels
        const joinedRef = collection(db, "users", currentUser.uid, "joinedChannels");
        const unsub = onSnapshot(joinedRef, () => {
            // The actual data mapping happens in the effect below using 'allRooms'
            // We just listen here to trigger updates (or we could merge logic)
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    // Derived joined rooms list
    useEffect(() => {
        if (!currentUser) return;
        const fetchJoined = async () => {
            // Since we are already listening to joinedChannels in real-time above,
            // but we need to map them.
            // Let's improve the architecture:
            // We listen to "users/{uid}/joinedChannels"
            // We get a list of IDs.
            // We filter "allRooms" by these IDs.

            // Real implementation:
            const joinedRef = collection(db, "users", currentUser.uid, "joinedChannels");
            const unsub = onSnapshot(joinedRef, (snap) => {
                const joinedIds = new Set(snap.docs.map(d => d.id));
                const filtered = allRooms.filter(r => joinedIds.has(r.id));
                setJoinedRooms(filtered);
            });
            return () => unsub();
        };

        if (allRooms.length > 0) {
            fetchJoined();
        }
    }, [currentUser, allRooms]);


    const createRoom = async (channelName, password = "") => {
        if (!currentUser) return;
        try {
            const newChannel = await addDoc(collection(db, "channels"), {
                channelName,
                password: password.trim() || null, // Store null if empty, effectively public
                ownerUid: currentUser.uid,
                ownerName: currentUser.displayName,
                createdAt: Date.now(),
            });

            // Auto-join
            await setDoc(
                doc(db, "users", currentUser.uid, "joinedChannels", newChannel.id),
                { joinedAt: Date.now() }
            );
            // ADDITION: Add owner to buddies
            await setDoc(
                doc(db, "channels", newChannel.id, "buddies", currentUser.uid),
                {
                    name: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    joinedAt: Date.now()
                }
            );
            return newChannel.id;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return { joinedRooms, allRooms, createRoom, loading };
}
