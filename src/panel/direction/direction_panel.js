import Panel from "../../libs/panel"
import directionTemplate from '../../views/direction/direction.dot'
import DirectionInput from "../../ui_components/direction_input"
import RoadMapPanel from './road_map_panel'
import DirectionApi from '../../adapters/direction_api'
import SearchInput from '../../ui_components/search_input'
import UrlPoi from "../../adapters/poi/url_poi";
import PanelManager from "../../proxies/panel_manager";


const startHandler = '#itinerary_input_start'
const destinationHandler = '#itinerary_input_end'

export default class DirectionPanel {
  constructor() {
    this.panel = new Panel(this, directionTemplate)
    this.isDirectionPanel = true
    this.vehicles = {DRIVING : 'driving', WALKING : 'walking', CYCLING : 'cycling'}
    this.active = false
    this.start = null
    this.end = null
    this.vehicle = this.vehicles.DRIVING
    this.roadMapPanel = new RoadMapPanel()
    PanelManager.register(this)

    let getParams = new URLSearchParams(window.location.search)

    if(getParams.get('origin') || getParams.get('destination') || getParams.get('route') === 'enabled') {
      this.restoreUrl(getParams).then(() => {
        this.open()
      })
    }
  }

  initDirection() {
    this.startInput = new DirectionInput(startHandler, (poi) => this.selectStart(poi), 'submit_direction_start')
    this.endInput = new DirectionInput(destinationHandler, (poi) => this.selectEnd(poi), 'submit_direction_end')
  }

  setVehicle(vehicle) {
    this.panel.removeClassName(0, `.itinerary_button_label_${this.vehicle}`, 'label_active')
    this.vehicle = vehicle
    this.panel.addClassName(0, `.itinerary_button_label_${vehicle}`, 'label_active')
  }

  invertStartEnd() {
    let startValue = this.startInput.getValue()
    let endValue = this.endInput.getValue()
    this.startInput.setValue(endValue)
    this.endInput.setValue(startValue)
    let tmp = this.start
    this.start = this.end
    this.end = tmp
    this.searchDirection()
  }

  selectStart(poi) {
    this.start = poi
    this.searchDirection()
  }

  selectEnd(poi) {
    this.end = poi
    this.searchDirection()
  }

  /* panel manager implementation */
  toggle() {
    if(this.active) {
      this.close()
    } else {
      this.open()
    }
  }

  cleanDirection() {
    if(this.startInput && this.endInput) {
      this.startInput.destroy()
      this.endInput.destroy()
    }
  }

  close() {
    SearchInput.unMinify()
    this.active = false
    this.panel.update()
    this.cleanDirection()
  }

  async open() {
    SearchInput.minify()
    this.active = true
    await this.panel.update()
    this.initDirection()
  }

  async searchDirection() {
    if(this.start && this.end) {

      let directionResponse = await DirectionApi.search(this.start, this.end, this.vehicle)

      let routes = directionResponse.routes
      routes.forEach((route, i) => {
        route.isActive = i === 0
        route.id = i
      })
      if(routes) {
        this.roadMapPanel.setRoad(routes, this.vehicle)
        fire('set_route', {routes : routes, vehicle : this.vehicle, start : this.start, end : this.end})
      }
    }
  }

  /* urlState interface implementation */

  async restoreUrl(getParams) {

    if(getParams.get('mode')) {
      let vehicleParam = getParams.get('mode')
      Object.keys(this.vehicles).forEach((vehicleKey) => {
        if(this.vehicles[vehicleKey] === vehicleParam) {
          this.vehicle = this.vehicles[vehicleKey]
        }
      })
    }

    if(getParams.get('origin')) {
      this.start = await  UrlPoi.fromUrl(getParams.get('origin'))
      document.querySelector(startHandler).value = this.start.name
    }
    if(getParams.get('destination')) {
      this.end = await UrlPoi.fromUrl(getParams.get('destination'))
      document.querySelector(destinationHandler).value = this.end.name
    }


    execOnMapLoaded(() => {
      this.searchDirection()
    })
  }
}
