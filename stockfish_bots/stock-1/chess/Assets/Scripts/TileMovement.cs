using UnityEngine;

public class TileMovement : MonoBehaviour
{
    public float speed;
    void Update()
    {
        transform.position += new Vector3(1, 1, 0) * speed * Time.deltaTime;
    }
}
