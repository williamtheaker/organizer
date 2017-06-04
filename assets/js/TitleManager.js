import _ from 'lodash'

export default class TitleManager {
  constructor() {
    this.handlers = []
    this.title = "";
    this.subtitle = "";
  }

  register(cb) {
    this.handlers.push(cb);
  }

  setTitle(title, subtitle) {
    this.title = title;
    this.subtitle = subtitle;
    _.each(this.handlers, (f) => f());
  }

  setSubtitle(subtitle) {
    this.subtitle = subtitle;
    _.each(this.handlers, (f) => f());
  }
}

export let titles = new TitleManager();
