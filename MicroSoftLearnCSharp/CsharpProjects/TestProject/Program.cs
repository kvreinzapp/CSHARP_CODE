// See https://aka.ms/new-console-template for more information
string[] names = { "B123", "C234",  "A345", "C15",
                   "B177", "G3003", "C235", "B179" };
foreach (string name in names) {
  if (name.StartsWith("B")) {
    Console.WriteLine($"{name} starts with B");
  }
}
