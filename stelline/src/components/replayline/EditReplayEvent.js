import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditReplayEvent.css';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
const CONTENTS = ['종합게임', '공포게임', '노래', '서버', '기념일', '내부 합방', '외부 합방', '최초 공개', '팬게임', '월드컵', '특별 컨텐츠', '대회'];

const EditReplayEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, date, members: initialMembers, videoId, title, contents: initialContents } = location.state || {};

  const [eventDate, setEventDate] = useState(date || '');
  const [selectedMembers, setSelectedMembers] = useState(initialMembers || Array(MEMBERS.length).fill(0));
  const [selectedContents, setSelectedContents] = useState(initialContents || CONTENTS.reduce((acc, content) => {
    acc[content] = false;
    return acc;
  }, {}));
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (e) => {
    setEventDate(e.target.value);
  };

  const handleMemberChange = (index) => {
    const updatedMembers = [...selectedMembers];
    updatedMembers[index] = updatedMembers[index] === 1 ? 0 : 1;
    setSelectedMembers(updatedMembers);
  };

  const handleContentChange = (content) => {
    setSelectedContents((prevContents) => ({
      ...prevContents,
      [content]: !prevContents[content],
    }));
  };

  const handleSave = () => {
    setIsLoading(true);
    axios.put(`${process.env.REACT_APP_API_URL}/api/replayline/${id}`, {
      date: eventDate,
      members: selectedMembers,
      contents: selectedContents,
    })
      .then(() => {
        setIsLoading(false);
        navigate('/replayline', { state: { restoreScroll: true } });
      })
      .catch((error) => {
        console.error('Error updating event:', error);
        setIsLoading(false);
      });
  };

  return (
    <div className="edit-event-container">
      <h1>필터 수정</h1>
      {isLoading ? (
        <div>저장 중...</div>
      ) : (
        <>
          <div className="edit-event-form">
            <div className="video-section">
              <h3>제목: {title}</h3>
              {videoId && (
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
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

              <div className="edit-contents">
                <h4>콘텐츠:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {CONTENTS.map((content, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1px' }}>
                      <input
                        type="checkbox"
                        checked={selectedContents[content]}
                        onChange={() => handleContentChange(content)}
                      />{' '}
                      {content}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button className="save-button" onClick={handleSave}>저장</button>
          <button className="cancel-button" onClick={() => navigate('/replayline', { state: { restoreScroll: true } })}>취소</button>
        </>
      )}
    </div>
  );
};

export default EditReplayEvent;
