# Runtime Boundaries

## 목적
이 문서는 브라우저 전용 실행 경계와 초기화 위치를 정의한다.
서버/클라이언트 경계가 모호해질 때 이 문서를 기준으로 판단한다.

## 브라우저 전용 런타임 목록
- access token 조회와 저장
- SSE 연결 초기화
- FCM 초기화
- PWA 설치 프롬프트 처리
- `window`, `document`, `localStorage`, `Notification` 접근
- 이미지 로딩 상태와 브라우저 이벤트 처리

## 초기화 위치
- 인증 토큰 접근과 현재 사용자 복구는 `lib/auth/tokenManager.ts`, `lib/api/auth.ts`, `components/store/authStore.ts` 경계 안에서 처리한다.
- 로그인 필요 화면의 진입 제어는 `components/auth/RequireAuth.tsx`에서 공통 처리한다.
- SSE 초기화는 `components/common/SSEInitializer.tsx`에서 시작하고, SharedWorker 지원 환경의 실제 SSE 서버 연결은 `lib/sse` 경계가 소유한다.
- FCM 초기화는 `components/common/FCMInitializer.tsx`에서 시작한다.
- PWA 관련 UI는 `components/common/PWAInstallPrompt.tsx`, `components/common/PWAInstallButton.tsx`를 통해 노출한다.

## 서버/클라이언트 경계 규칙
- 브라우저 API를 사용하는 로직은 클라이언트 컴포넌트 또는 클라이언트 전용 모듈에 둔다.
- 서버 환경에서도 필요한 값은 브라우저 API 없이 계산 가능해야 한다.
- 브라우저 의존 초기화는 페이지 파일보다 전용 초기화 컴포넌트에 두는 편을 우선한다.

## 사용자 조작에서 실행하는 일기 공유
- `lib/utils/diaryShare.ts`는 브라우저 전역 없이 사이트 origin과 일기 식별자로 URL·고정 전달 데이터를 구성한다. `app/diary/[id]/page.tsx`의 메타데이터도 이 origin 규칙과 공통 메타데이터 생성기를 사용하며 일기 API나 사용자 세션을 조회하지 않는다.
- `useDiaryShare`는 클릭·탭 처리 안에서 기능을 감지하고 `navigator.share` 또는 최초 `navigator.clipboard.writeText`를 즉시 호출한다. 선행 네트워크 요청, 동적 import, 타이머, effect로 사용자 활성화를 지연시키지 않는다.
- 공유 아이콘은 선택 모달만 연다. `링크 복사`와 `더보기`의 이벤트가 각각 복사·공유 실행 경계이며, `DiaryShareDialog`는 body 포털에 표시해 상세 모달의 변형·쌓임 맥락과 분리한다. 모달은 스크롤 잠금과 포커스 이동을 담당하고 API 호출은 훅에 위임한다.
- 복사 성공 토스트도 body 포털로 표시하며 선택 모달 종료 뒤에도 훅의 성공 안내 타이머가 끝날 때까지 유지한다. 토스트는 포커스를 받거나 포인터 입력을 가로채지 않는다.
- SSR·모듈 평가·마운트 시 공유/복사를 실행하거나 브라우저 지원 여부로 버튼 노출을 바꾸지 않는다. SSE·FCM·PWA 초기화 및 Service Worker에 공유 책임을 추가하지 않는다.
- 보안 컨텍스트나 문서 권한 정책으로 브라우저 API가 제한되면 공유 계약의 복사·수동 선택 경로로 수렴한다. 권한을 미리 조회·요구하거나 전역 권한 정책을 완화하지 않는다.
- 요청 시작 화면과 일기를 식별해 늦게 끝난 요청이 새 화면에 안내나 추가 복사를 만들지 않게 한다. 화면 변경 시 안내 타이머를 정리한다. 이미 시작된 시스템 공유·클립보드 쓰기는 취소할 수 있다고 가정하지 않는다.
- 다른 앱에서 돌아오거나 창 포커스가 바뀌었다는 이유로 공유를 다시 실행하지 않는다. 취소·오류 분류, 공개 범위와 URL 계약은 `docs/frontend/runtime-contracts.md`를 따른다.

## 장애 시 기대 동작
- 인증 상태가 `checking`인 동안에는 보호 라우트가 로그인 화면으로 이동하지 않아야 한다.
- access token은 있지만 저장된 사용자 상태가 없으면 현재 사용자 조회로 `user`를 복구해야 한다.
- SSE 실패는 화면 전체를 깨뜨리지 않아야 한다.
- sleep/wake, 오프라인, 백엔드 재배포처럼 상태 코드가 없거나 5xx 계열인 SSE 연결 실패는 인증 실패로 간주하지 않고 기존 토큰으로 재연결해야 한다.
- SSE 재연결은 3초에서 시작하는 exponential backoff를 적용하고, 연결이 다시 성공하면 지연 시간을 초기화한다.
- 상태 코드가 없는 SSE 오류가 반복되면 자동 타이머 재연결을 중단한다.
- SharedWorker 지원 환경에서는 같은 브라우저 origin의 여러 탭이 하나의 SSE 서버 연결을 공유해야 한다.
- 모바일 브라우저에서는 SharedWorker 지원 여부와 무관하게 기존 탭 단위 직접 SSE 연결로 fallback해야 한다.
- SharedWorker를 만들 수 없는 환경에서는 기존 탭 단위 직접 SSE 연결로 fallback해야 한다.
- FCM 초기화 실패는 알림 기능 저하로 끝나야 하며, 핵심 화면 진입을 막지 않아야 한다.
- 이미지 로드 실패는 대체 UI 또는 안전한 비표시 상태로 수렴해야 한다.
- 토큰 재발급이 401/403으로 실패하면 인증 정리 후 로그인 화면으로 이동해야 한다.

## 검증 포인트
- 브라우저 전용 코드가 서버 경로에서 실행되지 않는지 확인한다.
- 초기화 실패 시 화면이 계속 사용 가능한지 확인한다.
- 인증 실패와 재발급 흐름이 깨지지 않는지 확인한다.
- 이미지 로딩 관련 상태가 빠른 새로고침이나 캐시된 이미지에서도 안정적인지 확인한다.

## 관련 문서
- `ARCHITECTURE.md`
- `docs/architecture/sse-runtime.md`
- `docs/frontend/runtime-contracts.md`
- `docs/frontend/testing-and-verification.md`
