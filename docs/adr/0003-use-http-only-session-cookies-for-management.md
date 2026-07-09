---
status: accepted
---

# Use HttpOnly session cookies for management

Location Picker will authenticate browser management through a built-in login dialog and a `/login` endpoint that validates the long-lived `TOKEN` once, then sets a short-lived `HttpOnly; Secure; SameSite=Strict` session cookie. This keeps the token out of URLs, browser history, `localStorage`, and `sessionStorage`, while allowing the browser to stay logged in until the cookie expires.

The session cookie expires after 7 days. `SESSION_SECRET` signs the cookie when configured; otherwise the Worker falls back to `TOKEN` as the signing secret. Rotating `SESSION_SECRET` invalidates existing browser sessions without changing the login token.

The client-facing `/pub.json` endpoint remains public because proxy clients consume a fixed `configUrl` and cannot reliably send browser cookies or custom authentication headers. Anyone with the Worker URL can read the selected target location, but only a valid browser session can change it.
