import React from 'react'

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
    this.props.store.on('update', this.onStoreUpdated);
    this.props.store.notify();
  }

  componentWillUnmount() {
    this.props.store.removeListener('update', this.onStoreUpdated);
  }

  render() {
    return (
      <span>
        {React.cloneElement(this.props.children, {store: this.props.store, store_data: this.state.store_data})}
      </span>
    )
  }
}
