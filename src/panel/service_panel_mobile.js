import ServicePanelView from '../views/service_panel_mobile.dot';
import Panel from '../libs/panel';
import nconf from '@qwant/nconf-getter';
import CategoryService from '../adapters/category_service';
import PanelResizer from "../libs/panel_resizer";

export default class ServicePanelMobile {
  constructor() {
    this.panel = new Panel(this, ServicePanelView);
    this.panelResizer = new PanelResizer(this.panel);
    this.categories = CategoryService.getCategories();
    this.mustDeployCategories = this.categories.length > 8;
    this.isDeployed = false;
    this.isDirectionActive = nconf.get().direction.enabled;
    this.active = true;
  }

  toggleCategories() {
    this.isDeployed = !this.isDeployed;
    this.panel.update();
  }

  openFavorite() {
    window.app.navigateTo('/favs');
  }

  openDirection() {
    if (this.isDirectionActive) {
      window.app.navigateTo('/routes/');
    }
  }

  open() {
    this.active = true;
    this.panelResizer.reset();
    this.panel.update();
  }

  close() {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.panel.update();
  }

  openCategory(category) {
    window.app.navigateTo(`/places/?type=${category.name}`);
  }
}