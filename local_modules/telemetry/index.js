module.exports = {
  events: [
    /* App */
    'app_start',
    /* IA Maps iframe */
    'app_start_iframe',
    /* Suggest*/
    'suggest_selection',
    'suggest_submit',
    'suggest_clear',
    /* Favorite */
    'favorite_open',
    'favorite_close',
    'favorite_go',
    'favorite_share',
    'favorite_delete',
    'favorite_error_load_all', //error
    /* Itinerary */
    'itinerary_open',
    'itinerary_close',
    'itinerary_share',
    'itinerary_invert',
    'itinerary_mode_driving',
    'itinerary_mode_walking',
    'itinerary_mode_cycling',
    'itinerary_mode_publictransport',
    'itinerary_route_select',
    'itinerary_route_toggle_details',
    'itinerary_point_geolocation',
    'itinerary_route_preview_open',
    /* Poi */
    'poi_category_open',
    'poi_backtofavorite',
    'poi_backtolist',
    'poi_restore',
    'poi_share',
    'poi_share_to',
    /* OSM */
    'poi_osm_open',
    'poi_osm_go',
    'poi_osm_favorite', // Favorite toggle
    'poi_osm_phone',
    'poi_osm_website',
    'poi_osm_itinerary',
    'poi_osm_osm_view',
    'poi_osm_osm_edit',
    /* Pages Jaunes Poi */
    'poi_pages_jaunes_open',
    'poi_pages_jaunes_go',
    'poi_pages_jaunes_favorite', // Favorite toggle
    'poi_pages_jaunes_phone',
    'poi_pages_jaunes_website',
    'poi_pages_jaunes_reviews',
    'poi_pages_jaunes_itinerary',
    'poi_pages_jaunes_transactional_booking',
    'poi_pages_jaunes_transactional_appointment',
    'poi_pages_jaunes_transactional_quotationRequest',
    /* Map */
    'localise_trigger',
    /* Covid-19 */
    'covid_caresteouvert_link',
    'covid_caresteouvert_contribute',
    /* Perfs */
    'perf_map_first_render',
    /* map actions buttons */
    'map_zoom_in',
    'map_zoom_out',
    'map_itinerary',
    /* Menu and sidebar */
    'menu_click',
    'menu_favorite',
    /* Homepage */
    'home_itinerary',
    'home_category',
    /* User feedback */
    'user_feedback_answer',
  ],
};
