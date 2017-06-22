import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu'
import _ from 'lodash'
import { Checkbox } from 'react-form'

class ActivistCardBase extends React.Component {
  render() {
    const classes = "card " +
                    (this.props.dragging ? "dragging " : "");
    const draggable = this.props.connectDragSource(
      <div className={classes} key={this.props.activist.cid}>
        <ContextMenuTrigger id={this.props.activist.cid}>
          <div className="right">
            <div className={"rank rank-" + this.props.activist.rank}>{this.props.activist.rank}</div>
            <ContextMenuTrigger showOnClick={true} holdToDisplay={-1} id={this.props.activist.cid}>
              <button className="options"><i className="fa fa-ellipsis-v" /></button>
            </ContextMenuTrigger>
          </div>
          <div className="name">
            <Gravatar size={24} email={this.props.activist.email} />
            {this.props.activist.name}
          </div>
          <div className="email">{this.props.activist.email}</div>
        </ContextMenuTrigger>
      </div>
    )
    return (
      <div className="card-wrap">
        {draggable}
        <ContextMenu id={this.props.activist.cid}>
        </ContextMenu>
      </div>
    )
  }
}

const dragSpec = {
  beginDrag(props, monitor, component) {
    props.onDragging && props.onDragging(true);
    return {activist: props.activist}
  },
}

const collect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  dragging: monitor.isDragging()
})

const ActivistDragSource = DragSource("activist", dragSpec, collect);

const ActivistCard = ActivistDragSource(ActivistCardBase);
export default ActivistCard;
