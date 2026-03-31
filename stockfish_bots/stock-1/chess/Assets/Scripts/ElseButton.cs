using UnityEngine;

public class ElseButton : MonoBehaviour
{

    private void OnMouseDown() {
        GameManager.isMoving = false;
        foreach (GameObject place in GameManager.positionList) {
            Destroy(place);
        }
        GameManager.positionList.Clear();
    }
}
