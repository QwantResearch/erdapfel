import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';
import { bool, string, func, object } from 'prop-types';
import { useDevice } from 'src/hooks';
import SuggestsDropdown from 'src/components/ui/SuggestsDropdown';
import { fetchSuggests, getInputValue, modifyList } from 'src/libs/suggest';

const SUGGEST_DEBOUNCE_WAIT = 100;

let currentQuery = null;

const Suggest = ({
  outputNode,
  withCategories,
  withGeoloc,
  onSelect,
  className,
  onToggle,
  children: renderInput,
  value,
  withFeedback,
}) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const [hasFocus, setHasFocus] = useState(false);
  const dropdownVisible = hasFocus && isOpen && outputNode;
  const { isMobile } = useDevice();

  const close = () => {
    setIsOpen(false);
    setItems([]);
  };

  useEffect(() => {
    if (onToggle) {
      onToggle(dropdownVisible);
    }
  }, [dropdownVisible, onToggle]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchItems = useCallback(
    debounce(value => {
      if (currentQuery) {
        currentQuery.abort();
      }

      const query = fetchSuggests(value, {
        withCategories,
      });

      currentQuery = query;

      query
        .then(suggestions => modifyList(suggestions, withGeoloc && value === '', value))
        .then(items => {
          setItems(items);
          currentQuery = null;
        })
        .catch(() => {
          /* Query aborted. Just ignore silently */
        });
    }, SUGGEST_DEBOUNCE_WAIT),
    [withCategories, withGeoloc]
  );

  useEffect(() => {
    if (!hasFocus) {
      close();
    } else {
      setHighlighted(null);
      fetchItems(value);
      setIsOpen(true);
    }
  }, [hasFocus, fetchItems, value]);

  const selectItem = item => {
    onSelect(item, { query: value });
    setHighlighted(null);
  };

  const onKeyDown = e => {
    switch (e.key) {
      case 'Esc':
      case 'Escape':
        close();
        break;
      case 'Enter':
        if (highlighted !== null) {
          e.preventDefault(); // prevent search input submit with its current content (highlighted POI name)
          selectItem(highlighted);
        }
        break;
      case 'ArrowDown':
        setHighlighted(items[items.indexOf(highlighted) + 1] || null);
        break;
      case 'ArrowUp':
        e.preventDefault(); // prevent cursor returning at beggining
        setHighlighted(
          !highlighted ? items[items.length - 1] : items[items.indexOf(highlighted) - 1] || null
        );
    }
  };

  useEffect(() => {
    // If available we use the Visual Viewport API, which informs about the visible page area,
    // in particular taking the virtual keyboard into account.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
    if (isMobile && dropdownVisible && window.visualViewport) {
      const setDropdownFixedHeight = () => {
        const TOP_BAR_HEIGHT = 60;
        // visualViewport.height is the real visible height, not including the virtual keyboard.
        // Giving a fixed height to the container makes the content scrollable
        outputNode.style.height = window.visualViewport.height - TOP_BAR_HEIGHT + 'px';
      };
      setDropdownFixedHeight();
      visualViewport.addEventListener('resize', setDropdownFixedHeight);

      const suggestions = document.querySelector('.autocomplete_suggestions');
      const cancelTouchScrollIfNotOverflow = e => {
        const hasOverflow =
          suggestions &&
          suggestions.getBoundingClientRect().height > outputNode.getBoundingClientRect().height;
        if (!hasOverflow) {
          e.preventDefault();
        }
      };
      outputNode.addEventListener('touchmove', cancelTouchScrollIfNotOverflow);

      return () => {
        outputNode.style.height = 'auto';
        visualViewport.removeEventListener('resize', setDropdownFixedHeight);
        outputNode.removeEventListener('touchmove', cancelTouchScrollIfNotOverflow);
      };
    }
  }, [isMobile, items, dropdownVisible, outputNode]);

  return (
    <>
      {renderInput({
        onKeyDown,
        onFocus: () => {
          setHasFocus(true);
        },
        onBlur: () => {
          setHasFocus(false);
        },
        highlightedValue: highlighted ? getInputValue(highlighted) : null,
      })}
      {dropdownVisible &&
        ReactDOM.createPortal(
          <SuggestsDropdown
            className={className}
            suggestItems={items}
            highlighted={highlighted}
            onSelect={selectItem}
            value={value}
            withFeedback={withFeedback}
          />,
          outputNode
        )}
    </>
  );
};

Suggest.propTypes = {
  outputNode: object,
  withCategories: bool,
  withGeoloc: bool,
  onSelect: func.isRequired,
  onToggle: func,
  className: string,
  value: string,
  withFeedback: bool,
};

export default Suggest;
