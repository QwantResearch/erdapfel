import React from 'react';
import { Panel } from 'src/components/ui';
import NoResultMessage from './NoResultMessage';

const NoResultPanel = () => {
  return (
    <Panel>
      <div style={{ padding: '20px 34px' }}>
        <NoResultMessage />
      </div>
    </Panel>
  );
};

export default NoResultPanel;
