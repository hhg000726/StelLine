// src/components/Timeline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import '../shared/Line.css';
import { MEMBERS, COLORS } from '../../consts';
import TimelineItem from './TimelineItem';
import Filter from '../nav/Filter/Filter';
import Operation from '../nav/Filter/Operation';
import OneClickButton from '../nav/buttons/OneClickButton';
import Title from '../nav/Title';
import YearItem from '../nav/calendar/YearItem';
import { ResetCalendar, toggleExpandMonth, toggleExpandYear } from '../../utils';

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
    toggleExpandYear(year, groupedByYearMonth, setExpandedYears, setExpandedMonths)
  };

  // Toggle the expansion state for a month
  const toggleMonth = (year, month) => {
    toggleExpandMonth(year, month, groupedByYearMonth, setExpandedMonths);
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

  const handleFilterOperationChange = () => {
    const newOperation = filterOperation === 'AND' ? 'OR' : 'AND';
    setFilterOperation(newOperation);
    sessionStorage.setItem('filterOperation', newOperation);
  }

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

  const handleClickToOldOrNew = () => {
    navigate('/oldornew');
  }

  const handleResetCalendar = () => {
    ResetCalendar(setExpandedYears, setExpandedMonths)
  };

  return (
    <div className="page">

      <button className="nav-toggle-button" onClick={toggleNav}>
        {navOpen ? '내비게이션 닫기' : '내비게이션 열기'}
      </button>

      <div className={`nav ${navOpen ? 'open' : 'closed'}`}>

        <OneClickButton
          handler={handleClickToOldOrNew}
          text={"게임으로"}
        />

        <OneClickButton
          handler={handleClickToReplayline}
          text={"다시보기로"}
        />

        <Title />

        <input
          type="text"
          placeholder="제목 검색"
          value={searchTextTime}
          onChange={handleSearchChange}
          style={{ width: '90%', padding: '5px', marginBottom: '10px' }}
        />

        <ul>
          {Object.keys(groupedByYearMonth).map((year) => (
            <YearItem
              key={year}
              year={year}
              expanded={expandedYears[year]}
              toggleYear={toggleYear}
              groupedByDate={groupedByYearMonth}
              expandedMonths={expandedMonths}
              toggleMonth={toggleMonth}
              handler={handleNavClick}
              kind={'time'}
            />
          ))}
        </ul>

        <OneClickButton
          handler={handleResetFilters}
          text={'필터 초기화'}
        />

        <div className='filter-container'>
          <h4>멤버 필터</h4>
          <Filter
            targets={MEMBERS}
            state={selectedMembersTime}
            backgroundColor={(index) => selectedMembersTime[index] ? COLORS[index] : '#ffffff'}
            color={(index) => selectedMembersTime[index] ? '#ffffff' : '#333'}
            handler={handleMemberChange}
          />
          <Operation
            backgroundColor={filterOperation === 'AND' ? '#007BFF' : '#2ecc71'}
            handler={handleFilterOperationChange}
            text={filterOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
          />
        </div>

        <OneClickButton
          handler={handleResetCalendar}
          text={"달력 접기"}
        />
      </div>

      <div className="container">
        <div className="line">
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