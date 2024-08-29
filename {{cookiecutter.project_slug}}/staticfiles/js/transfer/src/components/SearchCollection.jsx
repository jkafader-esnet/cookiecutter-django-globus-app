import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  SearchCollectionAtom,
  SearchEndpointAtom,
  SelectedSearchItemsAtom,
} from '../state/globus';


const SearchCollection = (props) => {
  const [error, setError] = useState(null);
  const [searchEndpoint, setSearchEndpoint] = useRecoilState(SearchEndpointAtom);
  const [selectedSearchItems, setSelectedSearchItems] = useRecoilState(SelectedSearchItemsAtom);
  
  const searchCollection = useRecoilValue(SearchCollectionAtom);

  const navigate = useNavigate();

  useEffect(() => {
    getEndpoint();
  }, [props['endpointID']]);

  const getEndpoint = async () => {
    try {
      let response = await fetch(`/api/endpoints/${props['endpointID']}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      var endpoint = await response.json();
      if ('code' in endpoint) {
        throw endpoint;
      }
    } catch (error) {
      setError(error);
    }
    setSearchEndpoint(endpoint);
  };

  const handleItemSelect = (event) => {
    if (event.target.checked) {
      setSelectedSearchItems((selectedSearchItems) => {
        return [JSON.parse(event.target.value), ...selectedSearchItems];
      });
    } else {
      const removeItem = JSON.parse(event.target.value);
      let filtered = selectedSearchItems.filter((selectedSearchItem) => {
        return selectedSearchItem.name != removeItem.name;
      });
      setSelectedSearchItems(filtered);
    }
  };

  if (error) {
    return (
      <div className='alert alert-danger'>
        <strong>Error {error['status_code']}: </strong>{error['message']}
      </div>
    );
  }

  return (
    <div></div>
  );
};

export default SearchCollection;
