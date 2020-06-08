/* global _ */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { fire } from 'src/libs/customEvents';

const getEventClientY = event => event.changedTouches
  ? event.changedTouches[0].clientY
  : event.clientY;

// Pixel threshold to consider vertical swipes
const SWIPE_THRESHOLD_PX = 50;
// Pixel threshold from the bottom or top of the viewport to span to min or max
const MIN_MAX_THRESHOLD_PX = 75;

function getTargetSize(previousSize, moveDuration, startHeight, endHeight, maxSize) {
  let size = previousSize;
  const heightDelta = startHeight - endHeight;
  if (Math.abs(heightDelta) < SWIPE_THRESHOLD_PX) {
    // ignore move
    return size;
  } else if (endHeight < MIN_MAX_THRESHOLD_PX) {
    size = 'minimized';
  } else if (endHeight > maxSize - MIN_MAX_THRESHOLD_PX) {
    size = 'maximized';
  } else if (heightDelta < 0) {
    // swipe towards the top
    size = previousSize === 'default' ? 'maximized' : 'default';
  } else {
    // swipe towards the bottom
    size = previousSize === 'default' ? 'minimized' : 'default';
  }

  return size;
}

export default class Panel extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.node,
    minimizedTitle: PropTypes.node,
    resizable: PropTypes.bool,
    initialSize: PropTypes.oneOf(['default', 'minimized', 'maximized']),
    marginTop: PropTypes.number,
    close: PropTypes.func,
    className: PropTypes.string,
    white: PropTypes.bool,
  }

  static defaultProps = {
    initialSize: 'default',
    marginTop: 50, // default top bar size
  }

  constructor(props) {
    super(props);
    this.moveCallback = e => this.move(e);
    this.panelContentRef = React.createRef();
    this.state = {
      holding: false,
      size: props.initialSize,
      currentHeight: null,
    };
  }

  componentDidMount() {
    this.updateMobileMapUI();
    this.defaultHeight = this.panelDOMElement.offsetHeight;
  }

  componentDidUpdate() {
    this.updateMobileMapUI();
  }

  componentWillUnmount() {
    this.updateMobileMapUI(0);
    document.removeEventListener('mousemove', this.moveCallback);
    document.removeEventListener('touchmove', this.moveCallback);
  }

  updateMobileMapUI = (height = this.panelDOMElement.offsetHeight) => {
    if (this.props.resizable) {
      window.execOnMapLoaded(() => {
        fire('move_mobile_bottom_ui', height);
      });

      if (height > this.defaultHeight) {
        // Transition to maximized
        fire('mobile_geolocation_button_visibility', false);
        fire('mobile_direction_button_visibility', false);
      } else if (this.state.size === 'minimized' || height < 40) {
        // Transition to minimized
        fire('mobile_geolocation_button_visibility', true);
        fire('mobile_direction_button_visibility', true);
      } else {
        // Transition to default
        fire('mobile_geolocation_button_visibility', true);
        fire('mobile_direction_button_visibility', false);
      }
    }
  }

  holdResizer = event => {
    event.stopPropagation();
    this.startHeight = this.panelDOMElement.offsetHeight;
    this.startClientY = getEventClientY(event.nativeEvent);
    this.interactionStarted = event.timeStamp;

    if (event.type === 'touchstart') {
      document.addEventListener('touchmove', this.moveCallback);
    } else {
      document.addEventListener('mousemove', this.moveCallback);
    }

    this.setState(previousState => ({
      currentHeight: this.startHeight,
      previousSize: previousState.size,
      holding: true,
    }));
  }

  /**
  * Triggered on mouse move on the panel resizer
  * @param {MouseEvent|TouchEvent} e event
  */
  move = event => {
    event.stopPropagation();
    const clientY = getEventClientY(event);
    const currentHeight = this.startHeight + (this.startClientY - clientY);

    if (this.state.size === 'maximized' && this.panelContentRef.current.scrollTop > 0) {
      /* User is scrolling inside the panel content,
         update startClientY to ignore current swipe gesture */
      this.startClientY = clientY;
      return;
    }

    if (this.state.size === 'maximized' &&
        this.panelContentRef.current.scrollTop === 0 &&
        currentHeight >= this.state.currentHeight) {
      // User is starting to scroll content area from bottom to top, do nothing
      return;
    }

    this.setState({
      currentHeight,
      size: 'default',
    });
  }

  /**
   * Triggered on mouse up of the panel resizer
   * @param {MouseEvent|TouchEvent} event
   */
  stopResize = _ => {
    event.stopPropagation();

    if (event.type === 'touchend') {
      document.removeEventListener('touchmove', this.moveCallback);
    } else {
      document.removeEventListener('mousemove', this.moveCallback);
    }

    if (this.state.size === 'maximized' && this.panelContentRef.current.scrollTop > 0) {
      // User is scrolling inside the panel content
      return;
    }

    const newSize = getTargetSize(
      this.state.previousSize,
      event.timeStamp - this.interactionStarted,
      this.startHeight,
      this.state.currentHeight,
      window.innerHeight - this.props.marginTop,
    );

    this.setState({
      holding: false,
      size: newSize,
      currentHeight: null,
    });
  }

  handleHeaderClick() {
    const size = this.state.size === 'default' ? 'minimized' : 'default';
    this.setState({
      size,
      currentHeight: null,
    });
  }

  render() {
    const { children, title, minimizedTitle, resizable, close, className, white } = this.props;
    const { size, currentHeight, holding } = this.state;
    const resizeHandlers = resizable ? {
      onMouseDown: this.holdResizer,
      onTouchStart: this.holdResizer,
      onMouseUp: this.stopResize,
      onTouchEnd: this.stopResize,
    } : {};

    return <div
      className={classnames('panel', size, className, {
        'panel--white': white,
        'panel--holding': holding,
      })}
      style={{ height: currentHeight && `${currentHeight}px` }}
      ref={panel => this.panelDOMElement = panel}
      onTransitionEnd={() => this.updateMobileMapUI()}
      {...resizeHandlers}
    >
      {close && <div className="panel-close" title={_('Close')} onClick={close} >
        <i className="icon-x" />
      </div>}
      <div
        className={classnames('panel-header', { 'panel-resizeHandle': resizable })}
        ref={element => this.handleElement = element}
        onClick={() => this.handleHeaderClick()}
      >
        {resizable && size === 'minimized' && minimizedTitle ? minimizedTitle : title}
      </div>
      <div className="panel-content"
        ref={this.panelContentRef}
        style={({ overflow: size === 'maximized' ? 'auto' : 'hidden' })}
      >
        {children}
      </div>
    </div>;
  }
}
