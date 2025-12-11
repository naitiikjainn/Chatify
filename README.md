Chatify – Real-Time Chat Application (React + Firebase)

An advanced real-time chat web application built using React, Firebase Firestore, Firebase Authentication, and Firebase Storage, inspired by WhatsApp/Discord UI.
Supports messaging, image/file sharing, reactions, typing indicators, read receipts, message deletion, and more.

⭐ Features
🧵 Real-Time Messaging

Send & receive messages instantly using Firestore real-time streams

📸 File & Image Sharing with Preview

Select images/files before sending

Live preview dialog with caption

Uploads stored securely in Firebase Storage

Auto-generated download links

😄 Message Reactions

Tap reaction icon → choose emoji

Each user can add only one reaction per message

Reaction counts + highlight for your own reactions

✏️ Typing Indicator

Shows “User is typing…”

Auto-disappears after 5 seconds of inactivity

🧼 Delete Messages

Delete for Me → hides message only for the current user

Delete for Everyone → shows “This message was deleted”

If message contained an uploaded file, it is removed from Firebase Storage too

🔔 Unread Messages & Smart Auto-Scroll

Auto-scrolls only when user is at the bottom

When user scrolls up and new messages come → shows a floating “New message” indicator (like WhatsApp)

📂 Channel / Room System

Create channels

Delete channels

Each channel has its own message history

Works like Discord server channels

🔐 User Authentication

Login with Google using Firebase Authentication

Profile picture + name integrated into UI

🧰 Tech Stack
Layer	Technology
Frontend	React (CRA or Vite) + Material UI
Backend	Firebase Firestore
File Storage	Firebase Storage
Auth	Firebase Authentication (Google OAuth)
Hosting	Firebase Hosting
State mgmt	React Hooks
🚀 Getting Started (Local Setup)
1. Clone the repository
git clone https://github.com/naitiikjainn/chatify.git
cd chatify

2. Install dependencies
npm install

3. Configure Firebase

Create a file:

src/Firebase/Firebase.js


Paste your Firebase config:

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

4. Start the dev server
npm start


The app will open at:

👉 http://localhost:3000/

🌐 Deploying to Firebase Hosting
1. Build
npm run build

2. Deploy
firebase deploy


Your live site will be available at:

https://your-project-id.web.app/

📁 Folder Structure
chatify/
│── src/
│   ├── Components/
│   │   ├── Chat.js
│   │   ├── Rooms.js
│   │   ├── CreateRoom.js
│   ├── Firebase/
│   │   ├── Firebase.js
│   ├── App.js
│   ├── index.js
│── public/
│── package.json
│── README.md

🛠️ Future Improvements

Push notifications

Online/offline presence system

User-to-user private chats

Voice notes

Video messaging

Admin-only channels

🤝 Contributing

PRs are welcome! For major changes, open an issue first to discuss the proposal.

📜 License

This project is licensed under the MIT License
