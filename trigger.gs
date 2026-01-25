/**
 * Installs a time-driven trigger that runs every 4 hours.
 * Run this function once manually.
 */
function installTrigger() {
  // Clear existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runScheduledUpdate') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create a new trigger for every 4 hours
  ScriptApp.newTrigger('runScheduledUpdate')
    .timeBased()
    .everyHours(4)
    .create();
    
  Logger.log("Trigger installed successfully.");
}

/**
 * The function executed by the trigger.
 * This logic coordinates the update of cards and chats.
 */
function runScheduledUpdate() {
  Logger.log("Starting scheduled update...");

  try {
    // 1. Get Properties
    var scriptProperties = PropertiesService.getScriptProperties();
    var spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
    // Retrieve the Notebook ID from script properties
    var notebookId = scriptProperties.getProperty('NOTEBOOK_ID'); 
    
    // Fallback if property not set
    if (!spreadsheetId) {
      spreadsheetId = '1Xt5Bnx2VftsSx0ul8yemvt-rv8F5L8D3FYznJqVjFnw';
    }
    if (!notebookId) {
      notebookId = '1VyBYRj1Dp1RaHfWxeI8Muf0aPP6olkmx';
    }

    // 2. Open Spreadsheet and signal update
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheetName = 'SystemControl';
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange('A1').setValue('Status');     
      sheet.getRange('B1').setValue('Timestamp');  
      sheet.getRange('C1').setValue('Last Notebook ID'); // New Header
    }

    // 3. Write "PENDING" to signal Colab and record which notebook is expected
    sheet.getRange('A2').setValue('PENDING');
    sheet.getRange('B2').setValue(new Date());
    // Store the notebook ID so the Python script can verify it's the correct one if needed
    sheet.getRange('C2').setValue(notebookId); 
    
    var notebookUrl = 'https://colab.research.google.com/drive/' + notebookId;
    Logger.log("Signal 'PENDING' sent. Expecting analysis from: " + notebookUrl);
    
  } catch (e) {
    Logger.log("Error during update: " + e.toString());
  }
}
