# Unity Chess Engine

A simple 2D chess engine built in Unity C# from scratch. This project is a personal experiment to build a functional chess bot using Minimax with Alpha-Beta pruning and a fully working move logic system. This entire project was done independently with no guidance and was inspired by Sebastian Lague [Coding Adventure: Chess](https://www.youtube.com/watch?v=U4ogK0MIzqk), particularly the [Minimax Video](https://www.youtube.com/watch?v=l-hh51ncgDI&t=5s).

<img src="Assets/Images/chess.png" alt="Chess Engine Screenshot" width="600">

## Engine Strength

- Estimated ELO: around 1000 (based on over 40 manually played games against various levels of **Stockfish**)  
- Search depth: up to 3 plies with acceptable speed  
- Depth 4 works but becomes noticeably slow due to lack of search optimizations  
- Uses predefined book moves and book move responses for the first move  
- Includes positional bonuses so pieces make safer and more stable moves  
- Extensively tested through actual games to verify that no illegal moves occur and all legal moves are playable

## Game Features

- Play as White, Black, or Random  
- Multiple timer options available (similar to common chess time controls)  
- Undo and Reset buttons for testing and casual play  
- Simple 2D interface with fully working move logic

## Technical Details

- Engine Type: Minimax with Alpha-Beta Pruning  
- Evaluation: Material plus positional bonuses based on piece-square placement  
- Depth Limit: Adjustable, practically capped at 3 for performance  
- Implementation: Built in Unity 2D  
- Rules: Supports standard chess rules including castling, en passant, and promotion

## Download

You can download the last working builds of the game here:

- [Windows build (7z)](https://github.com/hanimuhamed/chess/releases/download/v1.0.0/chess-v1.0.0-windows.7z)  
- [Linux build (7z)](https://github.com/hanimuhamed/chess/releases/download/v1.0.0/chess-v1.0.0-linux.7z)

Unzip the archive for your platform and run the executable to play.

## How to Run

1. Clone the repository:

    ```bash
    git clone https://github.com/hanimuhamed/chess.git
    ```

2. Open the project in Unity (version 6000.0.32f1 or later is recommended)  
3. Run the `MainMenu` scene to start the game

## Testing

All testing has been done through gameplay to verify that:

- No illegal moves occur
- All legal moves are supported
- Engine responds correctly
- Opening moves are applied as intended

## Code Quality Disclaimer

The code works as intended but is messy and not well structured.  
It is not refactored and I have avoided changing it further since it already behaves the way I want.

## Roadmap

- Optimize search for deeper ply levels
- Improve evaluation heuristics
- Refactor the codebase
- Improve GUI polish and animations

## Contributing

Pull requests are welcome.  
Bug fixes, performance improvements, and code cleanups are encouraged.

## License

This project is released under the MIT License.
