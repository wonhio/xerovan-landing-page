# Xerovan 다국어 사이트 + WordPress 블로그 설정 가이드

## 완성되는 구조

```
xerovan.com/                → 방문자 언어로 자동 이동 (쿠키 → 브라우저 언어 → 영어)
xerovan.com/en/  /kr/  /ja/  /es/  /ar/  /pt/        → 언어별 랜딩 페이지
xerovan.com/{언어}/blog                              → 블로그 목록 (9개씩, /page/2 …)
xerovan.com/{언어}/blog/{글-슬러그}                   → 블로그 글
xerovan.com/{언어}/blog/feed.xml                     → RSS
xerovan.com/blog-sitemap.xml                         → 전체 사이트맵 (6개 언어 홈 + 모든 글)
xerovan.com/blog-media/…    → WordPress 이미지 (xerovan.com 주소로 프록시)

cms.xerovan.com             → Hostinger WordPress (글 작성 전용, 방문자에게 직접 노출 안 됨)
```

검토 문서의 **선택 A (Headless WordPress)** 방식입니다. Vercel이 WordPress REST API에서 글을 가져와 Xerovan 디자인으로 직접 렌더링하므로, 단순 프록시 방식의 문제(canonical 주소, CSS/이미지 경로, 로그인 쿠키, 리디렉션 루프, wp-admin 접근)가 생기지 않습니다. 현재 사이트가 Next.js가 아닌 정적 HTML이라, 렌더링은 Vercel 서버리스 함수(`api/blog.js`) 하나로 처리합니다.

---

## 1. DNS (Namecheap) — 기존 값은 건드리지 않기

- `@`, `www` 레코드: **현재 Vercel 값 그대로 유지**
- Hostinger가 안내한 `@ → 185.232.14.234`, `www → xerovan.com`: **추가하지 않음**
- 추가할 것은 **하나**뿐:

| Type | Host | Value |
|---|---|---|
| A | `cms` | Hostinger가 서브도메인용으로 알려주는 IP |

(Hostinger가 CNAME을 안내하면 `CNAME cms → 안내받은 호스트명`)

## 2. Hostinger — WordPress를 cms.xerovan.com에 설치

1. hPanel → 웹사이트 추가 → 도메인을 **`cms.xerovan.com`** 으로 지정 (xerovan.com 아님)
2. SSL 인증서 발급 확인 (https://cms.xerovan.com 이 열려야 함)
3. WordPress 설치

## 3. WordPress 설정

**설정 → 일반**
- WordPress 주소 / 사이트 주소: 둘 다 `https://cms.xerovan.com` 그대로 둡니다. **xerovan.com/blog로 바꾸지 마세요.**

**설정 → 고유주소**
- "글 이름(Post name)" 선택 → 글 주소의 슬러그가 그대로 `xerovan.com/{언어}/blog/{슬러그}`가 됩니다.

**설정 → 읽기**
- "검색엔진이 이 사이트를 색인하지 않도록 합니다" 체크 (cms 주소가 구글에 중복 노출되지 않도록)

**글 → 카테고리** — 아래 6개를 정확히 이 슬러그로 생성:

| 이름 (자유) | 슬러그 (정확히) |
|---|---|
| English | `en` |
| 한국어 | `kr` |
| 日本語 | `ja` |
| Español | `es` |
| العربية | `ar` |
| Português | `pt` |

**글을 쓸 때**: 각 글에 언어 카테고리를 **하나만** 체크합니다. 대표 이미지(Featured Image)를 넣으면 목록 카드와 SNS 공유 이미지로 사용됩니다. 요약(Excerpt)을 쓰면 카드 설명/메타 설명이 되고, 비워두면 본문 앞부분이 사용됩니다.

**(권장) cms 프론트엔드를 공개 블로그로 보내기** — 외모 → 테마 파일 편집기 → `functions.php` 맨 아래, 또는 "Code Snippets" 플러그인에 추가:

```php
// cms.xerovan.com 의 공개 페이지 방문 시 xerovan.com 블로그로 이동
// (wp-admin, 로그인, REST API, 로그인한 상태의 미리보기는 그대로 동작)
add_action('template_redirect', function () {
  if (is_user_logged_in()) return;
  $lang = 'en';
  if (is_singular('post')) {
    $cats = wp_get_post_categories(get_the_ID(), ['fields' => 'slugs']);
    foreach (['en','kr','ja','es','ar','pt'] as $l) { if (in_array($l, $cats, true)) { $lang = $l; break; } }
    wp_redirect("https://www.xerovan.com/$lang/blog/" . get_post_field('post_name', get_the_ID()), 301);
    exit;
  }
  wp_redirect('https://www.xerovan.com/en/blog', 301);
  exit;
});
```

**(선택) 같은 글의 다른 언어 버전 연결** — 언어 전환 메뉴가 같은 글의 번역본으로 이동하고 hreflang도 연결됩니다. 위 코드 아래에 추가:

```php
add_action('init', function () {
  register_post_meta('post', 'translations', ['show_in_rest' => true, 'single' => true, 'type' => 'string']);
});
```
그 다음 글 편집 화면 → 우측 상단 ⋮ → 환경설정 → 패널 → "사용자 정의 필드" 켜기 → 필드 이름 `translations`, 값 예시 `kr:xerovan-launch-ko,ja:xerovan-launch-ja`

> 보안 플러그인(Wordfence 등)이 REST API를 막으면 블로그가 비어 보입니다. `https://cms.xerovan.com/wp-json/wp/v2/posts` 가 브라우저에서 JSON으로 열리는지 확인하세요.

## 4. 저장소에 반영 (wonhio/xerovan-landing-page)

받은 zip을 풀어 저장소 루트에 복사합니다. `images/` 폴더는 기존 것을 그대로 둡니다.

```
index.html          ← 교체 (언어 자동 이동용 fallback)
en/ kr/ ja/ es/ ar/ pt/index.html   ← 신규
api/blog.js         ← 신규 (블로그 렌더러)
vercel.json         ← 신규 (언어 이동 + 블로그 라우팅)
robots.txt          ← 신규 (이미 있다면 Sitemap 줄만 추가)
_build/             ← 번역 원본 + 빌드 스크립트 (아래 5번 참고)
_original.html      ← 영어 원본 페이지
```

**반드시 Preview 배포로 먼저 확인** (브랜치로 push → Vercel Preview URL). 체크 리스트:

- [ ] `/` → 브라우저 언어에 맞게 이동 (한국어 브라우저면 `/kr/`)
- [ ] 6개 언어 페이지 + 우측 상단 언어 메뉴, 선택한 언어가 다음 방문 때도 유지
- [ ] `/ar/` 가 오른쪽→왼쪽(RTL)으로 표시
- [ ] 이미지가 모두 보임 (경로를 `/images/…` 절대 경로로 바꿨습니다)
- [ ] 대기자 등록 / 문의 폼 동작 (Apps Script로 `lang` 값이 함께 전송됨 — 시트에 무시되어도 문제 없음)
- [ ] `/kr/blog` 목록, 글 상세, 이미지, `/blog-sitemap.xml`

확인 후 main에 병합하면 프로덕션 반영됩니다.

**환경 변수 (선택)** — Vercel → Settings → Environment Variables
- `WP_ORIGIN` (기본값 `https://cms.xerovan.com`) — 서브도메인을 `wp.xerovan.com`으로 쓰면 이 값과 `vercel.json`의 `/blog-media` 주소를 같이 바꾸세요.
- `SITE_URL` (기본값 `https://www.xerovan.com`)

**캐시**: 블로그는 5분 캐시 + 백그라운드 갱신입니다. 글을 발행하면 최대 약 5분 안에 반영됩니다.

## 5. 이후 문구 수정 방법

언어 페이지 6개는 **빌드 스크립트로 생성**됩니다. 각 `index.html`을 직접 고치면 다음 빌드 때 덮어써집니다.

- 영어 문구/레이아웃 수정 → `_original.html` 수정
- 한국어 → `_build/build_pages.py` 안의 `R = [...]` 목록
- 일본어·스페인어·아랍어·포르투갈어 → `_build/i18n/ja.py`, `es.py`, `ar.py`, `pt.py`
- 그 다음 저장소 루트에서 `python3 _build/build_pages.py` 실행 → 6개 페이지 재생성

영어 원본에 새 문구를 추가하면, 번역 목록에도 같은 순서로 항목을 추가해야 합니다(스크립트가 누락 시 오류로 알려줍니다).

## 6. FAQ / 법적 고지 (Google Sheet)

- **영어**: 기존처럼 Google Sheet에서 불러옵니다.
- **나머지 5개 언어**: 페이지 안의 번역본(fallback)을 사용합니다. 시트로 관리하려면 언어별 탭을 만들어 CSV로 게시하고, 해당 언어의 `FAQ_SHEET_URL` 에 링크를 넣으세요.
- **법적 고지 시트**: 모든 언어가 같은 (영어) 시트를 공유합니다. 법적 문서는 보통 영어 정본을 유지하는 경우가 많아 그대로 두었습니다.

## 7. 출시 전 권장 사항

- **번역 검수**: 일본어·스페인어·아랍어·포르투갈어는 네이티브 검수를 권장합니다. 특히 푸터의 법적 고지 문구와 KYC/수수료 관련 FAQ는 금융 규제 표현이라 현지 검토가 필요합니다.
- **Google Search Console**: `https://www.xerovan.com/blog-sitemap.xml` 제출
- **OG 이미지**: 현재 6개 언어 모두 영어 `og-preview.jpg`를 사용합니다. 언어별 공유 이미지를 원하면 `og-preview-kr.jpg` 등을 만들어 교체할 수 있습니다.
