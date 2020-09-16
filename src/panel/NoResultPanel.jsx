/* globals _ */
import React from 'react';

import { Panel } from 'src/components/ui';
import SearchInput from '../ui_components/search_input';

const close = () => window.app.navigateTo('/');

const handleSearchClick = e => {
  e.preventDefault();
  close();
  SearchInput.setInputValue('');
  SearchInput.select();
};

const NoResultPanel = () => {
  return (
    <Panel
      white
      close={close}
    >
      <div
        style={{ padding: '0 16px 32px 16px' }}
      >
        <p className="u-mb-8 u-text--smallTitle">{_('No results found.')}</p>
        <p className="u-text--subtitle u-mb-20">
          {_('Check the spelling of your search or add more details, such as city or country.')}
        </p>
        <a onClick={handleSearchClick} href="#">
          {_('Try a new search query')}
        </a>
      </div>
    </Panel>
  );
};

export default NoResultPanel;