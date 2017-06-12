import React from 'react'
import _ from 'lodash'
import StoreBinding from './StoreBinding'
import { Table } from './DataTable'
import Modal from 'react-modal'
import ModelFilterEditor from './ModelFilterEditor'

export default class ModelIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modals: []
    };
    this.doOnChange = _.throttle(this.doOnChange.bind(this), 500, {trailing: true});
  }

  doOnChange(values) {
    var filters = {};
    const filterables = _.filter(values.filters, f => f);
    _.each(filterables, (values) => {
      const {model_id, operator, key} = _.mapValues(values, v => v.value);
      const value = values.value;
      if (model_id) {
        filters[key] = model_id;
      } else if (operator == "contains") {
        filters[key+"__icontains"] = value;
      } else if (operator == "equals") {
        filters[key] = value;
      } else {
        console.log("unknown filter operator", operator);
      }
    });
    this.props.store.setOptions(filters);
  }

  render() {
    const setModalState = (name, state) => (
      () => this.setState(old => {old.modals[name] = state;return old})
    );
    const modals = _.values(_.mapValues(this.props.actions, ({label, component: ModalComponent}, name) => (
      <Modal
        key={name}
        isOpen={this.state.modals[name]}
        contentLabel={label}
        onRequestClose={setModalState(name, false)}>
        <StoreBinding store={this.props.store}>
          <ModalComponent onFinished={setModalState(name, false)}/>
        </StoreBinding>
      </Modal>
    )));
    const actionButtons = _.values(_.mapValues(this.props.actions, (contents, name) => (
      <li key={name}>
        <input
          type="button"
          className="button"
          value={contents.label}
          onClick={setModalState(name, true)} />
      </li>
    )));
    return (
      <div>
        {modals}
        <div className="row">
          <div className="small-12 columns">
            <ModelFilterEditor onChange={this.doOnChange} store={this.props.store} />
            <div className="top-bar">
              <div className="top-bar-right">
                <ul className="menu">
                  <li><input type="button" className="button" value="Refresh" onClick={() => this.props.store.reload()} /></li>
                  {actionButtons}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="small-12 columns">
            <Table store={this.props.store} columns={this.props.columns} />
          </div>
        </div>
      </div>
    )
  }
}
