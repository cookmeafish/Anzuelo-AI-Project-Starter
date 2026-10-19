# Incident references

## Incident file
`docs/incidents/YYYY-MM-DD-<topic>.md`, opened in the first minutes and filled in as the incident goes on.
```
# Incident: <what users saw, in a few words>
Level: <1-4> | Status: investigating | identified | monitoring | resolved
Started: <time and zone> | Noticed: <time> | Resolved: <time>
Lead: <who decides> | Updates: <who writes them>

## Impact
<who and how many were affected, for how long, what was lost or wrong; numbers, labelled as estimates when they are>

## Timeline
| Time (zone) | What happened or was done | Source |
|---|---|---|
| 14:02 | Error rate on checkout rose from 0.2% to 31% | error tracker |
| 14:09 | Alert reached the on-call person | pager |
| 14:15 | Release 2.4.1 (deployed 13:58) suspected; rollback approved by the user | chat |
| 14:19 | Rolled back to 2.4.0; error rate back to 0.3% by 14:24 | metrics |

## Updates sent
<each update as sent, with its time>

## Post-mortem
<section 5 of the skill, written once it is resolved>
```

## Update
Short enough to read in 20 seconds.
```
<Title>: <status word>  (<time and zone>)
What is wrong: <in the user's terms>
Who is affected: <which users or features>
What we are doing: <the current action>
Workaround: <if any, or "none yet">
Next update: <time>, or sooner if anything changes
```
Leave out internal service names, guesses at the cause, and fix times nobody can promise.

## Post-mortem
```
## Post-mortem (written YYYY-MM-DD, reviewed with <who>)
### Summary
<two or three plain sentences: what happened, how long, how it was fixed>
### Impact
<users, duration, data, money, in numbers>
### Why-chain
1. Checkout failed because the new price code returned no value for gift cards. (evidence: log line, test)
2. That reached users because no test covered gift cards. (evidence: test list)
3. No test covered them because the spec template has no line for payment types. (evidence: template)
### What made it worse
<slow alert, missing dashboard, unclear rollback step>
### What went well / what did not
### Actions
| Action | Type (prevent / notice sooner / recover faster) | Owner | Due | Becomes a check? |
|---|---|---|---|---|
| Test for every payment type | prevent | <name> | YYYY-MM-DD | yes, in the test suite |
| Alert when checkout errors pass 2% for 5 minutes | notice sooner | <name> | YYYY-MM-DD | yes, monitoring |
### Lessons
<the row added to docs/lessons.md>
```
