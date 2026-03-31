using UnityEngine;
using TMPro;

public class UndoButton : MonoBehaviour
{
    public GameManager gameManager;
    public TextMeshPro label;
    public AudioClip notify;
    void OnMouseDown()
    {
        if (GameManager.gameOver) return;
        AudioSource.PlayClipAtPoint(notify, Vector3.zero);
        gameManager.Undo();
    }

    //private float scale = 0.11111f;
    private void OnMouseEnter()
    {
        if (GameManager.gameOver) return;
        //transform.localScale = Vector3.one * (1.0f + scale);
        label.color = Color.white;
    }

    private void OnMouseExit()
    {
        if (GameManager.gameOver) return;
        //transform.localScale = Vector3.one;
        label.color = new Color(1f, 1f, 1f, 0.25f);
    }
}
