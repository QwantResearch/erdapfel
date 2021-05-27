/* global _ */
import React from 'react';

import Block from 'src/panel/poi/blocks/Block';

const ContactBlock = ({ block }) => {
  return (
    <Block className="block-contact" title={_('contact')} icon="mail" href={block.url}>
      {block.url.replace('mailto:', '')}
    </Block>
  );
};

export default ContactBlock;
