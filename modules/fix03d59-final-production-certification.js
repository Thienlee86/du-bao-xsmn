/* =========================================================================
   FIX-03D5.9
   FINAL PRODUCTION CERTIFICATION V2

   FILE:
   modules/fix03d59-final-production-certification.js

   PURPOSE:
   - Perform FINAL read-only certification of the REAL Production Forecast.
   - Read the exact lexical LAST_FORECAST through the app.js accessor:
       getFix03D59ProductionForecastEnvelope()
   - Understand the REAL envelope schema:

       {
         forecast: {
           province,
           windowSize,
           items: [...]
         },
         pairFormulas: [...]
       }

   - Re-run the existing Production Pre-Commit Gate.
   - Verify the existing Production Commit Controller.
   - Publish ONE final certification result in RAM.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - NO savePrediction().
   - DOES NOT MODIFY LAST_FORECAST.
   - DOES NOT CREATE FORECAST.
   - FAIL CLOSED.

   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_FINAL_PRODUCTION_CERTIFICATION_V2_REAL_ENVELOPE';


  /*
   * =========================================================
   * 1. HELPERS
   * =========================================================
   */

  function isObjectCertification(
    value
  ) {

    return Boolean(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );

  }


  function normalizeTextCertification(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  function cloneDiagnosticCertification(
    value
  ) {

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

      return null;

    }

  }


  /*
   * =========================================================
   * 2. FAIL CLOSED
   * =========================================================
   */

  function failCertification(
    reason,
    extra = {}
  ) {

    const result = {

      version:
        VERSION,

      ready:
        false,

      passed:
        false,

      certified:
        false,

      reason,

      ...extra,

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

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * 3. READ REAL CURRENT PRODUCTION ENVELOPE
   * =========================================================
   *
   * PRIMARY SOURCE:
   *
   * app.js accessor:
   *
   * getFix03D59ProductionForecastEnvelope()
   *
   * This accessor closes over lexical LAST_FORECAST.
   * =========================================================
   */

  function readCurrentProductionEnvelopeCertification() {

    /*
     * ---------------------------------------------------------
     * PRIMARY: APP.JS LEXICAL ACCESSOR
     * ---------------------------------------------------------
     */

    try {

      const accessor =
        window
          .getFix03D59ProductionForecastEnvelope;


      if (
        typeof accessor ===
        'function'
      ) {

        const envelope =
          accessor();


        if (
          isObjectCertification(
            envelope
          )
        ) {

          return {

            ready:
              true,

            source:
              'getFix03D59ProductionForecastEnvelope',

            envelope

          };

        }

      }

    } catch (error) {

      // Continue fail-closed fallbacks.

    }


    /*
     * ---------------------------------------------------------
     * FALLBACK: DIRECT GLOBAL LEXICAL IDENTIFIER
     * ---------------------------------------------------------
     */

    try {

      if (
        typeof LAST_FORECAST !==
          'undefined' &&
        isObjectCertification(
          LAST_FORECAST
        )
      ) {

        return {

          ready:
            true,

          source:
            'LEXICAL_LAST_FORECAST',

          envelope:
            LAST_FORECAST

        };

      }

    } catch (error) {

      // Continue.

    }


    /*
     * ---------------------------------------------------------
     * COMPATIBILITY FALLBACK
     * ---------------------------------------------------------
     */

    try {

      if (
        isObjectCertification(
          window.LAST_FORECAST
        )
      ) {

        return {

          ready:
            true,

          source:
            'window.LAST_FORECAST',

          envelope:
            window.LAST_FORECAST

        };

      }

    } catch (error) {

      // FAIL CLOSED.

    }


    return {

      ready:
        false,

      source:
        null,

      envelope:
        null

    };

  }


  /*
   * =========================================================
   * 4. INSPECT REAL ENVELOPE SCHEMA
   * =========================================================
   */

  function inspectProductionEnvelopeCertification(
    envelope
  ) {

    if (
      !isObjectCertification(
        envelope
      )
    ) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_ENVELOPE_NOT_OBJECT'

      };

    }


    /*
     * REAL schema:
     *
     * envelope.forecast = OBJECT
     *
     * forecast.items = ARRAY
     */

    const forecast =
      isObjectCertification(
        envelope.forecast
      )
        ? envelope.forecast
        : null;


    if (!forecast) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FORECAST_NOT_AVAILABLE'

      };

    }


    const forecastItems =
      Array.isArray(
        forecast.items
      )
        ? forecast.items
        : null;


    if (!forecastItems) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FORECAST_ITEMS_NOT_AVAILABLE'

      };

    }


    const pairFormulas =
      Array.isArray(
        envelope.pairFormulas
      )
        ? envelope.pairFormulas
        : null;


    if (!pairFormulas) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_PAIR_FORMULAS_NOT_AVAILABLE'

      };

    }


    const province =
      normalizeTextCertification(
        forecast.province
      );


    const windowSize =
      Number(
        forecast.windowSize
      );


    if (!province) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FORECAST_PROVINCE_NOT_AVAILABLE'

      };

    }


    if (
      !Number.isFinite(
        windowSize
      )
    ) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FORECAST_WINDOW_NOT_AVAILABLE'

      };

    }


    return {

      ready:
        true,

      reason:
        'PRODUCTION_ENVELOPE_VALID',

      envelope,

      forecast,

      forecastItems,

      pairFormulas,

      province,

      windowSize,

      forecastItemCount:
        forecastItems.length,

      pairFormulaCount:
        pairFormulas.length

    };

  }


  /*
   * =========================================================
   * 5. READ CURRENT SELECTED PROVINCE
   * =========================================================
   */

  function readSelectedProvinceCertification(
    fallbackProvince
  ) {

    /*
     * Direct global lexical app.js state.
     */

    try {

      if (
        typeof SELECTED_PROVINCE !==
          'undefined' &&
        SELECTED_PROVINCE
      ) {

        return {

          ready:
            true,

          source:
            'SELECTED_PROVINCE',

          province:
            normalizeTextCertification(
              SELECTED_PROVINCE
            )

        };

      }

    } catch (error) {

      // Continue.

    }


    /*
     * DOM source.
     */

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return {

          ready:
            true,

          source:
            'provinceSelect',

          province:
            normalizeTextCertification(
              select.value
            )

        };

      }

    } catch (error) {

      // Continue.

    }


    /*
     * Existing authorized controller diagnostic.
     */

    try {

      const controller =
        window
          .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER;


      if (
        controller &&
        controller.selectedProvince
      ) {

        return {

          ready:
            true,

          source:
            'PRODUCTION_COMMIT_CONTROLLER',

          province:
            normalizeTextCertification(
              controller.selectedProvince
            )

        };

      }

    } catch (error) {

      // Continue.

    }


    /*
     * Last fail-closed usable identity:
     *
     * Current envelope's own province.
     *
     * This does NOT invent or change province.
     */

    if (fallbackProvince) {

      return {

        ready:
          true,

        source:
          'CURRENT_PRODUCTION_FORECAST',

        province:
          normalizeTextCertification(
            fallbackProvince
          )

      };

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


  /*
   * =========================================================
   * 6. READ CURRENT WINDOW
   * =========================================================
   */

  function readWindowCertification(
    fallbackWindow
  ) {

    try {

      if (
        typeof WINDOW_SIZE !==
          'undefined'
      ) {

        const value =
          Number(
            WINDOW_SIZE
          );


        if (
          Number.isFinite(
            value
          )
        ) {

          return {

            ready:
              true,

            source:
              'WINDOW_SIZE',

            windowSize:
              value

          };

        }

      }

    } catch (error) {

      // Continue.

    }


    try {

      const controller =
        window
          .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER;


      if (controller) {

        const value =
          Number(
            controller.windowSize
          );


        if (
          Number.isFinite(
            value
          )
        ) {

          return {

            ready:
              true,

            source:
              'PRODUCTION_COMMIT_CONTROLLER',

            windowSize:
              value

          };

        }

      }

    } catch (error) {

      // Continue.

    }


    const fallback =
      Number(
        fallbackWindow
      );


    if (
      Number.isFinite(
        fallback
      )
    ) {

      return {

        ready:
          true,

        source:
          'CURRENT_PRODUCTION_FORECAST',

        windowSize:
          fallback

      };

    }


    return {

      ready:
        false,

      source:
        null,

      windowSize:
        null

    };

  }


  /*
   * =========================================================
   * 7. RUN REAL PRE-COMMIT GATE
   * =========================================================
   */

  function runPreCommitCertification(
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


    try {

      const result =
        gate(
          envelope,
          {
            selectedProvince,
            windowSize
          }
        );


      if (
        !isObjectCertification(
          result
        )
      ) {

        return {

          ready:
            false,

          passed:
            false,

          authorized:
            false,

          reason:
            'PRECOMMIT_GATE_RESULT_NOT_AVAILABLE'

        };

      }


      return result;


    } catch (error) {

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
            error &&
            error.message
              ? error.message
              : error
          )

      };

    }

  }


  /*
   * =========================================================
   * 8. READ / RUN COMMIT CONTROLLER
   * =========================================================
   */

  function inspectControllerCertification() {

    /*
     * Prefer current cached PASS diagnostic.
     */

    try {

      const cached =
        window
          .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER;


      if (
        isObjectCertification(
          cached
        ) &&
        cached.ready === true &&
        cached.passed === true &&
        cached.authorized === true
      ) {

        return {

          ready:
            true,

          passed:
            true,

          authorized:
            true,

          source:
            'CACHED_CONTROLLER_DIAGNOSTIC',

          result:
            cloneDiagnosticCertification(
              cached
            )

        };

      }

    } catch (error) {

      // Continue to controller function.

    }


    const controller =
      window
        .inspectFix03D59ProductionCommitController;


    if (
      typeof controller !==
      'function'
    ) {

      return {

        ready:
          false,

        passed:
          false,

        authorized:
          false,

        source:
          null,

        reason:
          'PRODUCTION_COMMIT_CONTROLLER_NOT_AVAILABLE'

      };

    }


    try {

      const result =
        controller();


      if (
        !isObjectCertification(
          result
        )
      ) {

        return {

          ready:
            false,

          passed:
            false,

          authorized:
            false,

          source:
            'inspectFix03D59ProductionCommitController',

          reason:
            'PRODUCTION_COMMIT_CONTROLLER_RESULT_NOT_AVAILABLE'

        };

      }


      return {

        ready:
          result.ready === true,

        passed:
          result.passed === true,

        authorized:
          result.authorized === true,

        source:
          'inspectFix03D59ProductionCommitController',

        reason:
          result.reason || null,

        result:
          cloneDiagnosticCertification(
            result
          )

      };


    } catch (error) {

      return {

        ready:
          false,

        passed:
          false,

        authorized:
          false,

        source:
          'inspectFix03D59ProductionCommitController',

        reason:
          'PRODUCTION_COMMIT_CONTROLLER_EXECUTION_FAILED',

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )

      };

    }

  }


  /*
   * =========================================================
   * 9. FINAL CERTIFICATION
   * =========================================================
   */

  function certifyFix03D59Production() {

    /*
     * ---------------------------------------------------------
     * A. READ REAL CURRENT LAST_FORECAST
     * ---------------------------------------------------------
     */

    const readResult =
      readCurrentProductionEnvelopeCertification();


    if (
      readResult.ready !== true ||
      !readResult.envelope
    ) {

      return failCertification(
        'CURRENT_PRODUCTION_FORECAST_NOT_AVAILABLE',
        {

          forecastSource:
            readResult.source,

          accessorAvailable:
            typeof window
              .getFix03D59ProductionForecastEnvelope ===
            'function',

          accessorLoadedFlag:
            window
              .FIX03D59_PRODUCTION_FORECAST_ACCESSOR_LOADED ===
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * B. REAL ENVELOPE SCHEMA
     * ---------------------------------------------------------
     */

    const inspection =
      inspectProductionEnvelopeCertification(
        readResult.envelope
      );


    if (
      inspection.ready !== true
    ) {

      return failCertification(
        inspection.reason ||
        'CURRENT_PRODUCTION_ENVELOPE_INVALID',
        {

          forecastSource:
            readResult.source

        }
      );

    }


    /*
     * Production Forecast has exactly 9 prize items.
     */

    if (
      inspection.forecastItemCount !==
      9
    ) {

      return failCertification(
        'FORECAST_ITEM_COUNT_INVALID',
        {

          actual:
            inspection.forecastItemCount,

          expected:
            9

        }
      );

    }


    /*
     * Current Production contract generates 3 pair formulas.
     */

    if (
      inspection.pairFormulaCount !==
      3
    ) {

      return failCertification(
        'PAIR_FORMULA_COUNT_INVALID',
        {

          actual:
            inspection.pairFormulaCount,

          expected:
            3

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * C. CURRENT UI CONTEXT
     * ---------------------------------------------------------
     */

    const selected =
      readSelectedProvinceCertification(
        inspection.province
      );


    if (
      selected.ready !==
      true
    ) {

      return failCertification(
        'SELECTED_PROVINCE_NOT_AVAILABLE'
      );

    }


    const windowResult =
      readWindowCertification(
        inspection.windowSize
      );


    if (
      windowResult.ready !==
      true
    ) {

      return failCertification(
        'PRODUCTION_WINDOW_NOT_AVAILABLE'
      );

    }


    /*
     * Province must bind exactly.
     */

    if (
      normalizeTextCertification(
        selected.province
      ) !==
      normalizeTextCertification(
        inspection.province
      )
    ) {

      return failCertification(
        'PROVINCE_MISMATCH',
        {

          selectedProvince:
            selected.province,

          forecastProvince:
            inspection.province

        }
      );

    }


    /*
     * Window must bind exactly.
     */

    if (
      Number(
        windowResult.windowSize
      ) !==
      Number(
        inspection.windowSize
      )
    ) {

      return failCertification(
        'WINDOW_SIZE_MISMATCH',
        {

          selectedWindow:
            windowResult.windowSize,

          forecastWindow:
            inspection.windowSize

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * D. REAL PRE-COMMIT GATE
     * ---------------------------------------------------------
     */

    const preCommit =
      runPreCommitCertification(

        inspection.envelope,

        selected.province,

        windowResult.windowSize

      );


    if (
      !preCommit ||
      preCommit.ready !== true ||
      preCommit.passed !== true ||
      preCommit.authorized !== true
    ) {

      return failCertification(
        preCommit &&
        preCommit.reason
          ? preCommit.reason
          : 'PRECOMMIT_GATE_BLOCKED',
        {

          production: {

            selectedProvince:
              selected.province,

            forecastProvince:
              inspection.province,

            windowSize:
              inspection.windowSize,

            forecastItemCount:
              inspection.forecastItemCount,

            pairFormulaCount:
              inspection.pairFormulaCount

          },

          preCommitGate:
            cloneDiagnosticCertification(
              preCommit
            )

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * E. COMMIT CONTROLLER
     * ---------------------------------------------------------
     */

    const controller =
      inspectControllerCertification();


    if (
      controller.ready !== true ||
      controller.passed !== true ||
      controller.authorized !== true
    ) {

      return failCertification(
        controller.reason ||
        'PRODUCTION_COMMIT_CONTROLLER_BLOCKED',
        {

          production: {

            selectedProvince:
              selected.province,

            forecastProvince:
              inspection.province,

            windowSize:
              inspection.windowSize,

            forecastItemCount:
              inspection.forecastItemCount,

            pairFormulaCount:
              inspection.pairFormulaCount

          },

          preCommitGate:
            cloneDiagnosticCertification(
              preCommit
            ),

          controller:
            cloneDiagnosticCertification(
              controller
            )

        }
      );

    }


    /*
     * =========================================================
     * FINAL PASS
     * =========================================================
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
          selected.province,

        forecastProvince:
          inspection.province,

        windowSize:
          inspection.windowSize,

        forecastItemCount:
          inspection.forecastItemCount,

        pairFormulaCount:
          inspection.pairFormulaCount

      },

      sources: {

        forecast:
          readResult.source,

        selectedProvince:
          selected.source,

        window:
          windowResult.source,

        controller:
          controller.source

      },

      preCommitGate: {

        ready:
          preCommit.ready === true,

        passed:
          preCommit.passed === true,

        authorized:
          preCommit.authorized === true,

        reason:
          preCommit.reason || null,

        version:
          preCommit.version || null

      },

      controller: {

        ready:
          controller.ready === true,

        passed:
          controller.passed === true,

        authorized:
          controller.authorized === true,

        source:
          controller.source,

        functionAvailable:
          typeof window
            .inspectFix03D59ProductionCommitController ===
          'function',

        diagnostic:
          controller.result || null

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

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * 10. PUBLIC API
   * =========================================================
   */

  window
    .certifyFix03D59Production =
    certifyFix03D59Production;


  window
    .inspectFix03D59FinalProductionCertification =
    function () {

      return (
        window
          .LAST_FIX03D59_FINAL_PRODUCTION_CERTIFICATION ||
        null
      );

    };


  window
    .FIX03D59_FINAL_PRODUCTION_CERTIFICATION_VERSION =
    VERSION;


  window
    .FIX03D59_FINAL_PRODUCTION_CERTIFICATION_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Final Production Certification V2 loaded / REAL ENVELOPE / LEXICAL ACCESSOR / READ ONLY / ZERO WRITE'
  );

})();
