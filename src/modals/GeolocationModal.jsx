import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'src/components/ui/Modal';
import { listen } from 'src/libs/customEvents';
import { Button, CloseButton } from 'src/components/ui';
import classnames from 'classnames';
import { useI18n } from 'src/hooks';
import { IconExternalLink } from 'src/components/ui/icons';

let hasPermissionModalOpenedOnce = false;

const GeolocationModal = ({ status, onClose, onAccept }) => {
  const { getLocalizedUrl, _ } = useI18n();
  const aboutPrivacyUrl = getLocalizedUrl('aboutPrivacy');

  /* eslint-disable max-len */
  const pendingOnDirectionsText = _(
    "Always respecting your privacy.<br>As stated in {privacyPolicyLink}our privacy policy{closeTag}, we don't store your information because we don't want to know your whereabouts.",
    'geolocation',
    {
      privacyPolicyLink: `<a target="_blank" rel="noopener noreferrer" href="${aboutPrivacyUrl}">`,
      closeTag: '</a>',
    }
  );

  const pendingText = _(
    "We look at your location to show you where you are, and that's it!<br />(See our {privacyPolicyLink}privacy policy{closeTag})",
    'geolocation',
    {
      privacyPolicyLink: `<a target="_blank" rel="noopener noreferrer" href="${aboutPrivacyUrl}">`,
      closeTag: '</a>',
    }
  );

  const statuses = {
    PENDING: {
      title: _('At Qwant, your whereabouts are part of your privacy', 'geolocation'),
      text: pendingText,
      button: _('Continue', 'geolocation'),
      className: 'modal__maps__pending',
    },
    PENDING_ON_DIRECTIONS: {
      title: _('Enable your geolocation for better directions', 'geolocation'),
      text: pendingOnDirectionsText,
      button: _("Ok, I've got it", 'geolocation'),
      className: 'modal__maps__pending',
    },
    DENIED: {
      title: _('Houston,<br/> we have a (geolocation) problem&nbsp;🛰️', 'geolocation'),
      text: _(
        'Allow Qwant Maps to access your position so we can better help you find your way…',
        'geolocation'
      ),
      link: {
        label: _('How to access the geolocation services?', 'geolocation'),
        url: getLocalizedUrl('helpGeolocation'),
      },
      className: 'modal__maps__denied',
    },
    NOT_ACTIVATED: {
      title: _('Houston,<br/> we have a (geolocation) problem&nbsp;🛰️', 'geolocation'),
      text: _(
        "We can't access your position.<br/> Please check that your geolocation services are enabled."
      ),
      link: {
        label: _('How to access the geolocation services?', 'geolocation'),
        url: getLocalizedUrl('helpGeolocation'),
      },
      className: 'modal__maps__not-activated',
    },
  };
  /* eslint-enable max-len */

  const { title, text, button, link, className } = statuses[status];
  return (
    <Modal onClose={onClose}>
      <div className={classnames('modal__maps', className)}>
        <CloseButton onClick={onClose} />
        <div className="modal__maps__content">
          <h2
            className="modal__title u-text--smallTitle"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <div
            className="modal__subtitle u-text--subtitle"
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {button && (
            <Button className="modal__button" variant="primary" onClick={onAccept}>
              {button}
            </Button>
          )}
          {link && (
            <Button href={link.url} variant="tertiary" icon={<IconExternalLink width={16} />}>
              {link.label}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

function close() {
  ReactDOM.unmountComponentAtNode(document.querySelector('.react_modal__container'));
}

function open(status, onClose, onAccept) {
  ReactDOM.render(
    <GeolocationModal status={status} onClose={onClose} onAccept={onAccept} />,
    document.querySelector('.react_modal__container')
  );
}

listen('open_geolocate_not_activated_modal', () => open('NOT_ACTIVATED', close, close));

listen('open_geolocate_denied_modal', () => open('DENIED', close, close));

export async function openPendingDirectionModal() {
  if (hasPermissionModalOpenedOnce === true) {
    return;
  }
  hasPermissionModalOpenedOnce = true;
  return new Promise(resolve => {
    open(
      'PENDING_ON_DIRECTIONS',
      () => {
        close();
        resolve(false); // close: prevent native geolocation popup
      },
      () => {
        close();
        resolve(true); // click "OK": allow native geolocation popup
      }
    );
  });
}

export async function openPendingGeolocateModal() {
  return new Promise(resolve => {
    open(
      'PENDING',
      () => {
        close();
        resolve(false);
      },
      () => {
        close();
        resolve(true);
      }
    );
  });
}

export default GeolocationModal;
