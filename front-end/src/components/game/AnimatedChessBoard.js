import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import '../../css/AnimatedChessBoard.css';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const ANIMATION_MS = 260;

function parseFenPieces(fen) {
  const placement = (fen || '').split(' ')[0];
  const rows = placement.split('/');
  const pieces = {};

  rows.forEach((row, rowIndex) => {
    let fileIndex = 0;
    row.split('').forEach((token) => {
      const emptySquares = Number(token);
      if (Number.isNaN(emptySquares)) {
        const square = `${FILES[fileIndex]}${8 - rowIndex}`;
        const color = token === token.toUpperCase() ? 'w' : 'b';
        pieces[square] = `${color}${token.toUpperCase()}`;
        fileIndex += 1;
      } else {
        fileIndex += emptySquares;
      }
    });
  });

  return pieces;
}

function fileDistance(fromSquare, toSquare) {
  return FILES.indexOf(toSquare[0]) - FILES.indexOf(fromSquare[0]);
}

function pieceColor(piece) {
  if (!piece) {
    return '';
  }

  return piece[0] === 'w' ? 'white' : 'black';
}

function squareToPosition(square, orientation) {
  const fileIndex = FILES.indexOf(square[0]);
  const rankIndex = RANKS.indexOf(square[1]);
  const column = orientation === 'white' ? fileIndex : 7 - fileIndex;
  const row = orientation === 'white' ? 7 - rankIndex : rankIndex;

  return {
    left: `${column * 12.5}%`,
    top: `${row * 12.5}%`,
  };
}

function pointToSquare(x, y, boardRect, orientation) {
  if (!boardRect || x < 0 || y < 0 || x > boardRect.width || y > boardRect.height) {
    return null;
  }

  const fileIndex = Math.min(7, Math.max(0, Math.floor((x / boardRect.width) * 8)));
  const rowIndex = Math.min(7, Math.max(0, Math.floor((y / boardRect.height) * 8)));
  const file = orientation === 'white' ? FILES[fileIndex] : FILES[7 - fileIndex];
  const rank = orientation === 'white' ? String(8 - rowIndex) : String(rowIndex + 1);

  return `${file}${rank}`;
}

function buildAnimation(previousFen, nextFen, lastMoveUci) {
  if (!previousFen || !nextFen || !lastMoveUci || lastMoveUci.length < 4) {
    return null;
  }

  const previousPieces = parseFenPieces(previousFen);
  const currentPieces = parseFenPieces(nextFen);
  const from = lastMoveUci.slice(0, 2);
  const to = lastMoveUci.slice(2, 4);
  const movingPiece = previousPieces[from];

  if (!movingPiece) {
    return null;
  }

  let capturedSquare = to;
  let capturedPiece = previousPieces[to] || null;

  if (!capturedPiece && movingPiece[1] === 'P' && from[0] !== to[0] && !previousPieces[to]) {
    capturedSquare = `${to[0]}${from[1]}`;
    capturedPiece = previousPieces[capturedSquare] || null;
  }

  let secondary = null;
  if (movingPiece[1] === 'K' && Math.abs(fileDistance(from, to)) === 2) {
    const castleKingSide = fileDistance(from, to) > 0;
    const rookFrom = `${castleKingSide ? 'h' : 'a'}${from[1]}`;
    const rookTo = `${castleKingSide ? 'f' : 'd'}${from[1]}`;
    const rookPiece = previousPieces[rookFrom];

    if (rookPiece) {
      secondary = { from: rookFrom, to: rookTo, piece: rookPiece };
    }
  }

  if (currentPieces[to]) {
    return {
      primary: { from, to, piece: movingPiece },
      secondary,
      captured: capturedPiece ? { square: capturedSquare, piece: capturedPiece } : null,
    };
  }

  return null;
}

const Square = memo(function Square({
  square,
  orientation,
  piece,
  hidden,
  interactive,
  isHovered,
  isSelected,
  isLastMove,
  isMoveTarget,
  onHover,
  onSquareClick,
  onPiecePointerDown,
}) {
  const fileIndex = FILES.indexOf(square[0]);
  const rankIndex = RANKS.indexOf(square[1]);
  const isLight = (fileIndex + rankIndex) % 2 === 0;
  const showFile = orientation === 'white' ? square[1] === '1' : square[1] === '8';
  const showRank = orientation === 'white' ? square[0] === 'a' : square[0] === 'h';
  const occupied = Boolean(piece && !hidden);

  return (
    <button
      type="button"
      className={[
        'acb-square',
        isLight ? 'acb-square-light' : 'acb-square-dark',
        isHovered ? 'acb-square-hovered' : '',
        isSelected ? 'acb-square-selected' : '',
        isLastMove ? 'acb-square-last-move' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={squareToPosition(square, orientation)}
      onClick={() => onSquareClick(square)}
      onMouseEnter={() => onHover(square)}
      onMouseLeave={() => onHover('')}
      aria-label={`Square ${square}`}
    >
      {showFile ? <span className="acb-coordinate acb-coordinate-file">{square[0]}</span> : null}
      {showRank ? <span className="acb-coordinate acb-coordinate-rank">{square[1]}</span> : null}

      {isMoveTarget ? (
        <span className={`acb-target ${occupied ? 'acb-target-capture' : 'acb-target-move'}`} aria-hidden="true" />
      ) : null}

      {piece && !hidden ? (
        <img
          src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${piece.toLowerCase()}.png`}
          alt={piece}
          className={`acb-piece ${interactive ? 'acb-piece-interactive' : ''}`}
          draggable="false"
          onPointerDown={interactive ? (event) => onPiecePointerDown(event, square, piece) : undefined}
        />
      ) : null}
    </button>
  );
});

export default function AnimatedChessBoard({
  fen,
  orientation,
  playerColor,
  selectedSquare,
  possibleMoves,
  lastMoveUci,
  disabled,
  onSquareClick,
  onMove,
}) {
  const boardRef = useRef(null);
  const previousFenRef = useRef(fen);
  const [hoveredSquare, setHoveredSquare] = useState('');
  const [dragState, setDragState] = useState(null);
  const [animationState, setAnimationState] = useState(null);
  const pieces = useMemo(() => parseFenPieces(fen), [fen]);

  useEffect(() => {
    if (previousFenRef.current === fen) {
      return undefined;
    }

    const nextAnimation = buildAnimation(previousFenRef.current, fen, lastMoveUci);
    previousFenRef.current = fen;

    if (!nextAnimation) {
      setAnimationState(null);
      return undefined;
    }

    const animationId = Date.now();
    setAnimationState({ id: animationId, phase: 'idle', ...nextAnimation });

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimationState((current) => (current?.id === animationId ? { ...current, phase: 'active' } : current));
      });
    });

    const timeoutId = window.setTimeout(() => {
      setAnimationState((current) => (current?.id === animationId ? null : current));
    }, ANIMATION_MS + 40);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [fen, lastMoveUci]);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    function handlePointerMove(event) {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) {
        return;
      }

      const x = event.clientX - boardRect.left;
      const y = event.clientY - boardRect.top;
      const moved =
        dragState.moved ||
        Math.abs(event.clientX - dragState.startClientX) > 6 ||
        Math.abs(event.clientY - dragState.startClientY) > 6;

      setDragState((current) => (current ? { ...current, x, y, moved } : current));
    }

    function handlePointerUp(event) {
      const boardRect = boardRef.current?.getBoundingClientRect();
      const localX = boardRect ? event.clientX - boardRect.left : -1;
      const localY = boardRect ? event.clientY - boardRect.top : -1;
      const targetSquare = pointToSquare(localX, localY, boardRect, orientation);

      if (dragState.moved && targetSquare) {
        onMove(dragState.from, targetSquare);
      } else if (!dragState.moved) {
        onSquareClick(dragState.from);
      }

      setDragState(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, onMove, onSquareClick, orientation]);

  const playerCanInteract = !disabled;
  const hiddenSquares = new Set();

  if (animationState?.primary) {
    hiddenSquares.add(animationState.primary.to);
  }

  if (animationState?.secondary) {
    hiddenSquares.add(animationState.secondary.to);
  }

  if (dragState?.from) {
    hiddenSquares.add(dragState.from);
  }

  const squares = useMemo(() => {
    const ordered = [];
    const ranks = orientation === 'white' ? [...RANKS].reverse() : [...RANKS];
    const files = orientation === 'white' ? FILES : [...FILES].reverse();

    ranks.forEach((rank) => {
      files.forEach((file) => {
        ordered.push(`${file}${rank}`);
      });
    });

    return ordered;
  }, [orientation]);

  const lastMoveFrom = lastMoveUci?.slice(0, 2) || '';
  const lastMoveTo = lastMoveUci?.slice(2, 4) || '';

  function handlePiecePointerDown(event, square, piece) {
    if (!playerCanInteract || pieceColor(piece) !== playerColor) {
      return;
    }

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setDragState({
      from: square,
      piece,
      x: event.clientX - boardRect.left,
      y: event.clientY - boardRect.top,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
    });
  }

  return (
    <div className="acb-shell">
      <div ref={boardRef} className="acb-board" role="grid" aria-label="Chess board">
        {squares.map((square) => {
          const piece = pieces[square];
          const interactive = playerCanInteract && pieceColor(piece) === playerColor;

          return (
            <Square
              key={square}
              square={square}
              orientation={orientation}
              piece={piece}
              hidden={hiddenSquares.has(square)}
              interactive={interactive}
              isHovered={hoveredSquare === square}
              isSelected={selectedSquare === square}
              isLastMove={square === lastMoveFrom || square === lastMoveTo}
              isMoveTarget={possibleMoves.includes(square)}
              onHover={setHoveredSquare}
              onSquareClick={onSquareClick}
              onPiecePointerDown={handlePiecePointerDown}
            />
          );
        })}

        {animationState?.primary ? (
          <div
            className="acb-floating-piece acb-floating-piece-main"
            style={{
              ...squareToPosition(
                animationState.phase === 'active' ? animationState.primary.to : animationState.primary.from,
                orientation
              ),
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${animationState.primary.piece.toLowerCase()}.png`}
              alt={animationState.primary.piece}
              className="acb-piece"
            />
          </div>
        ) : null}

        {animationState?.secondary ? (
          <div
            className="acb-floating-piece acb-floating-piece-secondary"
            style={{
              ...squareToPosition(
                animationState.phase === 'active' ? animationState.secondary.to : animationState.secondary.from,
                orientation
              ),
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${animationState.secondary.piece.toLowerCase()}.png`}
              alt={animationState.secondary.piece}
              className="acb-piece"
            />
          </div>
        ) : null}

        {animationState?.captured ? (
          <div
            className={`acb-captured-piece ${animationState.phase === 'active' ? 'acb-captured-piece-fade' : ''}`}
            style={squareToPosition(animationState.captured.square, orientation)}
          >
            <img
              src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${animationState.captured.piece.toLowerCase()}.png`}
              alt={animationState.captured.piece}
              className="acb-piece"
            />
          </div>
        ) : null}

        {dragState ? (
          <div
            className="acb-drag-piece"
            style={{
              left: `${(dragState.x / (boardRef.current?.getBoundingClientRect().width || 1)) * 100}%`,
              top: `${(dragState.y / (boardRef.current?.getBoundingClientRect().height || 1)) * 100}%`,
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${dragState.piece.toLowerCase()}.png`}
              alt={dragState.piece}
              className="acb-piece"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
