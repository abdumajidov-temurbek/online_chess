export const BOT_DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', elo: 1000, description: 'Calm pace for newer players.' },
  { value: 'pre-intermediate', label: 'Pre-Intermediate', elo: 1500, description: 'Sharper tactics with manageable pressure.' },
  { value: 'intermediate', label: 'Intermediate', elo: 2200, description: 'Strong positional play and reliable calculation.' },
  { value: 'advanced', label: 'Advanced', elo: 3000, description: 'Near-maximum Stockfish strength.' },
];

export function difficultyByValue(value) {
  return BOT_DIFFICULTIES.find((option) => option.value === value) || BOT_DIFFICULTIES[0];
}
