using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using static UnityEngine.Rendering.DebugUI.Table;

public class PieceMovement : MonoBehaviour
{
    int x, y;
    List<Vector3> positions;
    PieceColor pc;
    char[] moveableList;
    public enum Piece
    {
        Pawn,
        Rook,
        Knight,
        Bishop,
        Queen,
        King
    }

    public Piece piece;
    private float scale = 0.11111f;

    private void Start()
    {
        pc = GetComponent<PieceColor>();
    }

    private bool IsKingSafeAfterMove(int fromX, int fromY, int toX, int toY)
    {
        // Create a temporary board to simulate the move
        char[,] tempBoard = new char[8, 8];
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 8; j++)
                tempBoard[i, j] = GameManager.chessBoard[i, j];

        // Make the move on the temporary board
        char piece = tempBoard[7 - fromY, fromX];
        tempBoard[7 - fromY, fromX] = ' ';
        tempBoard[7 - toY, toX] = piece;        // Create GameManager instance and use minimax with depth 1 to see if opponent can capture king
        GameManager gameManager = FindObjectOfType<GameManager>();
        if (gameManager == null)
        {
            //Debug.LogError("Could not find GameManager instance!");
            return false;
        }        // Check if this move would put or leave our king in check
        return !GameManager.IsInCheck(pc.isWhite, tempBoard);
    }
    private void OnMouseDown()
    {
        //Debug.Log("clicked");

        if (GameManager.chessBoard[7, 4] != 'K' && GameManager.playAsWhiteStatic)
        {
            GameManager.whiteKingMoved = true;
        }
        if (GameManager.chessBoard[7, 3] != 'K' && !GameManager.playAsWhiteStatic)
        {
            GameManager.whiteKingMoved = true;
        }
        if (GameManager.chessBoard[0, 4] != 'k' && GameManager.playAsWhiteStatic)
        {
            GameManager.blackKingMoved = true;
        }
        if (GameManager.chessBoard[0, 3] != 'k' && !GameManager.playAsWhiteStatic)
        {
            GameManager.blackKingMoved = true;
        }

        if (GameManager.chessBoard[7, 0] != 'R')
        {
            GameManager.whiteLeftRookMoved = true;
        }
        if (GameManager.chessBoard[7, 7] != 'R')
        {
            GameManager.whiteRightRookMoved = true;
        }
        if (GameManager.chessBoard[0, 0] != 'r')
        {
            GameManager.blackLeftRookMoved = true;
        }
        if (GameManager.chessBoard[0, 7] != 'r')
        {
            GameManager.blackRightRookMoved = true;
        }


        if (!(pc.isWhite && (GameManager.move % 2 == 0 == GameManager.playAsWhiteStatic))) return;
        foreach (GameObject place in GameManager.positionList)
        {
            Destroy(place);
        }

        GameManager.positionList.Clear();
        y = (int)transform.position.y;
        x = (int)transform.position.x;
        moveableList = pc.isWhite ? new char[] { 'P', 'R', 'N', 'B', 'Q', 'K' } : new char[] { 'p', 'r', 'n', 'b', 'q', 'k' };
        positions = GetLegalMoves(x, y, piece);
        GameManager.prexY = y;
        GameManager.prevX = x;

        GameObject currentButton = GameManager.currentButton;
        GameManager.positionList.Add(Instantiate(currentButton, new Vector3(x, y, -2.5f), Quaternion.identity));

        foreach (Vector3 pos in positions)
        {
            if (pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8)
            {
                if (!moveableList.Contains(GameManager.chessBoard[7 - (int)pos.y, (int)pos.x]))
                {
                    if (IsKingSafeAfterMove(x, y, (int)pos.x, (int)pos.y))
                    {
                        //Debug.Log(GameManager.chessBoard[7 - (int)pos.y, (int)pos.x]);                        GameObject placeButton = GameManager.placeButton;
                        // Check if this is an en passant move
                        bool isEnPassant = piece == Piece.Pawn &&
                                         GameManager.enPassantPossible &&
                                         (int)pos.x == GameManager.enPassantCol &&
                                         7 - (int)pos.y == GameManager.enPassantRow;
                        GameObject placeButton = GameManager.placeButton;
                        if (GameManager.chessBoard[7 - (int)pos.y, (int)pos.x] != ' ' || isEnPassant)
                        {
                            placeButton.GetComponentInChildren<SpriteRenderer>().color = GameManager.StaticCaptureColor;
                            placeButton.GetComponent<PlaceButton>().isCapture = true;
                        }
                        else
                        {
                            placeButton.GetComponentInChildren<SpriteRenderer>().color = GameManager.StaticPlaceColor;
                            placeButton.GetComponent<PlaceButton>().isCapture = false;
                        }
                        GameManager.positionList.Add(Instantiate(placeButton, pos, Quaternion.identity));
                    }
                }
            }
        }
        if (GameManager.positionList.Any())
        {
            GameManager.isMoving = true;
        }
    }

    List<Vector3> GetLegalMoves(int x, int y, Piece piece)
    {
        int z = -3;
        switch (piece)
        {

            case Piece.Knight:
                positions = new List<Vector3> {
                    new Vector3(x - 1, y - 2, z),
                    new Vector3(x - 1, y + 2, z),
                    new Vector3(x + 1, y - 2, z),
                    new Vector3(x + 1, y + 2, z),
                    new Vector3(x - 2, y - 1, z),
                    new Vector3(x - 2, y + 1, z),
                    new Vector3(x + 2, y - 1, z),
                    new Vector3(x + 2, y + 1, z)
                };
                break;
            case Piece.Pawn:
                {
                    positions = new List<Vector3> { };
                    int j = pc.isWhite ? 1 : -1;
                    // Normal forward moves
                    if (GameManager.chessBoard[7 - (y + j), x] == ' ')
                    {
                        positions.Add(new Vector3(x, y + j, z));
                        if (y == (int)(-2.5f * j + 3.5f) && (GameManager.chessBoard[7 - (y + (j * 2)), x] == ' '))
                        {
                            positions.Add(new Vector3(x, y + (j * 2), z));
                        }
                    }
                    // Regular captures and en passant
                    Debug.Log(GameManager.enPassantPossible);
                    foreach (int i in new int[] { -1, 1 })
                    {
                        try
                        {
                            // Regular captures
                            if (GameManager.chessBoard[7 - (y + j), x + i] != ' ')
                            {
                                positions.Add(new Vector3(x + i, y + j, z));
                            }
                            // En passant
                            else if (GameManager.enPassantPossible &&
                                    y == (pc.isWhite ? 4 : 3) && // Correct rank for en passant
                                    x + i == GameManager.enPassantCol && // Adjacent to pawn that moved
                                    7 - (y + j) == GameManager.enPassantRow) // Capture square matches
                            {
                                positions.Add(new Vector3(x + i, y + j, z));
                            }
                        }
                        catch (IndexOutOfRangeException) { }
                            ;
                    }
                    break;
                }

            case Piece.Rook:
                positions = new List<Vector3> { };
                foreach (int i in new int[] { -1, 1 })
                {
                    int up = 0;
                    try
                    {
                        do
                        {
                            up++;
                            positions.Add(new Vector3(x, y + (up * i), z));
                        } while (GameManager.chessBoard[7 - (y + (up * i)), x] == ' ');
                    }
                    catch (IndexOutOfRangeException) { }
                    ;
                }
                foreach (int i in new int[] { -1, 1 })
                {
                    int right = 0;
                    try
                    {
                        do
                        {
                            right++;
                            positions.Add(new Vector3(x + (right * i), y, z));
                        } while (GameManager.chessBoard[7 - y, x + (right * i)] == ' ');
                    }
                    catch (IndexOutOfRangeException) { }
                    ;
                }
                break;

            case Piece.Bishop:
                positions = new List<Vector3> { };
                foreach (int i in new int[] { -1, 1 })
                {
                    foreach (int j in new int[] { -1, 1 })
                    {
                        int dir = 0;
                        try
                        {
                            do
                            {
                                dir++;
                                positions.Add(new Vector3(x + (dir * j), y + (dir * i), z));
                            } while (GameManager.chessBoard[7 - (y + (dir * i)), (x + (dir * j))] == ' ');
                        }
                        catch (IndexOutOfRangeException) { }
                        ;
                    }
                }
                break;

            case Piece.Queen:
                positions = new List<Vector3> { };
                foreach (int i in new int[] { -1, 1 })
                {
                    int up = 0;
                    try
                    {
                        do
                        {
                            up++;
                            positions.Add(new Vector3(x, y + (up * i), z));
                        } while (GameManager.chessBoard[7 - (y + (up * i)), x] == ' ');
                    }
                    catch (IndexOutOfRangeException) { }
                    ;
                }
                foreach (int i in new int[] { -1, 1 })
                {
                    int right = 0;
                    try
                    {
                        do
                        {
                            right++;
                            positions.Add(new Vector3(x + (right * i), y, z));
                        } while (GameManager.chessBoard[7 - y, x + (right * i)] == ' ');
                    }
                    catch (IndexOutOfRangeException) { }
                    ;
                }
                foreach (int i in new int[] { -1, 1 })
                {
                    foreach (int j in new int[] { -1, 1 })
                    {
                        int dir = 0;
                        try
                        {
                            do
                            {
                                dir++;
                                positions.Add(new Vector3(x + (dir * j), y + (dir * i), z));
                            } while (GameManager.chessBoard[7 - (y + (dir * i)), (x + (dir * j))] == ' ');
                        }
                        catch (IndexOutOfRangeException) { }
                        ;
                    }
                }
                break;

            case Piece.King:
                positions = new List<Vector3> {
                    new Vector3(x - 1, y - 1, z),
                    new Vector3(x - 1, y, z),
                    new Vector3(x - 1, y + 1, z),

                    new Vector3(x + 1, y - 1, z),
                    new Vector3(x + 1, y, z),
                    new Vector3(x + 1, y + 1, z),

                    new Vector3(x, y + 1, z),
                    new Vector3(x, y - 1, z),
                };
                bool canKingsideCastle = false;
                bool canQueensideCastle = false;
                // Can't castle if king is in check
                if (GameManager.IsInCheck(pc.isWhite, GameManager.chessBoard))
                {
                    canKingsideCastle = false;
                    canQueensideCastle = false;
                }
                else if (pc.isWhite && y == 0)
                {  // White king at starting position
                    // Check if king hasn't moved - find king position in first rank
                    if (!GameManager.whiteKingMoved)
                    {
                        int kingCol = -1;
                        // Find king's column position in the back rank
                        for (int col = 0; col < 8; col++)
                        {
                            if (GameManager.chessBoard[7, col] == 'K')
                            {
                                kingCol = col;
                                break;
                            }
                        }
                        if (kingCol != -1)
                        {  // Found the king
                            // Check kingside castling - look for rook on king's right
                            if (!GameManager.whiteRightRookMoved)
                            {
                                bool pathClear = true;
                                for (int col = kingCol + 1; col < 7; col++)
                                {
                                    if (GameManager.chessBoard[7, col] != ' ')
                                    {
                                        pathClear = false;
                                        break;
                                    }
                                }
                                if (pathClear && GameManager.chessBoard[7, 7] == 'R')
                                {
                                    if (!IsSquareUnderAttack(7, kingCol + 1, true) &&
                                        !IsSquareUnderAttack(7, kingCol + 2, true))
                                    {
                                        canKingsideCastle = true;
                                    }
                                }
                            }
                            // Check queenside castling - look for rook on king's left
                            if (!GameManager.whiteLeftRookMoved)
                            {
                                bool pathClear = true;
                                for (int col = kingCol - 1; col > 0; col--)
                                {
                                    if (GameManager.chessBoard[7, col] != ' ')
                                    {
                                        pathClear = false;
                                        break;
                                    }
                                }
                                if (pathClear && GameManager.chessBoard[7, 0] == 'R')
                                {
                                    if (!IsSquareUnderAttack(7, kingCol - 1, true) &&
                                        !IsSquareUnderAttack(7, kingCol - 2, true))
                                    {
                                        canQueensideCastle = true;
                                    }
                                }
                            }
                        }
                    }
                }
                else if (!pc.isWhite && y == 7)
                {  // Black king at starting position
                    // Check if king hasn't moved - find king position in first rank
                    if (!GameManager.blackKingMoved)
                    {
                        int kingCol = -1;
                        // Find king's column position in the back rank
                        for (int col = 0; col < 8; col++)
                        {
                            if (GameManager.chessBoard[0, col] == 'k')
                            {
                                kingCol = col;
                                break;
                            }
                        }
                        if (kingCol != -1)
                        {  // Found the king
                            // Check kingside castling - look for rook on king's right
                            if (!GameManager.blackRightRookMoved)
                            {
                                bool pathClear = true;
                                for (int col = kingCol + 1; col < 7; col++)
                                {
                                    if (GameManager.chessBoard[0, col] != ' ')
                                    {
                                        pathClear = false;
                                        break;
                                    }
                                }
                                if (pathClear && GameManager.chessBoard[0, 7] == 'r')
                                {
                                    if (!IsSquareUnderAttack(0, kingCol + 1, false) &&
                                        !IsSquareUnderAttack(0, kingCol + 2, false))
                                    {
                                        canKingsideCastle = true;
                                    }
                                }
                            }
                            // Check queenside castling - look for rook on king's left
                            if (!GameManager.blackLeftRookMoved)
                            {
                                bool pathClear = true;
                                for (int col = kingCol - 1; col > 0; col--)
                                {
                                    if (GameManager.chessBoard[0, col] != ' ')
                                    {
                                        pathClear = false;
                                        break;
                                    }
                                }
                                if (pathClear && GameManager.chessBoard[0, 0] == 'r')
                                {
                                    if (!IsSquareUnderAttack(0, kingCol - 1, false) &&
                                        !IsSquareUnderAttack(0, kingCol - 2, false))
                                    {
                                        canQueensideCastle = true;
                                    }
                                }
                            }
                        }
                    }
                }

                if (canKingsideCastle)
                {
                    positions.Add(new Vector3(x + 2, y, z));
                }
                if (canQueensideCastle)
                {
                    positions.Add(new Vector3(x - 2, y, z));
                }
                break;

        }
        return positions;
    }

    private bool IsSquareUnderAttack(int row, int col, bool isWhiteKing)
    {
        // Create a temporary board to simulate the position
        char[,] tempBoard = new char[8, 8];
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 8; j++)
                tempBoard[i, j] = GameManager.chessBoard[i, j];

        // Place a king on the square we want to check
        tempBoard[row, col] = isWhiteKing ? 'K' : 'k';

        // If the king would be in check on that square, then the square is under attack
        return GameManager.IsInCheck(isWhiteKing, tempBoard);
    }

    private void OnMouseEnter()
    {
        if (!pc.isWhite) return;
        transform.localScale = Vector3.one * (1.0f + scale);
        transform.position += Vector3.up * (scale / 2); // Slightly raise the piece for better visibility
    }

    private void OnMouseExit()
    {
        if (!pc.isWhite) return;
        transform.localScale = Vector3.one;
        transform.position -= Vector3.up * (scale / 2);
    }
}
