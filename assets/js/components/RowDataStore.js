import EventEmitter from 'events'
import _ from 'lodash'
import memoize from 'memoizee'
import objectPath from 'object-path'
import axios from 'axios'

export default class RowDataStore extends EventEmitter {
  constructor() {
    super();
    this.data = {};
    this.filters = [];
    this.selected = [];

    this.visibleItems = memoize(this.visibleItems.bind(this));
    this.selectedItems = memoize(this.selectedItems.bind(this));
    this.areAllSelected = memoize(this.areAllSelected.bind(this));
  }

  notify() {
    var dataBundle = {
      all: this.allItems(),
      visible: this.visibleItems(),
      selected: this.selectedItems(),
      data: this.data
    };
    this.emit('update', dataBundle);
  }

  setData(data) {
    this.data = data;
    this.visibleItems.clear();
    this.selectedItems.clear();
    this.areAllSelected.clear();
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
    this.visibleItems.clear();
    this.selectedItems.clear();
    this.areAllSelected.clear();
    this.notify();
  }

  setAllSelected(state) {
    _.each(this.allItems(), (s) => {
      this.selected[s.id] = state;
    });
    this.selectedItems.clear();
    this.areAllSelected.clear();
    this.notify();
  }

  setSelected(rowID, state) {
    this.selected[rowID] = state;
    this.selectedItems.clear();
    this.areAllSelected.clear();
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

export class APIListDataStore extends RowDataStore {
  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
  }

  reload() {
    return axios.get(this.endpoint)
      .then((response) => {
        this.setData(response.data);
      });
  }

  allItems() {
    return this.data.results || [];
  }
}

export class ModelDataStore extends RowDataStore {
  constructor(modelType, options) {
    super();
    this.options = options || {};
    this.model = modelType;
  }

  setOptions(options) {
    if (this.options != options) {
      this.options = options;
      this.reload();
    }
  }

  reload() {
    return this.model.getAll(this.options)
      .then(rows => this.setData({rows: rows}));
  }

  allItems() {
    return this.data.rows || [];
  }
}
