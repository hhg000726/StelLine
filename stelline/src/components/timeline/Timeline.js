// src/components/Timeline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TimelineItem from './TimelineItem';
import './Timeline.css';
import axios from 'axios';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
const MEMBERS_ONE = ['칸', '유', '히', '시', '맂', '타', '부', '린', '나', '맄'];

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

// Group events by date using reduce
const groupEventsByDate = (events) => {

  return events.reduce((grouped, event) => {
    if (!grouped[event.date]) {
      grouped[event.date] = [];
    }
    grouped[event.date].push(event);
    return grouped;
  }, {});
};

const Timeline = () => {
  const itemRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const [eventsCopy, setEventsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTextTime, setsearchTextTime] = useState('');
  const [selectedMembersTime, setselectedMembersTime] = useState(Array(10).fill(0));  // 멤버 필터링용 상태
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [visibleDates, setVisibleDates] = useState([]);
  const [filterOperation, setFilterOperation] = useState('AND');  // AND 또는 OR 선택
  const [navOpen, setNavOpen] = useState(false); // 내비게이션 열림 상태 관리

  useEffect(() => {
    // 필터 상태 복원
    const savedsearchTextTime = sessionStorage.getItem('searchTextTime');
    const savedselectedMembersTime = sessionStorage.getItem('selectedMembersTime');
    const savedFilterOperation = sessionStorage.getItem('filterOperation');

    if (savedsearchTextTime) setsearchTextTime(savedsearchTextTime);
    if (savedselectedMembersTime) setselectedMembersTime(JSON.parse(savedselectedMembersTime));
    if (savedFilterOperation) setFilterOperation(savedFilterOperation);
  }, []);

  useEffect(() => {
    // 데이터 요청
    axios.get(`${process.env.REACT_APP_API_URL}/api/timeline`)
      .then((response) => {
        const modifiedData = response.data.map((event) => ({
          ...event,
          members: JSON.parse(event.members), // JSON 문자열을 파싱하여 리스트로 변환
          videoIds: JSON.parse(event.videoIds) // videoIds도 마찬가지로 파싱
        }));
        setEventsCopy(modifiedData); // 데이터 상태에 저장
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoading && location.state?.restoreScroll) {
      // 컴포넌트 렌더링 후 스크롤 복원을 위해 setTimeout 사용
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
        }, 100);
      }
    }
  }, [isLoading, location.state]);

  // Lazy load items based on visibility
  useEffect(() => {
    if (eventsCopy.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleDates((prevDates) => {
              if (!prevDates.includes(entry.target.dataset.date)) {
                return [...prevDates, entry.target.dataset.date];
              }
              return prevDates;
            });
          }
        });
      },
      { threshold: 0 }
    );

    // `itemRefs`를 복사하여 사용
    const currentRefs = Object.values(itemRefs.current);

    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [eventsCopy]);


  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  // 제목과 멤버 필터링을 적용한 이벤트 목록
  const filteredevents = eventsCopy.filter((event) => {
    // 제목 검색 필터
    const titleMatch = event.title.includes(searchTextTime);

    // 멤버 필터: 선택된 연산 방식에 따라 필터링
    let memberMatch;
    if (filterOperation === 'AND') {
      memberMatch = selectedMembersTime.every((isSelected, idx) =>
        !isSelected || event.members[idx] === 1
      );
    } else if (filterOperation === 'OR') {
      memberMatch = selectedMembersTime.some((isSelected, idx) =>
        isSelected && event.members[idx] === 1
      );
    }

    return titleMatch && memberMatch;
  });

  const groupedEvents = groupEventsByDate(filteredevents);

  // Group dates by year and month for navigation
  const groupedByYearMonth = filteredevents.reduce((grouped, event) => {
    const [year, month] = event.date.split('-');
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(event);
    return grouped;
  }, {});




  const handleNavClick = (arg) => {
    if (itemRefs.current[arg]) {
      itemRefs.current[arg].scrollIntoView({ behavior: 'auto' });
    }
  };

  // Toggle the expansion state for a year
  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      // 모든 연도를 접기
      const newExpandedYears = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      // 클릭한 연도는 토글하여 펼치거나 접음
      newExpandedYears[year] = !prev[year];

      // 만약 연도를 접는 경우, 해당 연도에 속한 모든 월도 접기
      if (!newExpandedYears[year]) {
        const monthsInYear = Object.keys(groupedByYearMonth[year]);
        setExpandedMonths((prevMonths) => {
          const newExpandedMonths = { ...prevMonths };
          monthsInYear.forEach((month) => {
            newExpandedMonths[`${year}-${month}`] = false;
          });
          return newExpandedMonths;
        });
      }

      return newExpandedYears;
    });

    // 다른 연도를 접을 때 해당 연도의 모든 월도 접기
    setExpandedMonths((prev) => {
      const newExpandedMonths = { ...prev };
      Object.keys(groupedByYearMonth).forEach((otherYear) => {
        if (otherYear !== year) {
          Object.keys(groupedByYearMonth[otherYear]).forEach((month) => {
            newExpandedMonths[`${otherYear}-${month}`] = false;
          });
        }
      });
      return newExpandedMonths;
    });
  };

  // Toggle the expansion state for a month
  const toggleMonth = (year, month) => {
    setExpandedMonths((prev) => {
      // 같은 연도의 다른 모든 월을 접기
      const newExpandedMonths = { ...prev };
      Object.keys(groupedByYearMonth[year]).forEach((otherMonth) => {
        newExpandedMonths[`${year}-${otherMonth}`] = false;
      });

      // 클릭한 월의 상태를 반대로 토글
      newExpandedMonths[`${year}-${month}`] = !prev[`${year}-${month}`];

      return newExpandedMonths;
    });
  };

  const handleMemberChange = (index) => {
    const updatedMembers = [...selectedMembersTime];
    updatedMembers[index] = !updatedMembers[index];
    setselectedMembersTime(updatedMembers);
    sessionStorage.setItem('selectedMembersTime', JSON.stringify(updatedMembers));
  };

  const handleSearchChange = (e) => {
    setsearchTextTime(e.target.value);
    sessionStorage.setItem('searchTextTime', e.target.value ?? '');
  };

  const handleResetFilters = () => {
    setsearchTextTime('');
    setselectedMembersTime(Array(10).fill(0));
    setFilterOperation('AND')
    sessionStorage.setItem('selectedMembersTime', JSON.stringify(Array(10).fill(0)));
    sessionStorage.setItem('searchTextTime', '');
    sessionStorage.setItem('filterOperation', 'AND');
  };

  const toggleNav = () => {
    setNavOpen((prevOpen) => !prevOpen);
  };

  const handleClickToReplayline = () => {
    navigate('/replayline');
  }

  const handleResetCalendar = () => {
    // Reset expandedYears: collapse all years
    setExpandedYears((prev) => {
      const newExpandedYears = {};
      Object.keys(prev).forEach((year) => {
        newExpandedYears[year] = false;
      });
      return newExpandedYears;
    });

    // Reset expandedMonths: collapse all months
    setExpandedMonths((prev) => {
      const newExpandedMonths = {};
      Object.keys(prev).forEach((key) => {
        newExpandedMonths[key] = false;
      });
      return newExpandedMonths;
    });
  };

  return (
    <div className="timeline-page">

      <button className="nav-toggle-button" onClick={toggleNav}>
        {navOpen ? '내비게이션 닫기' : '내비게이션 열기'}
      </button>

      <div className={`timeline-nav ${navOpen ? 'open' : 'closed'}`}>

        <button onClick={handleClickToReplayline}>
          리플레이 라인
        </button>

        <h2
  style={{
    fontFamily: "'Noto Sans', sans-serif", // 깔끔한 폰트 사용
    fontSize: '20px', // 제목 크기 지정
    fontWeight: '700', // 굵게 강조
    textAlign: 'center', // 텍스트 가운데 정렬
    color: '#333', // 텍스트 색상
    backgroundColor: '#f0f0f0', // 배경색 추가
    padding: '10px', // 패딩으로 여백 추가
    borderRadius: '8px', // 둥근 모서리로 부드러운 느낌
    marginBottom: '20px', // 아래쪽 여백 추가
  }}
>
  내비게이션
</h2>

        <input
          type="text"
          placeholder="제목 검색"
          value={searchTextTime}
          onChange={handleSearchChange}
          style={{ width: '90%', padding: '5px', marginBottom: '10px' }}
        />

        <ul>
          {Object.keys(groupedByYearMonth).map((year) => (
            <li key={year}>
              <span onClick={() => toggleYear(year)} style={{ cursor: 'pointer', display: 'block' }}>
                {year} {expandedYears[year] ? '▲' : '▼'}
              </span>
              {expandedYears[year] && (
                <ul>
                  {Object.keys(groupedByYearMonth[year]).sort((a, b) => parseInt(a) - parseInt(b)).map((month) => (
                    <li key={month}>
                      <span onClick={() => toggleMonth(year, month)} style={{ cursor: 'pointer', display: 'block' }}>
                        {month}월 {expandedMonths[`${year}-${month}`] ? '▲' : '▼'}
                      </span>
                      {expandedMonths[`${year}-${month}`] && (
                        <ul>
                          {groupedByYearMonth[year][month].map((event, index) => {
                            return (
                              <li key={index} onClick={() => handleNavClick(event.date)}>
                                {event.date.split('-')[2]}일
                                {event.members.map((member, memberIndex) => (
                                  member === 1 && (
                                    <span
                                      key={memberIndex}
                                      style={{
                                        color: COLORS[memberIndex], // 멤버에 해당하는 색상 적용
                                        fontWeight: 'bold',
                                        marginLeft: '4px'
                                      }}
                                    >
                                      {MEMBERS_ONE[memberIndex]}
                                    </span>
                                  )
                                ))}<br />
                                {event.title.split('\n').map((line, lineIndex) => (
                                  <React.Fragment key={lineIndex}>
                                    {line}
                                    <br />
                                  </React.Fragment>
                                ))}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <button onClick={handleResetFilters} style={{ display: 'block', margin: '0 auto', marginBottom: '10px' }}>필터<br />초기화</button>
        {/* 멤버 체크박스 */}
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ textAlign: 'center' }}>멤버 필터</h4>
          {MEMBERS.reduce((rows, member, index) => {
            // 두 개씩 그룹으로 나누기
            if (index % 2 === 0) {
              rows.push([member]);
            } else {
              rows[rows.length - 1].push(member);
            }
            return rows;
          }, []).map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px', // 버튼 사이 간격
                marginBottom: '5px'
              }}
            >
              {row.map((member, index) => (
                <button
                  key={index}
                  style={{
                    padding: '8px 2px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    width: '70px', // 버튼 너비 고정
                    backgroundColor: selectedMembersTime[rowIndex * 2 + index] ? COLORS[rowIndex * 2 + index] : '#ffffff',
                    color: selectedMembersTime[rowIndex * 2 + index] ? '#ffffff' : '#333',
                    cursor: 'pointer',
                    transform: selectedMembersTime[rowIndex * 2 + index] ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                  }}
                  onClick={() => handleMemberChange(rowIndex * 2 + index)}
                >
                  {member}
                </button>
              ))}
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ textAlign: 'center' }}>필터 방식</h4>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: filterOperation === 'AND' ? '#007BFF' : '#2ecc71',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transform: 'scale(0.95)',
                  transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                }}
                onClick={() => {
                  const newOperation = filterOperation === 'AND' ? 'OR' : 'AND';
                  setFilterOperation(newOperation);
                  sessionStorage.setItem('filterOperation', newOperation);
                }}
              >
                {filterOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleResetCalendar}
          style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'sticky',
            bottom: '10px',
            width: '90%',
            margin: '10px auto',
            padding: '12px 16px',
            backgroundColor: '#4CAF50', // 메인 색상 (초록색)
            color: 'white', // 텍스트 색상
            border: 'none',
            borderRadius: '8px', // 둥근 모서리
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // 그림자 추가
            cursor: 'pointer',
            fontWeight: 'bold', // 글씨를 조금 더 두껍게
            transition: 'background-color 0.3s, transform 0.2s', // 배경색과 크기 변화에 애니메이션 적용
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45A049'} // 호버 시 색상 약간 어둡게
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} // 클릭 시 크기 살짝 축소
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          달력 접기
        </button>
      </div>
      <div className="timeline-container">
        <div className="timeline">
          {Object.keys(groupedEvents).map((date, index) => (
            <div
              key={index}
              ref={(el) => (itemRefs.current[date] = el)}
              data-date={date}
            >
              {visibleDates.includes(date) && (
                <>
                  <h2>{date}</h2>

                  {groupedEvents[date].map((event, idx) => (
                    <TimelineItem
                      key={idx}
                      date={event.date}
                      title={event.title}
                      videoIds={event.videoIds}
                      members={event.members}
                      id={event.id}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;