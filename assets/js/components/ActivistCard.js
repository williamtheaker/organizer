import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import _ from 'lodash'
import { Checkbox } from 'react-form'
import { Card, CardHeader, Avatar } from 'material-ui'

class ActivistCardBase extends React.Component {
  render() {
    const classes = "card " +
                    (this.props.dragging ? "dragging " : "");
    const draggable = this.props.connectDragSource(
      <div>
        <Card className={classes}>
          <CardHeader
            title={this.props.activist.name}
            subtitle={this.props.activist.email}
            avatar={<Avatar className={"rank-"+this.props.activist.rank}>{this.props.activist.rank}</Avatar>} />
        </Card>
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
