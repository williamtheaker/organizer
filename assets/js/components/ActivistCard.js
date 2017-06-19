import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu'
import _ from 'lodash'
import { Checkbox } from 'react-form'


class ActivistCardBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false};
    this.setSignupState = this.setSignupState.bind(this);
  }

  setSignupState(state) {
    this.props.signup.state = state;
    this.props.signup.save();
  }

  componentWillUnmount() {
    this.props.signup.set({selected: false});
  }

  render() {
    const classes = "card " +
                    (this.props.dragging ? "dragging " : "") +
                    (this.props.signup.selected ? "selected" : "");
    const draggable = this.props.connectDragSource(
      <div className={classes} key={this.props.signup.id}>
        <ContextMenuTrigger id={this.props.signup.cid}>
          <div className="right">
            <div className={"rank rank-" + this.props.signup.activist.rank}>{this.props.signup.activist.rank}</div>
            <ContextMenuTrigger showOnClick={true} holdToDisplay={-1} id={this.props.signup.cid}>
              <button className="options"><i className="fa fa-ellipsis-v" /></button>
            </ContextMenuTrigger>
          </div>
          <div className="name">
            <input value="checked"
              type="checkbox"
              checked={this.props.signup.selected}
              onChange={(evt) => this.props.signup.set({selected: evt.target.checked})}/>
            <Gravatar size={24} email={this.props.signup.activist.email} />
            {this.props.signup.activist.name}
          </div>
          <div className="email">{this.props.signup.activist.email}</div>
        </ContextMenuTrigger>
      </div>
    )
    return (
      <div className="card-wrap">
        {draggable}
        <ContextMenu id={this.props.signup.cid}>
          <MenuItem onClick={_.partial(this.setSignupState, 'noshow')} >Mark as No-Show</MenuItem>
          <MenuItem onClick={_.partial(this.setSignupState, 'canceled')} >Mark as Cancelled</MenuItem>
        </ContextMenu>
      </div>
    )
  }
}

const dragSpec = {
  beginDrag(props, monitor, component) {
    props.onDragging && props.onDragging(true);
    return {signup: props.signup}
  },
}

const collect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  dragging: monitor.isDragging()
})

const ActivistDragSource = DragSource("card", dragSpec, collect);

const ActivistCard = ActivistDragSource(ActivistCardBase);
export default ActivistCard;
