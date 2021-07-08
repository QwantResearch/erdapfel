import { fire } from 'src/libs/customEvents';

export const geolocationPermissions = {
  PROMPT: 'prompt',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
};

export async function getGeolocationPermission() {
  // Some browsers (Safari, etc) do not implement Permissions API
  if (!window.navigator.permissions) {
    return geolocationPermissions.UNSUPPORTED;
  }

  // granted or denied
  const p = await window.navigator.permissions.query({ name: 'geolocation' });
  return p.state;
}

export function handleError(error) {
  if (error.code === 1) {
    // PERMISSION_DENIED
    fire('open_geolocate_denied_modal');
  } else {
    fire('open_geolocate_not_activated_modal');
  }
}

window.position = null;
window.positionWatchID = null;

// Centralize all the position requests in a single function,
// to avoid multiple calls to getCurrentPosition or watchPosition
// (these would cause multiple permission popups on Firefox).
// The native getCurrentPosition and watchPosition will be replaced by this one.
window.getPosition = (success, error) => {
  // The first time where the position is requested in the current session, launch watchPosition()
  // and save the position in a global variable
  if (!window.position) {
    window.positionWatchID = navigator.geolocation._watchPosition(position => {
      success(position);
      window.position = position;
    }, error);
    window.positionAsked = true;
  }

  // If the position is asked again in the same session, use the global variable
  else {
    if (window.position) {
      success(window.position);
    } else {
      error();
      return;
    }
  }
  return window.positionWatchID;
};

// This hack replaces the native functions from navigator.geolocation with the one above
// to prevent Mapbox from calling getPosition or watchPosition many times per session.
// clearWatch is replaced by a function that does nothing to keep the watchPosition active.
window.navigator.geolocation._getCurrentPosition = navigator.geolocation.getCurrentPosition;
window.navigator.geolocation._watchPosition = window.navigator.geolocation.watchPosition;
window.navigator.geolocation.getCurrentPosition = window.getPosition;
window.navigator.geolocation.watchPosition = window.getPosition;
window.navigator.geolocation.clearWatch = () => {};
