import React, { useState, useEffect } from 'react';
import { customerApi } from '../utils/api';

const CustomerSearch = ({ onSelect, selectedCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchCustomers = async () => {
      if (searchTerm.length < 2) {
        setCustomers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await customerApi.search(searchTerm);
        setCustomers(response.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="customer-search">
      <input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {selectedCustomer && (
        <div className="selected-customer">
          {selectedCustomer.first_name} {selectedCustomer.last_name}
          <button onClick={() => onSelect(null)}>×</button>
        </div>
      )}

      {!selectedCustomer && searchTerm.length >= 2 && (
        <div className="search-results">
          {loading ? (
            <div>Loading...</div>
          ) : customers.length > 0 ? (
            <ul>
              {customers.map(customer => (
                <li 
                  key={customer.customer_id} 
                  onClick={() => {
                    onSelect(customer);
                    setSearchTerm('');
                    setCustomers([]);
                  }}
                >
                  {customer.first_name} {customer.last_name} - {customer.phone}
                </li>
              ))}
            </ul>
          ) : (
            <div>No customers found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;