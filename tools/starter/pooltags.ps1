# Kernel pool usage by tag (read-only: NtQuerySystemInformation class 22, SystemPoolTagInformation), for the no-leaks
# work: which kind of kernel object grows while the test suites run. Starter-only.
#   powershell -NoProfile -File tools/starter/pooltags.ps1                  top 12 paged and nonpaged tags
#   powershell -NoProfile -File tools/starter/pooltags.ps1 -Csv <file>      every tag to a CSV (Tag,PagedMB,PagedLive,NonPagedMB,NonPagedLive)
#   powershell -NoProfile -File tools/starter/pooltags.ps1 -Diff <a> <b>    growth per tag from CSV a to CSV b, top 15 by paged MB
param([string]$Csv, [string[]]$Diff)
if ($Diff) {
  $a = @{}; Import-Csv $Diff[0] | % { $a[$_.Tag] = $_ }
  Import-Csv $Diff[1] | % { $o = $a[$_.Tag]; [pscustomobject]@{ Tag = $_.Tag
      PagedMB = [math]::Round([double]$_.PagedMB - [double]($o.PagedMB), 1); PagedLive = [int64]$_.PagedLive - [int64]($o.PagedLive)
      NonPagedMB = [math]::Round([double]$_.NonPagedMB - [double]($o.NonPagedMB), 1); NonPagedLive = [int64]$_.NonPagedLive - [int64]($o.NonPagedLive) } } |
    Sort-Object PagedMB -Descending | Select-Object -First 15 | Format-Table -AutoSize | Out-String
  return
}
$src = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public static class PoolTags {
  [DllImport("ntdll.dll")] static extern int NtQuerySystemInformation(int cls, IntPtr buf, int len, out int ret);
  public static List<string> Get() {
    int len = 1 << 20; IntPtr buf = IntPtr.Zero; int ret; int st;
    while (true) {
      buf = Marshal.AllocHGlobal(len);
      st = NtQuerySystemInformation(22, buf, len, out ret);
      if (st == unchecked((int)0xC0000004)) { Marshal.FreeHGlobal(buf); len = Math.Max(len * 2, ret + 65536); continue; }
      break;
    }
    var list = new List<string>();
    if (st != 0) { list.Add("status " + st.ToString("X")); return list; }
    int count = Marshal.ReadInt32(buf);
    // SYSTEM_POOLTAG on x64: Tag(4) PagedAllocs(4) PagedFrees(4) pad(4) PagedUsed(8) NonPagedAllocs(4) NonPagedFrees(4) NonPagedUsed(8) = 40 bytes
    IntPtr p = buf + 8;
    for (int i = 0; i < count; i++) {
      byte[] t = new byte[4]; Marshal.Copy(p, t, 0, 4);
      string tag = System.Text.Encoding.ASCII.GetString(t);
      int pa = Marshal.ReadInt32(p, 4), pf = Marshal.ReadInt32(p, 8);
      long pu = Marshal.ReadInt64(p, 16);
      int na = Marshal.ReadInt32(p, 24), nf = Marshal.ReadInt32(p, 28);
      long nu = Marshal.ReadInt64(p, 32);
      list.Add(tag + "|" + pu + "|" + (pa - pf) + "|" + nu + "|" + (na - nf));
      p += 40;
    }
    Marshal.FreeHGlobal(buf);
    return list;
  }
}
"@
Add-Type -TypeDefinition $src
$rows = [PoolTags]::Get() | % { $f = $_ -split '\|'; if ($f.Count -ge 5) { [pscustomobject]@{ Tag=$f[0]; PagedMB=[math]::Round([double]$f[1]/1MB,1); PagedLive=[int64]$f[2]; NonPagedMB=[math]::Round([double]$f[3]/1MB,1); NonPagedLive=[int64]$f[4] } } else { $_ } }
if ($Csv) { $rows | Export-Csv -NoTypeInformation -Path $Csv; "wrote $Csv ($(@($rows).Count) tags)"; return }
"--- top paged ---"
$rows | Sort-Object PagedMB -Descending | Select-Object -First 12 | Format-Table -AutoSize | Out-String
"--- top nonpaged ---"
$rows | Sort-Object NonPagedMB -Descending | Select-Object -First 12 | Format-Table -AutoSize | Out-String
