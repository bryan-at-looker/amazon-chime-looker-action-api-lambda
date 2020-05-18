import { success, failure } from "./libs/response-lib";

export async function main(event, context) {

  const fields = {
    "state": null,
    "fields": [
      {
        "name": "webhook_override",
        "label": "Override Webhook",
        "description": "Override the default webhook for your Amazon Chime group chat",
        "type": "text",
        "required": false
      },
      {
        "name": "send_title",
        "label": "Send Title",
        "description": "Send the Title in the schedule",
        "type": "select",
        "required": true,
        'default': 'yes',
        'options': [
          {label: 'Yes', name: 'yes' },
          {label: 'No', name: 'no' }
        ]
      },
      {
        "name": "include_links",
        "label": "Include Links",
        "description": "Include Drill Links in Markdown Table",
        "type": "select",
        "required": true,
        'default': 'none',
        'options': [
          {label: 'All', name: 'all' },
          {label: 'First', name: 'first' },
          {label: 'None', name: 'none' }
        ]
      },
    ]
  }

  try {
    return success(fields);
  } catch (e) {
    return failure({ status: false });
  }
}
