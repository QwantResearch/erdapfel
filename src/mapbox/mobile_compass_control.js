export default class MobileCompassControl {
  constructor() {
    this._container = document.createElement('div');
    const compassClass = 'map_control_group__button__compass--mobile';
    this._compass = this._createButton(compassClass, 'Reset North', () => {
      this._resetNorthAndTilt();
    });

    const compassIndicatorClass = 'map_control__compass__icon map_control__compass__icon--mobile';
    this._compassIndicator = this._createIcon(compassIndicatorClass);
    this._compass.appendChild(this._compassIndicator);
  }

  onAdd(map) {
    this._map = map;
    this._container.className = 'map_control_group';
    this._container.textContent = '';
    this._container.appendChild(this._compass);
    const _pitchAndRotateCompassArrow = this._pitchAndRotateCompassArrow.bind(this);

    _pitchAndRotateCompassArrow();

    this._map.on('rotate', _pitchAndRotateCompassArrow);
    this._map.on('pitch', _pitchAndRotateCompassArrow);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  _geolocate() {
    window.getPosition(
      position => {
        this._map.flyTo({ center: [position.coords.longitude, position.coords.latitude] });
      },
      () => {},
      { maximumAge: 10000 }
    );
  }

  _createButton(className, ariaLabel, fn) {
    const a = document.createElement('button');
    a.setAttribute('class', className);
    a.setAttribute('aria-label', ariaLabel);
    a.addEventListener('click', fn);
    this._container.appendChild(a);
    return a;
  }

  _createIcon(className) {
    const a = document.createElement('span');
    a.setAttribute('class', className);
    return a;
  }

  _resetNorthAndTilt() {
    this._map.easeTo({ pitch: 0, bearing: 0 });
  }

  _pitchAndRotateCompassArrow() {
    if (this._map.getPitch() === 0 && this._map.transform.angle === 0) {
      this._compass.classList.add('compass-origin');
    } else {
      this._compass.classList.remove('compass-origin');
    }
    const scale = 1 - this._map.getPitch() / 110;
    const rotation = this._map.transform.angle * (180 / Math.PI);
    this._compassIndicator.style.transform = `scale(1, ${scale}) rotate(${rotation}deg)`;
  }
}
