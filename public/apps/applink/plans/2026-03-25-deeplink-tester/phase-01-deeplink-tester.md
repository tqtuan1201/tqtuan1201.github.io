# Phase 01: Redesign & Implement Configurable Deep Link Tester

**Parent Plan:** [plan.md](./plan.md)  
**Date:** 2026-03-25  
**Priority:** High  
**Implementation Status:** `[ ]` Not Started  
**Review Status:** `[ ]` Pending  

## Overview

Replace the existing single-file `index.html` with a modern, premium deep link testing tool. The new tool allows users to configure all deep link parameters dynamically, supports both Custom URL Scheme and Universal Link modes, and provides real-time link preview with platform-aware launch.

## Key Insights

1. Current page hardcodes `12bay://` scheme — no reusability
2. Params input is raw JSON — error-prone for non-devs
3. No Universal Link support
4. No preset/history feature for quick switching between apps
5. Fallback URLs are hardcoded — should be configurable

## Requirements

### Functional
- [x] Configurable URL Scheme (CFBundleURLSchemes) — text input
- [x] Configurable host (optional)
- [x] Configurable path
- [x] Dynamic key-value query params builder (add/remove pairs)
- [x] Real-time deep link URL preview
- [x] "Open App" button that launches the deep link
- [x] Platform detection (iOS/Android/Desktop)
- [x] Configurable iOS fallback URL (App Store)
- [x] Configurable Android fallback URL (Play Store)
- [x] Fallback timeout (configurable, default 2s)
- [x] App Presets — dropdown to quickly load saved configs
- [x] Save/Load custom presets to localStorage
- [x] Universal Link mode toggle (use HTTPS domain instead of custom scheme)
- [x] Copy deep link to clipboard button
- [x] QR code generation for the deep link

### Non-Functional
- Single `index.html` file (no build tools, hosted on GitHub Pages)
- Premium, modern UI (dark mode, glassmorphism, animations)
- Mobile responsive
- No external dependencies except QR library (CDN)

## Architecture

### Single-File HTML App

```
index.html
├── <style> — CSS (dark theme, glassmorphism, responsive)
├── <body> — HTML structure
│   ├── Header
│   ├── Mode Toggle (Custom Scheme / Universal Link)
│   ├── App Presets Section (dropdown + save/delete)
│   ├── Configuration Form
│   │   ├── URL Scheme / Domain input
│   │   ├── Host input (optional)
│   │   ├── Path input
│   │   ├── Query Params Builder (dynamic key-value rows)
│   │   ├── iOS Fallback URL
│   │   ├── Android Fallback URL
│   │   └── Fallback Timeout
│   ├── Generated Deep Link Preview
│   ├── Action Buttons (Open App / Copy / QR)
│   └── QR Code Display
└── <script> — JavaScript logic
    ├── buildDeepLink() — compose URL from form inputs
    ├── handleOpenApp() — platform-detect + launch + fallback
    ├── addParam() / removeParam() — dynamic param rows
    ├── savePreset() / loadPreset() / deletePreset() — localStorage
    ├── copyToClipboard()
    ├── generateQR() — using qrcode.js CDN
    └── toggleMode() — switch Custom Scheme ↔ Universal Link
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY (full rewrite) | Replace hardcoded tester with configurable version |

## Implementation Steps

### Step 1: Design CSS Foundation
- Dark theme with glassmorphism card
- CSS custom properties for theming
- Responsive layout (mobile-first)
- Smooth transitions and micro-animations
- Google Font (Inter)

### Step 2: Build HTML Structure
- Mode toggle (Custom Scheme / Universal Link)
- Preset selector dropdown with save/delete buttons
- Form inputs: scheme, host, path
- Dynamic query params section with add/remove buttons
- Fallback URL inputs (iOS & Android)
- Timeout slider
- Live preview section
- Action buttons row
- QR code container

### Step 3: Implement JavaScript Logic
- `buildDeepLink()` — real-time URL composition
  - Custom Scheme mode: `scheme://host/path?key=val`
  - Universal Link mode: `https://domain/path?key=val`
- `handleOpenApp()` — platform detection + launch
  - iOS: try deep link → blur listener → fallback after timeout
  - Android: try deep link → fallback
  - Desktop: show link only (no launch)
- Dynamic params management (add/remove key-value rows)
- Preset management (localStorage CRUD)
- Clipboard copy with visual feedback
- QR code generation using `qrcode.js` from CDN

### Step 4: Add Default Presets
- Include 2-3 example presets (e.g., `12bay`, `comgooglemaps`)
- First-load initialization in localStorage

## Todo List

- [ ] Rewrite `index.html` with new design and all features
- [ ] Test on mobile Safari (iOS)
- [ ] Test on Chrome (Android)
- [ ] Test on Desktop browser
- [ ] Verify localStorage preset save/load/delete
- [ ] Verify QR code generation
- [ ] Verify clipboard copy

## Success Criteria

1. User can change URL scheme and all parameters without editing code
2. Deep link preview updates in real-time
3. "Open App" button correctly launches deep link on iOS/Android
4. Presets can be saved/loaded/deleted
5. QR code generates correctly for any deep link
6. UI looks premium (dark mode, glassmorphism, responsive)
7. Works on GitHub Pages (single static file)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| QR CDN unavailable | Low | Low | Fallback: hide QR section |
| Custom scheme blocked by browser | Medium | Medium | Show manual copy instructions |
| localStorage not available | Low | Low | Graceful degradation, presets still work per session |

## Security Considerations

- Sanitize all user inputs before composing URLs
- Use `encodeURIComponent` for query params
- Warn user about untrusted schemes

## Verification Plan

### Browser Testing
1. Open the page in browser via file or local server
2. Verify dark theme renders correctly
3. Test Custom Scheme mode: enter scheme → path → params → verify preview
4. Test Universal Link mode: enter domain → path → verify preview
5. Test preset save/load/delete
6. Test Copy button → verify clipboard content
7. Test QR code generation → scan with phone
8. Test "Open App" on iOS Safari → verify deep link launch + fallback
9. Test "Open App" on Android Chrome → verify deep link launch + fallback
10. Test responsive layout (resize browser / mobile view)
