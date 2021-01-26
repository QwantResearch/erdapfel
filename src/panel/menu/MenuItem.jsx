import React from 'react';
import { Flex } from 'src/components/ui';
import { IconExternalLink } from 'src/components/ui/icons';
import { GREY_SEMI_DARKNESS } from 'src/libs/colors';

const MenuItem = ({ icon, children, href, onClick, outsideLink }) =>
  <a
    className="menu-item"
    href={href || '#'}
    onClick={onClick}
    {...(outsideLink ? {
      rel: 'noopener noreferrer',
      target: '_blank',
    } : {})}
  >
    <Flex>
      {icon && <Flex className="u-mr-s">{icon}</Flex>}
      <div style={{ flexGrow: 1 }}>{children}</div>
      {outsideLink && <IconExternalLink width={16} fill={GREY_SEMI_DARKNESS} />}
    </Flex>
  </a>;

export default MenuItem;
