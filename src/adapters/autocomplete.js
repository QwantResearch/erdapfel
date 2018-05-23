import Autocomplete from '../vendors/autocomplete'
let geocoderConfig = require("../../config/geocoder.yml")
import ajax from '../libs/ajax'
import Poi from '../mapbox/poi'
import IconManager from '../adapters/icon_manager'
import State from '../main'

import Store from '../adapters/store'
const store = new Store()

function SearchInput(tagSelector) {
  this.pois = []
  this.poi = null
  listen('submit_autocomplete', () => {
    let poi = this.pois[0]
    if(this.poi) {
      this.poi = poi
    }
    select(poi)
  })

  new Autocomplete({
    selector : tagSelector,
    minChars : 1,
    cachePrefix : false,
    delay : 100,
    width:'650px',
    onUpdate : (e, poi) => {
      this.poi = poi
    },
    source : (term, suggest) => {
      let center = window.map.center().toArray()
      let bbox = window.map.bbox().toArray()

      /* FIXME
        'center' and 'bbox' are currently not used by the geocoder.
         Still, they could be useful for telemetry purposes.
         Should the exact position be made fuzzy ?
      */
      const suggestPromise = ajax.query(geocoderConfig.url, {q: term, center : center, bbox : bbox})
      const suggestHistoryPromise = store.getPrefixes(term)
      Promise.all([suggestPromise, suggestHistoryPromise]).then((responses) => {
        this.pois = extractMapzenData(responses[0])
        let historySuggestData = responses[1]
        historySuggestData = historySuggestData.map((historySuggest) => {
          let poi = Poi.load(historySuggest)
          poi.fromHistory = true
          return poi
        })
        this.pois = this.pois.concat(historySuggestData)
        suggest(this.pois, term)
      })
    },
    renderItem : ({id, name, fromHistory, className, subClassName}, search) => {
      let icon = IconManager.get({className : className, subClassName : subClassName})
      return `
<div class="autocomplete_suggestion${fromHistory ? ' autocomplete_suggestion--history' : ''}" data-id="${id}" data-val="${name}">
  <div style="color:${icon ? icon.color : ''}" class="autocomplete-icon ${icon ? `icon icon-${icon.iconClass}` : 'icon-location'}"></div>
  ${name}
</div>
`
    },
    onSelect : (e, term, item) => {
      e.preventDefault()
      const itemId = item.getAttribute('data-id')
      let poi = this.pois.find(poi => poi.id === itemId)
      select(poi)
    }
  })
}

function select(poi) {
  if(poi) {
    if(poi.bbox) {
      poi.padding = {top: 10,bottom: 25,left: 15,right: 5}
      fire('fit_bounds', poi);
    } else {
      fire('fly_to', poi)
    }
    fire('map_mark_poi', poi)
    State.app.poiPanel.close()
  }
}

function extractMapzenData(response) {
  const listData = response.features.map((feature) => {
    let emojiPicto = ''
    let zoomLevel = 0

    const resultType = feature.properties.geocoding.type
    switch (resultType) {
      case 'venue':
        emojiPicto = '🚘'
        zoomLevel = 16
        break
      case 'street':
        emojiPicto = '🚘'
        zoomLevel = 15
        break
      case 'locality':
        emojiPicto = '🌆'
        zoomLevel = 12
        break
      case 'address':
        emojiPicto = '🏠'
        zoomLevel = 16
        break
      case 'localadmin':
      case 'neighbourhood':
      case 'macrocounty':
      case 'region':
      case 'macroregion':
        emojiPicto = '🌎'
        zoomLevel = 12
        break
      case 'country':
        emojiPicto = '🌎'
        zoomLevel = 6
        break
      default:
        emojiPicto = '〰'
        zoomLevel = 15
    }
    let poiClassText = ''
    let poiSubclassText = ''

    if(feature.properties.geocoding.properties && feature.properties.geocoding.properties.length > 0) {
      let poiClass = feature.properties.geocoding.properties.find((property) => {return property.key === 'poi_class'})

      if(poiClass) {
        poiClassText = poiClass.value
      }
      let poiSubclass = feature.properties.geocoding.properties.find((property) => {return property.key === 'poi_subclass'})
      if(poiSubclass) {
        poiSubclassText = poiSubclass.value
      }
    }
    let poi = new Poi({lat : feature.geometry.coordinates[1], lng : feature.geometry.coordinates[0]}, feature.properties.geocoding.id, feature.properties.geocoding.label, poiClassText, poiSubclassText)

    poi.value = feature.properties.geocoding.label
    poi.picto = emojiPicto
    poi.poi_type = resultType
    poi.zoom = zoomLevel
    poi.bbox = feature['bbox']
    return poi
  })

  return listData
}

export default SearchInput
