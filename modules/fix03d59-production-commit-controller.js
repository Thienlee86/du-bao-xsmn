/* =========================================================================
   FIX-03D5.9
   PRODUCTION COMMIT CONTROLLER V1

   FILE:
   modules/fix03d59-production-commit-controller.js

   PURPOSE:
   - Observe the real Production Forecast lifecycle AFTER app.js renderForecast().
   - Read the current lexical LAST_FORECAST through the existing
     production forecast bridge/accessor when available.
   - Build the exact candidate envelope used by Production Core.
   - Run the existing Production Pre-Commit Gate.
   - Publish ONE authorization state for downstream Production modules.
   - Never modify LAST_FORECAST.
   - Never modify forecast.
   - Never modify pairFormulas.
   - Never call savePrediction().
   - Never write Production/storage.

   IMPORTANT:
   - This controller does NOT intercept app.js assignment.
   - This controller does NOT replace renderForecast().
   - This controller does NOT execute the forecast engine.
   - It only authorizes or blocks downstream Production continuation.

   READ ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_COMMIT_CONTROLLER_V1';


  /*
   * =========================================================
   * 1. HELPERS
   * =========================================================
   */

  function isObjectController(
    value
  ) {

    return Boolean(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );

  }


  function normalizeTextController(
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


  /*
   * =========================================================
   * 2. READ REAL PRODUCTION ENVELOPE
   * =========================================================
   *
   * Preferred:
   *   getFix03D59ProductionForecastEnvelope()
   *
   * This bridge already handles lexical:
   *   let LAST_FORECAST = ...
   *
   * Fallback:
   *   window.LAST_FORECAST
   * =========================================================
   */

  function getProductionEnvelopeController() {

    try {

      if (
        typeof window
          .getFix03D59ProductionForecastEnvelope ===
        'function'
      ) {

        const envelope =
          window
            .getFix03D59ProductionForecastEnvelope();
  /*
   * =========================================================
   * GLOBAL LEXICAL LAST_FORECAST
   * =========================================================
   *
   * app.js declares:
   *
   *   let LAST_FORECAST = null;
   *
   * Therefore it is NOT window.LAST_FORECAST.
   *
   * Classic scripts in the same page can still read the
   * global lexical binding by identifier.
   * =========================================================
   */

  try {

    if (
      typeof LAST_FORECAST !==
        'undefined' &&
      isObjectController(
        LAST_FORECAST
      )
    ) {

      return LAST_FORECAST;

    }

  } catch (error) {

    // Continue to window compatibility fallback.

  }

        if (
          isObjectController(
            envelope
          )
        ) {

          return envelope;

        }

      }

    } catch (error) {

      // FAIL CLOSED — continue fallback.

    }


    try {

      if (
        isObjectController(
          window.LAST_FORECAST
        )
      ) {

        return window.LAST_FORECAST;

      }

    } catch (error) {

      // FAIL CLOSED.

    }


    return null;

  }


  /*
   * =========================================================
   * 3. CURRENT SELECTED PROVINCE
   * =========================================================
   */

  function getSelectedProvinceController() {

    try {

      if (
        typeof SELECTED_PROVINCE !==
          'undefined' &&
        SELECTED_PROVINCE
      ) {

        return normalizeTextController(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // Continue.

    }


    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalizeTextController(
          select.value
        );

      }

    } catch (error) {

      // FAIL CLOSED.

    }


    return null;

  }


  /*
   * =========================================================
   * 4. CURRENT WINDOW SIZE
   * =========================================================
   */

  function getWindowSizeController() {

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

          return value;

        }

      }

    } catch (error) {

      // Continue.

    }


    return null;

  }


  /*
   * =========================================================
   * 5. FAIL CLOSED RESULT
   * =========================================================
   */

  function failController(
    reason,
    extra = {}
  ) {

    const result = {

      ready: false,

      passed: false,

      authorized: false,

      reason,

      version:
        VERSION,

      mode:
        'POST_RENDER_PRODUCTION_AUTHORIZATION',

      ...extra,

      safety: {

        lastForecastModified:
          false,

        forecastModified:
          false,

        pairFormulasModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        engineExecuted:
          false

      },

      readOnly:
        true,

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER =
      result;


    return result;

  }


  /*
   * =========================================================
   * 6. MAIN AUTHORIZATION
   * =========================================================
   */

  function inspectProductionCommitController03D59() {

    /*
     * ---------------------------------------------------------
     * REAL CURRENT PRODUCTION ENVELOPE
     * ---------------------------------------------------------
     */

    const envelope =
      getProductionEnvelopeController();


    if (
      !isObjectController(
        envelope
      )
    ) {

      return failController(
        'PRODUCTION_ENVELOPE_NOT_AVAILABLE'
      );

    }


    /*
     * Expected app.js schema:
     *
     * LAST_FORECAST = {
     *   forecast,
     *   pairFormulas
     * };
     */

    const forecast =
      isObjectController(
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


    if (!forecast) {

      return failController(
        'PRODUCTION_FORECAST_NOT_AVAILABLE'
      );

    }


    if (!pairFormulas) {

      return failController(
        'PRODUCTION_PAIR_FORMULAS_NOT_AVAILABLE'
      );

    }


    /*
     * ---------------------------------------------------------
     * CURRENT UI CONTEXT
     * ---------------------------------------------------------
     */

    const selectedProvince =
      getSelectedProvinceController();


    const windowSize =
      getWindowSizeController();


    if (!selectedProvince) {

      return failController(
        'SELECTED_PROVINCE_NOT_AVAILABLE',
        {
          forecastProvince:
            normalizeTextController(
              forecast.province
            )
        }
      );

    }


    if (
      !Number.isFinite(
        Number(
          windowSize
        )
      )
    ) {

      return failController(
        'WINDOW_SIZE_NOT_AVAILABLE',
        {
          selectedProvince
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * PRE-COMMIT GATE REQUIRED
     * ---------------------------------------------------------
     */

    const preCommitInspector =
      window
        .inspectFix03D59ProductionPreCommit;


    if (
      typeof preCommitInspector !==
        'function'
    ) {

      return failController(
        'PRECOMMIT_GATE_NOT_AVAILABLE',
        {
          selectedProvince,
          windowSize
        }
      );

    }


    /*
     * IMPORTANT:
     *
     * We pass the REAL current envelope object itself.
     * We do not clone, rewrite or manufacture a candidate.
     */

    let preCommit = null;


    try {

      preCommit =
        preCommitInspector(
          envelope,
          {
            selectedProvince,
            windowSize
          }
        );

    } catch (error) {

      return failController(
        'PRECOMMIT_GATE_EXECUTION_FAILED',
        {
          selectedProvince,

          windowSize,

          error:
            String(
              error &&
              error.message
                ? error.message
                : error
            )
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * STRICT AUTHORIZATION
     * ---------------------------------------------------------
     */

    if (
      !preCommit ||
      preCommit.ready !== true ||
      preCommit.passed !== true ||
      preCommit.authorized !== true
    ) {

      return failController(
        'PRECOMMIT_GATE_BLOCKED',
        {

          selectedProvince,

          windowSize,

          forecastProvince:
            normalizeTextController(
              forecast.province
            ),

          preCommitReason:
            preCommit &&
            preCommit.reason
              ? preCommit.reason
              : null,

          preCommitReady:
            Boolean(
              preCommit &&
              preCommit.ready === true
            ),

          preCommitPassed:
            Boolean(
              preCommit &&
              preCommit.passed === true
            ),

          preCommitAuthorized:
            Boolean(
              preCommit &&
              preCommit.authorized === true
            )

        }
      );

    }


    /*
     * =========================================================
     * SUCCESS
     * =========================================================
     *
     * authorized:true means:
     *
     * The current REAL LAST_FORECAST envelope has passed
     * the Production Pre-Commit contract and may be consumed
     * by downstream Production Bridge modules.
     *
     * NO WRITE IS PERFORMED HERE.
     */

    const result = {

      ready: true,

      passed: true,

      authorized: true,

      reason:
        'PRODUCTION_COMMIT_CONTROLLER_PASS',

      version:
        VERSION,

      mode:
        'POST_RENDER_PRODUCTION_AUTHORIZATION',

      selectedProvince,

      windowSize,

      forecastProvince:
        normalizeTextController(
          forecast.province
        ),

      forecastItemCount:
        Array.isArray(
          forecast.items
        )
          ? forecast.items.length
          : 0,

      pairFormulaCount:
        pairFormulas.length,

      preCommit: {

        version:
          preCommit.version ||
          null,

        reason:
          preCommit.reason ||
          null,

        ready:
          preCommit.ready === true,

        passed:
          preCommit.passed === true,

        authorized:
          preCommit.authorized === true

      },

      safety: {

        lastForecastModified:
          false,

        forecastModified:
          false,

        pairFormulasModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        engineExecuted:
          false

      },

      readOnly:
        true,

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic / authorization RAM alias only.
     */

    window
      .LAST_FIX03D59_PRODUCTION_COMMIT_CONTROLLER =
      result;


    return result;

  }


  /*
   * =========================================================
   * 7. PUBLIC API
   * =========================================================
   */

  window
    .inspectFix03D59ProductionCommitController =
    inspectProductionCommitController03D59;


  window
    .FIX03D59_PRODUCTION_COMMIT_CONTROLLER_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_COMMIT_CONTROLLER_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Commit Controller V1 loaded / POST-RENDER AUTHORIZATION / READ ONLY / ZERO WRITE'
  );

})();
