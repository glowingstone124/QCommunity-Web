# qhub

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
# QHub-Web

## Authentication

`/login` is QHub's CAS client entry and callback. It redirects to the central `/cas` portal, validates one-time tickets with `clientId: qcommunity`, and refreshes saved sessions through QAPI. QHub has no direct password login.

The standalone `/cas` portal verifies QO credentials or QQ Auth (`method=qq`) and grants tickets through `/qo/auth/ticket/grant`. Its session uses the separate `qo.cas.token` storage key. Legacy `/login?service=...` portal links remain compatible. Callbacks must match the per-tab sign-in state; unsolicited or replayed callbacks are rejected. Set `VITE_CAS_PORTAL_URL` to override the central portal (default `https://qoriginal.vip/cas`).

The frontend pins `@quantumoriginal/login-sdk` to a specific Git commit. `npm install` fetches and builds that SDK automatically; no sibling checkout or prebuilt SDK output is required.

Authentication checks: `npm test`, `npm run build`, then `npm run test:auth`. The browser check uses the production bundle and mocked QAPI responses. macOS uses installed Chrome by default; set `PLAYWRIGHT_CHANNEL=chromium` to use a Playwright browser.
