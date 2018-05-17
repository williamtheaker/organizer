import React from 'react'
import ReactDOM from 'react-dom'
import { MapControl, Map, Popup, Marker, Circle, CircleMarker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { FlatButton, Divider, Paper } from 'material-ui'
import _ from 'lodash'
import { connect } from 'react-redux'
import { getMembers } from '../selectors'
import { Model } from '../actions'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import MarkerClusterGroup from 'react-leaflet-markercluster/src/react-leaflet-markercluster'
import LocateControl from 'leaflet.locatecontrol'
import geolib from 'geolib'
import { Portal } from 'react-portal'
import copy from 'copy-to-clipboard'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerRetinaIcon from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl;

class Box extends L.Control {
  onAdd(map) {
    this.div = L.DomUtil.create('div');
    L.DomEvent.disableClickPropagation(this.div);
    return this.div;
  }
}

class BoxControl extends MapControl {
  createLeafletElement() {
    return new Box();
  }

  updateLeafletElement() {
  }

  render() {
    return (
      <Portal node={this.leafletElement.div}>
        {this.props.children}
      </Portal>
    );
  }
}

class BetterMap extends Map {
  createLeafletElement(props) {
    console.log('create');
    const ret = super.createLeafletElement(props);
    this.onMapCreated(ret);
    return ret;
  }
}

class LocalMap extends BetterMap {
  onMapCreated(map) {
    console.log('created', map, L);
    var lc = L.control.locate({
      keepCurrentZoomLevel: true,
      locateOptions: {
        enableHighAccuracy: true,
      }
    }).addTo(map);
    lc.start();

    map.on('click', this.props.onClick);
    map.on('locationfound', this.props.onLocationFound);
  }
}

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerRetinaIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

class MapEngineBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      people: [],
      focusPoint: null,
      totalRecords: 0,
      processedRecords: 0,
      locals: [],
      // Roughly 1 mile, in meters
      searchRadius: 1200
    };
    this.updateMembers();
    this.copyEmails = this.copyEmails.bind(this);
    this.updateMembers = this.updateMembers.bind(this);
  }

  setFocusPoint(loc) {
    this.setState({
      focusPoint: loc
    }, () => this.updateLocals());
  }

  componentWillReceiveProps(nextProps) {
    this.updateLocals()
  }

  updateLocals() {
    console.log('locating people within %s meters...', this.state.searchRadius);
    const geoChecker = person => !_.isEmpty(person.geo);
    const geoPeople = _.filter(this.props.members, geoChecker);
    const locals = _.filter(geoPeople, p => {
      const personLoc = [p.geo.lat, p.geo.lng];
      if (geolib.isPointInCircle(
        {latitude: personLoc[0], longitude: personLoc[1]},
        {latitude: this.state.focusPoint.lat, longitude: this.state.focusPoint.lng},
        this.state.searchRadius)) {
        return true;
      }
      return false;
    });

    this.setState({locals: locals});
  }

  updateMembers(e) {
    this.props.dispatch(Model.fetchModels('members'), {
      view: 'Everyone',
      fields: ['Name', 'Geocode Cache', 'Full Address', 'Membership Basis']
    });
  }

  copyEmails(e) {
    const emails = _.map(this.state.locals, l => l.Email);
    copy(emails.join(','));
  }

  render() {
    const geoChecker = person => !_.isEmpty(person.geo);
    const geoPeople = _.filter(this.props.members, geoChecker);
    const markers = _.map(geoPeople, person => {
      const position = [person.geo.lat, person.geo.lng];
      return {
        position: position,
        popup: person.Name,
        tooltip: person.Name
      };
    });

    const people = _.map(this.state.locals, person => {
      return (
        <p>{person.Name}</p>
      );
    });

    const locator = this.state.focusPoint ? (
      <Circle center={this.state.focusPoint}
        color="cyan" radius={this.state.searchRadius} />
    ) : null;

    return (
        <LocalMap
          onClick={e => this.setFocusPoint(e.latlng)}
          onLocationFound={e => this.setFocusPoint(e.latlng)}
          zoom={12}
          center={[0, 0]}>
          <HeatmapLayer
            longitudeExtractor={(p) => p.geo.lng}
            latitudeExtractor={(p) => p.geo.lat}
            intensityExtractor={(p) => 50}
            points={geoPeople} />
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; OpenStreetMap contributors' />
          <BoxControl>
            <Paper zDepth={2} style={{padding: "1rem"}}>
              <p><FlatButton label="Copy e-mails" onClick={this.copyEmails} /></p>
              <p><FlatButton label="Update memberss" onClick={this.updateMembers} /></p>
              {people}
            </Paper>
          </BoxControl>
          {locator}
          <MarkerClusterGroup markers={markers} />
        </LocalMap>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    members: getMembers(state),
  }
}

const MapEngine = connect(mapStateToProps)(MapEngineBase);

const MapIndex = (props) => {
  return (
    <div className="row the-app">
      <div className="small-12 columns">
        <div className="membership-map">
          <MapEngine />
        </div>
      </div>
    </div>
  );
}

export default MapIndex;
