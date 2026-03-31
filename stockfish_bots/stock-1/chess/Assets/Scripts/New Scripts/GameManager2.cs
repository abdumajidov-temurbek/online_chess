using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.VFX;
using static UnityEngine.Rendering.DebugUI.Table;

public class GameManager2 : MonoBehaviour {

    public Color lightTile;
    public Color darkTile;
    public Color placeColor;
    public static Color StaticPlaceColor;
    public Color captureColor;
    public static Color StaticCaptureColor;
    public GameObject tile;
    public GameObject button;
    private SpriteRenderer sr;
    public static int move = 0;

    public static char[,] chessBoard = {
        {'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'},

        {'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'},

        {' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '},

        {' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '},

        {' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '},

        {' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '},

        {'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'},

        {'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'}
    };

    public GameObject pawn;
    public GameObject rook;
    public GameObject knight;
    public GameObject bishop;
    public GameObject queen;
    public GameObject king;

    public static GameObject placeButton;
    public GameObject placeButtonSprite;
    public static List<GameObject> positionList = new List<GameObject>();

    public static int prexY;
    public static int prevX;
    public static GameObject[,] pieceList = new GameObject[8, 8];

    public GameObject elseSquare;
    public static bool isMoving = false;

    public static bool whiteKingMoved = false;
    public static bool blackKingMoved = false;
    public static bool whiteLeftRookMoved = false;
    public static bool blackLeftRookMoved = false;
    public static bool whiteRightRookMoved = false;
    public static bool blackRightRookMoved = false;

    private void Awake() {

        placeButton = placeButtonSprite;
        Application.targetFrameRate = 24;
    }
    void Start() {
        elseSquare.SetActive(false);
        StaticCaptureColor = captureColor;
        StaticPlaceColor = placeColor;
        //cam = Camera.main;
        sr = tile.GetComponent<SpriteRenderer>();
        CreateBoard();
        InitPieces();
    }

    private void Update() {
        if (isMoving) {
            if (elseSquare.activeSelf == false) {
                elseSquare.SetActive(true);
                Debug.Log("hi");
            }
            //Vector3 mousePos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            //mousePos.z = -4; // Ensure the sprite stays in the correct plane
            //pieceCursor.transform.position = mousePos;
        }
        else if (elseSquare.activeSelf == true) {
            elseSquare.SetActive(false);
        }
    }

    void CreateBoard() {
        for (int row = 7; row >= 0; row--) {
            for (int col = 0; col < 8; col++) {
                bool isLight = (row + col) % 2 == 0;
                Color color = isLight ? lightTile : darkTile;
                Vector2 position = new Vector3(col, row, 0);
                sr.color = color;
                Instantiate(tile, position, Quaternion.identity);
                //GameObject newButton = Instantiate(button, position, Quaternion.identity);
                //newButton.GetComponent<SpriteButton>().row = 7 - row;
                //newButton.GetComponent<SpriteButton>().col = col;

            }
        }
    }

    public void InitPieces() {
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                int row = 7 - i;
                int col = j;
                GameObject piece = ToPiece(chessBoard[i, j]);
                if (piece != null) {
                    pieceList[i, j] = Instantiate(piece, new Vector3(col, row, -1), Quaternion.identity);
                }
            }
        }
    }

    public GameObject ToPiece(char ch) {
        GameObject piece = null;
        switch (char.ToLower(ch)) {
            case 'p':
                piece = pawn;
                break;
            case 'r':
                piece = rook;
                break;
            case 'n':
                piece = knight;
                break;
            case 'b':
                piece = bishop;
                break;
            case 'q':
                piece = queen;
                break;
            case 'k':
                piece = king;
                break;
            default:
                piece = null;
                break;
        }
        if (char.IsLower(ch)) {
            piece.GetComponent<SpriteRenderer>().color = Color.black;
            piece.GetComponent<PieceColor>().isWhite = false;
        }
        else if (char.IsUpper(ch)) {
            piece.GetComponent<SpriteRenderer>().color = Color.white;
            piece.GetComponent<PieceColor>().isWhite = true;
        }
        return piece;
    }

}
