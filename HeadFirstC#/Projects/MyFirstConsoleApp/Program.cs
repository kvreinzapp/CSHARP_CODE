// See https://aka.ms/new-console-template for more information

OperatorExamples();
void OperatorExamples()
{
    int width = 3;
    width++;
    int height = 2 + 4;
    int area = width * height;
    Console.WriteLine(area);

    while (area < 50)
    {
        height++;
        area = width * height;
    }

    do
    {
        width--;
        area = width * height;
    } while (area > 25);

    string result = "The area";
    result = result + "is" + area;
    Console.WriteLine(result);

    bool truthValue = true;
    Console.WriteLine(truthValue);
}