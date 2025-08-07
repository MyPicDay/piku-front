// Firebase App & Messaging SW 스크립트 임포트
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// .env 환경변수는 서비스워커에서 직접 접근 불가하므로, 설정값을 하드코딩해야 합니다.
// 아래 YOUR_... 부분들을 실제 Firebase 프로젝트의 값으로 채워주세요.
const firebaseConfig = {
  apiKey: "YOUR_NEXT_PUBLIC_FCM_API_KEY",
  authDomain: "YOUR_NEXT_PUBLIC_FCM_AUTH_DOMAIN",
  projectId: "YOUR_NEXT_PUBLIC_FCM_PROJECT_ID",
  storageBucket: "YOUR_NEXT_PUBLIC_FCM_STORAGE_BUCKET",
  messagingSenderId: "YOUR_NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID",
  appId: "YOUR_NEXT_PUBLIC_FCM_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드에서 메시지를 받았을 때의 처리
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/android-chrome-192x192.png", // 알림 아이콘
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
