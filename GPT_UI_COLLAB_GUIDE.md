# GPT UI 협업 지침 (LabVIEW용 HTML/CSS/JS 자산 작업 전용)

> 이 지침은 **UI 자산(HTML/CSS/JS/webpack → PNG/PDF → LabVIEW Import)** 작업에만 적용합니다.  
> 일반 LabVIEW 로직/드라이버/DAQ 등에는 적용하지 않습니다.

---

## 0) 프로젝트/레포 정보
- GitHub: **https://github.com/JongWoo-Woo1/gmb-mils-ui**
- 리뷰 스냅샷 산출물 경로(리포 내): `docs/ui/ui_review.png`, `docs/ui/ui_review.pdf`  
  - (GitHub에서 빠른 확인)  
    - PNG: https://github.com/JongWoo-Woo1/gmb-mils-ui/blob/main/docs/ui/ui_review.png  
    - PDF: https://github.com/JongWoo-Woo1/gmb-mils-ui/blob/main/docs/ui/ui_review.pdf

> 브랜치가 `main`이 아니라면 위 URL의 `main`을 현재 브랜치명으로 바꾸면 됩니다.

---

## 1) 언제 이 지침을 자동 적용하나요? (UI 모드)
다음 키워드/맥락이 보이면 **UI 모드**로 전환해 이 지침을 적용합니다.
- “UI”, “디자인”, “버튼”, “PNG”, “아이콘”, “스타일”, “CSS”, “webpack”, “Puppeteer”, “자산/에셋 추출”, “LabVIEW 버튼 그림”
- HTML/CSS/JS 코드나 스크린샷을 첨부하고 **LabVIEW에서 쓸 이미지**를 언급한 경우

> UI 모드 외의 내용(순수 LabVIEW 로직/테스트/NI 주제)은 평소 규칙을 사용.

---

## 2) 대화 시작 ‘핸드셰이크’ (드리프트 방지)
- 사용자가 아래 중 하나를 주면 **현재 기준(baseline)** 으로 채택:
  - `baseline: <짧은해시>` 혹은 `baseline=<짧은해시>` (예: `baseline=8a7c9e2`)
  - Git 로그/출력에 있는 마지막 줄의 **짧은 해시**를 자동 인식
- 내가 답변할 때 가능하면 맨 위에 **`baseline=<해시>`**를 표시하여 같은 기준 확인

> 기준이 없으면, 즉시 실행 가능한 일반 가이드를 먼저 제시하고 “baseline 제공 시 더 정확히 맞출 수 있음”을 **한 번만** 안내.

---

## 3) 원커맨드: `npm run review -- "메시지"`
**한 줄**로 build → PNG/PDF 스냅샷 → git add/commit/push → 해시 출력까지 수행.

### `package.json`
```jsonc
{
  "scripts": {
    "build": "YOUR_BUILD_COMMAND",        // 예: "webpack --mode production"
    "review": "node tools/review.mjs"
  }
}
```

### `tools/review.mjs` (오케스트레이터)
- 해야 할 일: `build` 실행 → `export-ui-review.mjs`로 스냅샷 생성 → git add/commit/push → `baseline=<hash>` 출력
- 절대 `npm run review`를 다시 호출하지 않음(재귀 방지).

### `tools/export-ui-review.mjs` (스냅샷 생성 전담)
- **puppeteer-core** 사용(브라우저 다운로드 없이 빠름), 크롬/엣지 자동 탐색 또는 `PUPPETEER_EXECUTABLE_PATH` 환경변수로 지정
- 대상 HTML 자동 선택(우선순위): **CLI 인자** → `dist/index.html` → `gallery.html`
- **LOCK 파일**(`.export-ui-review.lock`)로 동시/재귀 실행 차단
- 매 실행 시 `docs/ui` **비우고 시작** → **고정 파일명**으로 저장: `ui_review.png`, `ui_review.pdf`
- **1920×1000 고정 뷰포트**, PDF는 **@page size + 0 margin + preferCSSPageSize** 로 1페이지 정확히 출력

> 결과물: `docs/ui/ui_review.png`, `docs/ui/ui_review.pdf` (항상 같은 이름)

### 사용 예
```bash
npm run review -- "버튼 간격 조정 및 헤더 정렬"
# 콘솔 마지막 줄에 baseline=<해시> 출력
```

---

## 4) PDF/PNG 스냅샷 정책
- 파일명은 고정:  
  - `docs/ui/ui_review.png`  
  - `docs/ui/ui_review.pdf`  
- **해시는 파일명에 넣지 않음** (혼동 방지). 해시는 콘솔의 `baseline=<hash>`로만 공유.
- PDF가 두 장으로 보이는 증상이 있을 경우, 아래가 스크립트에 적용되어 있어야 함:
  - `@page { size: 1920px 1000px; margin: 0; }`
  - `preferCSSPageSize: true` 로 PDF 생성
  - `html, body { margin:0; padding:0; overflow:hidden; }`
  - `page.screenshot({ captureBeyondViewport:false })` (권장)

---

## 5) LabVIEW Import 가이드(요약)
- Control Editor에서 상태별(Up/Hover/Active/Disabled) **동일 크기 PNG** 매핑
- Import 후 컨트롤 **크기 변경 금지**(픽셀 매핑 유지)
- 폼 리사이즈는 **Scale with Pane 끄기** + Splitter/레이아웃으로

---

## 6) 문제 해결(트러블슈팅)
- `ERR_FILE_NOT_FOUND` (공백/한글 경로): `pathToFileURL` 사용, `dist/index.html`을 인자로 지정해 실행
  - `node tools/export-ui-review.mjs dist/index.html`
- puppeteer 설치가 느림: `puppeteer-core` 사용 + `PUPPETEER_EXECUTABLE_PATH`로 로컬 크롬/엣지 지정
- 무한 실행/재귀: `review.mjs` → (build → export → git) **단방향** 구조 유지, `export-ui-review.mjs`에는 **LOCK + process.exit**

---

## 7) 빠른 체크리스트
- [ ] 지금 이 대화가 **UI 작업**인가?
- [ ] `npm run review -- "메시지"` 한 줄로 실행했는가?
- [ ] `docs/ui/ui_review.(png|pdf)` 최신본이 커밋/푸시되었는가?
- [ ] 채팅 맨 처음에 **`baseline=<해시>`**를 적었는가? (예: `baseline=31ef941`)
- [ ] (필요 시) 브라우저 경로 지정: `PUPPETEER_EXECUTABLE_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`

---

## 8) 예시 대화 포맷
```
baseline=31ef941 (branch: main)
이번 변경: 네비게이션 폭 240→256, RUN 모니터 라벨 정렬
피드백 요청: 좌상단 마진/테두리 굵기 확인
```
→ 나는 레포의 `docs/ui/ui_review.pdf`를 열어 **픽셀 피드백**으로 답변.

---

### 부록: 로컬에서 바로 열기 (선택)
```powershell
# Windows에서 바로 확인
start docs\ui\ui_review.pdf
start docs\ui\ui_review.png
```
