import React from 'react'
import RowDataStore from './RowDataStore'

export default class StoreBinding extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      store_data: {
        all: [],
        visible: [],
        selected: [],
        data: {}
      }
    }
    this.onStoreUpdated = this.onStoreUpdated.bind(this);
  }

  onStoreUpdated(bundle) {
    this.setState({store_data: bundle});
  }

  componentDidMount() {
    this.props.store.on('changed', this.onStoreUpdated);
    this.props.store.notify();
  }

  componentWillUnmount() {
    this.props.store.off('changed', this.onStoreUpdated);
  }

  render() {
    return (
      <span>
        {React.cloneElement(this.props.children, {store: this.props.store, store_data: this.state.store_data})}
      </span>
    )
  }
}

export const withStore = (SubComponent) => (
  (props) => (
    <StoreBinding store={props.store}>
      <SubComponent {...props} />
    </StoreBinding>
  )
)
