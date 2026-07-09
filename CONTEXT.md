# Location Selection

This context defines the language for choosing and publishing the location that the iOS location-spoofing clients consume.

## Language

**Location Picker**:
A personal web interface for selecting and saving a target location for compatible iOS proxy clients.
_Avoid_: Map site, control panel

**Target Location**:
The WGS-84 coordinates and associated altitude and accuracy values that clients use in place of the device's real location.
_Avoid_: Current location, real location

**Access Token**:
A private shared secret entered into the Location Picker login prompt to create a browser management session.
_Avoid_: Password, API key

**Management Session**:
A short-lived browser session represented by an `HttpOnly` cookie. It authorizes management endpoints without exposing the access token to front-end JavaScript.
_Avoid_: Token cache, saved password
