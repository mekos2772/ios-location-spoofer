---
status: accepted
---

# Split public config from token-protected management

Location Picker will expose the current target location through a public `pub.json` endpoint for proxy clients, while reserving authenticated browser-based management for reading and changing the target location. This removes access tokens from browser history and client config URLs, accepting that the selected target location is public to anyone who knows the Worker URL.

Management authentication is refined in ADR-0003.
