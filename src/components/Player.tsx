"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface PlayerHandle {
  togglePlay: () => void;
  toggleMute: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  getState: () => { paused: boolean; muted: boolean; volume: number };
  getWatchProgress: () => number; // 0-1, how far through the video
}

interface PlayerProps {
  videoId: string;
  onEnded: () => void;
  onError: (code: number) => void;
  onReady: () => void;
  onPlay: () => void;
  onPause: () => void;
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYTApi() {
  if (apiLoaded) return;
  apiLoaded = true;

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  };
}

function onApiReady(cb: () => void) {
  if (apiReady) {
    cb();
  } else {
    readyCallbacks.push(cb);
    loadYTApi();
  }
}

const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { videoId, onEnded, onError, onReady, onPlay, onPause },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const currentVideoRef = useRef(videoId);

  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  useEffect(() => {
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
    onReadyRef.current = onReady;
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
  });

  useImperativeHandle(ref, () => ({
    togglePlay() {
      const p = playerRef.current;
      if (!p) return;
      const state = p.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        p.pauseVideo();
      } else {
        p.playVideo();
      }
    },
    toggleMute() {
      const p = playerRef.current;
      if (!p) return;
      if (p.isMuted()) {
        p.unMute();
      } else {
        p.mute();
      }
    },
    volumeUp() {
      const p = playerRef.current;
      if (!p) return;
      p.setVolume(Math.min(100, p.getVolume() + 10));
    },
    volumeDown() {
      const p = playerRef.current;
      if (!p) return;
      p.setVolume(Math.max(0, p.getVolume() - 10));
    },
    getState() {
      const p = playerRef.current;
      if (!p) return { paused: false, muted: false, volume: 100 };
      return {
        paused: p.getPlayerState() !== window.YT.PlayerState.PLAYING,
        muted: p.isMuted(),
        volume: p.getVolume(),
      };
    },
    getWatchProgress() {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function" || typeof p.getDuration !== "function") return 0;
      const duration = p.getDuration();
      if (!duration || duration <= 0) return 0;
      return p.getCurrentTime() / duration;
    },
  }));

  const createPlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      width: "100%",
      height: "100%",
      videoId: currentVideoRef.current,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => onReadyRef.current(),
        onStateChange: (e: YT.OnStateChangeEvent) => {
          switch (e.data) {
            case window.YT.PlayerState.ENDED:
              onEndedRef.current();
              break;
            case window.YT.PlayerState.PLAYING:
              onPlayRef.current();
              break;
            case window.YT.PlayerState.PAUSED:
              onPauseRef.current();
              break;
          }
        },
        onError: (e: YT.OnErrorEvent) => onErrorRef.current(e.data),
      },
    });
  }, []);

  useEffect(() => {
    onApiReady(createPlayer);
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [createPlayer]);

  useEffect(() => {
    currentVideoRef.current = videoId;
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  return (
    <div className="player-container absolute inset-0 bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default Player;
