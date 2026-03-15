# Cursor Office hook script for Windows
# Reads hook event JSON from stdin, writes activity state to a temp file.
$stateFile = Join-Path $env:TEMP "cursor-office-state.json"
$data  = $input | Out-String | ConvertFrom-Json
$event = $data.hook_event_name
$ts    = [int][double]::Parse((Get-Date -UFormat %s))

$state = $null

switch ($event) {
  "preToolUse" {
    $tool = $data.tool_name
    $activity = switch ($tool) {
      { $_ -in "Read","Glob","SemanticSearch","Grep" } { "reading" }
      { $_ -in "Write","StrReplace","EditNotebook","Delete" } { "editing" }
      "Shell" { "running" }
      "Task"  { "phoning" }
      default { "typing" }
    }
    $state = @{ activity = $activity; tool = $tool; ts = $ts }
  }
  "subagentStart" {
    $state = @{ activity = "phoning"; ts = $ts }
  }
  "subagentStop" {
    $state = @{ activity = "typing"; ts = $ts }
  }
  "stop" {
    $activity = switch ($data.status) {
      "completed" { "celebrating" }
      "error"     { "error" }
      default     { "idle" }
    }
    $state = @{ activity = $activity; ts = $ts }
  }
  "beforeSubmitPrompt" {
    $state = @{ activity = "idle"; ts = $ts }
  }
}

if ($state) {
  $state | ConvertTo-Json -Compress | Set-Content $stateFile -Encoding UTF8
}

exit 0
