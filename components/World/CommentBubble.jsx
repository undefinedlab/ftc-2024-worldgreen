import React from 'react';

const EventPopup = ({ event }) => {
  if (!event) return null;

  return (
    <div className="center">
      <div className="comment-item">
        <div className="author">
          <img src={event.avatar} alt={event.name} />
          <span>@{event.name.split(' ')[0].toLowerCase()}</span>
        </div>
        <div className="comment">{event.message}</div>
      </div>
    </div>
  );
};

export default EventPopup;