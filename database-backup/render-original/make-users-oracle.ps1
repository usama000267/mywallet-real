$rows = Get-Content ".\users-render-section.txt"

$rows = $rows | Where-Object {
    $_ -and
    $_ -notmatch "^COPY " -and
    $_ -ne "\."
}

$out = @()
$out += "SET DEFINE OFF;"
$out += ""

foreach ($r in $rows) {

    $p = $r -split "`t", 9

    if ($p.Count -ne 9) {
        Write-Host "ERROR: Expected 9 columns, found $($p.Count)"
        Write-Host $r
        exit
    }

    $id       = $p[0]
    $name     = $p[1]
    $email    = $p[2]
    $password = $p[3]
    $balance  = $p[4]
    $refcode  = $p[5]
    $refby    = $p[6]
    $created  = $p[7]
    $blocked  = $p[8]

    $name     = $name.Replace("'", "''")
    $email    = $email.Replace("'", "''")
    $password = $password.Replace("'", "''")
    $refcode  = $refcode.Replace("'", "''")

    if ($refby -eq "\N") {
        $refbySql = "NULL"
    } else {
        $refbySql = $refby
    }

    if ($refcode -eq "\N") {
        $refcodeSql = "NULL"
    } else {
        $refcodeSql = "'$refcode'"
    }

    if ($blocked -eq "t") {
        $blockedSql = "1"
    } else {
        $blockedSql = "0"
    }

    $sql = "INSERT INTO USERS (ID, NAME, EMAIL, PASSWORD, BALANCE, REFERRAL_CODE, REFERRED_BY, CREATED_AT, IS_BLOCKED) VALUES ($id, '$name', '$email', '$password', $balance, $refcodeSql, $refbySql, TO_TIMESTAMP('$created','YYYY-MM-DD HH24:MI:SS.FF6'), $blockedSql);"

    $out += $sql
}

$out += ""
$out += "COMMIT;"

$out | Set-Content ".\users-oracle-insert.sql" -Encoding UTF8

Write-Host "Created users-oracle-insert.sql"
Write-Host "Rows converted:" $rows.Count