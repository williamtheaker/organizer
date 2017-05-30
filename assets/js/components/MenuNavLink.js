import React from 'react'
import { Route, Link } from 'react-router-dom'

export default ({
  to,
  exact,
  strict,
  location,
  activeClassName,
  className,
  activeStyle,
  style,
  isActive: getIsActive,
  children
}) => (
  <Route
    path={to}
    exact={exact}
    strict={strict}
    location={location}
    children={({ location, match }) => {
      const isActive = !!(getIsActive ? getIsActive(match, location) : match)

      return (
        <li className={isActive ? [className, (activeClassName ? activeClassName : "active")].filter(i => i).join(' ') : className}>
          <Link to={to}>{children}</Link>
        </li>
      )
    }}
  />
);


