module.exports = {
  data: {
    name: "Timeout Member",
  },
  category: "Members",
  UI: [
    {
      element: "userInput",
      name: "Member",
      storeAs: "member"
    },

    "-",
    
    {
      element: "dropdown",
      storeAs: "unitsOfTime",
      extraField: "timeoutDuration",
      name: "Timeout For",
      choices: [
        {
          name: "Second(s)",
          field: true
        },
        {
          name: "Minute(s)",
          field: true
        },
        {
          name: "Hour(s)",
          field: true
        },
        {
          name: "Day(s)",
          field: true
        }
      ]
    },
    "-",
    {
      element: "input",
      max: 256,
      name: "Reason",
      placeholder: "Leave Blank For None",
      storeAs: "reason"
    }
  ],
  
  subtitle: "Amount Of Time: $[timeoutDuration]$ $[unitsOfTime]$ - Reason: $[reason]$",
  compatibility: ["Any"],

  async run(values, message, client,  bridge) {
    let member = await bridge.getUser(values.member)
    member = await member.member;
    let duration;

    let timeoutDuration = parseFloat(bridge.transf(values.timeoutDuration))
    switch (values.unitsOfTime) {
      case "Second(s)":
        duration = parseFloat(timeoutDuration) * 1000;
        break;

      case "Minute(s)":
        duration = parseFloat(timeoutDuration) * 60 * 1000;
        break;

      case "Hour(s)":
        duration = parseFloat(timeoutDuration) * 60 * 60 * 1000;
        break;

      case "Day(s)":
        duration = parseFloat(timeoutDuration) * 60 * 60 * 24 * 1000;
        break;
    }


    let date = new Date();
    date.setTime(parseFloat(new Date().getTime()) + parseFloat(duration));
    date = date.toISOString()

    if (values.reason.trim() == "") {
      member.edit({
        communicationDisabledUntil: date,
      })
    } else {
      member.edit({
        communicationDisabledUntil: date,
        reason: bridge.transf(values.reason),
      })
    }
  },
};
