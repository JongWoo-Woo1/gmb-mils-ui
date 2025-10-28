# LabVIEW UI + Webpack 개발 지침

> ⚠️ **적용 범위(Scope): 이 문서는 GMB 프로젝트의 _UI 개선 대화_에서만 참고합니다.**
> LabVIEW의 일반 프로그래밍/구조/드라이버/VeriStand 연동/테스트 시나리오 등 **다른 주제에는 적용하지 않습니다.**
> UI 대화가 아닐 때는 이 지침을 사용하지 마세요.


> 목적: **웹 기술(HTML/CSS/JS + Webpack)** 로 픽셀 정밀 UI를 만든 뒤 **LabVIEW**에 이미지/리소스로 적용하기 위한 실무 지침입니다.  
> 협업 시에는 매 작업마다 **`ui_review.pdf`**(화면)와 **`code_snapshot.md`**(코드 요약) 두 파일만 제공하면 피드백을 진행합니다.

---

## 1) 개발 방향성 (요약)
- **고정 캔버스**: 최초 목표 해상도 **1920×1000**. 레이아웃은 이 크기를 기준으로 픽셀 맞춤.
- **웹에서 설계 → LabVIEW로 이식**: 웹에서 상호작용/스타일을 자유롭게 만들되, 최종 산출물은 **고정 크기 이미지(PNG/PDF)** 로 추출하여 LabVIEW Control Editor에 매핑.
- **검증 가능한 산출물**: 매 작업 후 `docs/ui/ui_review.pdf`(또는 PNG)와 `docs/ui/code_snapshot.md`만 주고받음. (브라우저 화면 ≒ LabVIEW 최종 화면)

---

---

## 1-α) LabVIEW UI의 한계와 우리 대응 전략

> LabVIEW는 강력한 HIL/계측 플랫폼이지만, **UI 커스터마이징과 레이아웃 엔진은 제한**적입니다.  
> 아래 제약을 전제로, 본 프로젝트는 **웹에서 픽셀 정밀 UI를 제작 → 정적 자산(PNG/PDF)로 이식**하는 방향을 채택합니다.

| LabVIEW UI 제약(현상) | 우리 프로젝트의 대응(디자인/절차) |
| --- | --- |
| **절대 배치 중심**: 컨트롤 위치는 **좌상단(0,0)** 기준 (자동 레이아웃/플렉스 그리드 부재) | 웹에서 **1920×1000 고정 캔버스**를 설계하고, `.lv-stage/.lv-frame`를 기준으로 **정수 좌표/4·8px 그리드**를 고수. LabVIEW에서는 **Scale with Pane 비활성화** + Splitter만 제한적으로 사용. |
| **스타일 커스터마이징 한계**: 시스템/클래식 테마 중심, CSS 같은 테마 시스템 부재 | 웹에서 색/그림자/둥근 모서리/아이콘 등을 **완전히 렌더링** → LabVIEW에는 **상태별 PNG**로 매핑(Up/Hover/Down/Disabled). 컨트롤 **크기 변경 금지**(1:1 매핑 유지). |
| **폰트/렌더링 차이**: 대상 PC 폰트·DPI·안티앨리어싱 차로 1px 선의 번짐 | 캡처 시 **deviceScaleFactor: 1**로 고정, **정수 좌표**에 배치. 시스템 폰트 스택 권장(대상 PC 동일 폰트). 1px 라인은 대비를 충분히 주고, 흐릿하면 색/두께를 보정. |
| **벡터 스케일링 부족**: 컨트롤/이미지를 늘리면 블러/계단 | **절대 크기 설계**(1920×1000) + 컨트롤 크기 변경 금지. 다양한 해상도 요구 시 **별도 아트보드**를 추가(다중 산출물). |
| **투명/레이어 성능**: 다중 데코·반투명 오브젝트가 많으면 느려질 수 있음 | 웹에서 배경/그림자를 **하나의 PNG에 bake**. LabVIEW 측 데코 레이어 최소화. |
| **상태/애니메이션 제약** | LabVIEW에서 필요한 최소 상호작용만 구현. 시각 효과는 **정적 이미지**로 대체. |

### 좌표계/픽셀 팁
- 모든 선/박스는 **정수(px) 좌표/크기**로 배치(0.5px, transform/scale 사용 금지).  
- 1px 테두리를 **총 크기 안에 포함**하려면 `.lv-frame`에 `box-sizing:border-box; width:1920px; height:1000px; border:1px;` 패턴 사용.  
- 캡처 스크립트는 대상 요소만 **element.screenshot()** 으로 클립 → 모서리 오차 제거.

### PNG 자산 규칙
- **24비트 PNG + 알파**(배경 투명 필요 시). 모든 상태(Up/Hover/Down/Disabled)는 **동일 크기** 유지.  
- 글/아이콘은 **배경과 함께 bake**하거나, 폰트 의존을 최소화(대상 PC 폰트 편차 흡수).  
- 1px hairline이 흐릿하면: 대비 색상/내외곽 2px 테크닉(1px 내부 + 1px 외곽)으로 또렷하게.


## 2) 폴더 구조(권장)
```
project/
├─ src/
│  ├─ index.html          # UI 셸
│  ├─ index.js            # 라우팅/부트스트랩
│  ├─ styles/             # CSS 토큰/레이아웃/컴포넌트
│  └─ views/              # 페이지 조각(dashboard.html, auto.html ...)
├─ tools/
│  ├─ review.mjs          # 빌드→캡처→스냅샷 자동화 오케스트레이터
│  ├─ export-ui-review.mjs# 1920×1000 요소 캡처(PNG→PDF)
│  └─ make-code-snapshot.mjs # 코드 요약 MD 생성(필터 적용)
├─ dist/                  # Webpack 빌드 산출물 (자동 생성)
└─ docs/ui/               # 리뷰 산출물: ui_review.pdf, ui_review.png, code_snapshot.md
```

---

## 3) HTML 셸(권장 구조)

```html
<!-- src/index.html -->
<div class="lv-stage">
  <div class="lv-frame">
    <div id="app" class="app"></div>
  </div>
</div>
```
- **.lv-stage**: LabVIEW 윈도우에 대응하는 **절대 캔버스(1920×1000)**  
- **.lv-frame**: 외곽선/테두리 또는 내부 여백을 포함시키고 싶을 때 사용  
- **#app**: 실제 페이지 컨텐츠가 들어가는 컨테이너

---

## 4) CSS 원칙(핵심)
- **픽셀 그리드**: 4/8px 스페이싱 스케일, 최소 터치영역 32px.
- **타이포**: UI용 시스템 폰트 스택, 라인하이트 1.2~1.4.
- **테두리**: 1px hairline(명암 대비 확보), 반응 상태(hover/active/disabled) 토큰화.
- **리셋**: `html, body { margin:0; padding:0; overflow:hidden; }`
- 캡처 시에는 스크립트가 `.lv-stage`(또는 `.lv-frame`)에 **강제 width/height/position**을 주입하여 정확히 1920×1000로 고정.

---

## 5) 라우팅(예시)
- **해시 기반 라우팅**(예: `#/dashboard`, `#/auto`, `#/settings`).
- 각 뷰는 `src/views/*.html`로 분리 → `index.js`에서 fragment로 교체 렌더.

---

## 6) 빌드 & 리뷰 산출물
### NPM 스크립트(예시)
```jsonc
{
  "scripts": {
    "build": "webpack --mode production",
    "review": "node tools/review.mjs",
    "code:snapshot": "node tools/make-code-snapshot.mjs"
  }
}
```
- **`npm run review`** 실행 시 파이프라인(오케스트레이션):
  1) Webpack **빌드** → `dist/index.html` 생성  
  2) **UI 캡처**: `export-ui-review.mjs`가 `.lv-stage`(기본) 요소만 **정확히 1920×1000**으로 캡처 → `docs/ui/ui_review.png`  
  3) **PDF 생성**: 위 PNG를 1페이지 **1920×1000 PDF** 로 래핑 → `docs/ui/ui_review.pdf`  
  4) **코드 스냅샷(MD)**: `make-code-snapshot.mjs`가 텍스트 소스만 모아 `docs/ui/code_snapshot.md` 생성

> 피드백은 **이 두 파일**로 진행합니다:  
> - 화면: `docs/ui/ui_review.pdf`  
> - 코드 요약: `docs/ui/code_snapshot.md`

---

## 7) 캡처 규칙(정밀도 보장)
- 기본 타깃은 **`.lv-stage`**. 필요 시 **`.lv-frame`** 또는 `#app`으로 교체 가능.  
  - `.lv-stage`가 **내용 전체 1920×1000**일 때 적합.  
  - 테두리(1px)를 **크기 안에 포함**하려면 `.lv-frame`을 타깃으로 하고 `box-sizing:border-box; width:1920px; height:1000px; border:1px`를 적용.
- 캡처는 **요소 스크린샷(element.screenshot)** 로 수행 → 픽셀 경계가 정확.
- PDF는 **PNG 1장 래핑 방식**으로 생성(이중 페이지/여백 방지).
- 산출물 파일명은 고정: `ui_review.png`, `ui_review.pdf` (실행 시 `docs/ui/`를 비우고 재생성).

---

## 8) 코드 스냅샷(MD) 정책
- 포함: `src/`, `tools/`, `package.json`, `webpack.config.js`
- 제외: `node_modules/`, `dist/`, `docs/`, `.git/`, `.github/`, `assets/`, `package-lock.json`, 이미지/바이너리(`.png`, `.jpg`, `.pdf`, `.zip` 등)
- 파일 사이즈/라인 제한 초과 시 본문을 자동 생략(상단만 표시).

---

## 9) LabVIEW 적용 가이드(요약)
- **Control Editor** 에서 PNG를 상태별로 매핑(Up/Hover/Active/Disabled).  
- Import 후 컨트롤 **크기 변경 금지**(픽셀 매핑 유지).  
- 폼 리사이즈는 **Scale with Pane 해제** + Splitter/정적 레이아웃으로 처리.

---

## 10) 품질 체크리스트
- [ ] `.lv-stage` 또는 `.lv-frame`가 **정확히 1920×1000**인가?  
- [ ] 스크롤바 없음(`overflow:hidden`), 기본 여백 제거(`margin:0`)가 적용됐는가?  
- [ ] 1px 테두리/그리드가 **깨지지 않고** 선명한가?  
- [ ] 버튼/폼 **최소 터치영역 32px** 확보?  
- [ ] 상태(hover/active/disabled)와 포커스 표시 일관성?  
- [ ] `ui_review.pdf`와 실제 LabVIEW 컨트롤의 외형이 **동일**한가?

---

## 11) 문제 해결(트러블슈팅)
- **다른 영역이 같이 찍힘/모서리 어긋남**: 타깃 셀렉터를 `.lv-frame`으로 변경, 또는 `.lv-stage`에 강제 스타일 주입 확인.  
- **PDF가 2장/여백 포함**: PNG-래핑 방식 유지(1페이지 `1920×1000`, `margin:0`), `preferCSSPageSize: true`.  
- **경로에 공백/한글** → 파일 URL은 `pathToFileURL()` 로 생성.  
- **웹폰트 지연** → `document.fonts.ready` 대기.  
- **브라우저 경로** → 로컬 크롬/엣지 실행파일 경로를 환경변수로 지정:  
  `PUPPETEER_EXECUTABLE_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`

---

## 12) 협업 방식(요약)
- 매 작업 후 다음 **두 파일만 제공**:  
  1) `docs/ui/ui_review.pdf` — **화면** 확인용  
  2) `docs/ui/code_snapshot.md` — **코드 컨텍스트** 확인용  
- 이 두 파일만으로도 디자인(픽셀)·코드 구조에 대한 피드백을 충분히 교환할 수 있습니다.