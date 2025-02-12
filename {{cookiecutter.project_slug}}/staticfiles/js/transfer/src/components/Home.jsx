import { Outlet } from 'react-router-dom';
import React, { useState } from 'react';

import PortalEndpoint from './PortalEndpoint.jsx';
import SearchEndpointLink from './SearchEndpointLink.jsx';

const Home = (props) => {
  const [endpointSearchText, setEndpointSearchText] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchEndpoints, setSearchEndpoints] = useState([]);

  const endpointRef = React.createRef();

  const handleEndpointClick = (event) => {
    endpointRef.current.style.display = 'none';
  };

  const handleEndpointSearchTextChange = (event) => {
    setEndpointSearchText(event.currentTarget.value);
  };

  const doSearch = async(event)=>{
    event.preventDefault();
    setSearchEndpoints([]);
    setLoading(true);
    let endpointsSearchURL = `/api/endpoints?filter_fulltext=${endpointSearchText}`;
    try {
      let response = await fetch(endpointsSearchURL, {
        headers: {
          Allow: 'application/data',
          'Content-Type': 'application/data',
        },
      });
      var searchEndpoints = await response.json();
      if ('code' in searchEndpoints) {
        throw searchEndpoints;
      }
    } catch (error) {
      setError(error);
    }
    if (searchEndpoints.length > 0) {
      setSearchEndpoints(searchEndpoints);
    } else {
      setSearchEndpoints({ empty: true });
    }
    setLoading(false);
  }

  if (error) {
    return (
      <div className='alert alert-danger'>
        <strong>Error {error['status_code']}: </strong>
        {error['message']}
      </div>
    );
  }

  return (
    <div id='transfer-home' className='container-fluid mt-4'>
      <div className='row'>
        <div className='col-10 mb-4' style={{marginLeft: 'auto', marginRight: 'auto'}}>
          
          <h5>Destination Node</h5>
          <form action='#' onSubmit={doSearch} className='row px-3'>
            <input
              id='endpoint-input'
              className='form-control col-10 rounded-left'
              placeholder='Search'
              type='text'
              style={{ borderBottomRightRadius: 0, borderTopRightRadius: 0, borderRight:0 }}
              value={searchEndpoints['display_name'] || endpointSearchText}
              onChange={handleEndpointSearchTextChange}
            />
            <button
              id='endpoint-search-button'
              className='col-2 rounded-right'
              style={{borderWidth:"1px", borderColor:"#BBB", borderStyle:"solid" }}
            >Search</button>
          </form>

          {/* 
            Endpoints will render here when the SearchEndpointLink is clicked below. 
            See App.jsx nested routing for more details. 
          */}
          <Outlet />

          {loading && <p>Loading...</p>}

          {searchEndpoints.length > 0 && (
            <div id='endpoints' ref={endpointRef}>
              <div className='list-group'>
                {searchEndpoints.map((endpoint) => {
                  return (
                    <SearchEndpointLink
                      key={endpoint['id']}
                      endpoint={endpoint}
                      handleEndpointClick={handleEndpointClick}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {searchEndpoints['empty'] && <h5 className='mt-4'>Nothing found</h5>}
        </div>
        <br/>
        <br/>
        <br/>

        <div className='col-10' style={{marginLeft: 'auto', marginRight: 'auto'}}>
          <PortalEndpoint />
        </div>

      </div>
    </div>

  );
};

export default Home;
