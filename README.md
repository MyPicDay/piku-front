# PikU Frontend

이 프로젝트는 Next.js, TypeScript, Tailwind CSS를 사용하여 구축된 PikU의 프론트엔드 애플리케이션입니다.

## 🚀 주요 기술 스택

- **Next.js**: 15.3.3
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x
- **Zustand**: 상태 관리
- **Axios**: HTTP 클라이언트
- **React Responsive**: 반응형 UI
- **Lucide React**: 아이콘

## 🏁 시작하기

### 1. 저장소 복제

```bash
git clone https://your-repository-url.git
cd piku-front
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

개발 서버를 실행하려면 아래 명령어를 입력하세요. Turbopack을 사용하여 더 빠른 개발 환경을 제공합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 결과를 확인하세요.

## 📜 사용 가능한 스크립트

- `npm run dev`: 개발 모드로 애플리케이션을 실행합니다 (Turbopack 사용).
- `npm run build`: 프로덕션용으로 애플리케이션을 빌드합니다.
- `npm run start`: 빌드된 프로덕션 서버를 시작합니다.
- `npm run lint`: Next.js의 내장 ESLint 설정을 사용하여 코드 스타일을 검사합니다.

## 🤝 컨벤션

### 브랜치 전략

- 기능 단위로 브랜치를 생성하여 작업합니다.
- 브랜치 이름은 아래 컨벤션을 따릅니다.

#### 브랜치 이름 컨벤션

- `feature/기능명`: 새로운 기능 개발
- `fix/수정내용`: 버그 수정
- `docs/문서내용`: 문서 추가 또는 수정
- `refactor/리팩토링내용`: 코드 리팩토링

**예시:**

```bash
git checkout -b feature/login
```

### 커밋 컨벤션

커밋 메시지는 다음 형식을 따릅니다. 이를 통해 커밋 내역을 쉽게 파악하고 변경 사항을 추적할 수 있습니다.

**커밋은 관련된 이슈 번호를 포함해야 합니다.**

#### 커밋 메시지 형식

```
타입: 제목 #이슈번호

본문 (선택 사항)
```

#### 타입(Type)

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드, 리팩토링 테스트 코드 추가
- `chore`: 빌드 업무 수정, 패키지 매니저 수정

**예시:**

```
feat: 로그인 기능 추가 #123

- 소셜 로그인 기능 구현
- JWT 토큰 발급 로직 추가
```
