using TMPro;
using UnityEngine;

public class QuitButton : MonoBehaviour {
    TextMeshPro tmp;
    private void Start() {
        tmp = GetComponent<TextMeshPro>();
    }
    void OnMouseDown() {
        Application.Quit();
    }

    private void OnMouseEnter() {
        tmp.color = Color.white;
    }

    private void OnMouseExit() {
        tmp.color = new Color(1f, 1f, 1f, 0.25f);
    }
}
