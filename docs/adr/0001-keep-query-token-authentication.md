---
status: superseded by ADR-0002
---

# Keep query-token authentication for client compatibility

Location Picker will keep its access token in the request query string because Loon, Shadowrocket, and Surge consume a fixed `configUrl` and cannot attach the required custom authentication header. This preserves client compatibility at the cost of exposing the token to browser history and any shared full URL, so the deployment uses a random token and treats complete URLs as secrets.
