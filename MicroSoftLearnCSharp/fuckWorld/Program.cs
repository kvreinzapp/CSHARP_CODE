public static class ToDoList
{
    public static string[] tasks = new string[10];
    public static int taskCount = 0;
    public static void addTask()
    {
        Console.WriteLine("Enter a new task:");
        tasks[taskCount] = Console.ReadLine();
        taskCount++;
    }
    public static void viewTasks()
    {
        if (taskCount == 0)
        {
            Console.WriteLine("No task now.");
        }
        Console.WriteLine("Your tasks:");
        for (int i = 0; i < taskCount; i++)
        {
            Console.WriteLine((i + 1) + ". " + tasks[i]);
        }
    }
    public static void CompleteTask()
    {
        Console.WriteLine("Enter the number of the tasks to mark as complete:");
        int taskNumber = int.Parse(Console.ReadLine()) - 1;
        Console.WriteLine("Task number is: " + taskNumber);
        if (taskNumber >= 0 && taskNumber < taskCount)
        {
            tasks[taskNumber] = tasks[taskNumber] + "(Completed)";
            Console.WriteLine("Task marked as complete.");
        }
        else
        {
            Console.WriteLine("Invalid task number. Please Try again");
        }
    }
    public static void Main(string[] args)
    {
        bool running = true;
        while (running)
        {
            Console.WriteLine("What would you like to do?");
            Console.WriteLine("1. Add a task");
            Console.WriteLine("2. View tasks");
            Console.WriteLine("3. Mark a task as complete");
            Console.WriteLine("4. Exit");
            string choice = Console.ReadLine();
            switch (choice)
            {
                case "1":
                    ToDoList.addTask();
                    break;
                case "2":
                    ToDoList.viewTasks();
                    break;
                case "3":
                    ToDoList.CompleteTask();
                    break;
                case "4":
                    running = false;
                    break;
                default:
                    Console.WriteLine("Invalid Choice");
                    break;
            }
        }
    }
}