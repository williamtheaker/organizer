import React from 'react'
import objectPath from 'object-path'
import _ from 'lodash'

export class Cell extends React.Component {
  render() {
    const value = objectPath.get(this.props.row, this.props.column.value);
    if (typeof value == "object") {
      return (
        <span>{JSON.stringify(value)}</span>
      )
    } else {
      return (
        <span>{value}</span>
      )
    }
  }
}

export class Row extends React.Component {

  render() {
    const row = this.props.row;
    const cells = _.map(this.props.columns, (column) => {
      const CellComponent = column.cell || Cell;
      return (
        <td key={column.value}>
          <CellComponent row={this.props.row} column={column} />
        </td>
      )
    });
    return (
      <tr>
        <td><input type="checkbox" value={this.props.row.id} onChange={(evt) => this.props.onSelectedChange(evt.target.checked)} checked={this.props.selected}/></td>
        {cells}
      </tr>
    )
  }
}

export class Header extends React.Component {
  render() {
    return (
      <th>{this.props.column.label}</th>
    )
  }
}

export class Table extends React.Component {
  defaultColumns() {
    return _.map(_.keys(this.props.store_data.visible[0]), (key) => {
      return {
        label: key,
        value: key
      }
    });
  }

  render() {
    const columns = this.props.columns || this.defaultColumns();

    const RowComponent = this.props.row || Row;
    const rows = _.map(this.props.store_data.visible, (row) => (
      <RowComponent
        key={row.id}
        row={row}
        columns={columns}
        selected={this.props.store.isSelected(row.id)}
        onSelectedChange={(selected) => this.props.store.setSelected(row.id, selected)} />
    ));

    const headers = _.map(columns, (column) => {
      const HeaderComponent = column.header || Header;
      return (
        <HeaderComponent
          key={column.label}
          column={column}
          onFilterChanged={
            (value) => {
              this.props.store.setFilter(column.value, value);
            }} />
      )
    });

    return (
      <table className="data-table hover">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={(evt) => {this.props.store.setAllSelected(evt.target.checked)}} checked={this.props.store.areAllSelected()}/></th>
            {headers}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }
}
