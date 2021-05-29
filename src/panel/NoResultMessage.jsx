import React from 'react';
import { Button } from 'src/components/ui';
import { useI18n } from 'src/hooks';
import { IconExternalLink } from 'src/components/ui/icons';

const NoResultMessage = () => {
  const { getLocalizedUrl, _ } = useI18n();
  const helpCenterLink = getLocalizedUrl('helpEditData');

  return (
    <div className="u-center">
      <p
        className="u-mb-xs u-text--smallTitle"
        dangerouslySetInnerHTML={{
          __html: _('Sorry, we could not find this place&nbsp;🏝️', 'suggest'),
        }}
      />
      <p className="u-text--subtitle u-mb-s">
        {_(
          'Please try to correct your query or rewrite it with more details about the location (city, country, …)',
          'suggest'
        )}
      </p>
      <Button
        href={helpCenterLink}
        variant="tertiary"
        icon={<IconExternalLink width={16} />}
        onMouseDown={() => window.open(helpCenterLink)}
      >
        {_('Add a missing place on the map')}
      </Button>
    </div>
  );
};

export default NoResultMessage;
