/* firebase-messaging-sw.template.js
 * ------------------------------------------------------------
 * Firebase Cloud Messaging Service Worker (Template)
 * ------------------------------------------------------------
 * 이 파일은 빌드/개발 시작 전 스크립트에 의해
 * public/firebase-messaging-sw.js 로 변환됩니다.
 * ------------------------------------------------------------
 */

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

/* ------------------------------ Firebase 초기화 ------------------------------ */
const firebaseConfig = {
  apiKey: '__FIREBASE_API_KEY__',
  authDomain: '__FIREBASE_AUTH_DOMAIN__',
  projectId: '__FIREBASE_PROJECT_ID__',
  storageBucket: '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__FIREBASE_APP_ID__',
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/* ------------------------------ SW Life‑Cycle ------------------------------ */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ------------------------ In‑memory 중복 알림 체크 ------------------------ */
const seenMessageIds = new Set();

/* --------------------------- 백그라운드 메시지 --------------------------- */
messaging.onBackgroundMessage(async (payload) => {
  const {
    notification: serverNotification = {},
    data: serverData = {},
  } = payload || {};

  // notification 페이로드가 있으면 브라우저가 기본 알림을 표시하므로 
  // Service Worker에서는 알림을 표시하지 않음 (중복 방지)
  if (serverNotification && (serverNotification.title || serverNotification.body)) {
    return; // 기본 브라우저 알림만 표시
  }

  // data-only 메시지인 경우에만 커스텀 알림 표시
  const title = serverData.title || '새 알림';
  const body = serverData.body || '새로운 알림이 도착했습니다!';
  const url = serverData.url || '/';
  const messageId = serverData.messageId || crypto.randomUUID();
  const icon = serverData.icon || '/android-chrome-192x192.png';
  const badge = serverData.badge || '/favicon-32x32.png';
  const rest = serverData;

  /* 중복 알림 방지 (브라우저별 tag 무시 대응) */
  if (seenMessageIds.has(messageId)) return;
  seenMessageIds.add(messageId);

  await self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag: messageId,        // OS-level 중복 제어
    renotify: false,
    requireInteraction: false, // 브라우저가 알아서 자동으로 닫음
    silent: false,         // 알림음 허용
    data: { url, ...rest },
  });
});

/* --------------------------- 알림 클릭 핸들러 --------------------------- */
self.addEventListener('notificationclick', (event) => {
  const { notification } = event;
  const { url = '/' } = notification.data || {};

  notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const origin = self.location.origin;
        const target = clientList.find((c) => c.url.startsWith(origin));

        if (target) {
          // 이미 열린 탭 → 포커스 & 경로 이동 (필요 시)
          return target.focus().then(() => {
            if (target.url !== url && 'navigate' in target) {
              return target.navigate(url);
            }
          });
        }
        // 열려 있는 탭이 없으면 새 창
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

/* --------------------------- 알림 닫힘 핸들러 --------------------------- */
self.addEventListener('notificationclose', (/* event */) => {
  // 필요하다면 analytics 이벤트 전송 등
});


