export const BOT_DIFFICULTIES = [
  { value: 'pre-intermediate', label: 'Pre-Intermediate', elo: 1200, description: 'Mapped to stock-1.' },
  { value: 'intermediate', label: 'Intermediate', elo: 1800, description: 'Mapped to stock-5.' },
  { value: 'advance', label: 'Advance', elo: 3000, description: 'Mapped to stock-17.' },
];

export function difficultyByValue(value) {
  return BOT_DIFFICULTIES.find((option) => option.value === value) || BOT_DIFFICULTIES[0];
}
