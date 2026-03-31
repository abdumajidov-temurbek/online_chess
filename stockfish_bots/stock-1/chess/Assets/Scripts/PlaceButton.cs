using UnityEngine;
using static UnityEngine.Rendering.DebugUI.Table;

public class PlaceButton : MonoBehaviour
{
    int x, y;
    public GameObject queen;
    public GameObject rook;
    private SpriteRenderer sr;
    public bool isCapture;
    public float tint = 0.25f;
    //private AudioSource audioSource;
    public AudioClip placeSound;
    public AudioClip captureSound;
    private void Start()
    {
        y = (int)transform.position.y;
        x = (int)transform.position.x;
        sr = transform.GetChild(0).GetComponent<SpriteRenderer>();
        //audioSource = GetComponent<AudioSource>();
    }
    private void OnMouseDown()
    {

        GameManager.SaveState();
        // Get the moving piece
        char movingPiece = GameManager.chessBoard[7 - GameManager.prexY, GameManager.prevX];

        // Check for en passant capture
        if (char.ToLower(movingPiece) == 'p' && x != GameManager.prevX && GameManager.chessBoard[7 - y, x] == ' ' &&
            GameManager.enPassantPossible && x == GameManager.enPassantCol)
        {
            // Remove the captured pawn (it's on the previous rank)
            GameManager.chessBoard[7 - GameManager.prexY, x] = ' ';
            if (GameManager.pieceList[7 - GameManager.prexY, x] != null)
            {
                Destroy(GameManager.pieceList[7 - GameManager.prexY, x]);
                GameManager.pieceList[7 - GameManager.prexY, x] = null;
            }
        }

        GameManager.chessBoard[7 - y, x] = GameManager.chessBoard[7 - GameManager.prexY, GameManager.prevX];
        GameManager.chessBoard[7 - GameManager.prexY, GameManager.prevX] = ' ';

        Destroy(GameManager.pieceList[7 - y, x]);
        GameManager.pieceList[7 - y, x] = GameManager.pieceList[7 - GameManager.prexY, GameManager.prevX];
        GameManager.pieceList[7 - y, x].transform.position = new Vector3(x, y, -1);
        GameManager.pieceList[7 - GameManager.prexY, GameManager.prevX] = null;

        // promotion
        if (y == 7 && GameManager.chessBoard[7 - y, x] == 'P')
        {
            GameManager.chessBoard[7 - y, x] = 'Q';
            Destroy(GameManager.pieceList[7 - y, x]);
            GameObject piece = Instantiate(queen, new Vector3(x, y, -1), Quaternion.identity);
            piece.GetComponent<SpriteRenderer>().color = Color.white;
            piece.GetComponent<PieceColor>().isWhite = true;
            GameManager.pieceList[7 - y, x] = piece;
        }
        else if (y == 0 && GameManager.chessBoard[7 - y, x] == 'p')
        {
            GameManager.chessBoard[7 - y, x] = 'q';
            Destroy(GameManager.pieceList[7 - y, x]);
            GameObject piece = Instantiate(queen, new Vector3(x, y, -1), Quaternion.identity);
            piece.GetComponent<SpriteRenderer>().color = Color.black;
            piece.GetComponent<PieceColor>().isWhite = false;
            GameManager.pieceList[7 - y, x] = piece;
        }        // Handle castling - only if it's actually a castling move
        bool isWhiteCastling = GameManager.chessBoard[7 - y, x] == 'K' && Mathf.Abs(x - GameManager.prevX) == 2;
        bool isBlackCastling = GameManager.chessBoard[7 - y, x] == 'k' && Mathf.Abs(x - GameManager.prevX) == 2; if (isWhiteCastling || isBlackCastling)
        {
            int row = isWhiteCastling ? 7 : 0;
            int yPos = isWhiteCastling ? 0 : 7;
            char rookChar = isWhiteCastling ? 'R' : 'r';

            // Find the rook's original position
            bool isKingsideCastling = x - GameManager.prevX == 2;
            int rookOriginalCol = -1;

            if (isKingsideCastling)
            {
                // Search for rook to the right of the king's original position
                for (int col = GameManager.prevX + 1; col < 8; col++)
                {
                    if (GameManager.chessBoard[row, col] == rookChar && GameManager.pieceList[row, col] != null)
                    {
                        rookOriginalCol = col;
                        break;
                    }
                }
            }
            else
            {
                // Search for rook to the left of the king's original position
                for (int col = GameManager.prevX - 1; col >= 0; col--)
                {
                    if (GameManager.chessBoard[row, col] == rookChar && GameManager.pieceList[row, col] != null)
                    {
                        rookOriginalCol = col;
                        break;
                    }
                }
            }

            if (rookOriginalCol != -1)
            {
                // Place rook next to where the king landed
                int rookNewCol = isKingsideCastling ? x - 1 : x + 1;

                // Update board state
                GameManager.chessBoard[row, rookNewCol] = rookChar;
                GameManager.chessBoard[row, rookOriginalCol] = ' ';

                // Move rook piece
                GameObject rookPiece = GameManager.pieceList[row, rookOriginalCol];
                rookPiece.transform.position = new Vector3(rookNewCol, yPos, -1);
                GameManager.pieceList[row, rookNewCol] = rookPiece;
                GameManager.pieceList[row, rookOriginalCol] = null;
            }
        }


        foreach (GameObject place in GameManager.positionList)
        {
            Destroy(place);
        }
        GameManager.positionList.Clear();
        GameManager.isMoving = false;

        // Create trails for the move
        GameManager.ClearMoveTrails();
        var fromTrail = Instantiate(GameManager.trail, new Vector3(GameManager.prevX, GameManager.prexY, 0), Quaternion.identity);
        var toTrail = Instantiate(GameManager.trail, new Vector3(x, y, 0), Quaternion.identity);
        GameManager.trailList.Add(fromTrail);
        GameManager.trailList.Add(toTrail);

        GameManager.move++;
        //Debug.Log("Move: " + GameManager.move);
        if (isCapture)
        {
            AudioSource.PlayClipAtPoint(captureSound, Camera.main.transform.position);
        }
        else
        {
            AudioSource.PlayClipAtPoint(placeSound, Camera.main.transform.position);
        }
    }

    private void OnMouseEnter()
    {
        sr.color += new Color(0f, 0f, 0f, tint);
    }

    private void OnMouseExit()
    {
        sr.color -= new Color(0f, 0f, 0f, tint);
    }
}