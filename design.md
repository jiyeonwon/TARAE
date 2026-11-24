# TARAE 디자인 시스템

이 문서는 Figma `인터렉2` 파일의 `UI` 페이지(기준 노드 `317:666`)에서 확인한 값과 실제 웹 구현에서 보완한 값을 연결한다. **Figma 추출값**과 **구현 보완값**을 구분해 표기하며, 실제 토큰의 단일 기준은 [`src/tokens.css`](./src/tokens.css)다.

## 1. Color system

### Figma 추출값

| 역할 | 값 | 용도 | CSS token |
| --- | --- | --- | --- |
| Primary | `#FFEBCB` | 주요 버튼, 밝은 강조 면 | `--primary`, `--beige-300` |
| Background foundation | `#0C0B09` | 디자인 시스템의 기본 배경 | `--background`, `--black` |
| Screen background | `#000000` | 실제 서비스 프레임 배경 | `--screen-background` |
| Surface | `#181612` | 모달·보조 패널 | `--surface`, `--gray-900` |
| Text | `#F1E7D2` | 화면 제목·본문 | `--screen-text` |
| Secondary text | `#A89B85` | 설명·메타 정보 | `--screen-muted` |
| Gold accent | `#C7A66B` | 선화·상태·포커스 | `--gold` |
| Border/line | `#51422F` | 구분선·아웃라인 | `--screen-line` |
| Error | `#DE8F9F` | 카메라·에셋 오류 | `--error`, `--rose-500` |

Figma의 foundation 팔레트도 코드에 그대로 보존했다. Beige `100–700`, Gray `50–900`, Rose `50/300/500/700/900`는 상태 확장 시 새 색을 임의로 추가하지 않고 재사용한다.

### 구현 보완값

- 카메라와 기록 패널은 원본의 투명 면을 유지하기 위해 `rgba(255,255,255,.1)`(`--panel`)을 사용한다.
- Hover/selected는 새로운 색 대신 기존 골드와 베이지의 투명도·밝기만 조절한다.
- 오류 상태만 foundation Rose를 사용하며 성공 상태를 별도 녹색으로 추가하지 않았다.

## 2. Typography system

### Figma 확인값과 구현 적용값

| 역할 | Figma 기준 | 현재 적용 | 굵기 | 행간 | 자간 | 사용 규칙 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Screen title | 28px | 24px | 500 | 1.45 | -0.01em | 한국어 화면 제목 |
| Heading | 24px | 22px | 500 | 1.5 | -0.01em | 카드명·패널 제목 |
| Subhead | 20px | 18px | 500 | 1.5 | 0 | 보조 제목 |
| Body | 16px | 16px | 400/500 | 1.55 | 0 | 설명과 해석 |
| Small | 14px | 14px | 400/500 | 1.5 | 0.01em | 상태·버튼 보조문 |
| Caption | 12px | 12px | 500 | 1.5 | 0.08em | 단계·역할 라벨 |

- 국문/본문: `Apple SD Gothic Neo`, 이후 `Noto Sans KR`, `Malgun Gothic`, sans-serif 폴백.
- 영문 로고/의식적 디스플레이: Figma 에셋과 함께 제공된 `Girassol`; 로컬 `public/assets/Girassol.ttf`를 로드한다.
- 영문 단계 라벨은 대문자와 넓은 자간을 사용하고, 한국어 본문은 읽기 흐름을 위해 기본 자간을 유지한다.

### 구현 보완값

- 요청에 따라 주요 제목은 Figma 기준보다 약 10–15% 축소하고 500 weight로 낮췄다. CTA는 최신 Splash 컴포넌트 기준인 Apple SD Gothic Neo 20px/700을 모든 주요 CTA에 공통 적용한다.
- 1920 × 1080 캔버스 전체를 같은 비율로 축소하므로 viewport마다 개별 타이포그래피 크기를 다시 줄이지 않는다.
- 브라우저에 Apple SD Gothic Neo가 없을 때도 국문 줄바꿈이 무너지지 않도록 시스템 폴백을 둔다.

## 3. Grid & layout system

### Figma 추출값

- 기준 프레임: `1920 × 1080px`
- 데스크톱 최소 기준: `1440px`
- Grid: 12-column stretch
- 좌우 margin: `120px` (`6.25%`)
- Gutter: `24px`
- 화면 중심축을 카드·카메라·제목이 공유한다.
- 주요 섹션 간 세로 간격은 40–64px, 컴포넌트 내부는 8/12/16/24px 체계를 사용한다.
- 주요 CTA: 폭 `340px`, 높이 약 `64px`, 좌우 패딩 `54px`, radius `200px`, 텍스트 `20px/700`.
- 고민 입력 면: 약 `1396 × 364px`, radius `20px`.
- 카메라 프리뷰 기준: `960 × 540px` (16:9).
- 역할 카드 기준: 약 `556 × 362px`.

### 구현 보완값

- 앱은 `1920 × 1080px` 고정 디자인 스테이지를 사용하고 `min(viewport width / 1920, viewport height / 1080)` 비율로 화면 전체를 축소한다.
- 스테이지는 viewport 중앙에 정렬하며 남는 영역은 배경색으로 처리한다. 페이지 스크롤이나 요소별 재배치 없이 Figma 구도를 그대로 보존한다.
- Splash의 카드 그래픽은 스테이지 상단 `42.69%`, CTA 그룹은 `83.15%`에 고정해 브라우저 높이가 작아져도 서로 겹치지 않는다.
- `prefers-reduced-motion`에서는 이동·뒤집기 시간을 사실상 제거한다.

## 4. Component system

### Button

- 기본: Beige 면 + black text, 사각형 중심의 절제된 radius.
- 보조: 투명 배경 + `#51422F` border + 밝은 text.
- Hover: `translateY(-2px)`와 기존 팔레트 내 명도 변화.
- Active: 이동량 제거.
- Disabled: opacity 감소, pointer/keyboard activation 차단.
- Focus: `#C7A66B`의 명확한 outline.

### Input field

- 고민 입력은 넓은 단일 면, 메모는 두 개의 독립 textarea로 구성한다.
- label을 항상 유지하고 placeholder는 설명만 담당한다.
- 빈 고민에는 다음 단계 버튼을 비활성화한다.

### Navigation

- 좌측 TARAE wordmark, 우측 현재 단계와 `리딩 기록` 버튼.
- 진행 정보는 `리딩 준비`, `카드 선택`, `함께 읽기`, `돌아보기`처럼 번호와 구분점 없이 텍스트로만 표시한다.

### Tarot card

- 첨부 SVG 원본의 비율·선·색·글자를 변경하지 않는다.
- `CardImage`가 로드 실패를 감지해 사용자에게 재시도 UI를 제공한다.
- `FlipCard`는 back/front의 CSS 3D 회전을 사용한다. 클릭할 때마다 앞·뒤가 교대로 바뀌며 650ms 동안 중복 입력을 잠근다.
- 펼친 덱은 동일 중심을 공유하는 완만한 fan rotation/translation을 사용한다.
- 선택 카드는 과거/배경, 현재/핵심 상황, 미래/가능성의 3개 슬롯에 순서대로 배치한다. 세 번째 위치는 확정적 예언이 아닌 현재에서 이어질 수 있는 가능성으로 설명한다.
- 카드명은 영문을 위에, 더 작고 가벼운 한글명을 아래에 두고 둘 다 중앙 정렬한다.

### Reading guide panel

- 3단계 accordion: `기본 의미 → 고민과 연결하기 → 대화 질문`.
- 잠긴 다음 단계는 내용이 DOM에 노출되지 않으며 사용자가 버튼을 눌렀을 때만 생성한다.
- 이전 단계는 다시 열 수 있고, 열람한 최고 단계는 현재 리딩 동안 유지한다.

### Progress, modal, status

- 진행 상태는 페이지 헤더와 가이드의 `n / 3` 표기로 이중 확인한다.
- 카메라 상태는 loading/ready/denied/error를 텍스트로 명시한다.
- 리딩 기록은 `dialog` semantics를 가진 modal이며 목록과 상세를 같은 층위에서 전환한다.

## 5. Interaction system

### Figma에서 확인한 원칙

- Default/Hover/Pressed 상태는 면색, 선색, 짧은 이동으로 구분한다.
- 카드 동작은 실제 카드의 무게감을 우선하며 과도한 glow나 bounce를 사용하지 않는다.
- 선택한 세 장은 순서대로 별도 슬롯에 이동하고, 미선택 카드는 팬 상태를 유지한다.

### 구현 보완값

| interaction | duration | easing/token | 규칙 |
| --- | ---: | --- | --- |
| 버튼/포커스 | 180ms | `--fast`, ease | 색·선·2px 이동 |
| 덱 이동/팬 | 500ms | `--move`, `--ease` | 상태 전환당 1회 |
| 카드 flip | 650ms | `--flip`, `--ease` | 클릭마다 앞/뒤 전환, 실행 중 재입력 차단 |
| 손 좌표 | frame-based | EMA smoothing | 흔들림 억제 |
| 제스처 확정 | dwell + cooldown | gesture constants | 중복 실행 방지 |

- 상태 머신: `IDLE → SHUFFLING → SPREADING → SELECTING → DRAWN`. `SELECTING`은 세 장을 모두 추출할 때까지 유지하고, 3장째 선택 후에만 `DRAWN`으로 이동한다.
- 양손 셔플, 한 손 펼치기, 검지 지목/안쪽 당기기는 각 상태에서만 허용한다.
- 손이 사라지거나 신뢰도가 낮으면 진행량을 갱신하지 않는다.
- 마우스/키보드/손동작은 모두 같은 reducer와 실제 deck 배열을 사용한다.
- 양손 셔플은 각 손의 중심 좌표와 x/y 속도, 두 손 사이 거리, 전체 에너지를 전달한다. 각 카드는 고유 편차를 사용해 이동 폭·회전·z-order가 다르게 반응하며, 입력 정지 후 180ms 감쇠로 안정된다.
- Loading은 카메라 모델/스트림 준비 상태와 텍스트로 연결하며, 실패 시 재시도와 마우스 계속하기를 함께 제공한다.

## 6. Code mapping

| system | implementation |
| --- | --- |
| Tokens | `src/tokens.css` |
| Layout/components/motion | `src/styles.css` |
| Card primitives | `src/components/Card.tsx`, `src/components/Deck.tsx` |
| Flow/screens | `src/App.tsx` |
| Deck state machine | `src/lib/deck.ts` |
| Gesture classification | `src/lib/gestures.ts` |
| Camera/MediaPipe | `src/lib/useCamera.ts` |
| Reading content/topic hints | `src/data/readings.ts` |
| Persistence | `src/lib/storage.ts` |

