import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import RoadMapStep from './RoadMapStep';
import { fire } from 'src/libs/customEvents';
import classnames from 'classnames';
import { FloatingButton } from '../../components/ui';

const MobileRoadMapPreview = ({
  steps,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const stepsRef = React.createRef();

  const scroll = () => {

    const newStep = Math.floor(
      // Determine which step is fully visible on screen
      stepsRef.current.scrollLeft / (window.innerWidth - 70 + 12)
    );

    // If it is different from the current step:
    if (currentStep !== newStep) {

      // Save it and highlight it as the current step
      setCurrentStep(newStep);

      // Stop scroll inertia (except when going to previous step, which happens at the start of the scroll)
      if ((currentStep - 1) !== newStep) {
        stepsRef.current.style.overflow = 'hidden';
        stepsRef.current.scrollLeft = stepsRef.current.scrollLeft;
        setTimeout(() => {
          // Ref is not available in setTimeout, use querySelector instead
          document.querySelector('.mobile-roadmap-preview-steps').style.overflow = 'auto';
        }, 100);
      }
    }
  };

  const toggleSize = () => {
    setExpanded(!expanded);
  };

  // When expanded is modified, move the map's bottom UI
  useEffect(
    () => {
      fire('move_mobile_bottom_ui', stepsRef.current.offsetHeight);
    },
    [expanded, stepsRef]
  );

  // When currentStep is modified, zoom on it
  useEffect(
    () => {
      fire('zoom_step', steps[currentStep]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep]
    // don't declare steps as dependency as it's dynamically recomputed on each render by DirectionPanel,
    // causing the ref to change even if the content is the same.
  );

  return <div className="itinerary_mobile_step_by_step">
    <FloatingButton
      onClick={onClose}
      icon="arrow-left"
    />
    <div
      ref={stepsRef}
      className={classnames('mobile-roadmap-preview-steps', { expanded })}
      onScroll={scroll}
      onClick={toggleSize}
    >
      {
        steps.map((step, index) =>
          <div
            key={index}
            className={
              classnames(
                'itinerary_mobile_step',
                {
                  past: index < currentStep,
                  active: index === currentStep,
                }
              )
            }>
            <RoadMapStep step={step}/>
          </div>)
      }
    </div>
  </div>;
};

MobileRoadMapPreview.propTypes = {
  steps: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MobileRoadMapPreview;
