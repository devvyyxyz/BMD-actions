module.exports = {
  name: "Cron Job",
  nameSchemes: [`Cron String Input
  <div class="hoverablez" onclick="require('electron').shell.openExternal('https://crontab.guru/')" style="width: 96%; margin: auto; padding-bottom: 12px; margin-bottom: -12px; border-radius: 8px;"><text style="margin-left:8px; padding: 3px;">Examples</text></div>`,
  "Cron Timezone (Leave blank for default)"
  ],
  preventStorage: [`Cron String Input
  <div class="hoverablez" onclick="require('electron').shell.openExternal('https://crontab.guru/')" style="width: 96%; margin: auto; padding-bottom: 12px; margin-bottom: -12px; border-radius: 8px;"><text style="margin-left:8px; padding: 3px;">Examples</text></div>`,
  "Cron Timezone (Leave blank for default)"
],
  initialize(client, data, run) {
    const cron = require('node-cron');
    cron.schedule(data[0], () => {
      run([], {});
    }, data[1] ? {timezone: data[1]} : null);
  }
};