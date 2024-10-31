// src/components/TimelineItem.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../shared/Item.css';
import { MEMBERS, COLORS } from '../../consts';

const TimelineItem = ({ title, videoIds, refCallback, id, date, members }) => {
  const itemRef = useRef(null);
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!itemRef.current) return;

    // `itemRef`를 복사하여 사용
    const currentItemRef = itemRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    if (refCallback) {
      refCallback(itemRef.current);
    }

    return () => {
      if (currentItemRef.current) {
        observer.unobserve(currentItemRef.current);
      }
    };
  }, [refCallback]);

  const handleEditTimeEvent = (eventId, eventDate, eventMembers, videoIds, title) => {
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('scrollPosition', scrollPosition);

    navigate(`/edit_time/${eventId}`, { state: { id: eventId, date: eventDate, members: eventMembers, videoIds: videoIds, title: title } });
  };

  return (
    <div
      ref={itemRef}
    >
      <div className="content">
        <h1>
          {title.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h1>
        <div className="list-container">
          <div className="display">
            <div className="list">
              {members.map((member, index) => (
                member === 1 && <span key={index} className="tag" style={{ backgroundColor: COLORS[index] }}>{MEMBERS[index]}</span>
              ))}
            </div>
          </div>
        </div>
        <div>
          {videoIds.map((videoId, idx) => (
            <div key={idx} className='video-item'>
              {isVisible ? (
                <div>
                  <iframe
                    className='responsive-video-iframe'
                    loading="lazy"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${title} - Video ${idx + 1}`}
                  ></iframe>
                </div>
              ) : (
                <div className='responsive-video-iframe'
                ></div>
              )}
            </div>
          ))}
          <button className="edit-button" onClick={() => handleEditTimeEvent(id, date, members, videoIds, title)}>
            수정
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
