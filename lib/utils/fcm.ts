import { getFirebaseMessaging } from "@/config/firebase";
import { getToken } from "firebase/messaging";

export const requestPermissionAndGetToken = async () => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  // 1. 알림 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }
  
  // 2. 권한을 받았다면 FCM 토큰 요청
  try {
    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
    });

    if (fcmToken) {
      return fcmToken;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
