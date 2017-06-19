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
            <ModelFilterEditor store={this.props.store} />
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
