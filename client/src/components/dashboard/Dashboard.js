import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import Spinner from '../layout/Spinner'
import DashboardActions from './DashboardActions'

// Redux
import { connect } from 'react-redux'
import { getCurrentProfile } from '../../actions/profile'
import { Link } from 'react-router-dom'

const Dashboard = ({
  profile: { profile, loading },
  getCurrentProfile,
  auth: { user },
}) => {
  useEffect(() => {
    getCurrentProfile()
  }, [])

  return loading && profile === null ? (
    <Spinner />
  ) : (
    <>
      <h1 className='large text-primary'>Dashboard</h1>
      <p className='lead'>
        <i className='fas fa-user'></i> Welcome {user && user.name}
      </p>
      {profile !== null ? (
        <>
          <DashboardActions />
        </>
      ) : (
        <>
          <p>You have not yet setup a profile, please add some info.</p>
          <Link to='/create-profile' className='btn btn-primary my-1'>
            Create Profile
          </Link>
        </>
      )}
    </>
  )
}

Dashboard.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
}

const mapStateToProps = (state) => {
  return {
    profile: state.profile,
    auth: state.auth,
  }
}

export default connect(mapStateToProps, { getCurrentProfile })(Dashboard)
