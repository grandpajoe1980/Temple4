"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react';

type SoundOption = 'bell' | 'chime' | 'gong';

const STORAGE_KEY = 'mindfulnessBellSettings';

function minutesFromValue(value: number) {
  return value * 15;
}

function playSynthSound(ctx: AudioContext, type: SoundOption) {
  const now = ctx.currentTime;

  if (type === 'bell') {
    // simple bell: higher sine with fast decay
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.9, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 3);
  } else if (type === 'chime') {
    // chime: triangle wave with a short delay and gentle decay
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(660, now);
    o2.frequency.setValueAtTime(1320, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.8, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    o1.start(now);
    o2.start(now);
    o1.stop(now + 3);
    o2.stop(now + 3);
  } else {
    // gong: lower frequency with overtone
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(220, now);
    o2.frequency.setValueAtTime(440, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.9, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 4);
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    o1.start(now);
    o2.start(now + 0.02);
    o1.stop(now + 4);
    o2.stop(now + 4);
  }
}

export default function MindfulnessBell() {
  const [option, setOption] = useState<SoundOption>('bell');
  const [value, setValue] = useState<number>(4); // 4 * 15 = 60 minutes default
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // load settings
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.option) setOption(parsed.option);
        if (parsed.value) setValue(parsed.value);
        if (parsed.isRunning) setIsRunning(parsed.isRunning);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setNextAt(null);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    const minutes = minutesFromValue(value);
    const ms = minutes * 60 * 1000;
    const id = window.setInterval(() => {
      const ctx = ensureAudioContext();
      playSynthSound(ctx, option);
      setNextAt(Date.now() + ms);
    }, ms);
    timerRef.current = id;
    setNextAt(Date.now() + ms);
  }, [ensureAudioContext, option, stopTimer, value]);

  const playNow = useCallback(() => {
    const ctx = ensureAudioContext();
    playSynthSound(ctx, option);
  }, [ensureAudioContext, option]);

  const toggleRunning = useCallback(() => setIsRunning((s) => !s), []);

  useEffect(() => {
    // persist settings
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ option, value, isRunning })
      );
    } catch (e) {}
  }, [option, value, isRunning]);

  useEffect(() => {
    if (isRunning) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [isRunning, startTimer, stopTimer]);

  return (
    <div className="max-w-xl rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-semibold">Mindfulness Bell</h2>
      <p className="text-sm text-gray-600 mt-1">Choose a sound and how often you want to hear it.</p>

      <div className="mt-4">
        <label className="block text-xs text-gray-700">Sound</label>
        <div className="mt-2 flex gap-2">
          <select
            value={option}
            onChange={(e) => setOption(e.target.value as SoundOption)}
            className="rounded-md border px-3 py-2"
          >
            <option value="bell">Bell</option>
            <option value="chime">Chime</option>
            <option value="gong">Gong</option>
          </select>
          <button
            type="button"
            onClick={playNow}
            className="ml-2 inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-white hover:bg-amber-700"
          >
            Play now
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs text-gray-700">Interval</label>
        <div className="mt-2">
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-2 text-sm text-gray-700">Every <strong>{minutesFromValue(value)}</strong> minutes</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleRunning}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-white ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        {nextAt && (
          <div className="text-sm text-gray-600">Next bell at {new Date(nextAt).toLocaleTimeString()}</div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">Settings are saved locally to this browser.</div>
    </div>
  );
}
