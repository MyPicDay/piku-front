import { getFirebaseMessaging } from "@/config/firebase";
import { getToken } from "firebase/messaging";

export const requestPermissionAndGetToken = async () => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.log("Firebase Messaging is not supported in this browser.");
    return null;
  }

  // 1. 알림 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notification permission not granted.");
    return null;
  }
  
  // 2. 권한을 받았다면 FCM 토큰 요청
  try {
    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
    });

    if (fcmToken) {
      console.log("FCM Token:", fcmToken);
      return fcmToken;
    } else {
      console.log("Can not get token.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return null;
  }
};
