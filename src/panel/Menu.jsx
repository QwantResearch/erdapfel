/* globals _ */
import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { menu as menuItems } from '../../config/constants.yml';
import nconf from '@qwant/nconf-getter';
import MenuItem from './menu/MenuItem';
import MenuButton from './menu/MenuButton';
import MasqStatus from './menu/MasqStatus';
import Store from '../adapters/store';

const isDirectionActive = nconf.get().direction.enabled;
const isMasqEnabled = nconf.get().masq.enabled;

export default class Menu extends React.Component {
  state = {
    isOpen: false,
    isInitialized: isMasqEnabled ? false : true,
    masqUser: null,
  };

  componentDidMount = () => {
    if (isMasqEnabled) {
      this.store = new Store();
      this.store.onToggleStore(this.onStoreChange);
      this.onStoreChange();
    }
    this.menuContainer = document.createElement('div');
    document.body.appendChild(this.menuContainer);
  }

  componentWillUnmount = () => {
    if (this.menuContainer) {
      this.menuContainer.remove();
    }
  }

  onStoreChange = () => {
    this.store.isLoggedIn().then(isLoggedIn => {
      if (!isLoggedIn) {
        this.setState({
          isInitialized: true,
          masqUser: null,
        });
      } else {
        this.store.getUserInfo().then(masqUser => {
          this.setState({
            isInitialized: true,
            masqUser,
          });
        });
      }
    });
  }

  open = () => {
    this.setState({ isOpen: true });
  }

  close = () => {
    this.setState({ isOpen: false });
  }

  navTo = (url, options) => {
    this.close();
    window.app.navigateTo(url, options);
  }

  render() {
    if (!this.state.isInitialized) {
      return null;
    }

    return <Fragment>
      <MenuButton masqUser={this.state.masqUser} onClick={this.open} />

      {this.state.isOpen && ReactDOM.createPortal(<div className="menu">
        <div className="menu__overlay" onClick={this.close} />

        <div className="menu__panel">
          <div className="menu__panel__top">
            <h2 className="menu__panel__top__title">
              <i className="menu__panel__top__icon icon-map" />
              <span>Qwant Maps</span>
              <i className="icon-x menu__panel__top__close" onClick={this.close} />
            </h2>
            {isMasqEnabled && <MasqStatus user={this.state.masqUser} store={this.store} />}
          </div>

          <div className="menu__panel__items_container">
            <div className="menu__panel__section menu__panel__section-internal">
              <button className="menu__panel__action"
                onClick={() => { this.navTo('/', { focusSearch: true }); }}
              >
                <img
                  className="menu__panel__action__icon"
                  src="./statics/images/magnifier.svg" alt=""
                />
                <span>{_('Search', 'menu')}</span>
              </button>
              {isDirectionActive &&
                <button className="menu__panel__action" onClick={() => { this.navTo('/routes/'); }}>
                  <i className="menu__panel__action__icon icon-corner-up-right" />
                  <span>{_('Directions', 'menu')}</span>
                </button>
              }
              <button className="menu__panel__action" onClick={() => { this.navTo('/favs/'); }}>
                <i className="menu__panel__action__icon icon-icon_star" />
                <span>{_('Favorites', 'menu')}</span>
              </button>
              <a className="menu__panel__action menu__panel__section_title__link"
                href="https://github.com/QwantResearch/qwantmaps/blob/master/contributing.md"
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className="menu__panel__action__icon icon-zap" />
                <span>{_('How to contribute', 'menu')}</span>
              </a>
            </div>

            {menuItems.map(menuItem => <MenuItem key={menuItem.sectionName} menuItem={menuItem} />)}
          </div>
        </div>
      </div>, this.menuContainer)}
    </Fragment>;
  }
}
