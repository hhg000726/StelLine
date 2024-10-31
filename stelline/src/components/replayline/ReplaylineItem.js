// src/components/ReplaylineItem.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../shared/Item.css';
import { MEMBERS, COLORS } from '../../consts';

const ReplaylineItem = ({ title, videoIds, refCallback, id, date, members, contents, listRef}) => {
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

  const handleEditReplayEvent = (eventId, eventDate, eventMembers, videoId, title, contents) => {
    // 현재 스크롤 위치 저장
    const scrollPosition = listRef.current.state.scrollOffset;
    sessionStorage.setItem('scrollPosition', scrollPosition);
    navigate(`/edit_replay/${eventId}`, { state: { id: eventId, date: eventDate, members: eventMembers, videoId: videoId, title: title, contents: contents } });
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
            <h2>멤버</h2>
            <div className="list">
              {members.map((member, index) => (
                member === 1 && <span key={index} className="tag" style={{ backgroundColor: COLORS[index] }}>{MEMBERS[index]}</span>
              ))}
            </div>
          </div>
          <div className="display">
            <h2>콘텐츠</h2>
            <div className="list">
              {Object.entries(contents).map(([content, isSelected], index) => (
                isSelected && <span key={index} className="tag">{content}</span>
              ))}
            </div>
          </div>
        </div>
        <div>
          {videoIds.map((videoId, idx) => (
            <div>
              <div key={idx} className="video-item">
                {isVisible ? (
                  <div>
                    <iframe className='responsive-video-iframe'
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
              <div>
                <button className="edit-button" onClick={() => handleEditReplayEvent(id, date, members, videoId, title, contents)}>
                  수정
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReplaylineItem;