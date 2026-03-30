import { useEffect, useRef } from 'react';
import Chess from 'chess.js';

function createTone(context, type, frequency, startTime, duration, gainValue) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function detectSoundType(previousFen, currentGame) {
  const lastMove = currentGame?.moves?.[currentGame.moves.length - 1]?.uci;
  if (!previousFen || !lastMove) {
    return null;
  }

  const probe = new Chess();
  probe.load(previousFen);
  const move = probe.move({
    from: lastMove.slice(0, 2),
    to: lastMove.slice(2, 4),
    promotion: lastMove[4] || 'q',
  });

  if (!move) {
    return currentGame.isFinished ? 'end' : currentGame.inCheck ? 'check' : 'move';
  }

  if (currentGame.isFinished) {
    return 'end';
  }
  if (currentGame.inCheck) {
    return 'check';
  }
  if (move.flags.includes('c') || move.flags.includes('e')) {
    return 'capture';
  }
  return 'move';
}

export default function useChessSounds(game) {
  const audioContextRef = useRef(null);
  const previousFenRef = useRef(null);
  const previousMoveRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return undefined;
    }

    const ensureContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };

    const unlock = () => ensureContext();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const currentMove = game?.moves?.[game.moves.length - 1]?.uci || '';
    if (!game?.fen) {
      previousFenRef.current = null;
      previousMoveRef.current = '';
      return;
    }

    if (!previousFenRef.current) {
      previousFenRef.current = game.fen;
      previousMoveRef.current = currentMove;
      return;
    }

    if (!currentMove || currentMove === previousMoveRef.current) {
      previousFenRef.current = game.fen;
      previousMoveRef.current = currentMove;
      return;
    }

    const soundType = detectSoundType(previousFenRef.current, game);
    const context = audioContextRef.current;
    if (soundType && context) {
      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      const now = context.currentTime + 0.005;
      if (soundType === 'move') {
        createTone(context, 'triangle', 660, now, 0.07, 0.045);
        createTone(context, 'triangle', 880, now + 0.03, 0.07, 0.03);
      } else if (soundType === 'capture') {
        createTone(context, 'square', 320, now, 0.09, 0.05);
        createTone(context, 'triangle', 220, now + 0.02, 0.12, 0.045);
      } else if (soundType === 'check') {
        createTone(context, 'sawtooth', 740, now, 0.08, 0.034);
        createTone(context, 'triangle', 988, now + 0.045, 0.12, 0.035);
      } else if (soundType === 'end') {
        createTone(context, 'triangle', 523.25, now, 0.16, 0.04);
        createTone(context, 'triangle', 659.25, now + 0.07, 0.18, 0.04);
        createTone(context, 'triangle', 783.99, now + 0.14, 0.24, 0.045);
      }
    }

    previousFenRef.current = game.fen;
    previousMoveRef.current = currentMove;
  }, [game]);
}
