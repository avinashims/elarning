import { useRef, useEffect, useCallback, useState } from 'react';
import api from '../services/api';
import './VideoPlayer.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const REFRESH_BUFFER_MS = 60 * 1000;

export default function VideoPlayer({ lessonId, initialTime = 0, locked = false, onComplete }) {
  const videoRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const lastSavedRef = useRef(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(!locked);
  const [error, setError] = useState(null);

  const saveProgress = useCallback(async (watchedSeconds, completed = false) => {
    if (!lessonId) return;
    try {
      await api.put(`/progress/lesson/${lessonId}`, { watchedSeconds, completed });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [lessonId]);

  const fetchSignedUrl = useCallback(async () => {
    if (!lessonId || locked) return null;

    const response = await api.get(`/videos/lessons/${lessonId}/access`);
    const { signedUrl, expiresAt } = response.data.data;
    const absoluteUrl = signedUrl.startsWith('http') ? signedUrl : `${API_URL.replace(/\/$/, '')}${signedUrl}`;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const refreshIn = new Date(expiresAt).getTime() - Date.now() - REFRESH_BUFFER_MS;
    if (refreshIn > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        fetchSignedUrl()
          .then((nextUrl) => {
            if (nextUrl && videoRef.current) {
              const currentTime = videoRef.current.currentTime;
              const wasPaused = videoRef.current.paused;
              setVideoSrc(nextUrl);
              videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current.currentTime = currentTime;
                if (!wasPaused) videoRef.current.play().catch(() => {});
              }, { once: true });
            }
          })
          .catch(console.error);
      }, refreshIn);
    }

    return absoluteUrl;
  }, [lessonId, locked]);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      setVideoSrc(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSignedUrl()
      .then((url) => {
        if (!cancelled) setVideoSrc(url);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err.response?.data?.message || 'Unable to load video';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [lessonId, locked, fetchSignedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleLoaded = () => {
      if (initialTime > 0 && initialTime < video.duration) {
        video.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      const current = Math.floor(video.currentTime);
      if (current - lastSavedRef.current >= 5) {
        lastSavedRef.current = current;
        saveProgress(current);
      }
    };

    const handleEnded = () => {
      saveProgress(Math.floor(video.duration), true);
      onComplete?.();
    };

    const handlePause = () => {
      saveProgress(Math.floor(video.currentTime));
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);

    saveIntervalRef.current = setInterval(() => {
      if (!video.paused) {
        saveProgress(Math.floor(video.currentTime));
      }
    }, 30000);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [videoSrc, initialTime, lessonId, saveProgress, onComplete]);

  if (locked) {
    return (
      <div className="video-locked">
        <div className="lock-icon">🔒</div>
        <h3>Premium Content Locked</h3>
        <p>Subscribe to a premium plan to access this lesson.</p>
        <a href="/pricing" className="btn btn-primary">View Plans</a>
      </div>
    );
  }

  if (loading) {
    return <div className="video-player video-loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="video-locked">
        <h3>Video Unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      <video ref={videoRef} src={videoSrc} controls controlsList="nodownload" />
    </div>
  );
}
