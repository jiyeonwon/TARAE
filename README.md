# TARAE

TARAE(타래)는 질문자와 리더가 한 화면을 공유하며 직접 카드를 섞고, 과거·현재·가능성의 세 장을 뽑고, 서로의 해석을 나누는 2인용 인터랙티브 타로 웹서비스다. 자동으로 정답을 말하는 대신 카드 이미지와 키워드를 먼저 보여주고, 필요할 때만 3단계 리딩 가이드를 연다.

## 주요 기능

- Figma `UI` 페이지 기반의 1920×1080 데스크톱 디자인과 반응형 레이아웃
- 원본 Major Arcana SVG 22장 + 공통 카드 뒷면
- Fisher–Yates 셔플, 팬 펼치기, 순서가 보존되는 3장 추출이 연결된 실제 deck state
- 각 카드의 반복 가능한 650ms 3D 앞·뒤 flip과 애니메이션 중복 입력 방지
- MediaPipe Hand Landmarker의 21개 랜드마크, 좌표 스무딩, dwell/cooldown 기반 제스처
- 손동작과 같은 reducer를 사용하는 마우스·키보드 대체 조작
- 카드 이름·키워드만 먼저 공개하는 first interpretation
- 기본 의미 → 고민 연결 → 대화 질문의 선택적 3단계 가이드
- 6개 고민 주제의 규칙 기반 분류와 카드별 자연어 힌트
- 리더/질문자 메모와 리딩 기록 LocalStorage 저장·복원
- 카메라 거부, 모델 실패, 에셋 실패, 손 미인식에 대한 복구 UI

## 기술 스택

- React 19, TypeScript 5.9, Vite 7
- `@mediapipe/tasks-vision` / Hand Landmarker
- CSS Variables, CSS 3D transforms, SVG assets
- Browser `getUserMedia`, Canvas overlay, LocalStorage
- Node test runner + `tsx`

모델, WASM, 카드, 글꼴은 모두 `public/`에 포함되어 있어 외부 서비스 없이 브라우저 안에서 동작한다.

배포 주소: [jiyeonwon.github.io/TARAE](https://jiyeonwon.github.io/TARAE/)

## 개발 환경과 설치

권장 환경은 Node.js 20 이상, 웹캠이 연결된 최신 데스크톱 Chrome 또는 Safari다.

```bash
cd /Users/jiyeonwon/Desktop/TARAE
npm install
npm run dev
```

확인된 개발 주소:

```text
http://127.0.0.1:5173/
```

프로덕션 빌드와 미리보기:

```bash
npm run build
npm run preview
```

테스트:

```bash
npm test
```

## 이용 흐름

1. 질문자와 리더 역할을 확인하고 질문자의 고민을 입력한다.
2. 카메라를 연결하거나 `마우스로 계속하기`를 선택한다.
3. 셔플 → 펼치기 → 과거·현재·가능성 카드 세 장 선택 순서로 의식을 진행한다.
4. 화면을 리더에게 넘긴 뒤 카드를 공개한다.
5. 리더가 그림과 키워드로 먼저 해석한다.
6. 필요한 만큼만 가이드 01–03을 연다.
7. 두 사람의 메모를 남기고 리딩을 저장한다.

## MediaPipe와 손동작

카메라 연결 시 브라우저가 권한을 요청한다. `허용` 후 로컬 Hand Landmarker model이 준비되면 작은 16:9 preview에 21개 landmark가 표시된다. 영상은 브라우저 안에서만 처리되며 업로드하지 않는다.

- **Shuffle:** 양손을 카메라에 보이고 좌우로 반복 이동한다.
- **Spread:** 한 손을 화면 오른쪽에서 왼쪽으로 수평 이동한다.
- **Point:** 검지를 펴 원하는 카드 위에 안정적으로 둔다.
- **Draw:** 지목 상태를 유지한 채 손을 화면 중심 방향으로 당긴다. 같은 동작을 세 번 반복하며 이미 뽑은 카드는 덱에서 제외된다.

카메라 화면은 거울처럼 좌우 반전되며 카드 포인터 좌표도 같은 방향으로 보정된다. 움직임이 멈추거나 손이 프레임에서 사라지면 제스처 업데이트도 멈춘다.

## 대체 조작과 접근성

- 카메라 연결을 건너뛰어 마우스/터치로 전체 플로우를 진행할 수 있다.
- 의식 화면의 안내 버튼으로 셔플과 펼치기를 실행하고, 펼친 카드를 클릭해 선택한다.
- 키보드 사용자는 모든 버튼과 카드에 Tab/Enter로 접근할 수 있다.
- `prefers-reduced-motion`을 존중하고 focus outline, label, live status를 제공한다.

## 프로젝트 구조

```text
src/
  components/       카드와 덱 UI
  data/             22장 리딩 데이터, 에셋 manifest
  lib/              deck, gesture, camera, storage 로직
  App.tsx           전체 사용자 플로우
  tokens.css        Figma 기반 디자인 토큰
  styles.css        레이아웃·상태·애니메이션
public/
  assets/cards/     원본 SVG 23개
  assets/figma/     Figma 장식 에셋
  models/           Hand Landmarker model
  wasm/             MediaPipe runtime
tests/              deck/gesture/data/storage 테스트
reference/          확인한 Figma node context
```

디자인 추출값과 구현 보완값은 [design.md](./design.md)에 정리되어 있다.

## 확인한 항목

- 자동 테스트: 카드/데이터 대응, 셔플, 상태 머신, 주제 분류, 저장 유효성, 손동작 셔플·펼치기·선택 lock
- Safari 수동 플로우: Splash → 질문 입력 → 마우스 대체 → 셔플 → 팬 → 3장 순차 추출 → 개별 앞·뒤 flip → 리더 handoff
- 카메라 거부 시 구체적 오류와 재시도/대체 경로
- 공개 전 카드 앞면의 시각·접근성 정보 비노출
- `npm run build` 프로덕션 빌드

## 알려진 제한 사항

- 이번 실행 환경에서는 브라우저 카메라 권한을 의도적으로 거부해 오류 경로를 검증했으며, **실제 웹캠 입력을 사용한 MediaPipe 제스처는 라이브로 검증하지 못했다.** 제스처 분류기는 합성 랜드마크 단위 테스트로 확인했다.
- 3장용 첫 해석·가이드·마무리·기록은 production build와 데이터/저장 테스트로 검증했다. 수정 후 Safari 수동 확인은 handoff까지 진행했으며 이후 화면은 다시 완주하지 못했다.
- 실제 손 인식 품질은 조명, 카메라 각도, 손과 카메라의 거리 영향을 받는다. 첫 사용 시 preview를 보며 동작 범위를 맞춰야 한다.
- 현재 버전은 정방향 Major Arcana 22장과 과거·현재·가능성의 기본 3장 배열을 지원한다.
- 리딩 기록은 현재 브라우저의 LocalStorage에만 남으며 다른 기기·브라우저와 동기화되지 않는다.
- Chrome을 실행할 수 없는 환경이어서 Safari에서 전체 마우스 플로우를 검증했다. 배포 전 실제 Chrome + webcam 회귀 테스트를 권장한다.
- `getUserMedia`는 보안 컨텍스트가 필요하다. 로컬 개발에서는 `localhost`/`127.0.0.1`을 사용하고 원격 배포에서는 HTTPS를 사용해야 한다.

