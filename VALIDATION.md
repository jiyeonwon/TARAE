# TARAE 검증 기록

검증일: 2026-11-24 (Asia/Seoul)

## 자동 검증

- `npm test`: 9/9 통과
- `npm run build`: TypeScript + Vite production build 통과
- 카드 23개와 manifest 경로 존재 확인
- 22장 카드의 이미지/번호/이름/키워드/의미/관점/힌트/질문 대응 확인
- 실제 배열을 바꾸는 Fisher–Yates shuffle과 순서가 보존되는 3장 draw 확인
- `IDLE → SHUFFLING → SPREADING → SELECTING → DRAWN` 상태 제한 확인
- 정지/손 누락 시 셔플 미발동, 양손 이동 시 셔플, 한 손 sweep 시 spread, draw 뒤 selection lock 확인
- LocalStorage payload 검증과 손상 데이터 복구 확인

## 브라우저 검증

Safari에서 아래 흐름을 직접 완료했다.

1. 빈 고민의 다음 버튼 비활성
2. 고민 입력 및 표시
3. 카메라 권한 거부와 구체적 오류/재시도/마우스 대체 UI
4. 실제 덱 순서가 바뀌는 셔플
5. 22장 fan spread
6. 세 장을 순차 선택할 때 잔여 덱이 22→21→20→19장으로 감소
7. 세 번째 선택 전 완료 CTA 비노출, 세 번째 선택 후 `DRAWN` 전환
8. 각 선택 카드의 앞면↔뒷면 반복 flip과 애니메이션 중복 입력 차단
9. handoff 진입과 공개 전 카드 정보 비노출

3장용 첫 해석·가이드·마무리·기록 UI는 TypeScript production build와 3장 데이터/저장 테스트로 검증했다. 브라우저 수동 검증은 사용 중이던 Safari 탭이 닫혀 handoff 이후까지 다시 완주하지 못했다.

## 미검증 범위

실제 웹캠에서의 MediaPipe landmark 추적과 물리적 손동작은 카메라 권한을 허용하지 않은 환경이므로 라이브 검증하지 않았다. 해당 판단 로직은 합성 landmark 테스트로만 확인했다.

