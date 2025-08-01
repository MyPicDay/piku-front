// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: `${process.env.NEXT_PUBLIC_FCM_API_KEY}` || "",
  authDomain: `${process.env.NEXT_PUBLIC_FCM_AUTH_DOMAIN}` || "",
  projectId: `${process.env.NEXT_PUBLIC_FCM_PROJECT_ID}` || "",
  storageBucket: `${process.env.NEXT_PUBLIC_FCM_STORAGE_BUCKET}` || "",
  messagingSenderId: `${process.env.NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID}` || "",
  appId: `${process.env.NEXT_PUBLIC_FCM_APP_ID}` || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// FCM 메시징 객체를 가져오는 함수 추가
export const getFirebaseMessaging = () => {
  if (typeof window !== 'undefined' && isSupported()) {
		console.log('getFirebaseMessaging', app);
    return getMessaging(app);
  }
  return null;
};
