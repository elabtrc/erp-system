import React, { useState } from 'react';
  import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    getDay,
    isBefore
  } from 'date-fns';

  const Calendar = ({ onDateSelect, branch }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const today = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Get the weekday index of the first and last day (0 = Sunday, 6 = Saturday)
    const firstDayIndex = getDay(monthStart);
    const lastDayIndex = getDay(monthEnd);
    const totalEmptyEnd = 6 - lastDayIndex; // Empty spaces after the last day

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={prevMonth} className="nav-button">◀</button>
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="nav-button">▶</button>
        </div>
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}

          {/* Empty placeholders for alignment (before the start of the month) */}
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-start-${index}`} className="calendar-day empty"></div>
          ))}

          {monthDays.map(day => {
            const dayNumber = format(day, 'd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isPast = isBefore(day, today) || isSameDay(day, today);
            const isAvailable = isCurrentMonth && (!isPast || isToday);

            const handleClick = () => {
              if (!isPast && isCurrentMonth) {
                onDateSelect(day);
              }
            };            

            return (
              <div 
                key={day.toString()}
                className={`calendar-day 
                  ${isPast ? 'past-day' : ''} 
                  ${isAvailable ? 'available-day' : ''}`}
                onClick={handleClick}
              >
                {dayNumber}
              </div>
            );
          })}

          {/* Empty placeholders for alignment (after the last day of the month) */}
          {Array.from({ length: totalEmptyEnd }).map((_, index) => (
            <div key={`empty-end-${index}`} className="calendar-day empty"></div>
          ))}
        </div>
      </div>
    );
  };

  export default Calendar;
