# 일기 공유 검증 기록

검증일: 2026-09-06. Chromium, 데스크톱 1280×900 / 모바일 360×800.
로컬 서버와 테스트용 일기/API 응답, Web Share·Clipboard 대역을 사용했다. 아래 결과는 실제 백엔드 권한 판정이나 OS 공유창 검증을 의미하지 않는다.

## 확인한 사용자 흐름

| 흐름 | 결과 |
| --- | --- |
| 직접 상세 URL 공유 | 고정 제목·문구와 해당 `/diary/{id}` URL만 전달 |
| 공유 오류 → 복사 거절 | 각각 한 번 호출 후 URL 전체 선택·포커스가 있는 수동 패널 표시 |
| Escape / 닫기 | 패널 종료 후 공유 버튼 포커스 복귀; 일기 모달 유지 |
| 시스템 공유 취소 | 추가 클립보드 쓰기와 수동 패널 없이 종료 |
| 새 클릭으로 재복사 | 실제 성공 후에만 성공 안내 표시 |
| 재복사 처리 중 키보드 | 버튼 포커스 유지, Enter 중복 실행 차단, Escape 종료 후 공유 버튼 복귀; 요청 완료 전까지 공유 잠금 유지 |
| 사진·텍스트 피드 | 공유 표시, 비공개는 숨김; 스켈레톤과 실제 사진 카드 높이 일치 |
| 모바일 스토리 | 좋아요 → 댓글 → 공유 세로 배치, 댓글 화면에서 액션과 패널 숨김 |
| 360px 스토리 패널 | 패널 x=16..280, 액션 x=300..344로 겹치지 않음; 하단 16px 여백 |
| 알림 경유 모달 | 현재 알림 URL 대신 같은 일기 상세 URL을 생성 |
| 프로필 사진 경유 모달 | 더보기의 공유하기도 같은 URL 생성; 패널 종료 후 아이콘에 포커스 복귀 |
| 공개 범위 대역 응답 | PUBLIC/ANONYMOUS/FRIENDS는 표시, PRIVATE는 숨김 |
| 비로그인 테스트 세션 | 공개·익명 상세 화면에서 로그인 추가 없이 공유 가능 |

## 캡처

- [데스크톱 직접 상세 수동 복사](desktop/2026-09-06/01-direct-copy-panel.png)
- [데스크톱 프로필 상세 메뉴 공유](desktop/2026-09-06/02-profile-menu-share.png)
- [360px 모바일 스토리 수동 복사](mobile/2026-09-06/01-story-copy-panel.png)
- [360px 모바일 알림 모달 다크 모드](mobile/2026-09-06/02-notification-dark-panel.png)
- [360px 모바일 친구 공개 상세 다크 모드](mobile/2026-09-06/03-direct-friends-dark-panel.png)

## 검증 환경 참고

Node 26의 실험적 Web Storage가 jsdom의 localStorage를 가리는 현상을 피하기 위해 Vitest 실행에 `NODE_OPTIONS=--no-experimental-webstorage`를 사용했다. 애플리케이션 런타임 설정은 변경하지 않았다.
타입 검사와 전체 Vitest, 기존 Playwright E2E를 실행했다. 시스템 공유·Clipboard 제한 분기는 대역과 수동 브라우저 조작으로 검증했다.
추가 리뷰에서 Chromium의 native `disabled` 전환으로 재복사 버튼 포커스가 사라지는 현상을 재현하고 `aria-disabled`와 실행 가드로 수정했다. 공유 전용 회귀 흐름은 `e2e/diary-share.spec.ts`에 보존해 `npm run test:e2e`에서 반복 검증한다.
`NEXT_PUBLIC_E2E_TEST=1 NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3000 npm run build`로 프로덕션 빌드를 생성하고 로컬 `next start` 서버에서 Twitterbot·facebookexternalhit·Kakaotalk-scrap User-Agent로 상세 HTML을 조회했다. 세 요청 모두 제목·설명, canonical·og:url, OG/Twitter 공통 이미지와 크기·alt 등 16개 메타데이터 항목이 일치했다. 실제 외부 서비스의 크롤링 결과는 별도 확인 대상이다.

## 실제 환경에서 남은 확인

- HTTPS iOS Safari·Android Chrome·지원 데스크톱 브라우저의 실제 OS 공유창과 외부 앱 전달.
- 설치형 PWA·앱 내 브라우저의 권한 제한, 실제 클립보드 붙여넣기, 스크린리더 낭독.
- 실제 작성자·친구·비친구 계정의 열람 권한, 공유 후 비공개 전환·친구 해제·삭제에 대한 백엔드 결과.
- 실제 메신저의 공통 OG 이미지 표시와 외부 미리보기 캐시 동작.
