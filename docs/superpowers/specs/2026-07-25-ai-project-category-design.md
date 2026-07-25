# AI Project 카테고리 설계

작성일: 2026-07-25

## 배경 / 목표

기존 포트폴리오 허브는 학생당 **이력서 / 자소서 / 포트폴리오** 3개 카테고리(각 1개)를 올리고 둘러보는 서비스다.
여기에 **AI Project** 카테고리를 추가한다. 학생은 PPTX 발표자료를 올리거나 배포된 HTML 링크를 등록해,
다른 사람이 **브라우저에서 바로 보고**(첨삭/피드백은 각자 알아서), **다운로드**하거나 **원본 링크로 들어가** 확인할 수 있게 한다.

## 결정 사항 (브레인스토밍 확정)

- **구조**: 새 카테고리 1개 추가, 기존과 동일하게 **학생당 1개**.
- **첨삭**: 댓글/피드백 시스템 없음. "볼 수 있게만" — 인라인 뷰 + 다운로드 + 링크 열기만 제공.
- **PPTX 바로 보기**: **서버에서 PPTX→PDF 변환**(기존 HWP→PDF `convert.ts` 패턴 재사용) 후 PDF를 인라인 임베드.
- **부가 필수 요건**: iframe 인라인 임베드가 되든 안 되든, **다운로드 버튼과 원본 링크 열기는 항상 제공**한다.

## 아키텍처 개요

카테고리는 DB에서 `Post.type`(String)로 저장되고, 앱단 `PostType` enum으로만 관리된다.
뷰어 탭 · 업로드 슬롯 · 리스팅 필터가 모두 `Object.values(PostType)`를 순회하므로,
enum 값 하나를 추가하면 대부분의 UI가 자동으로 새 카테고리를 포함한다. **DB 마이그레이션 불필요.**

## 상세 설계

### 1. 데이터 모델 (마이그레이션 없음)
- `constants/enums.ts`
  - `PostType`에 `AI_PROJECT = "AI_PROJECT"` 추가
  - `PostTypeLabels`에 `[PostType.AI_PROJECT]: "AI 프로젝트"` 추가
  - `PostTypeColors`에 색상 1개 추가 (기존 3색과 구분되는 값)
- `Post` 스키마의 `@@unique([authorId, type])`로 학생당 1개 규칙이 그대로 적용됨.
- `validations/post.ts`의 `postInputSchema.type`은 `z.nativeEnum(PostType)`이라 자동 전파(무변경).

### 2. PPTX 업로드 + 변환
- `lib/uploads.ts`
  - `ALLOWED_EXT`에 `.pptx`(및 `.ppt`) 추가.
  - 기존 `else if (CONVERT)` 분기가 비-PDF 파일을 `convertToPdf`로 PDF 변환 → PPTX가 자동으로 미리보기 PDF 생성 경로를 탄다.
  - `convertToPdf`(`lib/convert.ts`)는 LibreOffice `soffice --convert-to pdf`를 쓰며 PPTX를 지원하므로 변경 불필요.
- `components/posts/SlotUploader.tsx`
  - 파일 입력 `accept`를 타입별로 분기: AI_PROJECT 슬롯은 `.pptx,.ppt`, 나머지는 기존 `.pdf,.hwp,.hwpx,application/pdf` 유지.
- 제약: 변환은 `ENABLE_HWP_CONVERT=1` + LibreOffice 설치 환경에서만 동작.
  로컬 Mac(LibreOffice 없음)에선 PPTX 미리보기 PDF가 생성되지 않고 **다운로드만** 가능.
  배포(Docker, LibreOffice·한글폰트 포함)에서 미리보기 정상 동작.

### 3. "바로 보기" 뷰어 (`components/posts/StudentDocViewer.tsx`)
- **탭**: `PostType` enum 추가로 AI 프로젝트 탭이 자동 노출됨.
- **PPTX**: 변환된 미리보기 PDF를 기존 `<iframe src=".../#view=FitH">`로 인라인 표시(기존 로직 재사용).
- **HTML 링크 (AI_PROJECT에 한해 인라인 임베드 추가)**:
  - `linkUrl`을 `<iframe>`으로 인라인 임베드해 바로 보이게 한다.
  - 사이트가 임베드를 차단(X-Frame-Options/CSP frame-ancestors)하는 경우가 많으므로, 임베드 실패에 대비해
    기존 "🔗 열기" 링크 카드(새 탭)를 **항상 함께** 노출한다.
- **부가 필수(모든 경우 보장)**:
  - 파일이 있으면 **다운로드 버튼** 항상 표시(`download` 속성).
  - 링크가 있으면 **원본 링크 열기**(새 탭) 항상 표시.
  - 즉 인라인 뷰 가능 여부와 무관하게 다운로드/링크 열기 경로가 끊기지 않는다.

### 4. 상단 네비게이션
- `components/header/Navbar.tsx`에 **"AI Project"** 링크 추가.
- 클릭 시 기존 홈 리스팅을 `?type=AI_PROJECT`로 필터한 화면으로 이동(별도 페이지 신설 안 함 — YAGNI).

## 변경 파일 요약
- `constants/enums.ts` — enum 값/라벨/색상 추가
- `lib/uploads.ts` — 허용 확장자에 pptx/ppt 추가
- `components/posts/SlotUploader.tsx` — 타입별 accept 분기
- `components/posts/StudentDocViewer.tsx` — HTML 링크 iframe 임베드 + 폴백, 다운로드/링크 열기 보장
- `components/header/Navbar.tsx` — "AI Project" 네비 링크
- 신규 페이지 0개, DB 마이그레이션 0개

## 테스트 / 검증
- 로컬(LibreOffice 없음): AI_PROJECT 슬롯에서 PPTX 업로드 → 다운로드 버튼 동작, HTML 링크 등록 → 링크 카드 열기 + (임베드 가능 사이트면) iframe 표시.
- 배포 환경: PPTX 업로드 → PDF 미리보기 iframe 인라인 표시.
- 네비 "AI Project" → 리스팅이 AI_PROJECT만 노출.
- 학생당 1개 규칙: 같은 학생이 AI_PROJECT 2번 등록 시 기존 유니크 제약대로 처리.

## 범위 밖 (하지 않음)
- 댓글/첨삭 코멘트 시스템
- AI 프로젝트 다중 등록(1인 다건)
- Office Online 등 외부 뷰어 임베드
