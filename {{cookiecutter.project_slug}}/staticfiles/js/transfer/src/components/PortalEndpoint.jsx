import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  PortalCollectionAtom,
  SearchCollectionAtom,
  SearchEndpointAtom,
  SelectedPortalItemsAtom,
} from '../state/globus';

const PortalEndpoint = (props) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [PORTAL_ENDPOINT_ID, SET_PORTAL_ENDPOINT_ID] = useState(null);
  const [transferRequest, setTransferRequest] = useState(null);

  const [portalCollection, setPortalCollection] = useRecoilState(PortalCollectionAtom);
  const [selectedPortalItems, setSelectedPortalItems] = useRecoilState(SelectedPortalItemsAtom);

  const searchCollection = useRecoilValue(SearchCollectionAtom);
  const searchEndpoint = useRecoilValue(SearchEndpointAtom);

  const [navigation, setNavigation] = useState(['/~/']);

  useEffect(() => {
    const config = JSON.parse(document.getElementById('transfer-config').innerHTML);
    SET_PORTAL_ENDPOINT_ID(config['portalEndpointID']);
    if (PORTAL_ENDPOINT_ID) { getPortalCollection() }
  }, [PORTAL_ENDPOINT_ID]);

  const getPortalCollection = async (path = null) => {
    setError(null);
    setLoading(true);
    setSelectedPortalItems([]);
    try {
      let url = `/api/endpoints/${PORTAL_ENDPOINT_ID}/ls`;
      if (path) {
        url = `${url}?path=${path}`;
      }
      let response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      var collection = await response.json();

      if ('code' in collection) {
        throw collection;
      }
    } catch (error) {
      setError(error);
    }
    setPortalCollection(collection);
    setLoading(false);
  };

  const handleBackClick = () => {
    if (navigation.length > 1) {
      const newNavigation = navigation.filter((item, index) => index !== navigation.length - 1);
      getPortalCollection(newNavigation[newNavigation.length - 1]);
      setNavigation(newNavigation);
    }
  };

  const handleDirectoryClick = (event) => {
    event.preventDefault();

    setNavigation((navigation) => {
      return [...navigation, event.target.dataset.pathName];
    });

    getPortalCollection(event.target.dataset.pathName);
  };

  const handleItemSelect = (item) => {
    const boolSelected = selectedPortalItems.some(listedItem => listedItem.name === item.name);

    if (boolSelected) {
      let filtered = selectedPortalItems.filter((selectedPortalItem) => {
        return selectedPortalItem.name != item.name;
      });
      setSelectedPortalItems(filtered);
    } else {
      setSelectedPortalItems((selectedPortalItems) => {
        return [item, ...selectedPortalItems];
      });
    }
  };


  const handleTransferToSearchEndpoint = async (event) => {
    event.preventDefault();

    setError(null);
    if (!searchEndpoint) {
      setError({
        message: 'Please search and select a destination endpoint',
        status_code: '500',
      });
      setLoading(false);
    } else {
      setLoading(true);
      const csrfToken = Cookies.get('csrftoken');
      let transferItems = [];
      for (let portalItem of selectedPortalItems) {

        let sourcePath = portalCollection['absolute_path']
        ? portalCollection['absolute_path']
        : portalCollection['path']
        sourcePath = `${sourcePath}${portalItem['name']}`;
        
        let destinationPath = searchCollection['absolute_path']
          ? searchCollection['absolute_path']
          : searchCollection['path'];
        destinationPath = `${destinationPath}${portalItem['name']}`;

        let recursive = portalItem['type'] == 'dir' ? true : false;

        transferItems.push({
          source_path: sourcePath,
          destination_path: destinationPath,
          recursive: recursive,
        });
      }

      if (transferItems.length === 0) {
        setError({ status_code: 500, message: 'Please select items to transfer'});
        setLoading(false);
      } else {
        let transferRequestPayload = {
          source_endpoint: PORTAL_ENDPOINT_ID,
          destination_endpoint: searchEndpoint['id'],
          transfer_items: transferItems,
        };

        try {
          const response = await fetch('/api/endpoints/transfer/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(transferRequestPayload),
          });
          var transferRequest = await response.json();
          if ('code' in transferRequest && transferRequest['code'] !== 'Accepted') {
            throw transferRequest;
          }
        } catch (error) {
          setError(error);
          setLoading(false);
        }
        setTransferRequest(transferRequest);
        setLoading(false);
      }
    }
  };

  if (error && error['code'] === '401 Unauthorized') {
    return (
      <div className='alert alert-danger'>
        <strong>Error {error['status_code']}: </strong>
        {error['message']} Please try <a className='alert-link' href='/login/globus'>logging in with Globus</a>.
       </div>
    )
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className='mb-4'>
      
      {error && (
        <div className='alert alert-danger'>
          <strong>Error {error['status_code']}: </strong>
          {error['message']}
        </div>
      )}

      {transferRequest && (
        <div className='alert alert-success alert-dismissible fade show'>
          <h4 className='alert-heading'>Accepted!</h4>
          <p>{transferRequest['message']}</p>
          <hr />
          <p className='mb-0'>
            <a
              className='alert-link'
              href={`https://app.globus.org/activity/${transferRequest['task_id']}`}
              target='_blank'>
              Check Status of Request <i className='fa-solid fa-arrow-up-right-from-square'></i>
            </a>
          </p>
        </div>
      )}

      <h5>Browsing Portal Source Node</h5>

      <div className='file-browser border mb-4 pb-4 pl-2 pt-2 rounded'>
        <button className='btn btn-primary btn-sm mb-2' onClick={handleBackClick}>
          Back
        </button>

        {portalCollection && portalCollection['DATA'].length > 0 &&
          portalCollection['DATA'].map((item) => {
            return (
              <div key={`${item['last_modified']}-${item['name']}`} className='form-check' style={{display:'inline-block', margin:'10px'}}>
                <div>
                <span key={item['name']} onClick={() => handleItemSelect(item)} style= {{cursor:'pointer', display:'flex', flexDirection:'right'}}>
                    {item['type'] == 'dir' ? (
                      <a
                        href='#'
                        onClick={handleDirectoryClick}
                        data-path-name={`${portalCollection.path}${item['name']}/`}>
                        <>
                          <img src='../../images/folder.png' alt='folder' style={{width:'20px', height:'20px'}}></img>
                          {item['name']}
                        </>
                      </a>
                      ) : (
                        <>
                          <img src='../../images/file.png' alt='file' style={{width:'20px', height:'20px'}}></img>
                          {item['name']}
                        </>
                      )}
                </span>
                </div>
              </div>
            );
          })}
      </div>
      
      <h5>Transfer Queue</h5>
      <div className = 'border mb-4 pb-4 pl-2 pt-2 rounded'>
        <ul>
        {selectedPortalItems.length > 0 ? (
          selectedPortalItems.map((portalItem, index) => (
            <li key = {index}> {portalItem['name'] }</li>
          ))
          ) : (
          <p>No items available to display</p>
          )}
        </ul>
      </div>

      <div style={{textAlign: 'center'}}>
        <button className='btn btn-primary' onClick={handleTransferToSearchEndpoint}>
          Initiate Transfer <i className='fa-solid fa-arrow-right'></i>
        </button>
      </div>


    </div>
  );
};

export default PortalEndpoint;
