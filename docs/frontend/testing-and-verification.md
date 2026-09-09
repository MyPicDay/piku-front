# Testing and Verification

## 목적
이 문서는 `piku-front`에서 어떤 변경에 어떤 검증이 필요한지를 정의한다.

## 검증 계층
- 타입 검사: `npx tsc --noEmit`
- 단위/컴포넌트 테스트: `npm run test:run`
- 브라우저 E2E: `npm run test:e2e`
- 수동 검증: 브라우저에서 실제 흐름 확인

## 기본 명령
- `npx tsc --noEmit`
- `npm run test:run`
- `npm run test:e2e`

## 변경 유형별 최소 검증

### API 계약 변경
- `npx tsc --noEmit`
- 관련 Vitest 테스트

### UI 흐름 변경
- 관련 Vitest 테스트
- 상태 또는 비동기 흐름이 복잡하면 수동 검증 추가

### 브라우저 상호작용 변경
- 관련 테스트
- 필요 시 Playwright 또는 수동 검증

### 라우트/URL 규칙 변경
- 타입 검사
- 관련 테스트
- 직접 URL 진입 수동 검증

## 테스트 파일 배치 규칙
- 가능한 한 대상 코드와 가까운 `__tests__`에 둔다.
- E2E는 `e2e/` 아래에 둔다.
- `e2e/diary-share.spec.ts`는 선택 모달을 열 때 API 미호출, 링크 복사와 더보기의 실행 분리, 복사 성공 후 모달 종료·토스트 위치·자동 숨김, 공유 실패·취소, 포커스·재시도·중복 실행 방지, 모달 공유 URL, 모바일 배치와 비공개 숨김을 검증한다. Web Share·Clipboard·일기 응답은 대역을 사용하므로 실제 OS 공유창과 수신자 열람 권한은 수동 검증 대상이다.

## 수동 검증 기준
- 브라우저 전용 초기화
- 토큰 재발급과 인증 실패 흐름
- access token은 있지만 저장된 사용자 상태가 없는 세션 복구 흐름
- SSE 연결 실패와 재연결 backoff 흐름
- 이미지 로딩과 스켈레톤 전환
- 실제 URL 진입과 리다이렉트 동작

## 완료 전 체크
- 변경 범위에 맞는 최소 검증을 모두 수행했는가
- 실패 경로를 한 번이라도 확인했는가
- 문서 갱신이 필요한 변경인지 확인했는가

## 관련 문서
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/process/documentation-rules.md`
