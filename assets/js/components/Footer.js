import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Footer = (props) => (
    <footer>
        <div className="row">
            <div className="small-6 columns">
                <p>Made with ❤ in Oakland, CA</p>
            </div>
            <div className="small-6 columns" style={{textAlign: 'right'}}>
                <p><a href={props.slackUrl}><FontAwesomeIcon icon='lock' /> Login</a></p>
            </div>
        </div>
    </footer>
)

export default Footer
