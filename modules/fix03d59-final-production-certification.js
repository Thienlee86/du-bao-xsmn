/* =========================================================================
   FIX-03D5.9
   FINAL PRODUCTION CERTIFICATION V1

   FILE:
   modules/fix03d59-final-production-certification.js

   PURPOSE:
   - Perform the FINAL read-only certification of the FIX-03D5.9
     Production Forecast commit chain.
   - Verify the real Production Pre-Commit Gate is available.
   - Verify the Production Commit Controller is available.
   - Verify the current LAST_FORECAST can be observed through the
     existing read-only bridge/accessor.
   - Verify the currently selected province and production window.
   - Re-run existing READ-ONLY inspectors where available.
   - Produce ONE final certification result in RAM.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - NO savePrediction().
   - DOES NOT MODIFY LAST_FORECAST.
   - DOES NOT CREATE A FORECAST.
   - DOES NOT PROMOTE A CANDIDATE.
   - FAIL CLOSED.

   CERTIFICATION RESULT:
   window.LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION

   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_FINAL_PRODUCTION_CERTIFICATION_V1';


  /* =====================================================================
     HELPERS
     ===================================================================== */

  function safeCall(fn) {

    try {

      return {

        ok: true,

        value:
          fn()

      };

    } catch (error) {

      return {

        ok: false,

        error:
          error

      };

    }

  }


  function normalizeProvince(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return '';

    }


    return String(value)
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-');

  }


  function cloneDiagnostic(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return value;

    }


    try {

      return JSON.parse(
        JSON.stringify(value)
      );

    } catch (error) {

      return {

        unavailable:
          true,

        reason:
          'DIAGNOSTIC_CLONE_FAILED'

      };

    }

  }


  function fail(reason, details) {

    const result = {

      version:
        VERSION,

      ready:
        false,

      passed:
        false,

      certified:
        false,

      reason:
        reason,

      details:
        details || null,

      safety: {

        readOnly:
          true,

        engineExecution:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePrediction:
          false,

        lastForecastModified:
          false

      },

      timestamp:
        new Date().toISOString()

    };


    window
      .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION =
        result;


    return result;

  }


  /* =====================================================================
     READ CURRENT PRODUCTION FORECAST
     ===================================================================== */

  function readCurrentForecast() {

    const readers = [

      'readLastForecast03D59',

      'readProductionForecast03D59',

      'getProductionForecast03D59',

      'readLastForecast84FLH',

      'getForecast84FLH'

    ];


    for (
      let i = 0;
      i < readers.length;
      i += 1
    ) {

      const name =
        readers[i];


      if (
        typeof window[name] ===
        'function'
      ) {

        const attempt =
          safeCall(
            function () {

              return window[name]();

            }
          );


        if (
          attempt.ok &&
          attempt.value
        ) {

          return {

            ready:
              true,

            source:
              name,

            forecast:
              attempt.value

          };

        }

      }

    }


    /*
     * Diagnostic aliases are accepted only as READ sources.
     */

    const aliases = [

      'LAST_FIX03D59_PRODUCTION_FORECAST',

      'LAST_FIX03D59_STEP84FL',

      'LAST_FIX03D59_STEP84F'

    ];


    for (
      let i = 0;
      i < aliases.length;
      i += 1
    ) {

      const name =
        aliases[i];


      const value =
        window[name];


      if (value) {

        const candidate =
          value.forecast ||
          value.currentForecast ||
          value.lastForecast ||
          null;


        if (candidate) {

          return {

            ready:
              true,

            source:
              name,

            forecast:
              candidate

          };

        }

      }

    }


    return {

      ready:
        false,

      source:
        null,

      forecast:
        null

    };

  }


  /* =====================================================================
     READ CURRENT SELECTED PROVINCE
     ===================================================================== */

  function readSelectedProvince() {

    const resolverNames = [

      'resolveStep83BScope03D59',

      'inspectStep83BScope03D59'

    ];


    for (
      let i = 0;
      i < resolverNames.length;
      i += 1
    ) {

      const name =
        resolverNames[i];


      if (
        typeof window[name] !==
        'function'
      ) {

        continue;

      }


      const attempt =
        safeCall(
          function () {

            return window[name]();

          }
        );


      if (
        !attempt.ok ||
        !attempt.value
      ) {

        continue;

      }


      const value =
        attempt.value;


      const province =
        value.province ||
        value.selectedProvince ||
        value.provinceSlug ||
        null;


      if (province) {

        return {

          ready:
            true,

          source:
            name,

          province:
            normalizeProvince(
              province
            )

        };

      }

    }


    /*
     * Existing controller diagnostics may expose the exact
     * currently selected Production province.
     */

    const controller =
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER ||
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER_RESULT ||
      null;


    if (controller) {

      const province =
        controller.selectedProvince ||
        (
          controller.details &&
          controller.details.selectedProvince
        ) ||
        null;


      if (province) {

        return {

          ready:
            true,

          source:
            'PRODUCTION_COMMIT_CONTROLLER_DIAGNOSTIC',

          province:
            normalizeProvince(
              province
            )

        };

      }

    }


    return {

      ready:
        false,

      source:
        null,

      province:
        ''

    };

  }


  /* =====================================================================
     EXTRACT FORECAST ENVELOPE
     ===================================================================== */

  function inspectForecastEnvelope(
    rawForecast
  ) {

    if (!rawForecast) {

      return {

        ready:
          false,

        reason:
          'FORECAST_NOT_AVAILABLE'

      };

    }


    /*
     * Some accessors return LAST_FORECAST directly.
     * Some diagnostics wrap it.
     */

    const envelope =
      rawForecast.lastForecast ||
      rawForecast.currentForecast ||
      rawForecast;


    const forecastItems =
      Array.isArray(
        envelope.forecast
      )
        ? envelope.forecast
        : null;


    const pairFormulas =
      Array.isArray(
        envelope.pairFormulas
      )
        ? envelope.pairFormulas
        : null;


    if (!forecastItems) {

      return {

        ready:
          false,

        reason:
          'FORECAST_ITEMS_NOT_AVAILABLE'

      };

    }


    if (!pairFormulas) {

      return {

        ready:
          false,

        reason:
          'PAIR_FORMULAS_NOT_AVAILABLE'

      };

    }


    const firstItem =
      forecastItems.length > 0
        ? forecastItems[0]
        : null;


    const province =
      normalizeProvince(
        envelope.province ||
        (
          firstItem &&
          (
            firstItem.province ||
            firstItem.provinceSlug
          )
        ) ||
        ''
      );


    const windowSize =
      Number(
        envelope.windowSize ||
        envelope.window ||
        (
          firstItem &&
          (
            firstItem.windowSize ||
            firstItem.window
          )
        ) ||
        0
      );


    return {

      ready:
        true,

      reason:
        'FORECAST_ENVELOPE_READY',

      envelope:
        envelope,

      province:
        province,

      windowSize:
        windowSize,

      forecastItemCount:
        forecastItems.length,

      pairFormulaCount:
        pairFormulas.length

    };

  }


  /* =====================================================================
     PRE-COMMIT GATE CERTIFICATION
     ===================================================================== */

  function inspectPreCommitGate(
    envelope,
    selectedProvince,
    windowSize
  ) {

    const gate =
      window
        .inspectFix03D59ProductionPreCommit;


    if (
      typeof gate !==
      'function'
    ) {

      return {

        ready:
          false,

        passed:
          false,

        authorized:
          false,

        reason:
          'PRECOMMIT_GATE_NOT_AVAILABLE'

      };

    }


    const attempt =
      safeCall(
        function () {

          return gate(
            envelope,
            {

              selectedProvince:
                selectedProvince,

              windowSize:
                windowSize

            }
          );

        }
      );


    if (!attempt.ok) {

      return {

        ready:
          false,

        passed:
          false,

        authorized:
          false,

        reason:
          'PRECOMMIT_GATE_EXECUTION_FAILED',

        error:
          String(
            attempt.error &&
            attempt.error.message
              ? attempt.error.message
              : attempt.error
          )

      };

    }


    const result =
      attempt.value;


    if (!result) {

      return {

        ready:
          false,

        passed:
          false,

        authorized:
          false,

        reason:
          'PRECOMMIT_GATE_EMPTY_RESULT'

      };

    }


    return cloneDiagnostic(
      result
    );

  }


  /* =====================================================================
     CONTROLLER CERTIFICATION
     ===================================================================== */

  function inspectController() {

    const controllerFunctions = [

      'inspectFix03D59ProductionCommitController',

      'runFix03D59ProductionCommitController',

      'inspectProductionCommitController03D59'

    ];


    /*
     * Prefer an already produced controller diagnostic.
     * This avoids triggering any controller behavior unnecessarily.
     */

    const cached =
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER ||
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER_RESULT ||
      null;


    if (cached) {

      return {

        ready:
          true,

        source:
          'CACHED_CONTROLLER_DIAGNOSTIC',

        result:
          cloneDiagnostic(
            cached
          )

      };

    }


    for (
      let i = 0;
      i < controllerFunctions.length;
      i += 1
    ) {

      const name =
        controllerFunctions[i];


      if (
        typeof window[name] ===
        'function'
      ) {

        return {

          ready:
            true,

          source:
            name,

          result:
            null,

          functionAvailable:
            true

        };

      }

    }


    return {

      ready:
        false,

      source:
        null,

      result:
        null,

      functionAvailable:
        false

    };

  }


  /* =====================================================================
     FINAL CERTIFICATION
     ===================================================================== */

  function certifyFix03D59Production() {

    /*
     * ---------------------------------------------------------------
     * 1. REAL PRE-COMMIT BOUNDARY
     * ---------------------------------------------------------------
     */

    if (
      typeof window
        .inspectFix03D59ProductionPreCommit !==
      'function'
    ) {

      return fail(
        'REAL_PRECOMMIT_GATE_NOT_AVAILABLE'
      );

    }


    /*
     * ---------------------------------------------------------------
     * 2. CURRENT PRODUCTION FORECAST
     * ---------------------------------------------------------------
     */

    const forecastRead =
      readCurrentForecast();


    if (
      !forecastRead.ready ||
      !forecastRead.forecast
    ) {

      return fail(
        'CURRENT_PRODUCTION_FORECAST_NOT_AVAILABLE',
        {

          forecastSource:
            forecastRead.source

        }
      );

    }


    /*
     * ---------------------------------------------------------------
     * 3. FORECAST ENVELOPE
     * ---------------------------------------------------------------
     */

    const forecastInspection =
      inspectForecastEnvelope(
        forecastRead.forecast
      );


    if (!forecastInspection.ready) {

      return fail(
        forecastInspection.reason
      );

    }


    if (
      forecastInspection.forecastItemCount !==
      9
    ) {

      return fail(
        'FORECAST_ITEM_COUNT_INVALID',
        {

          actual:
            forecastInspection
              .forecastItemCount,

          expected:
            9

        }
      );

    }


    if (
      forecastInspection.pairFormulaCount !==
      3
    ) {

      return fail(
        'PAIR_FORMULA_COUNT_INVALID',
        {

          actual:
            forecastInspection
              .pairFormulaCount,

          expected:
            3

        }
      );

    }


    /*
     * ---------------------------------------------------------------
     * 4. SELECTED PROVINCE
     * ---------------------------------------------------------------
     */

    const selected =
      readSelectedProvince();


    let selectedProvince =
      selected.province;


    /*
     * If resolver is unavailable, the envelope province may still
     * provide the production identity. We do NOT invent a province.
     */

    if (
      !selectedProvince &&
      forecastInspection.province
    ) {

      selectedProvince =
        forecastInspection.province;

    }


    if (!selectedProvince) {

      return fail(
        'SELECTED_PROVINCE_NOT_AVAILABLE'
      );

    }


    if (
      forecastInspection.province &&
      normalizeProvince(
        forecastInspection.province
      ) !==
      normalizeProvince(
        selectedProvince
      )
    ) {

      return fail(
        'PROVINCE_MISMATCH',
        {

          selectedProvince:
            selectedProvince,

          forecastProvince:
            forecastInspection.province

        }
      );

    }


    /*
     * ---------------------------------------------------------------
     * 5. WINDOW
     * ---------------------------------------------------------------
     */

    let productionWindow =
      forecastInspection.windowSize;


    const controllerDiagnostic =
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER ||
      window
        .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER_RESULT ||
      null;


    if (
      !productionWindow &&
      controllerDiagnostic
    ) {

      productionWindow =
        Number(
          controllerDiagnostic.windowSize ||
          (
            controllerDiagnostic.details &&
            controllerDiagnostic.details.windowSize
          ) ||
          0
        );

    }


    if (
      !Number.isFinite(
        productionWindow
      ) ||
      productionWindow <= 0
    ) {

      return fail(
        'PRODUCTION_WINDOW_NOT_AVAILABLE'
      );

    }


    /*
     * ---------------------------------------------------------------
     * 6. RE-RUN REAL PRE-COMMIT GATE READ-ONLY
     * ---------------------------------------------------------------
     */

    const gateResult =
      inspectPreCommitGate(
        forecastInspection.envelope,
        selectedProvince,
        productionWindow
      );


    if (
      !gateResult ||
      gateResult.ready !== true
    ) {

      return fail(
        gateResult &&
        gateResult.reason
          ? gateResult.reason
          : 'PRECOMMIT_GATE_NOT_READY',
        {

          gate:
            gateResult || null

        }
      );

    }


    if (
      gateResult.passed !== true
    ) {

      return fail(
        gateResult.reason ||
        'PRECOMMIT_GATE_NOT_PASSED',
        {

          gate:
            gateResult

        }
      );

    }


    if (
      gateResult.authorized !==
      true
    ) {

      return fail(
        gateResult.reason ||
        'PRECOMMIT_GATE_NOT_AUTHORIZED',
        {

          gate:
            gateResult

        }
      );

    }


    /*
     * ---------------------------------------------------------------
     * 7. CONTROLLER PRESENCE
     * ---------------------------------------------------------------
     */

    const controller =
      inspectController();


    if (!controller.ready) {

      return fail(
        'PRODUCTION_COMMIT_CONTROLLER_NOT_AVAILABLE'
      );

    }


    /*
     * ---------------------------------------------------------------
     * 8. FINAL CERTIFIED RESULT
     * ---------------------------------------------------------------
     */

    const result = {

      version:
        VERSION,

      ready:
        true,

      passed:
        true,

      certified:
        true,

      reason:
        'FINAL_PRODUCTION_CERTIFIED',

      production: {

        selectedProvince:
          selectedProvince,

        forecastProvince:
          forecastInspection.province ||
          selectedProvince,

        windowSize:
          productionWindow,

        forecastItemCount:
          forecastInspection
            .forecastItemCount,

        pairFormulaCount:
          forecastInspection
            .pairFormulaCount

      },

      sources: {

        forecast:
          forecastRead.source,

        selectedProvince:
          selected.source ||
          'FORECAST_ENVELOPE',

        controller:
          controller.source

      },

      preCommitGate:
        cloneDiagnostic(
          gateResult
        ),

      controller: {

        ready:
          controller.ready,

        source:
          controller.source,

        functionAvailable:
          controller.functionAvailable ===
          true,

        diagnostic:
          cloneDiagnostic(
            controller.result
          )

      },

      safety: {

        readOnly:
          true,

        engineExecution:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePrediction:
          false,

        lastForecastModified:
          false

      },

      timestamp:
        new Date().toISOString()

    };


    window
      .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION =
        result;


    return result;

  }


  /* =====================================================================
     PUBLIC READ-ONLY API
     ===================================================================== */

  window
    .certifyFix03D59Production =
      certifyFix03D59Production;


  window
    .inspectFix03D59FinalProductionCertification =
      function () {

        return window
          .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION ||
          null;

      };


  window
    .FIX03D59_FINAL_PRODUCTION_CERTIFICATION_VERSION =
      VERSION;


})();
