/**
 * @file NitrogenioController.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags nitrogenio, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function NitrogenioController() {
  
  /**
   * Evaluates favorability for Cylindrospermopsis raciborskii.
   * Context: Section 5.1 - High affinity for ammonium and phenotypic plasticity.
   * 
   * @param {number} ammonia_ug_L - Concentration of NH4+.
   * @param {number} nitrogenPhosphorusRatio - N:P ratio (mass).
   */
  function assessCyanobacteriaRisk(ammonia_ug_L, nitrogenPhosphorusRatio) {
    let riskLevel = 'LOW';
    let dominanceFactor = 0;

    // C. raciborskii thrives with high ammonium availability (Section 5.1.2)
    if (ammonia_ug_L > 500) { 
      dominanceFactor += 5;
    }

    // Low N:P ratios (< 16:1) generally favor N-fixing cyanobacteria, 
    // though C. raciborskii has "consumo de luxo" mechanisms.
    if (nitrogenPhosphorusRatio < 20) {
      dominanceFactor += 3;
    }

    if (dominanceFactor >= 5) {
      riskLevel = 'HIGH - Cylindrospermopsis raciborskii Dominance Likely';
    } else if (dominanceFactor > 2) {
      riskLevel = 'MODERATE';
    }

    console.log(`Cyanobacteria Risk Assessment: ${riskLevel}`);
    return riskLevel;
  }

  // Simulation
  assessCyanobacteriaRisk(600, 10);
}