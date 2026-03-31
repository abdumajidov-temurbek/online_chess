using UnityEngine;
using TMPro;

public class RestartButton : MonoBehaviour
{
    public GameManager gameManager;
    public TextMeshPro label;
    public AudioClip notify;
    void OnMouseDown()
    {
        //gameManager.playAsWhite = !gameManager.playAsWhite; // Toggle play as white
        AudioSource.PlayClipAtPoint(notify, Vector3.zero);
        gameManager.Restart();
    }

    //private float scale = 0.11111f;
    private void OnMouseEnter()
    {
        //transform.localScale = Vector3.one * (1.0f + scale);
        label.color = Color.white;
    }

    private void OnMouseExit()
    {
        //transform.localScale = Vector3.one;
        label.color = new Color(1f, 1f, 1f, 0.25f);
    }
}
