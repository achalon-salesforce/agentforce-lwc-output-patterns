# agentforce-lwc-output-patterns

Reusable patterns for building custom Lightning Web Component (LWC) outputs for Agentforce agents. This repo demonstrates how to replace plain-text agent responses with rich, interactive UI components — using two production-ready examples: an appointment calendar picker and a favorite sports team card.

---

## What We Built

### 1. Appointment Calendar Picker

A full calendar interface that the agent renders when a user needs to book an appointment. The user browses available dates, selects a time slot, and confirms — which sends a first-person message back to the agent to continue the conversation.

**Files:**
- `lwc/apptCalendarPicker_0208ca` — calendar UI with date navigation, time slot grid, and confirm button
- `lightningTypes/apptCalendarPicker_0208ca` — Custom Lightning Type backed by `ApptCalendarPicker_0208caData`
- `genAiFunctions/apptPicker_aae3fa_Output` — GenAI Function wired to a Flow
- `flows/apptPicker_aae3fa_Output` — AutoLaunched Flow that receives an LLM-generated JSON payload and assigns it to the output CLT

### 2. Favorite Sports Team Card

A branded card the agent renders once it knows the user's favorite team. Displays the team name with a trophy badge and a **Save to My Profile** button that sends the team back into the conversation for the agent to process.

**Files:**
- `lwc/favoriteTeamOutput` — output card with trophy badge and save button
- `lightningTypes/favoriteTeamOutput` — Custom Lightning Type backed by `FavoriteTeamOutputData`
- `genAiFunctions/SaveFavoriteTeamOutput` — GenAI Function wired to a Flow
- `flows/SaveFavoriteTeamOutput` — AutoLaunched Flow that receives JSON and assigns it to the output CLT
- `classes/FavoriteTeamAgent` — `@InvocableMethod` that updates `User.AboutMe` when called by the agent

---

## Why LWC Outputs, Not Inputs

When we started this project we explored **Custom Lightning Type inputs** — a pattern that lets an LWC collect structured data from the user before the agent runs. Technically it's supported by the platform. In practice, it's flaky. As one Slack colleague put it:

> "The short answer is: input CLTs are technically supported but notoriously flaky, with many people hitting the same wall you are."

We hit that wall ourselves. The input LWC rendered correctly, but calling `@AuraEnabled` Apex directly from an Embedded Messaging context returned `400/500` errors. There's no Apex class whitelist mechanism on Embedded Messaging sites like there is on Experience Cloud — the runtime simply blocks it.

**The better pattern is outputs.** Instead of collecting input in the LWC and pushing it into Apex, you:

1. Let the agent ask the question in natural language
2. Render a custom LWC output card showing what the agent found or confirmed
3. Use a button in the output LWC to fire `sendUtterance` — posting a first-person message back into the chat
4. The agent receives that utterance and calls the action to do the work

This is exactly how the calendar picker works: the agent renders the calendar, the user picks a slot, the button fires `"I'd like an appointment on Thursday, May 28 at 10:30 AM"` — and the agent handles booking from there.

---

## How the Pattern Works

```
Agent decides to show a custom UI
    ↓
GenAI Function invoked
    ↓
AutoLaunched Flow receives LLM-generated JSON payload
    ↓
Flow assigns JSON string → Apex data class (Custom Lightning Type)
    ↓
CLT renderer.json points to your LWC
    ↓
LWC renders in the chat window
    ↓
User interacts → button fires sendUtterance()
    ↓
Message appears in chat → agent continues the conversation
```

Every piece is wired together through the **Custom Lightning Type (CLT)**. The CLT is the bridge between the Apex data class, the GenAI Function output schema, and the LWC renderer.

---

## How to Customize This for Your Use Case

### Step 1: Define Your Data Shape

Create an Apex class to hold your payload as a JSON string:

```apex
@JsonAccess(serializable='always' deserializable='always')
global inherited sharing class YourOutputData {
    @AuraEnabled
    global String yourOutputJSON;
}
```

### Step 2: Register the Custom Lightning Type

```json
// lightningTypes/yourType/schema.json
{
  "title": "Your Type",
  "description": "Description of what this displays",
  "lightning:type": "@apexClassType/c__YourOutputData"
}

// lightningTypes/yourType/lightningDesktopGenAi/renderer.json
{
  "renderer": {
    "componentOverrides": {
      "$": { "definition": "c/yourLwcComponent" }
    }
  }
}
```

### Step 3: Build Your LWC

The key pattern — unwrap the JSON envelope and parse the payload:

```javascript
import { LightningElement, api } from 'lwc';

export default class YourLwcComponent extends LightningElement {
    _value;
    data = {};

    @api
    get value() { return this._value; }
    set value(v) {
        this._value = v;
        // Unwrap the Apex envelope field, then parse the JSON string
        const raw = v?.yourOutputJSON;
        if (raw) {
            try { this.data = JSON.parse(raw); } catch (_) {}
        }
    }
}
```

Register it with the `lightning__AgentforceOutput` target:

```xml
<targets>
    <target>lightning__AgentforceOutput</target>
</targets>
<targetConfigs>
    <targetConfig targets="lightning__AgentforceOutput">
        <sourceType name="c__yourType"/>
    </targetConfig>
</targetConfigs>
```

### Step 4: Wire Up the Flow

The Flow is deliberately simple — it just assigns the LLM-generated payload into the data class:

```
Input variable:  Payload (String, isInput=true)
Output variable: YourOutput (Apex: YourOutputData, isOutput=true)
Assignment:      YourOutput.yourOutputJSON = Payload
```

**This is the only place you need to customize the business logic.** Need to look up account data, check availability, query a system? Add those steps to the Flow before the assignment. The LWC and CLT don't change.

### Step 5: Wire Up the GenAI Function

```xml
<GenAiFunction>
    <invocationTarget>YourFlowApiName</invocationTarget>
    <invocationTargetType>flow</invocationTargetType>
    <masterLabel>Your Action Label</masterLabel>
    <description>Tell the agent when to use this action.</description>
</GenAiFunction>
```

Input schema — the LLM generates the payload:

```json
{
  "properties": {
    "Payload": {
      "description": "JSON payload. Format: {\"title\":\"...\", \"field\":\"...\"}",
      "lightning:type": "lightning__textType",
      "copilotAction:isUserInput": false
    }
  }
}
```

Output schema — the CLT that renders the LWC:

```json
{
  "properties": {
    "YourOutput": {
      "lightning:type": "c__yourType",
      "copilotAction:isDisplayable": true,
      "copilotAction:isUsedByPlanner": true
    }
  }
}
```

### Step 6: Add to Your Agent

In Agent Builder, add the GenAI Function to a topic. Set the `Payload` input variable to **Agent populated** — the agent will construct the JSON from context, instructions, and conversation history. You don't need to map it to a record field or hardcode it.

---

## Deployment

```bash
# Deploy all metadata
sf project deploy start --source-dir force-app --target-org <your-alias>

# Assign permission sets to your agent user
sf org assign permset --name FavoriteTeamAccess \
  --on-behalf-of <agent-username> --target-org <your-alias>
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lwc/favoriteTeamOutput` | Sports team output card |
| `lwc/apptCalendarPicker_0208ca` | Calendar date/time picker |
| `lightningTypes/favoriteTeamOutput` | CLT schema + renderer for team card |
| `lightningTypes/apptCalendarPicker_0208ca` | CLT schema + renderer for calendar |
| `flows/SaveFavoriteTeamOutput` | Flow wiring for team card |
| `flows/apptPicker_aae3fa_Output` | Flow wiring for calendar |
| `genAiFunctions/SaveFavoriteTeamOutput` | GenAI Function for team card |
| `genAiFunctions/apptPicker_aae3fa_Output` | GenAI Function for calendar |
| `classes/FavoriteTeamAgent` | Invocable that updates `User.AboutMe` |
| `classes/ApptCalendarPicker_0208caData` | Apex data class for calendar CLT |
| `classes/FavoriteTeamOutputData` | Apex data class for team card CLT |

---

## Troubleshooting & Gotchas

These are real issues we hit building this — save yourself the time.

**LWC not rendering in the builder?**
Try republishing the Embedded Chat deployment. A quick way to force a hard republish is to switch between Messaging for Web V1 and V2 and back — that triggers a full refresh.

**Agent actions not firing in the new Agent Builder?**
Make sure the **Connections** piece is configured properly on your agent. Without it the agent can't invoke actions even if everything else is wired correctly.

**Custom Lightning Type not showing up?**
Go to **Setup → Custom Code → Lightning Types** and confirm your CLT appears in the list. If it's missing, the Lightning Type Bundle didn't deploy correctly.

**Output renders as plain text instead of your LWC?**
Two things to check in the GenAI Function output schema:
1. The output property must have `"copilotAction:isDisplayable": true` and be **set to Show in Conversation** in the UI
2. The `"lightning:type"` must reference your CLT (e.g. `"c__favoriteTeamOutput"`) — **not** the `@apexClassType` form. The `@apexClassType` variant is for the CLT schema itself, not the GenAI Function output schema.

**Input CLTs (collecting data from users)?**
Technically supported, notoriously flaky in Embedded Messaging contexts. `@AuraEnabled` Apex calls from the Embedded Messaging site endpoint return `400/500` errors with no clear fix. The recommended pattern is **outputs** — let the agent ask in natural language, render a confirmation card as output, and use `sendUtterance` on a button to send the user's choice back into the conversation.

---

## Requirements

- Salesforce org with Agentforce enabled
- API version 64.0+
- `sf` CLI authenticated to target org
- Embedded Messaging for Web or Agentforce chat channel configured
