import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import FavoritesPanel from './favorites/FavoritesPanel';
import PoiPanel from './poi/PoiPanel';
import ServicePanel from './service/ServicePanel';
import CategoryPanel from 'src/panel/category/CategoryPanel';
import DirectionPanel from 'src/panel/direction/DirectionPanel';
import Telemetry from 'src/libs/telemetry';
import CategoryService from 'src/adapters/category_service';
import { parseQueryString, getCurrentUrl, buildQueryString } from 'src/libs/url_utils';
import { fire, listen, unListen } from 'src/libs/customEvents';
import { isNullOrEmpty } from 'src/libs/object';
import { PanelContext } from 'src/libs/panelContext.js';
import NoResultPanel from 'src/panel/NoResultPanel';
import TopBar from 'src/components/TopBar';
import { useConfig, useDevice } from 'src/hooks';

function getTopBarAppValue({ poiFilters = {}, poi = {}, query } = {}) {
  if (poi.name) {
    return poi.name;
  }
  if (poiFilters.category) {
    return CategoryService.getCategoryByName(poiFilters.category)?.getInputValue() || '';
  }
  return poiFilters.query || query || '';
}

const PanelManager = ({ router }) => {
  const directionConf = useConfig('direction');
  const { isMobile } = useDevice();

  const [panelOptions, setPanelOptions] = useState({
    ActivePanel: ServicePanel,
    options: {},
    panelSize: 'default',
  });
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [topBarValue, setTopBarValue] = useState('');
  const setPanelSize = useCallback(
    panelSize => {
      setPanelOptions({ ...panelOptions, panelSize });
    },
    [panelOptions]
  );

  const mainSearchInputRef = useRef(null);

  // Telemetry
  useEffect(() => {
    window.times.appRendered = Date.now();

    const initialUrlPathName = window.location.pathname;
    const initialQueryParams = parseQueryString(window.location.search);

    Telemetry.add(Telemetry.APP_START, {
      language: window.getLang(),
      is_mobile: isMobile,
      url_pathname: initialUrlPathName,
      url_client: initialQueryParams['client'] || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Disable ESlint plugin so we don't need to add 'isMobile' as effect dependency,
  // to prevent sending the event again if the user resizes the app

  // Panel auto-minimization on mobile
  useEffect(() => {
    if (isMobile) {
      const minimizePanelOnMapInteraction = listen('map_user_interaction', () => {
        if (panelOptions.panelSize !== 'minimized') {
          setPanelSize('minimized');
        }
        fire('restart_idle_timeout');
      });
      return () => {
        unListen(minimizePanelOnMapInteraction);
      };
    }
  }, [isMobile, panelOptions.panelSize, setPanelSize]);

  // Definition of url routes to panels
  useEffect(() => {
    router.addRoute('Category', '/places/(.*)', placesParams => {
      const { type: category, q: query, ...otherOptions } = parseQueryString(placesParams);
      setPanelOptions({
        ActivePanel: CategoryPanel,
        options: {
          poiFilters: {
            category,
            query,
          },
          ...otherOptions,
        },
        panelSize: 'default',
      });
    });

    router.addRoute('noresult', '/noresult', (routeParams, options) => {
      const { q: query } = parseQueryString(routeParams);
      setPanelOptions({
        ActivePanel: NoResultPanel,
        panelSize: 'default',
        options: {
          ...options,
          query,
        },
      });
    });

    router.addRoute('POI', '/place/(.*)', async (urlPart, options = {}) => {
      const [poi, params] = urlPart.split('?');
      const { q: query } = parseQueryString(params);
      const poiId = poi.split('@')[0];
      setPanelOptions({
        ActivePanel: PoiPanel,
        options: {
          ...options,
          query,
          poiId,
          backToList,
          backToFavorite,
        },
        panelSize: 'default',
      });
    });

    router.addRoute('Favorites', '/favs', () => {
      setPanelOptions({
        ActivePanel: FavoritesPanel,
        options: {},
        panelSize: 'default',
      });
    });

    if (directionConf.enabled) {
      const isPublicTransportActive =
        (directionConf.publicTransport && directionConf.publicTransport.enabled) ||
        parseQueryString(document.location.search)['pt'] === 'true';

      router.addRoute('Routes', '/routes(?:/?)(.*)', (routeParams, options) => {
        const params = parseQueryString(routeParams);
        params.details = params.details === 'true';
        params.activeRouteId = Number(params.selected) || 0;
        setPanelOptions({
          ActivePanel: DirectionPanel,
          options: { ...params, ...options, isPublicTransportActive },
          panelSize: 'default',
        });
      });
    }

    // Default matching route
    router.addRoute('Services', '/?', (_, options = {}) => {
      setPanelOptions({
        ActivePanel: ServicePanel,
        options,
        panelSize: 'default',
      });
      if (options?.focusSearch) {
        mainSearchInputRef.current.select();
      }
    });

    // Route the initial URL
    router.routeUrl(getCurrentUrl(), window.history.state || {});
  }, [router, directionConf]);

  // Effects on panel change
  useEffect(() => {
    setTopBarValue(getTopBarAppValue(panelOptions.options));

    // Not in a "list of PoI" context (options.poiFilters is null)
    if (isNullOrEmpty(panelOptions.options?.poiFilters)) {
      // Markers are not persistent
      fire('remove_category_markers');
    }
  }, [panelOptions.ActivePanel, panelOptions.options]);

  const backToList = (e, poiFilters) => {
    e.stopPropagation();
    const { query, category, ...rest } = poiFilters;
    const queryObject = {
      q: query,
      type: category,
      ...rest,
    };

    Telemetry.add(Telemetry.POI_BACKTOLIST);
    fire('restore_location');
    window.app.navigateTo(`/places/${buildQueryString(queryObject)}`);
  };

  const backToFavorite = e => {
    e.stopPropagation();
    Telemetry.add(Telemetry.POI_BACKTOFAVORITE);
    window.app.navigateTo('/favs');
  };

  const getTopBarReturnAction = () => {
    const { poi, poiFilters = {}, isFromFavorite } = panelOptions.options;
    if (poi?.name && (poiFilters?.category || poiFilters?.query || isFromFavorite)) {
      const backAction = poiFilters.category || poiFilters.query ? backToList : backToFavorite;
      // use the mousedown event so it's triggered before the blur event on the suggest
      return event => {
        if (isSuggestOpen) {
          return;
        }
        backAction(event, poiFilters);
      };
    }
    return null;
  };

  const { ActivePanel, options, panelSize } = panelOptions;
  const isPanelVisible = !isSuggestOpen || (ActivePanel === ServicePanel && !topBarValue);

  return (
    <div>
      <TopBar
        value={topBarValue}
        setUserInputValue={setTopBarValue}
        ref={mainSearchInputRef}
        onSuggestToggle={setIsSuggestOpen}
        backButtonAction={getTopBarReturnAction()}
      />
      <PanelContext.Provider value={{ size: panelSize, setSize: setPanelSize }}>
        {/*
          The panel container is made hidden using "display: none;" to avoid unnecessary
          mounts and unmounts of the ActivePanel, that would have inappropriate side effects
          on map markers, requests to server, etc.
        */}
        <div className="panel_container" style={{ display: !isPanelVisible ? 'none' : null }}>
          <ActivePanel {...options} />
        </div>
      </PanelContext.Provider>
    </div>
  );
};

PanelManager.propTypes = {
  router: PropTypes.object.isRequired,
};

export default PanelManager;
