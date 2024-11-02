import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChannelFilter from './ChannelFilter';
import './OldOrNewGame.css';
import OneClickButton from '../nav/buttons/OneClickButton';
import { useNavigate } from 'react-router-dom';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
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
];

const OldOrNewGame = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [nextVideo, setNextVideo] = useState(null);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [username, setUsername] = useState('');
  const [topScores, setTopScores] = useState([]);

  // Fetch a random video based on the selected channels
  const fetchRandomVideo = async selectedChannels => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/random-video`, {
        params: { channels: selectedChannels.join(',') },
      });
      response.data.videoIds = JSON.parse(response.data.videoIds);
      return response.data;
    } catch (err) {
      setError('Error fetching video');
      return null;
    }
  };

  // Fetch top 10 scores
  const fetchTopScores = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/top-scores`);
      const sortedScores = response.data.map(scoreEntry => {
        const parsedChannels = JSON.parse(scoreEntry.channels);
        return {
          ...scoreEntry,
          channels: parsedChannels.sort((a, b) => a - b)
        };
      });
      setTopScores(sortedScores);
    } catch (err) {
      setError('Error fetching top scores');
    }
  };

  // When channels change, fetch two random videos for comparison
  useEffect(() => {
    const initializeVideos = async () => {
      if (channels.length > 0) {
        const video1 = await fetchRandomVideo(channels);
        const video2 = await fetchRandomVideo(channels);
        if (video1 && video2) {
          setCurrentVideo(video1);
          setNextVideo(video2);
        }
      }
    };
    initializeVideos();
  }, [channels]);

  // Fetch top scores when result is shown
  useEffect(() => {
    if (showResult) {
      fetchTopScores();
    }
  }, [showResult]);

  // Handler for guessing old or new
  const handleGuess = async guess => {
    if (!currentVideo || !nextVideo) return;

    const isCorrect = guess === (new Date(currentVideo.date) < new Date(nextVideo.date) ? 'new' : 'old');

    if (isCorrect) {
      setScore(score + 1);
      setCurrentVideo(nextVideo);
      const newVideo = await fetchRandomVideo(channels);
      if (newVideo) {
        setNextVideo(newVideo);
      } else {
        setError('Error fetching next video');
      }
    } else {
      setShowResult(true);
    }
  };

  // Submit score to the database
  const handleResultSubmit = async () => {
    if (username.length === 3 && /^[A-Z]+$/.test(username)) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/submit-score`, {
          username: username.toUpperCase(),
          score,
          channels,
        });
        setShowResult(false);
        setScore(0);
        setChannels([]);
        setCurrentVideo(null);
        setNextVideo(null);
      } catch (err) {
        setError('Error submitting score');
      }
    }
  };

  // Render letter buttons if input is not correct
  const renderLetterButtons = () => (
    <div className="letter-buttons-container">
      {[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter) => (
        <button
          key={letter}
          className="letter-button"
          onClick={() => setUsername((prev) => (prev.length < 3 ? prev + letter : prev))}
        >
          {letter}
        </button>
      ))}
      <button className="letter-button delete" onClick={() => setUsername(username.slice(0, -1))}>
        Delete
      </button>
    </div>
  );

  const handleClickToTimeline = () => {
    navigate('/timeline');
  }

  const handleClickToReplayline = () => {
    navigate('/replayline');
  }

  return (
    <div>
      <div className='header-container'>
        <OneClickButton
          handler={handleClickToTimeline}
          text={"주요 영상으로"}
        />
        
        <OneClickButton
          handler={handleClickToReplayline}
          text={"다시보기로"}
        />
        </div>
        <h1 className='header-title'>언제일까요</h1>
      <div className="game-container">

        <div className="score-display">
          <h2>점수: {score}</h2>
        </div>
        {showResult ? (
          <div className="result-container">
            <h2 className="game-over-heading">게임 오버!</h2>
            <div className="score-section">
            </div>
            <div className="videos-side-by-side">
              <div className="video-section result-video">
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo.videoIds[0]}`}
                  className="video-frame result-frame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Previous Video"
                ></iframe>
                <p>{currentVideo.date}</p>
              </div>
              <div className="video-section result-video">
                <iframe
                  src={`https://www.youtube.com/embed/${nextVideo.videoIds[0]}`}
                  className="video-frame result-frame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Next Video"
                ></iframe>
                <p>{nextVideo.date}</p>
              </div>
            </div>
            <div className="username-input-container">
              <input
                type="text"
                maxLength="3"
                placeholder="영어 대문자 3개"
                value={username}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (/^[A-Z]*$/.test(value)) setUsername(value);
                }}
                className="username-input"
              />
              {username.length < 3 && renderLetterButtons()}
            </div>
            <button className="submit-button" onClick={handleResultSubmit} disabled={username.length !== 3}>
              점수 기록하기
            </button>
            <div className="top-scores-container">
              <h3 className="top-scores-heading">기록</h3>
              <table className="top-scores-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>사용자명</th>
                    <th>점수</th>
                    <th>채널</th>
                  </tr>
                </thead>
                <tbody>
                  {topScores.map((scoreEntry, index) => {
                    let parsedChannels = [];
                    if (scoreEntry.channels) {
                      try {
                        parsedChannels = scoreEntry.channels; // JSON 문자열을 배열로 변환
                      } catch (e) {
                        console.error("Failed to parse channels:", e);
                      }
                    }
                    return (
                      <tr key={index} className="top-score-item">
                        <td>{index + 1}</td>
                        <td>{scoreEntry.username}</td>
                        <td>{scoreEntry.score}</td>
                        <td>
                          {parsedChannels.map((channel, idx) => (
                            <span key={idx} className="channel-badge" style={{ backgroundColor: COLORS[channel] }}>
                              {MEMBERS[channel]}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="videos-container">
            {channels.length === 0 ? (
              <ChannelFilter onChannelsSelect={setChannels} />
            ) : (
              <>
                {currentVideo && (
                  <div
                    className="video-section"
                    style={{ backgroundColor: COLORS[currentVideo.channel] }}
                  >
                    <h3 className="video-member">{MEMBERS[currentVideo.channel]}</h3>
                    <h3 className="video-title">{currentVideo.title}</h3>
                    <iframe
                      src={`https://www.youtube.com/embed/${currentVideo.videoIds[0]}`}
                      className="video-frame-game"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Current Video"
                    ></iframe>
                  </div>
                )}
                <div className="buttons-container">
                  <button className="guess-button improved-guess-button" onClick={() => handleGuess('old')}>
                    Old
                  </button>
                  <button className="guess-button improved-guess-button" onClick={() => handleGuess('new')}>
                    New
                  </button>
                </div>
                {nextVideo && (
                  <div
                    className="video-section"
                    style={{ backgroundColor: COLORS[nextVideo.channel] }}
                  >
                    <h3 className="video-member">{MEMBERS[nextVideo.channel]}</h3>
                    <h3 className="video-title">{nextVideo.title}</h3>
                    <iframe
                      src={`https://www.youtube.com/embed/${nextVideo.videoIds[0]}`}
                      className="video-frame-game"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Next Video"
                    ></iframe>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default OldOrNewGame;