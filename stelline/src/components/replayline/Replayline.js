// src/components/Replayline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReplaylineItem from './ReplaylineItem';
import './Replayline.css';
import axios from 'axios';
import { VariableSizeList as List } from 'react-window';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
const CONTENTS = ['종합게임', '공포게임', '노래', '서버', '기념일', '내부 합방', '외부 합방', '최초 공개', '팬게임', '월드컵', '특별 컨텐츠', '대회']
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

// Replayline.js 파일에서 수정
const getGradientStyle = (members) => {
  const activeColors = members
    .map((value, index) => (value === 1 ? COLORS[index] : null))
    .filter(Boolean);

  if (activeColors.length === 0) {
    return { background: '#3498db' }; // 기본 색상 (남색)
  }

  const gradientPercentage = 100 / activeColors.length;
  const gradientColors = activeColors
    .map((color, index) => `${color} ${index * gradientPercentage}%, ${color} ${(index + 1) * gradientPercentage}%`)
    .join(', ');

  return {
    background: `linear-gradient(90deg, ${gradientColors})`,
  };
};


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

const Replayline = () => {
  const itemRefs = useRef({});
  const listRef = useRef(null);
  const resizeTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [eventsCopy, setEventsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(Array(10).fill(0));  // 멤버 필터링용 상태
  const [selectedChannels, setSelectedChannels] = useState(Array(10).fill(1));  // 채널 필터링용 상태
  const [selectedContents, setSelectedContents] = useState(CONTENTS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {}));  // 컨텐츠 필터링용 상태
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [filterMemberOperation, setFilterMemberOperation] = useState('AND');  // AND 또는 OR 선택('OR');  // AND 또는 OR 선택
  const [filterContentOperation, setFilterContentOperation] = useState('AND');  // AND 또는 OR 선택
  const [navOpen, setNavOpen] = useState(false); // 내비게이션 열림 상태 관리

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // 필터 상태 복원
    const savedSearchText = sessionStorage.getItem('searchText');
    const savedSelectedMembers = sessionStorage.getItem('selectedMembers');
    const savedSelectedChannels = sessionStorage.getItem('selectedChannels');
    const savedSelectedContents = sessionStorage.getItem('selectedContents');
    const savedFilterMemberOperation = sessionStorage.getItem('filterMemberOperation');
    const savedFilterContentOperation = sessionStorage.getItem('filterContentOperation');

    if (savedSearchText) setSearchText(savedSearchText);
    if (savedSelectedMembers) setSelectedMembers(JSON.parse(savedSelectedMembers));
    if (savedSelectedChannels) setSelectedChannels(JSON.parse(savedSelectedChannels));
    if (savedSelectedContents) setSelectedContents(JSON.parse(savedSelectedContents));
    if (savedFilterMemberOperation) setFilterMemberOperation(savedFilterMemberOperation);
    if (savedFilterContentOperation) setFilterContentOperation(savedFilterContentOperation);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // 우선 현재의 윈도우 크기를 설정합니다.
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // 이전 타이머를 제거합니다.
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current);
      }

      // 일정 시간이 지나면 (예: 500ms) 강제 리렌더링합니다.
      resizeTimer.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 500);
    };

    window.addEventListener('resize', handleResize);

    // 컴포넌트가 언마운트될 때 리스너와 타이머를 정리합니다.
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // 데이터 요청
    axios.get(`${process.env.REACT_APP_API_URL}/api/replayline`)
      .then((response) => {
        const modifiedData = response.data.map((event) => ({
          ...event,
          members: JSON.parse(event.members), // JSON 문자열을 파싱하여 리스트로 변환
          videoIds: JSON.parse(event.videoIds), // videoIds도 마찬가지로 파싱
          contents: JSON.parse(event.contents) // videoIds도 마찬가지로 파싱
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
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition && listRef.current) {
        listRef.current.scrollTo(parseInt(savedScrollPosition, 10));
      }
    }
  }, [isLoading, location.state]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  // 제목과 멤버 필터링을 적용한 이벤트 목록
  const filteredevents = eventsCopy.filter((event) => {
    // 제목 검색 필터
    const keywords = searchText.toLowerCase().split(" ");
    const titleMatch = keywords.every(keyword => event.title.replace(/\s/g, "").toLowerCase().includes(keyword));

    // 채널 필터
    let channelMatch;
    channelMatch = selectedChannels.some((isSelected, idx) =>
      isSelected && event.channel === idx
    );

    // 멤버 필터: 선택된 연산 방식에 따라 필터링
    let memberMatch;
    if (filterMemberOperation === 'AND') {
      memberMatch = selectedMembers.every((isSelected, idx) =>
        !isSelected || event.members[idx] === 1
      );
    } else if (filterMemberOperation === 'OR') {
      memberMatch = selectedMembers.some((isSelected, idx) =>
        isSelected && event.members[idx] === 1
      );
    }

    // 컨텐츠 필터: 선택된 연산 방식에 따라 필터링
    let contentMatch = true;

    if (filterContentOperation === 'AND') {
      contentMatch = Object.entries(selectedContents).every(([key, value]) => {
        // selectedContents[key]가 1인 경우에만 필터링 조건을 확인
        if (value === true) {
          return event.contents[key] === true;
        }
        return true; // selectedContents[key]가 0이면 조건을 무시
      });
    } else if (filterContentOperation === 'OR') {
      contentMatch = Object.entries(selectedContents).some(([key, value]) => {
        // selectedContents[key]가 1인 경우에만 필터링 조건을 확인
        return value === true && event.contents[key] === true;
      });
    }

    return titleMatch && channelMatch && memberMatch && contentMatch;
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

  const groupedByYearMonthDay = filteredevents.reduce((grouped, event) => {
    const [year, month, day] = event.date.split('-');
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = {};
    if (!grouped[year][month][day]) grouped[year][month][day] = [];
    grouped[year][month][day].push(event);
    return grouped;
  }, {});

  const handleNavClick = (arg) => {
    if (listRef.current) {
      const index = Object.keys(groupedEvents).indexOf(arg);
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'start');
      }
    }
  };

  const getItemSize = (index) => {
    const date = Object.keys(groupedEvents)[index];
    const videoCount = groupedEvents[date].reduce((total, event) => total + event.videoIds.length, 0);
    if (window.innerWidth <= 768) {
      return 172 + (Math.min(1000, window.innerWidth) * 0.5625 + 280) * videoCount
    }
    return (172 + (Math.min(1000, window.innerWidth * 0.7) * 0.5625 + 400) * videoCount)
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
    const updatedMembers = [...selectedMembers];
    updatedMembers[index] = !updatedMembers[index];
    setSelectedMembers(updatedMembers);
    sessionStorage.setItem('selectedMembers', JSON.stringify(updatedMembers));
  };

  const handleChannelChange = (index) => {
    const updatedChannels = [...selectedChannels];
    updatedChannels[index] = !updatedChannels[index];
    setSelectedChannels(updatedChannels);
    sessionStorage.setItem('selectedChannels', JSON.stringify(updatedChannels));
  };

  const handleContentChange = (content) => {
    const updatedContents = { ...selectedContents }
    updatedContents[content] = !updatedContents[content];
    console.log('Updated Contents:', updatedContents);
    setSelectedContents(updatedContents);
    sessionStorage.setItem('selectedContents', JSON.stringify(updatedContents));
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    sessionStorage.setItem('searchText', e.target.value ?? '');
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedMembers(Array(10).fill(0));
    setSelectedChannels(Array(10).fill(1));
    setSelectedContents(CONTENTS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {}));
    setFilterMemberOperation('AND')
    setFilterContentOperation('AND')
    sessionStorage.setItem('searchText', '');
    sessionStorage.setItem('selectedMembers', JSON.stringify(Array(10).fill(0)));
    sessionStorage.setItem('selectedChannels', JSON.stringify(Array(10).fill(1)));
    sessionStorage.setItem('selectedContents', JSON.stringify(CONTENTS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})));
    sessionStorage.setItem('filterMemberOperation', 'AND');
    sessionStorage.setItem('filterContentOperation', 'AND');
  };

  const toggleNav = () => {
    setNavOpen((prevOpen) => !prevOpen);
  };

  const handleClickToTimeline = () => {
    navigate('/timeline');
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
    <div className="replayline-page">

      <button className="nav-toggle-button" onClick={toggleNav}>
        {navOpen ? '내비게이션 닫기' : '내비게이션 열기'}
      </button>

      <div className={`replayline-nav ${navOpen ? 'open' : 'closed'}`}>

        <button onClick={handleClickToTimeline}>
          타임 라인
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
          value={searchText}
          onChange={handleSearchChange}
          style={{ width: '90%', padding: '5px', marginBottom: '10px' }}
        />

        <ul>
          {Object.keys(groupedByYearMonthDay).map((year) => (
            <li key={year}>
              <span onClick={() => toggleYear(year)} style={{ cursor: 'pointer', display: 'block' }}>
                {year} {expandedYears[year] ? '▲' : '▼'}
              </span>
              {expandedYears[year] && (
                <ul>
                  {Object.keys(groupedByYearMonthDay[year]).sort((a, b) => parseInt(a) - parseInt(b)).map((month) => (
                    <li key={month}>
                      <span onClick={() => toggleMonth(year, month)} style={{ cursor: 'pointer', display: 'block' }}>
                        {month}월 {expandedMonths[`${year}-${month}`] ? '▲' : '▼'}
                      </span>
                      {expandedMonths[`${year}-${month}`] && (
                        <ul>
                          {Object.keys(groupedByYearMonthDay[year][month]).sort((a, b) => parseInt(a) - parseInt(b)).map((day) => (
                            <li
                              key={day}
                              onClick={(e) => {
                                handleNavClick(`${year}-${month}-${day}`);
                                if ('ontouchstart' in window) { // 모바일에서만 실행
                                  const tooltipContent = groupedByYearMonthDay[year][month][day]
                                    .map((event, idx) => `<div style="color: ${COLORS[event.members.findIndex(member => member === 1)]}; background: rgba(255, 255, 255, 0.9); padding: 5px; border-radius: 5px; margin-bottom: 5px;">${event.title}</div>`)
                                    .join('');

                                  // 툴팁 생성 (모바일 클릭 시 화면에 고정 표시)
                                  const tooltip = document.createElement('div');
                                  tooltip.className = 'custom-tooltip';
                                  tooltip.innerHTML = tooltipContent;
                                  tooltip.style.position = 'fixed';
                                  tooltip.style.top = '20%';
                                  tooltip.style.left = '50%';
                                  tooltip.style.transform = 'translateX(-50%)';
                                  tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
                                  tooltip.style.color = 'white';
                                  tooltip.style.padding = '15px';
                                  tooltip.style.fontWeight = 'bold';
                                  tooltip.style.borderRadius = '8px';
                                  tooltip.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
                                  tooltip.style.zIndex = '1000';
                                  tooltip.addEventListener('click', () => {
                                    if (tooltip.parentNode) {
                                      tooltip.parentNode.removeChild(tooltip);
                                    }
                                  });
                                  document.body.appendChild(tooltip);

                                  // 모바일에서도 클릭 후 툴팁을 닫기 위한 설정
                                  setTimeout(() => {
                                    document.addEventListener('click', function handleClickOutside(event) {
                                      if (tooltip && !tooltip.contains(event.target)) {
                                        if (tooltip.parentNode) {
                                          tooltip.parentNode.removeChild(tooltip);
                                        }
                                        document.removeEventListener('click', handleClickOutside);
                                      }
                                    });
                                  }, 0);
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (!('ontouchstart' in window)) { // PC에서만 실행
                                  const tooltipContent = groupedByYearMonthDay[year][month][day]
                                    .map((event, idx) => `<div style="color: ${COLORS[event.members.findIndex(member => member === 1)]}; background: rgba(255, 255, 255, 0.9); padding: 5px; border-radius: 5px; margin-bottom: 5px;">${event.title}</div>`)
                                    .join('');

                                  // 툴팁 생성
                                  const tooltip = document.createElement('div');
                                  tooltip.className = 'custom-tooltip';
                                  tooltip.innerHTML = tooltipContent;
                                  tooltip.style.position = 'fixed';
                                  tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
                                  tooltip.style.color = 'white';
                                  tooltip.style.padding = '15px';
                                  tooltip.style.fontWeight = 'bold';
                                  tooltip.style.borderRadius = '8px';
                                  tooltip.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
                                  tooltip.style.zIndex = '1000';
                                  document.body.appendChild(tooltip);

                                  const updateTooltipPosition = (e) => {
                                    let x = e.clientX + 20;
                                    let y = e.clientY + 20;
                                    const tooltipRect = tooltip.getBoundingClientRect();

                                    // 화면 경계 조정 - 화면을 넘어가지 않도록 수정
                                    if (x + tooltipRect.width > window.innerWidth) {
                                      x = window.innerWidth - tooltipRect.width - 10;
                                    }
                                    if (y + tooltipRect.height > window.innerHeight) {
                                      y = window.innerHeight - tooltipRect.height - 10;
                                    }
                                    if (y < 0) {
                                      y = 10;
                                    }
                                    if (x < 0) {
                                      x = 10;
                                    }

                                    tooltip.style.top = `${y}px`;
                                    tooltip.style.left = `${x}px`;
                                  };

                                  updateTooltipPosition(e);
                                  e.target.tooltipElement = tooltip;

                                  e.target.addEventListener('mousemove', updateTooltipPosition);
                                  e.target.updateTooltipPosition = updateTooltipPosition;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (e.target.tooltipElement) {
                                  e.target.removeEventListener('mousemove', e.target.updateTooltipPosition);
                                  if (e.target.tooltipElement.parentNode) {
                                    e.target.tooltipElement.parentNode.removeChild(e.target.tooltipElement);
                                  }
                                  e.target.tooltipElement = null;
                                  e.target.updateTooltipPosition = null;
                                }
                                const existingTooltips = document.querySelectorAll('.custom-tooltip');
                                existingTooltips.forEach((tooltip) => {
                                  if (tooltip.parentNode) {
                                    tooltip.parentNode.removeChild(tooltip);
                                  }
                                });
                              }}
                            >
                              {day}일<br />
                              {
                                (() => {
                                  // 0. 10개의 배열을 만들어 초기화합니다.
                                  const memberPresenceArray = Array(10).fill(0);

                                  // 1. 해당 날짜의 이벤트를 순회합니다.
                                  groupedByYearMonthDay[year][month][day].forEach((event) => {
                                    // 2. members 배열을 순회하며 1인 경우 갱신합니다.
                                    event.members.forEach((member, idx) => {
                                      if (member === 1) {
                                        memberPresenceArray[idx] = 1;
                                      }
                                    });

                                    // 3. event의 channel이 특정 값이라면 해당 인덱스를 갱신합니다.
                                    if (event.channel >= 0 && event.channel < memberPresenceArray.length) {
                                      memberPresenceArray[event.channel] = 1;
                                    }
                                  });

                                  // 4. 배열을 순회하며 각 값에 대해 한 글자 출력을 생성합니다.
                                  return memberPresenceArray.map((member, memberIndex) =>
                                    member === 1 ? (
                                      <span
                                        key={memberIndex}
                                        style={{
                                          color: COLORS[memberIndex], // 멤버에 해당하는 색상 적용
                                          fontWeight: 'bold',
                                          marginLeft: '4px',
                                        }}
                                      >
                                        {MEMBERS_ONE[memberIndex]}
                                      </span>
                                    ) : null
                                  );
                                })()
                              }

                            </li>
                          ))}
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
        {/* 체크박스 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', background: '#E4E4E4', borderRadius: '10px'}}>
            <h4 style={{ paddingTop: '10px' }}>멤버 필터</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div>
              {MEMBERS.map((member, index) => (
                <button
                  key={index}
                  style={{
                    padding: '8px 2px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    width: '70px', // 버튼 너비 고정
                    backgroundColor: selectedMembers[index] ? COLORS[index] : '#ffffff',
                    color: selectedMembers[index] ? '#ffffff' : '#333',
                    cursor: 'pointer',
                    transform: selectedMembers[index] ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                  }}
                  onClick={() => handleMemberChange(index)}
                >
                  {member}
                </button>
              ))}
              </div>
              <div>
                <h4 style={{ textAlign: 'center' }}>필터 방식</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: filterMemberOperation === 'AND' ? '#007BFF' : '#2ecc71',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transform: 'scale(0.95)',
                      transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                      marginBottom: '10px',
                    }}
                    onClick={() => {
                      const newOperation = filterMemberOperation === 'AND' ? 'OR' : 'AND';
                      setFilterMemberOperation(newOperation);
                      sessionStorage.setItem('filterMemberOperation', newOperation);
                    }}
                  >
                    {filterMemberOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '10px', background: '#E4E4E4', borderRadius: '10px' }}>
            <h4 style={{ paddingTop: '10px' }}>채널 필터</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px' }}>
              {MEMBERS.map((member, index) => (
                <button
                  key={index}
                  style={{
                    padding: '8px 2px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    width: '70px', // 버튼 너비 고정
                    backgroundColor: selectedChannels[index] ? COLORS[index] : '#ffffff',
                    color: selectedChannels[index] ? '#ffffff' : '#333',
                    cursor: 'pointer',
                    transform: selectedChannels[index] ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                  }}
                  onClick={() => handleChannelChange(index)}
                >
                  {member}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#E4E4E4', borderRadius: '10px', textAlign: 'center' }}>
          <h4 style={{ paddingTop: '10px' }}>컨텐츠 필터</h4>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {CONTENTS.map((content, index) => (
              <button
                key={index}
                style={{
                  padding: '8px 2px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  width: '70px', // 버튼 너비 고정
                  backgroundColor: selectedContents[content] ? '#007BFF' : '#ffffff',
                  color: selectedContents[content] ? '#ffffff' : '#333',
                  cursor: 'pointer',
                  transform: selectedContents[content] ? 'scale(0.95)' : 'scale(1)',
                  transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                }}
                onClick={() => handleContentChange(content)}
              >
                {content}
              </button>
            ))}
            <div>
              <h4 style={{ textAlign: 'center' }}>필터 방식</h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: filterContentOperation === 'AND' ? '#007BFF' : '#2ecc71',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transform: 'scale(0.95)',
                    transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                    marginBottom: '10px',
                  }}
                  onClick={() => {
                    const newOperation2 = filterContentOperation === 'AND' ? 'OR' : 'AND';
                    setFilterContentOperation(newOperation2);
                    sessionStorage.setItem('filterContentOperation', newOperation2);
                  }}
                >
                  {filterContentOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
                </button>
              </div>
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


      <div className="replayline-container">

        <List
          key={Object.keys(groupedEvents).join('-')}
          ref={listRef}
          height={window.innerHeight * 0.9}
          itemCount={Object.keys(groupedEvents).length}
          itemSize={getItemSize}
          width={window.innerWidth > 768 ? window.innerWidth * 0.7 : window.innerWidth}
        >
          {({ index, style }) => {
            const date = Object.keys(groupedEvents)[index];
            return (
              <div style={style} ref={(el) => (itemRefs.current[date] = el)} data-date={date}>
                <h2>{date}</h2>
                {groupedEvents[date].map((event, idx) => (
                  <ReplaylineItem
                    key={idx}
                    date={event.date}
                    title={event.title}
                    videoIds={event.videoIds}
                    id={event.id}
                    members={event.members}
                    contents={event.contents}
                    listRef={listRef}
                  />
                ))}
              </div>
            );
          }}
        </List>
      </div>
    </div>
  );
};

export default Replayline;