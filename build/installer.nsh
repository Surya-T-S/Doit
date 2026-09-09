!include LogicLib.nsh

; Custom NSIS script for Doit uninstaller
; Ensures complete deletion of application binaries, local data files, and updater caches

!macro customUnInstall
  ; Prompt the user during interactive uninstall
  ${ifNot} ${Silent}
    MessageBox MB_YESNO|MB_ICONQUESTION "Do you also want to completely delete all personal data, tasks, and settings stored by Doit from this computer?" /SD IDYES IDNO skipDataRemoval
      DetailPrint "Removing Doit user application data..."
      RMDir /r "$APPDATA\Doit"
      RMDir /r "$LOCALAPPDATA\doit-updater"
      RMDir /r "$LOCALAPPDATA\Doit"
    skipDataRemoval:
  ${else}
    ; In silent/automated uninstall, remove everything cleanly
    RMDir /r "$APPDATA\Doit"
    RMDir /r "$LOCALAPPDATA\doit-updater"
    RMDir /r "$LOCALAPPDATA\Doit"
  ${EndIf}
!macroend
