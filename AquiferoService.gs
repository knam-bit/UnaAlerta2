/**
 * @file AquiferoService.gs
 * @project Monitoramento Lago Paranoá
 * @category hidrogeologia
 * @tags aquifero, hidrogeologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function AquiferoService() {
  
  /**
   * Simulates vertical percolation from Porous Domain to Fractured Aquifer.
   * Context: Section 2.1 - The communication between domains is vital for base flow.
   * 
   * @param {number} porousStorage_vol - Current water volume in saprolite/soil.
   * @param {boolean} isSurfaceSealed - If true, vertical recharge is cut off.
   */
  function manageAquiferRecharge(porousStorage_vol, isSurfaceSealed) {
    const FRACTURED_RECHARGE_RATE = 0.05; // 5% percolation rate
    
    if (isSurfaceSealed) {
      console.error('CRITICAL: Surface sealing detected (Urbanization).');
      console.error('Consequence: Starvation of Fractured Domain (R4/PPC aquifers).');
      return 0;
    }

    if (porousStorage_vol > 0) {
      const rechargeAmount = porousStorage_vol * FRACTURED_RECHARGE_RATE;
      console.log(`Recharging Fractured Domain: +${rechargeAmount} m3`);
      return rechargeAmount;
    }

    return 0;
  }

  // Simulation: Urbanized area in Lago Norte
  manageAquiferRecharge(1000, true);
}