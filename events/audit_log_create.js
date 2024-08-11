module.exports = {
    name: "Audit Log Created",
    nameSchemes: ["Store Audit Log As"],
    
    initialize(client, data, run) {
      client.on('guildAuditLogEntryCreate', (guild, auditLogEntry) => {
        run([
          auditLogEntry
        ], { guild })
      })
    }
  };
  