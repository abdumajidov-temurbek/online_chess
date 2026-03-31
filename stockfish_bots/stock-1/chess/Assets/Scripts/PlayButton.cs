using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

public class PlayButton : MonoBehaviour
{
    TextMeshPro tmp;
    private void Start() {
        tmp = GetComponent<TextMeshPro>();
    }
    void OnMouseDown() {
        SceneManager.LoadScene("Game");
    }

    private void OnMouseEnter() {
        tmp.color = Color.white;
    }

    private void OnMouseExit() {
        tmp.color = new Color(1f, 1f, 1f, 0.25f);
    }
}
