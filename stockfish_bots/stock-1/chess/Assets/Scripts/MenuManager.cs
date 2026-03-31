using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuManager : MonoBehaviour
{
    public static bool playAsWhite;
    public static int gameTime;
    public GameObject menuPanel;
    public GameObject tile;
    public Color lightCol;
    public Color darkCol;
    public AudioClip notify;

    void Start()
    {
        // Initialize default values
        playAsWhite = true; // Default to playing as white
        gameTime = 10; // Default game time in minutes
        menuPanel.SetActive(false); // Hide the menu at start
        CreateBoard();
    }
    public void OpenMenu()
    {
        // Logic to open the menu
        Debug.Log("Menu opened");
        menuPanel.SetActive(true);
        playSound();
    }
    public void CloseMenu()
    {
        // Logic to close the menu
        Debug.Log("Menu closed");
        menuPanel.SetActive(false);
        playSound();
    }
    public void Quit()
    {
        // Logic to quit the game
        Debug.Log("Game quit");
        playSound();
        Application.Quit();
    }
    public void SetPlayAsWhite(bool isItWhite)
    {
        playAsWhite = isItWhite;
        Debug.Log("Play as White: " + playAsWhite);
        playSound();
    }
    public void SetPlayAsRandom()
    {
        playAsWhite = Random.value > 0.5f; // Randomly set to true or false
        Debug.Log("Play as Random: " + playAsWhite);
        playSound();
    }
    public void SetGameTime(int time)
    {
        gameTime = time;
        Debug.Log("Game time set to: " + gameTime + " minutes");
        playSound();
    }

    public void Play()
    {
        CloseMenu();
        playSound();
        SceneManager.LoadScene("Game"); // Load the game scene
    }

    void CreateBoard()
    {
        if (tile == null) return;
        SpriteRenderer sr = tile.GetComponent<SpriteRenderer>();
        for (int row = -100; row < 100; row++)
        {
            for (int col = -100; col < 100; col++)
            {
                bool isDark = (row + col) % 2 == 0;
                Color color = isDark ? darkCol : lightCol;
                Vector2 position = new Vector3(col, row, 0);
                sr.color = color;
                Instantiate(tile, position, Quaternion.identity);
                //GameObject newButton = Instantiate(button, position, Quaternion.identity);
                //newButton.GetComponent<SpriteButton>().row = 7 - row;
                //newButton.GetComponent<SpriteButton>().col = col;

            }
        }
    }
    private void playSound()
    {
        if (notify != null)
        {
            AudioSource.PlayClipAtPoint(notify, Vector3.zero);
        }
    }
}
