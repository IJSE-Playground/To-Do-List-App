// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwhutftbtQWzc0qpFPRolspRGmq5iPHBA",
  authDomain: "to-do-list-app-6398a.firebaseapp.com",
  projectId: "to-do-list-app-6398a",
  storageBucket: "to-do-list-app-6398a.appspot.com",
  messagingSenderId: "948812294589",
  appId: "1:948812294589:web:2370bcb0827f110e858ad4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export {app, auth};