import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BranchPanel from './BranchPanel';
import Calendar from './Calendar';
import BookingModal from './BookingModal';
import './Styles.css';

const branches = [
  {
    id: 1,
    name: 'Imus Branch',
    location: 'Nueno Ave, Imus, Cavite',
    schedule: 'Mon-Sun: 9AM-7:30PM',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Dasma Bayan Branch',
    location: 'Unit 6, LIDOR Commercial Complex, Dasmariñas, Cavite',
    schedule: 'Mon-Sun: 9AM-7:30PM',
    image: 'https://images.unsplash.com/photo-1519664824562-b4bc73f9795a?w=500&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Molino Branch',
    location: '2nd Flr, Randys Commercial Building, 0345 Avenida Rizal, Bacoor, Cavite',
    schedule: 'Mon-Sun: 9AM-7PM',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Lancaster Branch',
    location: 'Advincula Ave, Kawit, Cavite',
    schedule: 'Mon-Sun: 9AM-7PM',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&auto=format&fit=crop'
  }
];

function BookingPage() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('salonToken'); // or sessionStorage
    if (!token) {
      navigate('/login'); // redirect to login if not logged in
    }

    document.body.classList.add('booking-page');
    return () => document.body.classList.remove('booking-page');
  }, [navigate]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
  };

  const handleDateSelect = (date) => {
    if (selectedBranch) {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const handleBookingSubmit = (bookingData) => {
    console.log('Booking confirmed:', {
      branch: selectedBranch,
      date: selectedDate,
      ...bookingData
    });
    setShowModal(false);
    alert(`Booking confirmed at ${selectedBranch.name}!`);
  };

  return (
    <div className="booking-app-container">
      <header className="booking-header">
        <h1>F.A. 101 Salon and Spa</h1>
      </header>

      <main className="booking-main-content">
        <BranchPanel 
          branches={branches} 
          selectedBranch={selectedBranch} 
          onSelect={handleBranchSelect} 
        />

        <div className="booking-calendar-container">
          {selectedBranch ? (
            <>
              <div className="calendar-header-info">
                <h2>Available Dates at {selectedBranch.name}</h2>
                <p>Click on a date to book an appointment</p>
              </div>
              <Calendar onDateSelect={handleDateSelect} branch={selectedBranch} />
            </>
          ) : (
            <div className="no-branch-selected">
              <div className="prompt-icon">!</div>
              <p>Please select a branch to view available dates</p>
            </div>
          )}
        </div>
      </main>

      {showModal && selectedBranch && selectedDate && (
        <BookingModal
          branch={selectedBranch}
          date={selectedDate}
          onClose={() => setShowModal(false)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
}

export default BookingPage;