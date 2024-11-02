import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../shared/Edit.css';
import { MEMBERS } from '../../consts';

const EditTimeEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, date, members: initialMembers, videoIds, title } = location.state || {};

  const [eventDate, setEventDate] = useState(date || '');
  const [selectedMembers, setSelectedMembers] = useState(initialMembers || Array(MEMBERS.length).fill(0));
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (e) => {
    setEventDate(e.target.value);
  };

  const handleMemberChange = (index) => {
    const updatedMembers = [...selectedMembers];
    updatedMembers[index] = updatedMembers[index] === 1 ? 0 : 1;
    setSelectedMembers(updatedMembers);
  };

  const handleSave = () => {
    setIsLoading(true);
    axios.put(`${process.env.REACT_APP_API_URL}/api/timeline/${id}`, {
      date: eventDate,
      members: selectedMembers,
    })
      .then(() => {
        setIsLoading(false);
        navigate('/timeline', { state: { restoreScroll: true } });
      })
      .catch((error) => {
        console.error('Error updating event:', error);
        setIsLoading(false);
      });
  };

  return (
    <div className="edit-event-container">
      <h1>태그 수정</h1>
      {isLoading ? (
        <div>저장 중...</div>
      ) : (
        <>
          <div className="edit-event-form">
            <h2>{title}</h2>
            <div>
              {videoIds.map((videoId, idx) => (
                <div className="video-section">
                  <iframe
                    className='responsive-video-iframe'
                    loading="lazy"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${title} - Video ${idx + 1}`}
                  ></iframe>
                </div>
              ))}
            </div>
            <label>
              날짜:
              <input type="date" value={eventDate} onChange={handleDateChange} />
            </label>

            <div className="edit-members-contents">
              <div className="edit-members">
                <h4>멤버:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {MEMBERS.map((member, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1px' }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers[index] === 1}
                        onChange={() => handleMemberChange(index)}
                      />{' '}
                      {member}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button className="save-button" onClick={handleSave}>저장</button>
          <button className="cancel-button" onClick={() => navigate('/timeline', { state: { restoreScroll: true } })}>취소</button>
        </>
      )}
    </div>
  );
};

export default EditTimeEvent;
