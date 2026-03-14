using Windows.Devices.Bluetooth.Advertisement;

var seconds = 10;
string? nameFilter = null;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--seconds":
            if (i + 1 >= args.Length || !int.TryParse(args[++i], out seconds) || seconds < 1)
            {
                Console.Error.WriteLine("Invalid value for --seconds.");
                return 2;
            }
            break;
        case "--name":
            if (i + 1 >= args.Length)
            {
                Console.Error.WriteLine("Missing value for --name.");
                return 2;
            }
            nameFilter = args[++i];
            break;
        default:
            Console.Error.WriteLine($"Unknown argument: {args[i]}");
            return 2;
    }
}

var devices = new Dictionary<ulong, SeenDevice>();
var sync = new object();

var watcher = new BluetoothLEAdvertisementWatcher
{
    ScanningMode = BluetoothLEScanningMode.Active
};

watcher.Received += (_, eventArgs) =>
{
    var localName = eventArgs.Advertisement.LocalName ?? string.Empty;
    if (!Matches(localName, nameFilter))
    {
        return;
    }

    var shouldPrint = false;

    lock (sync)
    {
        if (!devices.TryGetValue(eventArgs.BluetoothAddress, out var device))
        {
            device = new SeenDevice(eventArgs.BluetoothAddress);
            devices[eventArgs.BluetoothAddress] = device;
            shouldPrint = true;
        }

        if (string.IsNullOrWhiteSpace(device.Name) && !string.IsNullOrWhiteSpace(localName))
        {
            device.Name = localName;
        }

        device.Rssi = eventArgs.RawSignalStrengthInDBm;
        device.LastSeen = eventArgs.Timestamp;
    }

    if (shouldPrint)
    {
        Console.WriteLine(
            "{0}  {1}  RSSI={2,4}  Name={3}",
            DateTime.Now.ToString("HH:mm:ss"),
            FormatMac(eventArgs.BluetoothAddress),
            eventArgs.RawSignalStrengthInDBm,
            string.IsNullOrWhiteSpace(localName) ? "<unknown>" : localName);
    }
};

try
{
    Console.WriteLine(
        "Scanning for BLE advertisements for {0}s{1}...",
        seconds,
        string.IsNullOrWhiteSpace(nameFilter) ? string.Empty : $" (name filter: {nameFilter})");
    watcher.Start();
    await Task.Delay(TimeSpan.FromSeconds(seconds));
    watcher.Stop();
}
catch (Exception ex)
{
    Console.Error.WriteLine("BLE scan failed: {0}", ex.Message);
    return 1;
}

Console.WriteLine();
List<SeenDevice> summary;
lock (sync)
{
    summary = devices.Values
        .OrderBy(device => string.IsNullOrWhiteSpace(device.Name) ? "~" : device.Name)
        .ThenBy(device => device.Address)
        .ToList();
}

Console.WriteLine("Summary: {0} device(s)", summary.Count);
foreach (var device in summary)
{
    Console.WriteLine(
        "{0}  RSSI={1,4}  Name={2}",
        FormatMac(device.Address),
        device.Rssi,
        string.IsNullOrWhiteSpace(device.Name) ? "<unknown>" : device.Name);
}

return 0;

static bool Matches(string localName, string? nameFilter)
{
    if (string.IsNullOrWhiteSpace(nameFilter))
    {
        return true;
    }

    return !string.IsNullOrWhiteSpace(localName)
        && localName.Contains(nameFilter, StringComparison.OrdinalIgnoreCase);
}

static string FormatMac(ulong bluetoothAddress)
{
    var hex = bluetoothAddress.ToString("X12");
    return string.Join(":", Enumerable.Range(0, 6).Select(index => hex.Substring(index * 2, 2)));
}

internal sealed class SeenDevice
{
    public SeenDevice(ulong address)
    {
        Address = address;
    }

    public ulong Address { get; }
    public string Name { get; set; } = string.Empty;
    public short Rssi { get; set; }
    public DateTimeOffset LastSeen { get; set; }
}
