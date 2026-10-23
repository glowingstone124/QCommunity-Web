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

`/login` remains the QO credential portal and grants CAS tickets to relying services. `/cas` is QCommunity's CAS client callback; it validates tickets with `clientId: qcommunity` and refreshes saved sessions through QAPI.

The frontend pins `@quantumoriginal/login-sdk` to a specific Git commit. `npm install` fetches and builds that SDK automatically; no sibling checkout or prebuilt SDK output is required.
