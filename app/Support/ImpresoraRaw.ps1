param(
    [Parameter(Mandatory = $true)][string]$Printer,
    [Parameter(Mandatory = $true)][string]$Path
)

if (-not (Test-Path -LiteralPath $Path)) {
    Write-Output "ERR_ARCHIVO"
    exit 1
}

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class ImpresoraRawEscPos
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool OpenPrinter(string src, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static string Enviar(string impresora, byte[] datos)
    {
        IntPtr hPrinter;

        if (!OpenPrinter(impresora, out hPrinter, IntPtr.Zero))
        {
            return "ERR_ABRIR";
        }

        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Ticket POS";
        di.pOutputFile = null;
        di.pDataType = "RAW";

        if (!StartDocPrinter(hPrinter, 1, di))
        {
            ClosePrinter(hPrinter);
            return "ERR_DOCUMENTO";
        }

        StartPagePrinter(hPrinter);

        IntPtr puntero = Marshal.AllocCoTaskMem(datos.Length);
        Marshal.Copy(datos, 0, puntero, datos.Length);

        int escrito;
        bool ok = WritePrinter(hPrinter, puntero, datos.Length, out escrito);

        Marshal.FreeCoTaskMem(puntero);
        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return ok ? "OK" : "ERR_ESCRITURA";
    }
}
"@

try {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    Write-Output ([ImpresoraRawEscPos]::Enviar($Printer, $bytes))
}
catch {
    Write-Output ("ERR_" + $_.Exception.Message)
    exit 1
}
