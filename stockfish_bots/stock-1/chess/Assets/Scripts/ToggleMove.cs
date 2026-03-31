using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using static UnityEngine.GraphicsBuffer;

public class ToggleMove : MonoBehaviour
{
    private bool isDragging = false;
    private Camera cam;
    private float gridSize = 1f;
    private Vector3 initPos;
    private Vector3 targetPos;
    public GameObject place;
    private GameObject newPlace = null;
    public float lerpTime = 1.5f;
    public float scaleTime = 1.5f;
    
    private Vector3 lerpVelocity = Vector2.zero;
    private Vector3 scaleVelocity = Vector2.zero;
    
    private Vector3 initSize = Vector2.one * 1f;
    public Vector3 maxSize;
    
    //public bool isWhite;
    private bool isLocked = true;
    private int prevMove = 0;
    void Start()
    {

        cam = Camera.main;
        targetPos = transform.position;
    }

    // Update is called once per frame
    void Update()
    {
        isLocked = GameManager.move == prevMove;
        prevMove = GameManager.move;
        if (Input.GetMouseButtonDown(0)) {
            Vector2 mousePos = cam.ScreenToWorldPoint( Input.mousePosition );
            Collider2D hit = Physics2D.OverlapPoint(mousePos);
            if (hit != null && hit.gameObject == gameObject) {
                isDragging = !isDragging;
                if (isDragging) {
                    initPos = transform.position;
                }
                if (!isDragging && initPos != targetPos) {
                    GameManager.move += 1;
                }
                if (newPlace == null) {
                    newPlace = Instantiate(place, targetPos, Quaternion.identity);
                    
                }
                else {
                    Destroy(newPlace);
                    targetPos.x = Mathf.Min(Mathf.Max(Mathf.Round(targetPos.x / gridSize) * gridSize,0), 7);
                    targetPos.y = Mathf.Min(Mathf.Max(Mathf.Round(targetPos.y / gridSize) * gridSize,0), 7);
                    
                }
            }
        }

        if (isDragging ) {
            targetPos = cam.ScreenToWorldPoint( Input.mousePosition );
            targetPos.z = -5;
            transform.position = Vector3.SmoothDamp(transform.position, targetPos, ref lerpVelocity, lerpTime);
            targetPos.x = Mathf.Min(Mathf.Max(Mathf.Round(targetPos.x / gridSize) * gridSize, 0), 7);
            targetPos.y = Mathf.Min(Mathf.Max(Mathf.Round(targetPos.y / gridSize) * gridSize, 0), 7);
            targetPos.z = -1;
            newPlace.transform.position = targetPos;
            
            //Debug.Log(transform.position);

            transform.localScale = Vector3.SmoothDamp(transform.localScale, maxSize, ref scaleVelocity, scaleTime);
        }
        else {
            
            transform.position = Vector3.SmoothDamp(transform.position, targetPos, ref lerpVelocity, lerpTime);
            transform.localScale = Vector3.SmoothDamp(transform.localScale, initSize, ref scaleVelocity, scaleTime);
            
        }
        
        
        if (!isLocked) {
            //transform.eulerAngles += Vector3.forward * 180;
        }
        
    }
}

    
