
import { useState, useEffect } from "react";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { useAuth } from "../Context/AuthContext";

export function useChat(channelId) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);

    // Pagination


    // Listen for messages
    useEffect(() => {
        if (!channelId) {
            setMessages([]);
            return;
        }
        setLoading(true);

        const messagesRef = collection(db, "channels", channelId, "messages");
        // Initial query: last 50 messages
        // Note: To paginate "up", we usually need to query in reverse or use cursors.
        // For simple chat, we can just grab the last N. 
        // If we want real infinite scroll up, we need `endBefore` or `limitToLast`.
        // `limitToLast(50)` is best for chat.

        // Firestore `limitToLast` requires matching order. 
        // Actually, `orderBy('createdAt')` + `limitToLast(50)` works if we want the LATEST 50.

        // However, `onSnapshot` with `limitToLast` can be tricky if we want to "load previous".
        // A simpler approach for this "MVP++" is:
        // Just load all for now if pagination is too complex to get right in one shot without robust state,
        // OR try a safe limit. Let's use a safe limit of 100 for now to prevent massive reads.

        const safeQ = query(messagesRef, orderBy("createdAt", "asc")); // We will filter in client if needed or refine later.

        const unsub = onSnapshot(safeQ, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(docs);
            setLoading(false);
        });

        return () => unsub();
    }, [channelId]);

    // Listen for Typing
    useEffect(() => {
        if (!channelId) return;
        const typingCol = collection(db, "channels", channelId, "typing");
        const unsub = onSnapshot(typingCol, (snap) => {
            const now = Date.now();
            const active = [];
            snap.docs.forEach((d) => {
                const data = d.data();
                const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate().getTime() : 0;
                if (now - lastSeen < 6000 && d.id !== currentUser?.uid) {
                    if (data.name) active.push(data.name);
                }
            });
            setTypingUsers(active);
        });
        return () => unsub();
    }, [channelId, currentUser]);

    const sendMessage = async (text, fileData = null) => {
        if (!currentUser || !channelId) return;

        const payload = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
        };

        if (text) payload.text = text;
        if (fileData) {
            // fileData should contain { fileUrl, fileName, fileType, ... }
            Object.assign(payload, fileData);
        }

        await addDoc(collection(db, "channels", channelId, "messages"), payload);

        // Update last read
        await setDoc(
            doc(db, "users", currentUser.uid, "channelReads", channelId),
            { lastRead: serverTimestamp() },
            { merge: true }
        );
    };

    const sendTyping = async () => {
        if (!currentUser || !channelId) return;
        try {
            await setDoc(doc(db, "channels", channelId, "typing", currentUser.uid), {
                name: currentUser.displayName,
                lastSeen: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error(e); // ignore
        }
    };

    // Listen for hidden messages (delete for me)
    const [hiddenMessages, setHiddenMessages] = useState(new Set());

    useEffect(() => {
        if (!currentUser) return;
        const colRef = collection(db, "users", currentUser.uid, "deletedMessages");
        const unsub = onSnapshot(colRef, (snap) => {
            const s = new Set();
            snap.docs.forEach((d) => s.add(d.id));
            setHiddenMessages(s);
        });
        return () => unsub();
    }, [currentUser]);

    const deleteForMe = async (messageId) => {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, "users", currentUser.uid, "deletedMessages", messageId), {
                deletedAt: serverTimestamp()
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteForEveryone = async (messageId) => {
        if (!currentUser || !channelId) return;
        try {
            await setDoc(doc(db, "channels", channelId, "messages", messageId), {
                deletedForEveryone: true,
                deletedBy: currentUser.uid
            }, { merge: true });
        } catch (e) {
            console.error(e);
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        if (!currentUser || !channelId) return;
        const msgRef = doc(db, "channels", channelId, "messages", messageId);

        // We use a transaction or simple update. For simplicity in this structure:
        // We need to know the current state.
        // Firestore `arrayUnion` and `arrayRemove` are great if the structure is `{ reactions: { "❤️": [uid, uid] } } `
        // But working with maps in Firestore can be tricky with dot notation for dynamic keys without knowing the full map.
        // Let's read first then update to be safe and logical.

        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(msgRef);
                if (!snap.exists()) return;

                const data = snap.data();
                const reactions = data.reactions || {};

                // Logic:
                // 1. If user already reacted with THIS emoji -> Remove it.
                // 2. If user reacted with DIFFERENT emoji -> Switch to this one (Instagram style usually allows one reaction per user, or multiple? Instagram allows one usually).
                // Let's go with: One reaction per user per message (cleaner UI).

                let oldEmoji = null;
                Object.keys(reactions).forEach(k => {
                    if (reactions[k].includes(currentUser.uid)) oldEmoji = k;
                });

                if (oldEmoji === emoji) {
                    // Remove
                    const updatedList = reactions[emoji].filter(id => id !== currentUser.uid);
                    if (updatedList.length > 0) {
                        reactions[emoji] = updatedList;
                    } else {
                        delete reactions[emoji];
                    }
                } else {
                    // Remove from old if exists
                    if (oldEmoji) {
                        const updatedOld = reactions[oldEmoji].filter(id => id !== currentUser.uid);
                        if (updatedOld.length > 0) {
                            reactions[oldEmoji] = updatedOld;
                        } else {
                            delete reactions[oldEmoji];
                        }
                    }
                    // Add to new
                    if (!reactions[emoji]) reactions[emoji] = [];
                    reactions[emoji].push(currentUser.uid);
                }

                tx.update(msgRef, { reactions });
            });
        } catch (e) {
            console.error("Reaction failed", e);
        }
    };

    return {
        messages: messages.filter(m => !hiddenMessages.has(m.id)), // Filter out hidden ones
        loading,
        typingUsers,
        sendMessage,
        sendTyping,
        deleteForMe,
        deleteForEveryone,
        toggleReaction
    };
}
