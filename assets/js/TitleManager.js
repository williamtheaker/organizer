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
    $(this.handlers).each((idx, f) => {
      f();
    });
  }
}

export let titles = new TitleManager();
