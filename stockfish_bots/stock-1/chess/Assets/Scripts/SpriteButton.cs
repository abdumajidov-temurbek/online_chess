using System.Collections;
using System.Collections.Generic;
using System.Linq;

using UnityEngine;

public class SpriteButton : MonoBehaviour
{
    public int row;
    public int col;
    char[] moveableList;
    private void OnMouseDown() {
        //Debug.Log("button pressed: " + row + ", " + col);
        if (GameManager.move % 2 == 0) {
            moveableList = new char[] { 'P', 'R', 'N', 'B', 'Q', 'K' };   
        }
        else {
            moveableList = new char[] { 'p', 'r', 'n', 'b', 'q', 'k' };
        }
        /*if (GameManager.piece == null) {
            if (moveableList.Contains(GameManager.chessBoard[row, col])) {
                GameManager.piece = GameManager.chessBoard[row, col];
                Destroy(GameManager.pieceList[row, col]);
                //GameManager.pieceCursor = Instantiate(GameManager.ToPiece(GameManager.piece ?? ' '), new Vector3(col, 7 - row, -2), Quaternion.identity);

                //Debug.Log("piece chosen: " + GameManager.piece);
                GameManager.prexY = row;
                GameManager.prevX = col;
            }
        }
        else {
            if (moveableList.Contains(GameManager.chessBoard[row, col])) {
                //Debug.Log("invalid place");
                GameManager.chessBoard[GameManager.prexY, GameManager.prevX] = GameManager.piece ?? ' ';
                //GameManager.pieceList[GameManager.prevRow, GameManager.prevCol] = 
                //    Instantiate(GameManager.ToPiece(GameManager.piece ?? ' '), new Vector3(GameManager.prevCol, 7 - GameManager.prevRow, -2), Quaternion.identity);
                GameManager.piece = null;
                Destroy(GameManager.pieceCursor);
            }
            else {
                //Debug.Log(GameManager.piece + " placed at " + row + ", " + col);
                GameManager.chessBoard[row, col] = GameManager.piece ?? ' ';
                Destroy(GameManager.pieceList[row, col]);
                //GameManager.pieceList[row, col] = Instantiate(GameManager.ToPiece(GameManager.piece ?? ' '), new Vector3(col, 7 - row, -2), Quaternion.identity);

                GameManager.chessBoard[GameManager.prexY, GameManager.prevX] = ' ';
                Destroy(GameManager.pieceList[GameManager.prexY, GameManager.prevX]);

                Destroy(GameManager.pieceCursor);

                GameManager.move += 1;
                GameManager.piece = null;
            }
        }*/
        
    }
}
