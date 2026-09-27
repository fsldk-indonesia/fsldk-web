# Homepage Gallery Thumbnail Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the homepage "Dokumentasi Kegiatan Terbaru" gallery grid from making the browser decode dozens of full-resolution (1920px) photos at once during scroll, by making it use the 480px thumbnail variant the backend already generates — and consolidate the duplicated image-URL logic so this exact gap can't reopen.

**Architecture:** No backend or database change is needed. `fsldk-api/pkg/upload` already writes a deterministic `<name>_thumb.<ext>` sibling file for every uploaded (and backfilled) image — `gallery.public-index.page.ts` and `gallery.public-detail.page.ts` already derive that thumbnail URL client-side with a local `thumbUrl()` helper and render correctly. `home.index.page.ts`'s gallery grid never got that helper — it renders the full-size `imagePath` directly, which is the actual cause of the reported lag. This plan extracts the proven `imgUrl`/`thumbUrl` logic (currently copy-pasted across 4 files) into one shared util in `core/utils/`, then switches the homepage grid to the thumbnail variant.

**Tech Stack:** Angular 19 (standalone components, signals), Jasmine/Karma (`ng test`).

**Spec:** No separate spec document — this plan's background is the diagnosis from the conversation that produced it (see Background below); there is no `docs/superpowers/specs/...` file to keep in sync.

## Background (why each file is touched)

Confirmed by reading the actual code, not assumed:

- `fsldk-api/pkg/upload/resize.go` (`generateVariants`, `thumbFileName`) and `backfill.go` (`BackfillThumbnails`) already produce a `_thumb` sibling file for **every** image, old or new, uploaded through the shared `/upload/image` endpoint. This convention is deterministic (insert `_thumb` before the extension) and requires no DB column — the thumb URL is 100% derivable from the main image URL already stored on gallery/news/article rows.
- `gallery.public-index.page.ts:450-472` and `gallery.public-detail.page.ts:644-665` each already have a private `imgUrl()` + `thumbUrl()` pair implementing exactly this derivation, and their templates already call `thumbUrl(...)` for grid/card images. These pages are NOT laggy.
- `gallery-lightbox.component.ts:359-369` has its own copy of `imgUrl()` only (no thumb — correct, since the lightbox shows one full-res photo at a time).
- `home.index.page.ts:2554-2559` has its own copy named `galleryImgUrl()` — **missing** the thumb derivation — and `home.index.page.html:932` calls it directly on every photo in the grid. This is the only place in the app still serving full-res images into a multi-item grid, and it is exactly the section shown lagging in the reported screenshot ("Dokumentasi Kegiatan Terbaru").

Four copies of the same string-manipulation logic is how this gap happened (three copies kept in sync, one didn't). This plan fixes the immediate bug and removes the duplication that caused it.

## Global Constraints

- Work stays entirely inside `fsldk-web/` (Angular repo) — no `fsldk-api/` changes, no migration, no DTO change.
- `core/utils/` holds cross-cutting, DI-free pure functions (existing precedent: `core/utils/format-rupiah.ts`) — new util follows that shape: exported functions, no class, no Angular decorators.
- Preserve existing template call syntax wherever the diff allows it — assign the imported function as a public class field (`imgUrl = resolveImageUrl;`) instead of writing a delegator method body, so templates that already call `imgUrl(x)`/`thumbUrl(x)` need no changes.
- Test convention for pure-function utils in this repo: plain Jasmine `describe`/`it`/`expect` importing the functions directly (see `src/app/modules/zakat/zakat.compute.spec.ts`) — no `TestBed`.
- `npm run build` (`ng build`) must succeed after each task — it AOT-compiles templates too, so it catches a renamed method a template still references.

---

### Task 1: Shared `resolveImageUrl` / `resolveThumbnailUrl` util

**Files:**
- Create: `fsldk-web/src/app/core/utils/image-url.ts`
- Create: `fsldk-web/src/app/core/utils/image-url.spec.ts`

**Interfaces:**
- Produces: `resolveImageUrl(path: string): string` and `resolveThumbnailUrl(path: string): string` — both pure functions, no side effects, importable from `core/utils/image-url`. Every later task imports these two names.

- [ ] **Step 1: Write the failing test**

```typescript
// fsldk-web/src/app/core/utils/image-url.spec.ts
import { resolveImageUrl, resolveThumbnailUrl } from './image-url';
import { environment } from '../../../environments/environment';

describe('resolveImageUrl', () => {
  it('returns empty string for a falsy path', () => {
    expect(resolveImageUrl('')).toBe('');
  });

  it('passes through absolute http(s) URLs unchanged', () => {
    expect(resolveImageUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(resolveImageUrl('http://cdn.example.com/a.jpg')).toBe('http://cdn.example.com/a.jpg');
  });

  it('passes through data: URIs unchanged', () => {
    expect(resolveImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('prefixes a leading-slash path with the API base (no /api/v1, no /uploads/)', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveImageUrl('/legacy/photo.jpg')).toBe(`${base}/legacy/photo.jpg`);
  });

  it('prefixes a bare filename with the API base + /uploads/', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveImageUrl('abc123.jpg')).toBe(`${base}/uploads/abc123.jpg`);
  });
});

describe('resolveThumbnailUrl', () => {
  it('returns empty string for a falsy path', () => {
    expect(resolveThumbnailUrl('')).toBe('');
  });

  it('inserts _thumb before the extension of a resolved backend path', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveThumbnailUrl('abc123.jpg')).toBe(`${base}/uploads/abc123_thumb.jpg`);
  });

  it('inserts _thumb before the extension of an already-absolute URL', () => {
    expect(resolveThumbnailUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a_thumb.png');
  });

  it('falls back to the full resolved URL when there is no extension to split on', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveThumbnailUrl('no-extension-name')).toBe(`${base}/uploads/no-extension-name`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd fsldk-web && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `Cannot find module './image-url'` (the module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```typescript
// fsldk-web/src/app/core/utils/image-url.ts
import { environment } from '../../../environments/environment';

/** Resolusi imagePath yang disimpan backend (nama file relatif seperti
 *  "<token>.<ext>", atau path lama diawali "/") menjadi URL publik penuh.
 *  URL absolut (http/https/data:) dikembalikan apa adanya. Satu-satunya
 *  sumber logika ini — sebelumnya disalin manual di gallery.public-index,
 *  gallery.public-detail, gallery-lightbox, dan home.index. */
export function resolveImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = environment.apiBaseUrl.replace('/api/v1', '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/uploads/${path}`;
}

/** Varian thumbnail (lebih kecil, di-generate backend saat upload — lihat
 *  fsldk-api/pkg/upload/resize.go) untuk grid/card view, supaya tidak semua
 *  card meng-load gambar resolusi penuh sekaligus. Cukup sisip "_thumb"
 *  sebelum ekstensi — konvensi penamaan yang sama dipakai backend
 *  (thumbFileName di pkg/upload). Lightbox/detail penuh tetap pakai
 *  resolveImageUrl() — cuma satu foto ditampilkan sekaligus di sana. */
export function resolveThumbnailUrl(path: string): string {
  const full = resolveImageUrl(path);
  if (!full) return '';
  const dot = full.lastIndexOf('.');
  if (dot === -1) return full;
  return `${full.slice(0, dot)}_thumb${full.slice(dot)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd fsldk-web && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS — all `resolveImageUrl` / `resolveThumbnailUrl` specs green.

- [ ] **Step 5: Commit**

```bash
git add fsldk-web/src/app/core/utils/image-url.ts fsldk-web/src/app/core/utils/image-url.spec.ts
git commit -m "feat(web): add shared resolveImageUrl/resolveThumbnailUrl util"
```

---

### Task 2: Migrate `gallery.public-index.page.ts` to the shared util

**Files:**
- Modify: `fsldk-web/src/app/modules/gallery/pages/public-index/gallery.public-index.page.ts:8` (import), `:450-472` (methods)

**Interfaces:**
- Consumes: `resolveImageUrl`, `resolveThumbnailUrl` from Task 1 (`core/utils/image-url`).
- Produces: nothing new — `imgUrl`/`thumbUrl` keep their existing public names and `(path: string) => string` signature, so the template (`thumbUrl(item.coverImage)` at line 79) is untouched.

- [ ] **Step 1: Replace the environment import with the util import**

```typescript
// Before (line 8):
import { environment } from '../../../../../environments/environment';

// After:
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';
```

- [ ] **Step 2: Replace the two local methods with field references to the shared functions**

```typescript
// Before (lines 450-472):
  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }

  /** Varian thumbnail (lebih kecil, di-generate backend saat upload — lihat
   *  fsldk-api/pkg/upload) untuk cover galeri di grid, supaya tidak semua
   *  card meng-load gambar resolusi penuh sekaligus. Cukup sisip "_thumb"
   *  sebelum ekstensi — konvensi penamaan yang sama dipakai backend. */
  thumbUrl(path: string): string {
    const full = this.imgUrl(path);
    if (!full) return '';
    const dot = full.lastIndexOf('.');
    if (dot === -1) return full;
    return `${full.slice(0, dot)}_thumb${full.slice(dot)}`;
  }

// After:
  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
```

- [ ] **Step 3: Verify the build (template still binds correctly)**

Run: `cd fsldk-web && npm run build`
Expected: build succeeds with no TypeScript/template errors.

- [ ] **Step 4: Commit**

```bash
git add fsldk-web/src/app/modules/gallery/pages/public-index/gallery.public-index.page.ts
git commit -m "refactor(web): gallery public-index uses shared image-url util"
```

---

### Task 3: Migrate `gallery.public-detail.page.ts` to the shared util

**Files:**
- Modify: `fsldk-web/src/app/modules/gallery/pages/public-detail/gallery.public-detail.page.ts:9` (import), `:644-665` (methods)

**Interfaces:**
- Consumes: `resolveImageUrl`, `resolveThumbnailUrl` from Task 1.
- Produces: nothing new — same field-name preservation as Task 2, so `imgUrl(gallery.coverImage)` (line 35) and `thumbUrl(photo.imagePath)` (line 138) in the template need no changes.

- [ ] **Step 1: Replace the environment import with the util import**

```typescript
// Before (line 9):
import { environment } from '../../../../../environments/environment';

// After:
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';
```

- [ ] **Step 2: Replace the two local methods with field references**

```typescript
// Before (lines 644-665):
  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }

  /** Varian thumbnail untuk grid foto (lihat gallery.public-index.page.ts
   *  untuk penjelasan konvensi "_thumb"). Lightbox tetap pakai imgUrl() —
   *  cuma satu foto ditampilkan sekaligus di sana, jadi resolusi penuh aman. */
  thumbUrl(path: string): string {
    const full = this.imgUrl(path);
    if (!full) return '';
    const dot = full.lastIndexOf('.');
    if (dot === -1) return full;
    return `${full.slice(0, dot)}_thumb${full.slice(dot)}`;
  }

// After:
  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
```

- [ ] **Step 3: Verify the build**

Run: `cd fsldk-web && npm run build`
Expected: build succeeds with no TypeScript/template errors.

- [ ] **Step 4: Commit**

```bash
git add fsldk-web/src/app/modules/gallery/pages/public-detail/gallery.public-detail.page.ts
git commit -m "refactor(web): gallery public-detail uses shared image-url util"
```

---

### Task 4: Migrate `gallery-lightbox.component.ts` to the shared util

**Files:**
- Modify: `fsldk-web/src/app/modules/gallery/components/gallery-lightbox/gallery-lightbox.component.ts:14` (import), `:359-369` (method)

**Interfaces:**
- Consumes: `resolveImageUrl` from Task 1 (thumbnail variant is intentionally NOT used here — the lightbox always shows one full-resolution photo).
- Produces: nothing new — `imgUrl(photo.imagePath)` in the template (line 74) is untouched.

- [ ] **Step 1: Replace the environment import with the util import**

```typescript
// Before (line 14):
import { environment } from '../../../../../environments/environment';

// After:
import { resolveImageUrl } from '../../../../core/utils/image-url';
```

- [ ] **Step 2: Replace the local method with a field reference**

```typescript
// Before (lines 359-369):
  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }

// After:
  imgUrl = resolveImageUrl;
```

- [ ] **Step 3: Verify the build**

Run: `cd fsldk-web && npm run build`
Expected: build succeeds with no TypeScript/template errors.

- [ ] **Step 4: Commit**

```bash
git add fsldk-web/src/app/modules/gallery/components/gallery-lightbox/gallery-lightbox.component.ts
git commit -m "refactor(web): gallery lightbox uses shared image-url util"
```

---

### Task 5: Fix the homepage gallery grid — the actual bug

**Files:**
- Modify: `fsldk-web/src/app/modules/home/pages/index/home.index.page.ts:13` (import), `:2551-2559` (method)
- Modify: `fsldk-web/src/app/modules/home/pages/index/home.index.page.html:932`

**Interfaces:**
- Consumes: `resolveThumbnailUrl` from Task 1.
- Produces: nothing new — this is the leaf of the chain. `environment` becomes unused in this file after this change (its only other use was inside the method being replaced) and must be removed from the import list, or `ng build` will fail on the unused import.

- [ ] **Step 1: Replace the environment import with the util import**

```typescript
// Before (line 13):
import { environment } from '../../../../../environments/environment';

// After:
import { resolveThumbnailUrl } from '../../../../core/utils/image-url';
```

- [ ] **Step 2: Replace `galleryImgUrl` with a `galleryThumbUrl` field bound to the shared thumbnail resolver**

```typescript
// Before (lines 2551-2559):
  /** Sama seperti imgUrl() di gallery.public-index/detail.page.ts — path foto
   *  galeri disimpan relatif (butuh di-prefix apiBaseUrl), beda dari gambar
   *  modul lain di beranda ini yang sudah dikirim backend sebagai URL utuh. */
  galleryImgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    return path.startsWith('/') ? `${base}${path}` : `${base}/uploads/${path}`;
  }

// After:
  /** Grid galeri di beranda menampilkan banyak foto sekaligus (bukan satu
   *  seperti lightbox) — HARUS pakai varian thumbnail, bukan resolveImageUrl,
   *  supaya browser tidak decode banyak JPEG resolusi penuh sekaligus saat
   *  discroll. Sama seperti thumbUrl() di gallery.public-index/detail.page.ts. */
  galleryThumbUrl = resolveThumbnailUrl;
```

- [ ] **Step 3: Update the one template call site**

```html
<!-- Before (home.index.page.html:932): -->
<img [src]="galleryImgUrl(photo.imagePath)" [alt]="photo.caption || feature.gallery.eventTheme" loading="lazy">

<!-- After: -->
<img [src]="galleryThumbUrl(photo.imagePath)" [alt]="photo.caption || feature.gallery.eventTheme" loading="lazy">
```

- [ ] **Step 4: Verify the build**

Run: `cd fsldk-web && npm run build`
Expected: build succeeds with no TypeScript/template errors (this also confirms `environment` has no other stray usages left in the file).

- [ ] **Step 5: Commit**

```bash
git add fsldk-web/src/app/modules/home/pages/index/home.index.page.ts fsldk-web/src/app/modules/home/pages/index/home.index.page.html
git commit -m "fix(web): homepage gallery grid uses thumbnail images, not full-res"
```

---

### Task 6: Manual verification in the browser

**Files:** none (verification only)

**Interfaces:**
- Consumes: the running app at `http://localhost:4200` with `fsldk-api` running on `:8080`, and at least one gallery that has photos (needed for the `galleryFeature()` section on the homepage to render at all).

- [ ] **Step 1: Start both servers**

Run: `cd fsldk-api && go run .` (separate terminal), then `cd fsldk-web && npm start`

- [ ] **Step 2: Open the homepage and inspect the Network tab**

Open `http://localhost:4200`, scroll to "Dokumentasi Kegiatan Terbaru", open DevTools → Network → filter `img`. Expected: every request for a gallery grid photo now ends in `_thumb.<ext>` (e.g. `abc123_thumb.jpg`), not the bare filename.

- [ ] **Step 3: Confirm the lightbox still shows full resolution**

Click a photo in the grid to open the lightbox (`openGalleryZoom`). Expected: the lightbox's Network request is for the plain (non-`_thumb`) filename, and the image is visibly sharper/larger than the grid thumbnail.

- [ ] **Step 4: Confirm the scroll-lag is gone**

Scroll the gallery grid section up and down repeatedly. Expected: no visible stutter/jank compared to before the fix — this was the original reported symptom.

- [ ] **Step 5: Repeat Step 2-3 on `/tentang/galeri` and a gallery detail page**

Confirms Tasks 2-4's refactor didn't regress the two pages that were already working correctly.

- [ ] **Step 6: Commit (if any fixups were needed)**

```bash
git add -A
git commit -m "fix(web): address issues found during manual gallery thumbnail verification"
```
(Skip this commit entirely if Step 1-5 needed no changes.)
