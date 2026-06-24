Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run "powershell -Command ""Start-Process python -ArgumentList '-m','http.server','8080' -WindowStyle Hidden""", 0, True
WScript.Sleep 500
shell.Run "http://localhost:8080/AIchat.html"
