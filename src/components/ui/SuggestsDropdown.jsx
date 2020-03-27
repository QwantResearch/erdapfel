import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { object, func, string, arrayOf } from 'prop-types';

import SuggestItem from './SuggestItem';

const SuggestsDropdown = ({
  className = '',
  suggestItems,
  onSelect,
  onHighlight,
  inputId,
}) => {
  const [highlighted, setHighlighted] = useState(null);
  const [style, setStyle] = useState({});
  const dropDownRef = useRef(null);
  const liRef = useRef(null);

  useEffect(() => {
    const keyDownHandler = ({ key }) => {
      if (document.activeElement.getAttribute('id') !== inputId) {
        document.removeEventListener('keydown', keyDownHandler);
        return;
      }

      if (key === 'ArrowDown') {
        let h = highlighted === null ? - 1 : highlighted;

        if (h < suggestItems.length - 1) {
          // Jump labels
          if (!suggestItems[h + 1].id) {
            h++;
          }

          setHighlighted(h + 1);
          onHighlight(suggestItems[h + 1]);
        } else {
          setHighlighted(null);
          onHighlight(null);
        }
      }

      if (key === 'ArrowUp') {
        let h = highlighted === null ? suggestItems.length : highlighted;

        if (h > 0) {
          // Jump labels
          if (!suggestItems[h - 1].id) {
            h--;
          }

          setHighlighted(h - 1);
          onHighlight(suggestItems[h - 1]);
        } else {
          setHighlighted(null);
          onHighlight(null);
        }
      }

      if (key === 'Enter') {
        if (highlighted !== null) {
          onSelect(suggestItems[highlighted]);
        }
      }
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  });

  useEffect(() => {
    const inputElement = document.getElementById(inputId);
    const computedStyle = window.getComputedStyle(inputElement);
    const boundingRect = inputElement.getBoundingClientRect();
    const isMobile =
      computedStyle.position === 'fixed' || // Top bar
      computedStyle.position === 'absolute'; // itineray

    setStyle({
      display: 'block',
      top: isMobile ? boundingRect.bottom : computedStyle.height,
      left: computedStyle.marginLeft,
      width: inputElement.offsetWidth,
    });

  }, []);

  return (
    <ul
      className={classnames('autocomplete_suggestions', className)}
      style={style}
      ref={dropDownRef}
    >
      {suggestItems.map((suggest, index) =>
        <li
          key={index}
          onMouseDown={() => onSelect(suggestItems[index])}
          onMouseEnter={() => { setHighlighted(index); }}
          ref={liRef}
        >
          <SuggestItem item={suggest} isHighlighted={highlighted === index} />
        </li>
      )}
    </ul>
  );
};

SuggestsDropdown.propTypes = {
  suggestItems: arrayOf(object).isRequired,
  onHighlight: func.isRequired,
  onSelect: func.isRequired,
  className: string,
  inputId: string.isRequired,
};

export default SuggestsDropdown;
