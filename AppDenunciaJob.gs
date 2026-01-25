/**
 * @file AppDenunciaJob.gs
 * @project Monitoramento Lago Paranoá
 * @category sociedade
 * @tags app_denuncia, sociedade, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function AppDenunciaJob() {
  return {
    processIncomingReports: function() {
      console.log('Running logic for AppDenunciaJob... Syncing pending reports.');
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const ws = ss.getSheetByName("Denuncias_Cidadas");
      if (!ws) return;
      
      const data = ws.getDataRange().getValues();
      const pendingReports = data.slice(1).filter(row => row[5] === 'EM_ANALISE');
      
      pendingReports.forEach(report => {
        const coords = this.parseCoords(report[2]); // Local/GPS
        if (this.validateGeoData(coords)) {
          const zone = GeoLocationModel().checkZone(coords.lat, coords.lng);
          this.routeToAgency(report[3], zone, report);
        }
      });
    },

    parseCoords: function(gpsString) {
      if (!gpsString) return null;
      const parts = gpsString.split(',');
      if (parts.length !== 2) return null;
      return {
        lat: parseFloat(parts[0]),
        lng: parseFloat(parts[1])
      };
    },

    validateGeoData: function(coords) {
      if (!coords || !coords.lat || !coords.lng) return false;
      return GeoLocationModel().isInLagoRegion(coords.lat, coords.lng);
    },

    routeToAgency: function(type, zone, report) {
      let agency = 'ADASA'; // Default
      
      if (type.includes('ESGOTO') || type.includes('ODOR')) {
        agency = 'CAESB';
      } else if (type.includes('ORLA') || type.includes('INVASAO')) {
        agency = 'IBRAM';
      }
      
      console.log(`📨 Routing ${type} report to ${agency} - Zone: ${zone[0].name}`);
      
      // Aqui poderia enviar email ou webhook real
      // MailApp.sendEmail(...) ou UrlFetchApp.fetch(...)
    }
  };
}