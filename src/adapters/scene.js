import { Map, Marker, LngLat, setRTLTextPlugin, LngLatBounds } from 'mapbox-gl--ENV';
import PoiPopup from './poi_popup';
import MobileCompassControl from '../mapbox/mobile_compass_control';
import ExtendedControl from '../mapbox/extended_nav_control';
<<<<<<< HEAD
import UrlState from '../proxies/url_state';
import { map, layout } from '../../config/constants.yml';
=======
import {map, layout} from '../../config/constants.yml';
>>>>>>> Implement map hash system without url shards
import nconf from '@qwant/nconf-getter';
import MapPoi from './poi/map_poi';
import HotLoadPoi from './poi/hotload_poi';
import LocalStore from '../libs/local_store';
import getStyle from './scene_config';
import SceneDirection from './scene_direction';
import SceneCategory from './scene_category';
import Error from '../adapters/error';
import { createIcon } from '../adapters/icon_manager';
import SceneEasterEgg from './scene_easter_egg';

const performanceEnabled = nconf.get().performance.enabled;
const baseUrl = nconf.get().system.baseUrl;
const easterEggsEnabled = nconf.get().app.easterEggs;

const store = new LocalStore();

function Scene() {
  this.currentMarker = null;
  this.popup = new PoiPopup();
  this.zoom = map.zoom;
  this.center = [map.center.lng, map.center.lat];
  this.savedLocation = null;
}

Scene.prototype.initScene = async function() {
  await this.setupInitialPosition();
  this.initMapBox();
};

Scene.prototype.setupInitialPosition = async function() {
  if (window.hotLoadPoi) {
    const hotloadedPoi = new HotLoadPoi();
    this.zoom = hotloadedPoi.zoom;
    this.center = [hotloadedPoi.getLngLat().lng, hotloadedPoi.getLngLat().lat];
  } else {
    const lastLocation = await store.getLastLocation();
    if (lastLocation) {
      this.center = [lastLocation.lng, lastLocation.lat];
      this.zoom = lastLocation.zoom;
    }
  }
};

Scene.prototype.initMapBox = function() {
  this.mb = new Map({
    attributionControl: false,
    container: 'scene_container',
    style: getStyle(),
    zoom: this.zoom,
    center: this.center,
    hash: false,
  });

  this.popup.init(this.mb);

  setRTLTextPlugin(`${baseUrl}statics/build/javascript/map_plugins/mapbox-gl-rtl-text.js`);

  window.map = {
    center: () => {
      return this.mb.getCenter();
    },
    bbox: () => {
      return this.mb.getBounds();
    },
    mb: this.mb,
  };

  const interactiveLayers = ['poi-level-1', 'poi-level-2', 'poi-level-3'];

  this.mb.on('load', () => {
    this.onHashChange();
    new SceneDirection(this.mb);
    new SceneCategory(this.mb);
    if (performanceEnabled) {
      window.times.mapLoaded = Date.now();
    }

    const extendedControl = new ExtendedControl();
    const mobileCompassControl = new MobileCompassControl();

    this.mb.addControl(extendedControl, 'bottom-right');
    this.mb.addControl(mobileCompassControl, 'top-right');

    interactiveLayers.forEach(interactiveLayer => {
      this.mb.on('mouseenter', interactiveLayer, () => {
        this.mb.getCanvas().style.cursor = 'pointer';
      });

      this.mb.on('mouseleave', interactiveLayer, () => {
        this.mb.getCanvas().style.cursor = '';
      });

      this.mb.on('click', interactiveLayer, async e => {
        e._interactiveClick = true;
        if (e.features && e.features.length > 0) {
          const mapPoi = new MapPoi(e.features[0]);
          window.app.loadPoi(mapPoi);
        }
      });

      this.popup.addListener(interactiveLayer);
    });

    this.mb.on('moveend', () => {
      const { lng, lat } = this.mb.getCenter();
      const zoom = this.mb.getZoom();
      store.setLastLocation({ lng, lat, zoom });
      window.app.updateHash(this.getLocationHash());
      fire('map_moveend');
    });

    const url_active = `${baseUrl}statics/images/direction_icons/walking_bullet_active.png`;
    this.mb.loadImage(url_active, (error, image) => {
      if (error) {
        Error.sendOnce('scene', 'initMapBox', `Failed to load image at ${url_active}`, error);
        return;
      }
      this.mb.addImage('walking_bullet_active', image);
    });

    const url_inactive = `${baseUrl}statics/images/direction_icons/walking_bullet_inactive.png`;
    this.mb.loadImage(url_inactive, (error, image) => {
      if (error) {
        Error.sendOnce('scene', 'initMapBox', `Failed to load image at ${url_inactive}`, error);
        return;
      }
      this.mb.addImage('walking_bullet_inactive', image);
    });

    this.mb.on('click', e => {
      if (!e._interactiveClick) {
        window.app.emptyClickOnMap();
      }
    });

    /* Easter egg for beta */
    if (easterEggsEnabled) {
      SceneEasterEgg.enableEggs(this.mb);
    }

    window.execOnMapLoaded = f => f();
    fire('map_loaded');
  });

  listen('fit_map', (item, padding) => {
    this.fitMap(item, padding);
  });

  listen('map_reset', () => {
    this.mb.jumpTo({ center: [map.center.lng, map.center.lat], zoom: map.zoom });
  });

  listen('map_mark_poi', poi => {
    this.addMarker(poi);
  });

  listen('clean_marker', () => {
    this.cleanMarker();
  });

  listen('save_location', () => {
    this.saveLocation();
  });

  listen('restore_location', () => {
    this.restoreLocation();
  });
};

Scene.prototype.saveLocation = function() {
  this.savedLocation = this.getLocationHash();
};

Scene.prototype.restoreLocation = function() {
  if (this.savedLocation) {
    this.restore(this.savedLocation);
    const flyOptions = {
      center: this.urlCenter,
      zoom: this.urlZoom,
      animate: true,
      screenSpeed: 2,
    };
    this.mb.flyTo(flyOptions);
  }
};

Scene.prototype.isPointInBounds = function(point, bounds) {
  const lng = (point.lng - bounds._ne.lng) * (point.lng - bounds._sw.lng) < 0;
  const lat = (point.lat - bounds._ne.lat) * (point.lat - bounds._sw.lat) < 0;
  return lng && lat;
};

Scene.prototype.isBBoxInExtendedViewport = function(bbox) {

  // Get viewport bounds
  const viewport = this.mb.getBounds();

  // Compute "width", "height"
  const width = viewport._ne.lng - viewport._sw.lng;
  const height = viewport._ne.lat - viewport._sw.lat;

  // Compute extended viewport
  viewport._ne.lng += width;
  viewport._ne.lat += height;

  viewport._sw.lng -= width;
  viewport._sw.lat -= height;

  // Check bounds:

  // Lng between -180 and 180 (wraps: 180 + 1 = -179)
  if (viewport._ne.lng < -180) {
    viewport._ne.lng += 360;
  } else if (viewport._ne.lng > 180) {
    viewport._ne.lng -= 360;
  }

  if (viewport._sw.lng < -180) {
    viewport._sw.lng += 360;
  } else if (viewport._sw.lng > 180) {
    viewport._sw.lng -= 360;
  }

  // Lat between -85 and 85 (does not wrap)
  if (viewport._ne.lat < -85) {
    viewport._ne.lat = -85;
  } else if (viewport._ne.lat > 85) {
    viewport._ne.lat = 85;
  }

  if (viewport._sw.lat < -85) {
    viewport._sw.lat = -85;
  } else if (viewport._sw.lat > 85) {
    viewport._sw.lat = 85;
  }


  // Check if one corner of the BBox is in the extended viewport:

  if (
    this.isPointInBounds(bbox._ne, viewport) // ne
      || this.isPointInBounds({ lng: bbox._sw.lng, lat: bbox._ne.lat }, viewport) // nw
      || this.isPointInBounds({ lng: bbox._ne.lng, lat: bbox._sw.lat }, viewport) // se
      || this.isPointInBounds(bbox._sw, viewport) // sw
  ) {
    return true;
  }

  return false;
};

Scene.prototype.fitBbox = function(bbox, padding = { left: 0, top: 0, right: 0, bottom: 0 }) {
  // normalise bbox
  if (bbox instanceof Array) {
    bbox = new LngLatBounds(bbox);
  }

  // Animate if the zoom is big enough and if the BBox is (partially or fully) in
  // the extended viewport.
  const animate = this.mb.getZoom() > 10 && this.isBBoxInExtendedViewport(bbox);
  this.mb.fitBounds(bbox, { padding, animate });
};


Scene.prototype.fitMap = function(item, padding) {
  // BBox
  if (item._ne && item._sw) {
    this.fitBbox(item, padding);
  } else { // PoI
    if (item.bbox) { // poi Bbox
      this.fitBbox(item.bbox, padding);
    } else { // poi center
      const flyOptions = { center: item.getLngLat(), screenSpeed: 1.5, animate: false };
      if (item.zoom) {
        flyOptions.zoom = item.zoom;
      }

      if (padding) {
        flyOptions.offset = [
          (padding.left - padding.right) / 2,
          (padding.top - padding.bottom) / 2,
        ];
      }

      if (this.mb.getZoom() > 10 && this.isWindowedPoi(item)) {
        flyOptions.animate = true;
      }
      this.mb.flyTo(flyOptions);
    }
  }
};

Scene.prototype.ensureMarkerIsVisible = function(poi) {
  const { x: leftPixelOffset } = this.mb.project(poi.getLngLat());
  const isPoiUnderPanel = leftPixelOffset < layout.sizes.sideBarWidth + layout.sizes.panelWidth
    && window.innerWidth > layout.mobile.breakPoint;
  if (this.isWindowedPoi(poi) && !isPoiUnderPanel) {
    return;
  }
  this.mb.flyTo({
    center: poi.getLngLat(),
    offset: [(layout.sizes.panelWidth + layout.sizes.sideBarWidth) / 2, 0],
    maxDuration: 1200,
  });
};

Scene.prototype.addMarker = function(poi) {
  this.ensureMarkerIsVisible(poi);
  const { className, subClassName, type } = poi;

  const element = createIcon({ className, subClassName, type });
  element.onclick = function(e) {
    // click event should not be propagated to the map itself;
    e.stopPropagation();
  };

  if (this.currentMarker !== null) {
    this.currentMarker.remove();
  }

  const marker = new Marker({ element, anchor: 'bottom', offset: [0, -5] })
    .setLngLat(poi.getLngLat())
    .addTo(this.mb);
  this.currentMarker = marker;
  return marker;
};

Scene.prototype.cleanMarker = async function() {
  if (this.currentMarker !== null) {
    this.currentMarker.remove();
  }
};

Scene.prototype.isWindowedPoi = function(poi) {
  const windowBounds = this.mb.getBounds();
  /* simple way to clone value */
  const originalWindowBounds = windowBounds.toArray();
  const poiCenter = new LngLat(poi.getLngLat().lng, poi.getLngLat().lat);
  windowBounds.extend(poiCenter);
  return compareBoundsArray(windowBounds.toArray(), originalWindowBounds);
};

Scene.prototype.getLocationHash = function() {
  const { lat, lng } = this.mb.getCenter();
  return `map=${this.mb.getZoom().toFixed(2)}/${lat.toFixed(7)}/${lng.toFixed(7)}`;
};

Scene.prototype.restoreFromHash = function(hash, options = {}) {
  const zoomLatLng = hash
    .replace(/^#/, '')
    .replace(/^map=/, '')
    .split('/')
    .map(value => parseFloat(value));
  if (!zoomLatLng || zoomLatLng.length < 3) {
    return;
  }
  const [ zoom, lat, lng ] = zoomLatLng;
  this.mb.jumpTo({ zoom, center: [ lng, lat ], ...options });
};

Scene.prototype.onHashChange = function() {
  window.onhashchange = () => {
<<<<<<< HEAD
    const mapShardValue = UrlState.getShardValue('map');
    if (mapShardValue) {
      this.restore(mapShardValue);
      this.mb.jumpTo({ center: this.urlCenter, zoom: this.urlZoom });
    }
=======
    this.restoreFromHash(window.location.hash);
>>>>>>> Implement map hash system without url shards
  };
};

/* private */

function compareBoundsArray(boundsA, boundsB) {
  return boundsA[0][0] === boundsB[0][0] && boundsA[0][1] === boundsB[0][1] &&
         boundsA[1][0] === boundsB[1][0] && boundsA[1][1] === boundsB[1][1];
}

export default Scene;
