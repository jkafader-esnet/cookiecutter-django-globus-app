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

      <br/>
      <br/>
      <br/>
      <h5>Browsing Portal Source Node</h5>

      <div className='file-browser border mb-4 pb-4 pl-2 pt-2 rounded'>
        <div className = 'row'>
        
        <div className = 'col-12'>
        <button className='btn btn-primary btn-sm mb-2' onClick={handleBackClick}>
          Back
        </button>
        {/* add search bar and tail */}
        </div>

        {portalCollection && portalCollection['DATA'].length > 0 &&
          portalCollection['DATA'].map((item) => {
            return (
              <div key={`${item['last_modified']}-${item['name']}`} className = 'col-3' style= {{cursor:'pointer', textAlign: 'center'}}>
                    {item['type'] == 'dir' ? (
                      <a
                        href='#'
                        onClick={handleDirectoryClick}
                        data-path-name={`${portalCollection.path}${item['name']}/`}
                        to={{
                          pathname: `/${props['endpointID']}/${item['name']}/`,
                          search: `?absolutePath=${searchCollection['path']}`,
                        }}>
                        
                          {/* <img src='../../static/folder.png' alt='folder' style={{marginTop: '20px', height:'60px'}}></img> */}
                          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M6.26218 9.59562C8.13755 7.72025 10.6811 6.66669 13.3333 6.66669H26.4505C28.0976 6.67521 29.717 7.09048 31.165 7.87553C32.6038 8.6556 33.829 9.77681 34.7332 11.1406L37.4521 15.1194L37.4838 15.1667C37.7858 15.6253 38.1963 16.0021 38.679 16.2638C39.1596 16.5243 39.6968 16.6627 40.2434 16.6667H66.6666C69.3188 16.6667 71.8623 17.7203 73.7377 19.5956C75.613 21.471 76.6666 24.0145 76.6666 26.6667V60C76.6666 62.6522 75.613 65.1957 73.7377 67.0711C71.8623 68.9464 69.3188 70 66.6666 70H13.3333C7.82564 70 3.33325 65.5076 3.33325 60V16.6667C3.33325 14.0145 4.38682 11.471 6.26218 9.59562ZM13.3333 13.3334C12.4492 13.3334 11.6014 13.6845 10.9762 14.3097C10.3511 14.9348 9.99992 15.7826 9.99992 16.6667V60C9.99992 61.8257 11.5075 63.3334 13.3333 63.3334H66.6666C67.5506 63.3334 68.3985 62.9822 69.0236 62.357C69.6487 61.7319 69.9999 60.8841 69.9999 60V26.6667C69.9999 25.7826 69.6487 24.9348 69.0236 24.3097C68.3985 23.6845 67.5506 23.3334 66.6666 23.3334H40.216C38.5689 23.3248 36.9495 22.9096 35.5015 22.1245C34.0627 21.3444 32.8375 20.2232 31.9333 18.8594L29.2144 14.8807L29.1827 14.8333C28.8807 14.3748 28.4702 13.9979 27.9875 13.7362C27.507 13.4757 26.9697 13.3374 26.4232 13.3334H13.3333Z" fill="#62CAF5"/>
                          </svg>

                          <p>{item['name']}</p>
                      </a>
                      ) : (
                      <a 
                        onClick={() => handleItemSelect(item)}> 
                          {/* <img src='../../static/file.png' alt='file' style={{marginTop: '20px', width:'60px'}}></img> */}
                          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.9291 6.26218C14.8044 4.38682 17.348 3.33325 20.0001 3.33325H48.3335C49.2175 3.33325 50.0654 3.68444 50.6905 4.30956L69.0238 22.6429C69.6489 23.268 70.0001 24.1159 70.0001 24.9999V66.6666C70.0001 69.3188 68.9465 71.8623 67.0712 73.7377C65.1958 75.613 62.6523 76.6666 60.0001 76.6666H20.0001C17.348 76.6666 14.8044 75.613 12.9291 73.7377C11.0537 71.8623 10.0001 69.3188 10.0001 66.6666V13.3333C10.0001 10.6811 11.0537 8.13755 12.9291 6.26218ZM20.0001 9.99992C19.1161 9.99992 18.2682 10.3511 17.6431 10.9762C17.018 11.6014 16.6668 12.4492 16.6668 13.3333V66.6666C16.6668 67.5506 17.018 68.3985 17.6431 69.0236C18.2682 69.6487 19.1161 69.9999 20.0001 69.9999H60.0001C60.8842 69.9999 61.732 69.6487 62.3571 69.0236C62.9823 68.3985 63.3335 67.5506 63.3335 66.6666V26.3806L46.9527 9.99992H20.0001Z" fill="#62CAF5"/>
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M46.6668 3.33325C48.5078 3.33325 50.0002 4.82564 50.0002 6.66659V23.3333H66.6668C68.5078 23.3333 70.0002 24.8256 70.0002 26.6666C70.0002 28.5075 68.5078 29.9999 66.6668 29.9999H46.6668C44.8259 29.9999 43.3335 28.5075 43.3335 26.6666V6.66659C43.3335 4.82564 44.8259 3.33325 46.6668 3.33325Z" fill="#62CAF5"/>
                          </svg>
                          <p>{item['name']}</p>
                      </a> 
                      )}
              </div>
            );
          })}
          </div>
      </div>
      <br/>
      <br/>
      <br/>
      <h5>Transfer Queue</h5>
      <div className = 'border mb-4 pb-4 pl-2 pt-2 rounded'>
        <ul className='transfer-queue'>
        {selectedPortalItems.length > 0 ? (
          selectedPortalItems.map((portalItem, index) => (
            <li className='transfer-queue-item' key = {index}> {portalItem['name'] }</li>
          ))
          ) : (
          <p>No items available to display</p>
          )}
        </ul>
      </div>
      <br/>
      <br/>
      <br/>

      <div style={{textAlign: 'center', marginBottom: '100px'}}>
        <button className='btn btn-primary' onClick={handleTransferToSearchEndpoint}>
          Initiate Transfer <i className='fa-solid fa-arrow-right'></i>
        </button>
      </div>


    </div>
  );
};

export default PortalEndpoint;
