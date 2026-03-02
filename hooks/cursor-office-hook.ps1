# Cursor Office hook script for Windows
# Reads hook event JSON from stdin, writes activity state to a temp file.
$stateFile = Join-Path $env:TEMP "cursor-office-state.json"
$input_data = $input | Out-String

function Get-JsonValue {
  param([string]$json, [string]$key)
  if ($json -match """$key""\s*:\s*""([^""]+)""") { return $Matches[1] }
  return ""
}

$event = Get-JsonValue $input_data "hook_event_name"
$ts    = [int][double]::Parse((Get-Date -UFormat %s))

switch ($event) {
  "preToolUse" {
    $tool = Get-JsonValue $input_data "tool_name"
    $activity = switch ($tool) {
      { $_ -in "Read","Glob","SemanticSearch","Grep" } { "reading" }
      { $_ -in "Write","StrReplace","EditNotebook","Delete" } { "editing" }
      "Shell" { "running" }
      "Task"  { "phoning" }
      default { "typing" }
    }
    "{""activity"":""$activity"",""tool"":""$tool"",""ts"":$ts}" | Set-Content $stateFile -Encoding UTF8
  }
  "subagentStart" {
    "{""activity"":""phoning"",""ts"":$ts}" | Set-Content $stateFile -Encoding UTF8
  }
  "subagentStop" {
    "{""activity"":""typing"",""ts"":$ts}" | Set-Content $stateFile -Encoding UTF8
  }
  "stop" {
    $status = Get-JsonValue $input_data "status"
    $activity = switch ($status) {
      "completed" { "celebrating" }
      "error"     { "error" }
      default     { "idle" }
    }
    "{""activity"":""$activity"",""ts"":$ts}" | Set-Content $stateFile -Encoding UTF8
  }
  "beforeSubmitPrompt" {
    "{""activity"":""idle"",""ts"":$ts}" | Set-Content $stateFile -Encoding UTF8
  }
}

exit 0
