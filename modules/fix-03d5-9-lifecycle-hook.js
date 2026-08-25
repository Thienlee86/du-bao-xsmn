/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH V3
   PRODUCTION FORECAST LIFECYCLE HOOK
   LEXICAL LAST_FORECAST BRIDGE

   PURPOSE:
   - Observe the REAL Production LAST_FORECAST used by app.js.
   - Support lexical global:
       let LAST_FORECAST = ...
   - Fall back to window.LAST_FORECAST only when available.
   - Expose a safe READ-ONLY accessor for downstream modules.
   - Never create a forecast.
   - Never modify LAST_FORECAST.
   - Never call savePrediction().
   - Never write Production/storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_84FLH_V3';


  /*
   * =========================================================
   * 1. REAL PRODUCTION ENVELOPE LOOKUP
   * =========================================================
   *
   * IMPORTANT:
   *
   * app.js declares:
   *
   *   let LAST_FORECAST = null;
   *
   * Therefore LAST_FORECAST may exist as a lexical global
   * without becoming:
   *
   *   window.LAST_FORECAST
   *
   * Lexical lookup MUST be attempted first.
   * =========================================================
   */

  function getProductionForecastEnvelope84FLH() {

    /*
     * ---------------------------------------------------------
     * A. REAL APP.JS LEXICAL GLOBAL
     * ---------------------------------------------------------
     */

    try {

      if (
        typeof LAST_FORECAST !==
          'undefined' &&
        LAST_FORECAST &&
        typeof LAST_FORECAST ===
          'object'
      ) {

        return LAST_FORECAST;

      }

    } catch (error) {

      /*
       * FAIL CLOSED.
       *
       * Continue only to compatibility fallback.
       */

    }


    /*
     * ---------------------------------------------------------
     * B. WINDOW COMPATIBILITY FALLBACK
     * ---------------------------------------------------------
     */

    try {

      if (
        window.LAST_FORECAST &&
        typeof window.LAST_FORECAST ===
          'object'
      ) {

        return window.LAST_FORECAST;

      }

    } catch (error) {

      /*
       * FAIL CLOSED
       */

    }


    return null;

  }


  /*
   * =========================================================
   * 2. FORECAST LOOKUP
   * =========================================================
   */

  function getProductionForecast84FLH() {

    const envelope =
      getProductionForecastEnvelope84FLH();


    if (
      !envelope ||
      typeof envelope !== 'object'
    ) {

      return null;

    }


    /*
     * Current app.js schema:
     *
     * LAST_FORECAST = {
     *   forecast,
     *   pairFormulas
     * };
     */

    if (
      envelope.forecast &&
      typeof envelope.forecast ===
        'object'
    ) {

      return envelope.forecast;

    }


    /*
     * Compatibility only:
     * direct forecast object.
     */

    if (
      envelope.province &&
      Array.isArray(
        envelope.items
      )
    ) {

      return envelope;

    }


    return null;

  }


  /*
   * =========================================================
   * 3. SAFE INSPECTION
   * =========================================================
   */

  function inspectProductionForecast84FLH() {

    const envelope =
      getProductionForecastEnvelope84FLH();


    const forecast =
      getProductionForecast84FLH();


    const exists =
      Boolean(
        envelope &&
        forecast
      );


    const valid =
      Boolean(

        exists &&

        forecast.empty !== true &&

        forecast.province &&

        Array.isArray(
          forecast.items
        ) &&

        forecast.items.length > 0

      );


    const result = {

      ready:
        valid,

      passed:
        valid,

      forecastExists:
        exists,

      forecastValid:
        valid,

      province:
        valid
          ? forecast.province
          : null,

      windowSize:
        valid &&
        Number.isFinite(
          Number(
            forecast.windowSize
          )
        )
          ? Number(
              forecast.windowSize
            )
          : null,

      itemCount:
        valid
          ? forecast.items.length
          : 0,

      reason:
        !exists
          ? 'NO_PRODUCTION_FORECAST_YET'
          : (
              !valid
                ? 'PRODUCTION_FORECAST_SCHEMA_INVALID'
                : 'PRODUCTION_FORECAST_AVAILABLE'
            ),

      source:
        'LEXICAL_LAST_FORECAST_BRIDGE',

      version:
        VERSION,

      readOnly:
        true,

      productionWrite:
        false,

      storageWrite:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      inspectedAt:
        new Date().toISOString()

    };


    /*
     * Diagnostic RAM only.
     *
     * This does NOT modify LAST_FORECAST.
     */

    window
      .LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  /*
   * =========================================================
   * 4. PUBLIC READ-ONLY ACCESSORS
   * =========================================================
   *
   * Downstream modules should use these instead of directly
   * assuming window.LAST_FORECAST exists.
   * =========================================================
   */

  window
    .getFix03D59ProductionForecastEnvelope =
    getProductionForecastEnvelope84FLH;


  window
    .getFix03D59ProductionForecast =
    getProductionForecast84FLH;


  window
    .inspectFix03D59ProductionForecast =
    inspectProductionForecast84FLH;


  window
    .FIX03D59_84FLH_VERSION =
    VERSION;


  window
    .FIX03D59_84FLH_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.4F-LH V3 loaded — LEXICAL LAST_FORECAST BRIDGE / READ ONLY / ZERO WRITE'
  );

})();
