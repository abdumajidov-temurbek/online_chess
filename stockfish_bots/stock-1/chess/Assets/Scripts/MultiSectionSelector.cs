
using UnityEngine;
using UnityEngine.UI;
public class MultiSectionSelector : MonoBehaviour
{
    public Button[] sectionAButtons;
    public Button[] sectionBButtons;

    private Button selectedA;
    private Button selectedB;

    void Start()
    {
        if (sectionAButtons[3] != null)
        {
            selectedA = sectionAButtons[3];
            Highlight(selectedA);
        }
        if (sectionBButtons[0] != null)
        {
            selectedB = sectionBButtons[0];
            Highlight(selectedB);
        }
    }
    public void SelectFromSetTime(Button b)
    {
        if (selectedA != null) Deselect(selectedA);
        selectedA = b;
        Highlight(selectedA);
    }

    public void SelectFromPlayAs(Button b)
    {
        if (selectedB != null) Deselect(selectedB);
        selectedB = b;
        Highlight(selectedB);
    }

    private void Highlight(Button b)
    {
        b.GetComponent<Image>().color = b.GetComponent<Button>().colors.selectedColor;
    }

    private void Deselect(Button b)
    {
        b.GetComponent<Image>().color = b.GetComponent<Button>().colors.disabledColor;
    }
}
