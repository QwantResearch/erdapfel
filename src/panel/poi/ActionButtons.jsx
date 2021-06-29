/* globals _ */
import React from 'react';
import PropTypes from 'prop-types';
import Telemetry from 'src/libs/telemetry';
import { Flex, ShareMenu, Button } from 'src/components/ui';
import { Heart, IconCalendar, IconFileList } from 'src/components/ui/icons';
import { PINK_DARK } from 'src/libs/colors';

const TransactionalButton = ({ poi }) => {
  const { booking_url, appointment_url, quotation_request_url } =
    poi?.blocksByType?.transactional || {};

  let icon;
  let label;
  let url;
  let telemetryEvent;
  if (booking_url) {
    icon = <IconCalendar width={16} />;
    url = booking_url;
    label = _('Booking', 'poi panel');
    telemetryEvent = 'transactional_booking';
  } else if (appointment_url) {
    icon = <IconCalendar width={16} />;
    url = appointment_url;
    label = _('Appointment', 'poi panel');
    telemetryEvent = 'transactional_appointment';
  } else if (quotation_request_url) {
    icon = <IconFileList width={16} />;
    url = quotation_request_url;
    label = _('Request for quotation', 'poi panel');
    telemetryEvent = 'transactional_quotationRequest';
  } else {
    return null;
  }

  const sendTelemetryEvent = () => {
    Telemetry.sendPoiEvent(
      poi,
      telemetryEvent,
      Telemetry.buildInteractionData({
        id: poi.id,
        source: poi.meta?.source,
        template: 'single',
        zone: 'detail',
        element: 'transactional',
      })
    );
  };

  return (
    <Button
      icon={icon}
      href={url}
      rel="noopener noreferrer external"
      title={label}
      onClick={sendTelemetryEvent}
    />
  );
};

const ActionButtons = ({
  poi,
  isDirectionActive,
  openDirection,
  onClickPhoneNumber,
  isPoiInFavorite,
  toggleStorePoi,
}) => {
  const onShareClick = (e, handler) => {
    Telemetry.add(Telemetry.POI_SHARE);
    return handler(e);
  };

  const onShare = target => {
    Telemetry.add(Telemetry.POI_SHARE_TO, { target });
  };

  const favoriteColor = isPoiInFavorite ? PINK_DARK : null;

  return (
    <Flex className="poi_panel__actions">
      {isDirectionActive && (
        <Button
          className="poi_panel__action__direction"
          variant="primary"
          onClick={openDirection}
          title={_('Directions', 'poi panel')}
        >
          {_('Directions', 'poi panel')}
        </Button>
      )}

      {poi?.blocksByType?.phone && (
        <Button
          className="poi_panel__action__phone"
          onClick={onClickPhoneNumber}
          icon="icon_phone"
          href={poi.blocksByType.phone.url}
          rel="noopener noreferrer external"
          title={_('Call', 'poi panel')}
        />
      )}

      <TransactionalButton poi={poi} />

      <Button
        className="poi_panel__action__favorite"
        data-active={isPoiInFavorite}
        title={_('Favorites', 'poi panel')}
        onClick={toggleStorePoi}
        style={{ borderColor: favoriteColor }}
        icon={<Heart width={16} color={favoriteColor} fill={favoriteColor || 'transparent'} />}
      />

      <ShareMenu
        url={window.location.toString()}
        scrollableParent=".panel-content"
        onShare={onShare}
      >
        {openMenu => (
          <Button
            className="poi_panel__action__share"
            title={_('Share', 'poi panel')}
            icon="share-2"
            onClick={e => onShareClick(e, openMenu)}
          />
        )}
      </ShareMenu>
    </Flex>
  );
};

ActionButtons.propTypes = {
  poi: PropTypes.object.isRequired,
  isDirectionActive: PropTypes.bool,
  openDirection: PropTypes.func,
  onClickPhoneNumber: PropTypes.func,
  isPoiInFavorite: PropTypes.bool,
  toggleStorePoi: PropTypes.func.isRequired,
};

export default ActionButtons;
