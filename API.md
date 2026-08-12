# API Documentation

This document describes the structure and conventions for QCommunity-Web API services.

## Base URL

- **Development**: `http://localhost:8080` (proxied via `/api`)
- **Production**: Configured in environment variables

## Authentication

All authenticated endpoints require an `Authorization` header:

```
Authorization: ******
```

The token is automatically injected by the Axios interceptor in `src/utils/request.js`.

## HTTP Client Usage

```js
import { get, post } from '@/utils/request'
import request from '@/utils/request'

// GET
const data = await get('/endpoint')

// POST
const result = await post('/endpoint', { payload })

// Custom config
const response = await request.get('/endpoint', { params: { page: 1 } })
```

## Error Handling

| Status | Behaviour |
|--------|-----------|
| 401 | Token removed, redirect to `/login` |
| Other 4xx/5xx | `Promise.reject(error)` — handle in calling code |

## Existing Services

### `src/services/fallen.js`
Fetches Fallen Team member data.

### `src/services/rankings.js`
Fetches player rankings and leaderboard data.

### `src/services/registration.js`
Handles player registration flows.

## Adding a New Service

```js
// src/services/example.js
import { get, post } from '@/utils/request'

export async function getItems() {
    return get('/items')
}

export async function createItem(data) {
    return post('/items', data)
}
```
