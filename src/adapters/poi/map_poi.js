import Poi from "./poi";

export default class MapPoi extends Poi {
  constructor(feature, lngLat) {
    let id = feature.properties.global_id
    super(id,  feature.name, 'poi', lngLat)
  }
}
