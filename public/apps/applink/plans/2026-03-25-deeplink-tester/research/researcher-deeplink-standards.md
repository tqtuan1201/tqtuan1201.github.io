# Deep Link Standards & Best Practices Research

**Date:** 2026-03-25
**Topic:** iOS/Android deep link types, testing approaches, configurable tester tools

## Deep Link Types

### 1. Custom URL Schemes (CFBundleURLSchemes)
- Format: `myapp://path?param1=value1`
- Defined in `Info.plist` → `CFBundleURLTypes` → `CFBundleURLSchemes`
- **Pros:** Simple setup, works offline, no server needed
- **Cons:** No uniqueness guarantee, no fallback, security concerns
- **Use cases:** Internal app-to-app comms, OAuth callbacks, dev testing

### 2. Universal Links (iOS)
- Format: `https://domain.com/path`
- Requires `apple-app-site-association` (AASA) file on server
- AASA served at `/.well-known/apple-app-site-association`
- App must enable Associated Domains capability: `applinks:domain.com`
- **Pros:** Secure (domain verified), seamless fallback to web, no prompt dialog
- **Cons:** Requires HTTPS, server-side config, more complex setup

### 3. Android App Links
- Format: `https://domain.com/path`
- Requires `assetlinks.json` at `/.well-known/assetlinks.json`
- Intent filters in `AndroidManifest.xml` with `android:autoVerify="true"`
- **Pros:** No disambiguation dialog, verified, HTTPS-based
- **Cons:** Server-side config needed

## Web-Based Testing Patterns

### Common Features in Existing Tools
1. **Configurable scheme** – user enters custom URL scheme (e.g. `myapp://`)
2. **Path input** – specify deep link path
3. **Query params builder** – key-value pair editor or JSON input
4. **Generated URL preview** – real-time display of composed deep link
5. **Open/launch button** – triggers `window.location.href` with deep link
6. **Platform detection** – auto-detect iOS/Android/Desktop
7. **Fallback URLs** – App Store / Play Store fallback if app not installed
8. **History/presets** – save frequently used configurations

### Fallback Strategy (Best Practice)
1. Try `window.location.href = deeplink`
2. Listen for `blur` event (app opened successfully)
3. After timeout (~2s), redirect to App Store / Play Store / web fallback
4. For Universal Links: the HTTPS URL itself IS the fallback

## Key Configurable Parameters for Testing

| Parameter | Description | Example |
|-----------|-------------|---------|
| URL Scheme | CFBundleURLSchemes value | `myapp`, `12bay`, `comgooglemaps` |
| Host | Optional host for the scheme | `open`, `navigate` |
| Path | Deep link path | `/product/detail`, `/home` |
| Query Params | Key-value pairs | `id=123&ref=test` |
| iOS Fallback URL | Where to redirect if app not on iOS | App Store URL |
| Android Fallback URL | Where to redirect if app not on Android | Play Store URL |
| Universal Link Domain | Domain for Universal Links test | `example.com` |

## Sources
- Apple Developer: Defining Custom URL Schemes
- Apple Developer: Supporting Universal Links
- Android Developer: Verify Android App Links
- Adjust, Branch.io: Deep link testing best practices
