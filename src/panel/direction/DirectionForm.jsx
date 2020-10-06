/* global _ */
import React from 'react';
import PropTypes from 'prop-types';
import DirectionInput from './DirectionInput';
import VehicleSelector from './VehicleSelector';
import { isMobileDevice } from 'src/libs/device';

export default class DirectionForm extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool,
    origin: PropTypes.object,
    destination: PropTypes.object,
    onChangeDirectionPoint: PropTypes.func.isRequired,
    onReversePoints: PropTypes.func.isRequired,
    vehicles: PropTypes.array.isRequired,
    onSelectVehicle: PropTypes.func.isRequired,
    activeVehicle: PropTypes.string.isRequired,
    isInitializing: PropTypes.bool,
    originInputText: PropTypes.string,
    destinationInputText: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.originRef = React.createRef();
    this.destinationRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (isMobileDevice() || this.props.isInitializing) {
      return;
    }

    const { origin, destination } = this.props;

    if (!origin && !destination && prevProps.isInitializing) {
      // If both text fields are empty, focus on origin
      this.focus(this.originRef.current);
    } else if (!origin && destination) {
      // a destination is set, origin is empty, so let's focus on origin
      this.focus(this.originRef.current);
    } else if (origin && !destination) {
      // an origin is set, destination is empty, so let's focus on destination
      this.focus(this.destinationRef.current);
    }
  }

  focus(node) {
    setTimeout(() => { node.focus(); }, 0);
  }

  onChangePoint = (which, value, point) => {
    this.props.onChangeDirectionPoint(which, value, point);
  }

  onReverse = () => {
    this.props.onReversePoints();
  }

  render() {
    const {
      isLoading,
      vehicles,
      activeVehicle,
      onSelectVehicle,
      originInputText,
      destinationInputText,
    } = this.props;

    return <div className="direction-form">
      <form className="direction-fields" noValidate>
        <DirectionInput
          isLoading={isLoading}
          value={originInputText}
          pointType="origin"
          onChangePoint={(input, point) => this.onChangePoint('origin', input, point)}
          ref={this.originRef}
        />
        <div className="direction-form-separator" />
        <DirectionInput
          isLoading={isLoading}
          value={destinationInputText}
          pointType="destination"
          onChangePoint={(input, point) => this.onChangePoint('destination', input, point)}
          ref={this.destinationRef}
        />
        <button
          type="button"
          className="direction-invert-origin-destination"
          onClick={this.onReverse}
          title={_('Invert start and end', 'direction')}>
          <i className="icon-reverse" />
        </button>
      </form>
      <VehicleSelector
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        onSelectVehicle={onSelectVehicle}
      />
    </div>
    ;
  }
}
