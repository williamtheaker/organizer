import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import _ from 'lodash'
import { Checkbox, CardHeader, Card, Badge, Avatar, ListItem } from 'material-ui'
import { connect } from 'react-redux'
import { modelFinder, getLoading } from '../selectors'
import { bindActionCreators } from 'redux'
import { Model } from '../actions'

function mapStateToProps(state, props) {
  return {
    signup: modelFinder('signups', 'id', props.id)(state)
  }
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    updateSignup: _.partial(Model.updateModel, 'signups', props.id)
  }, dispatch);
}

class SignupCardBase extends React.Component {
  componentWillUnmount() {
    this.props.updateSignup({selected: false});
  }

  render() {
    const draggable = this.props.connectDragSource(
      <div>
        <ListItem
          primaryText={this.props.signup.activist.name}
          secondaryText={this.props.signup.activist.email}
          leftCheckbox={<Checkbox
                          checked={this.props.signup.selected}
                          onCheck={(evt, checked) => this.props.updateSignup({selected: checked})} />}
          rightAvatar={<Avatar className={"rank-"+this.props.signup.activist.rank}>{this.props.signup.activist.rank}</Avatar>} />
      </div>
    )
    return (
      <div className="card-wrap">
        {draggable}
      </div>
    )
  }
}

const dragSpec = {
  beginDrag(props, monitor, component) {
    props.onDragging && props.onDragging(true);
    console.log('start drag', props);
    return {signup: props.signup}
  },
}

const collect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  dragging: monitor.isDragging()
})

const SignupDragSource = DragSource("signup", dragSpec, collect);

const SignupCard = connect(mapStateToProps, mapDispatchToProps)(SignupDragSource(SignupCardBase));
export default SignupCard;
