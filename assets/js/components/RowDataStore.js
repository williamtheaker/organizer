import _ from 'lodash'
import objectPath from 'object-path'
import Events from 'ampersand-events'

export default class RowDataStore {
  constructor() {
    //super();
    this.data = {};
    this.filters = [];
    this.selected = [];

    this.visibleItems = _.memoize(this.visibleItems.bind(this));
    this.selectedItems = _.memoize(this.selectedItems.bind(this));
    this.areAllSelected = _.memoize(this.areAllSelected.bind(this));
  }

  clearCache() {
    this.visibleItems.cache.clear();
    this.selectedItems.cache.clear();
    this.areAllSelected.cache.clear();
  }

  notify() {
    var dataBundle = {
      all: this.allItems(),
      visible: this.visibleItems(),
      selected: this.selectedItems(),
      data: this.data
    };
    this.trigger('changed', dataBundle);
  }

  setData(data) {
    this.data = data;
    this.clearCache();
    this.notify();
  }

  allItems() {
    return [];
  }

  visibleItems() {
    return _.filter(this.allItems(), _.bind(this._runFilters, this))
  }

  selectedItems() {
    return _.filter(this.visibleItems(), (s) => {
      return this.selected[s.id];
    });
  }

  isSelected(id) {
    return this.selected[id];
  }

  setFilter(property, value) {
    this.filters[property] = value;
    this.visibleItems.cache.clear();
    this.selectedItems.cache.clear();
    this.areAllSelected.cache.clear();
    this.notify();
  }

  setAllSelected(state) {
    _.each(this.allItems(), (s) => {
      this.selected[s.id] = state;
    });
    this.selectedItems.cache.clear();
    this.areAllSelected.cache.clear();
    this.notify();
  }

  setSelected(rowID, state) {
    this.selected[rowID] = state;
    this.selectedItems.cache.clear();
    this.areAllSelected.cache.clear();
    this.notify();
  }

  areAllSelected() {
    const items = this.visibleItems();
    if (items.length == 0) {
      return false;
    } else {
      return _.every(items, (item) => this.selected[item.id]);
    }
  }


  _runFilters(row) {
    return _.every(
      _.toPairs(this.filters),
      ([fieldName, filterFunc]) => {
        return filterFunc(objectPath.get(row, fieldName));
      }
    );
  }
}

_.assign(RowDataStore.prototype, Events, {});

export class ModelDataStore extends RowDataStore {
  constructor(modelType, options) {
    super();
    this.baseOptions = options || {};
    this.options = {};
    this.model = modelType;
    this.reload = _.memoize(this.reload);
    this.onChanged = _.debounce(this.onChanged.bind(this), 50);
  }

  setOptions(options) {
    if (this.options != options) {
      this.options = options;
      this.reload.cache.clear();
      this.reload();
    }
  }

  onChanged() {
    this.notify();
  }

  reload() {
    return this.model.getAll({...this.baseOptions, ...this.options})
      .then(rows => {
        _.each(this.data.rows, row => row.off('changed', this.onChanged));
        this.setData({rows: rows})
        _.each(rows, row => row.on('changed', this.onChanged));
      })
      .then(() => this.reload.cache.clear())
  }

  allItems() {
    return this.data.rows || [];
  }
}
