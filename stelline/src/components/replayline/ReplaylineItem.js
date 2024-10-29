// src/components/ReplaylineItem.js
import React, { useEffect, useRef, useState } from 'react';
import './ReplaylineItem.css';
import { useNavigate } from 'react-router-dom';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코', '단체, 서버'];

const COLORS = [
  '#373584',
  '#B77DE4',
  '#DFB387',
  '#757875',
  '#D94854',
  '#50D3F0',
  '#794EB7',
  '#77A0F2',
  '#FFAABA',
  '#7AD95F',
  '#222222',
];

const ReplaylineItem = ({ title, videoIds, refCallback, id, date, members, contents }) => {
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
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('scrollPosition', scrollPosition);
    navigate(`/edit_replay/${eventId}`, { state: { id: eventId, date: eventDate, members: eventMembers, videoId: videoId, title: title, contents: contents } });
  };

  return (
    <div
      ref={itemRef}
    >
      <div className="replayline-content">
        <h1>
          {title.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h1>
        <div className="members-contents-container">
          <div className="members-display">
            <h2>멤버</h2>
            <div className="members-list">
              {members.map((member, index) => (
                member === 1 && <span key={index} className="member-tag" style={{ backgroundColor: COLORS[index] }}>{MEMBERS[index]}</span>
              ))}
            </div>
          </div>
          <div className="contents-display">
            <h2>콘텐츠</h2>
            <div className="contents-list">
              {Object.entries(contents).map(([content, isSelected], index) => (
                isSelected && <span key={index} className="content-tag">{content}</span>
              ))}
            </div>
          </div>
        </div>
        <div>
          {videoIds.map((videoId, idx) => (
            <div key={idx} className="video-item">
              {isVisible ? (
                <div>
                  <iframe
                    loading="lazy"
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${title} - Video ${idx + 1}`}
                  ></iframe>
                </div>
              ) : (
                <div
                  style={{
                    width: '560px',
                    height: '315px',
                    backgroundColor: '#f0f0f0', // 자리 표시자 배경색
                  }}
                ></div>
              )}
              <button className="edit-button" onClick={() => handleEditReplayEvent(id, date, members, videoId, title, contents)}>
                수정
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReplaylineItem;