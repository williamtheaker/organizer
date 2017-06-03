import React from 'react'

export default function Lazy(moduleLoader) {
  return class extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {loaded: false};
    }

    componentDidMount() {
      moduleLoader.then((Module) => {
        this.setState({loaded: true, component: Module.default});
      });
    }

    render() {
      if (this.state.loaded) {
        const Component = this.state.component;
        return <Component {...this.props} />
      } else {
        return <div />
      }
    }
  }
}
