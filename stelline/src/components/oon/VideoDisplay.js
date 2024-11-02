import React from 'react';
import OneClickButton from '../nav/buttons/OneClickButton';

const VideoDisplay = ({ video }) => {
  if (!video) return null;

  // Get the central 30% of videoId
  const videoId = video.videoIds[0];
  const start = Math.floor(videoId.length * 0.35);
  const end = Math.ceil(videoId.length * 0.65);
  const partialVideoId = videoId.slice(start, end);

  

  return (
    <div>
      <h3>{video.title}</h3>
      <p>Video ID (partial): {partialVideoId}</p>
    </div>
  );
};

export default VideoDisplay;
