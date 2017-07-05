import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import _ from 'lodash'
import { Checkbox } from 'react-form'
import { Card, CardHeader, Avatar } from 'material-ui'

const ActivistCardBase = (props) => {
  const classes = "activist-card " +
                  (props.dragging ? "dragging " : "");
  const draggable = props.connectDragSource(
    <div>
      <Card className={classes}>
        <CardHeader
          title={props.activist.name}
          subtitle={props.activist.email}
          avatar={<Avatar className={"rank-"+props.activist.rank}>{props.activist.rank}</Avatar>} />
      </Card>
    </div>
  )
  return (
    <div className="activist-card-wrap">
      {draggable}
    </div>
  )
}

const dragSpec = {
  beginDrag(props, monitor, component) {
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
