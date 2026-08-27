/* =========================================================================
   FIX-03D5.9
   PRODUCTION COMMIT CONTROLLER V2

   FILE:
   modules/fix03d59-production-commit-controller.js

   PURPOSE:
   - Observe the real Production Forecast lifecycle AFTER app.js renderForecast().
   - Read the current lexical LAST_FORECAST through:
       1. Existing production forecast accessor when available.
       2. Direct global lexical LAST_FORECAST binding.
       3. window.LAST_FORECAST compatibility fallback.
   - Build/read the exact candidate envelope used by Production Core.
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
   NO ENGINE EXECUTION
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_COMMIT_CONTROLLER_V2';


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
   * Resolution order:
   *
   * 1. getFix03D59ProductionForecastEnvelope()
   *
   * 2. Direct lexical LAST_FORECAST
   *
   * 3. window.LAST_FORECAST
   *
   * app.js may declare:
   *
   *   let LAST_FORECAST = ...
   *
   * A global lexical `let` does NOT become
   * window.LAST_FORECAST.
   *
   * Therefore direct identifier access must be attempted
   * independently from the accessor branch.
   * =========================================================
   */

  function getProductionEnvelopeController() {

    /*
     * ---------------------------------------------------------
     * 1. EXISTING PRODUCTION ACCESSOR
     * ---------------------------------------------------------
     */

    try {

      if (
        typeof window
          .getFix03D59ProductionForecastEnvelope ===
        'function'
      ) {

        const envelope =
          window
            .getFix03D59ProductionForecastEnvelope();


        if (
          isObjectController(
            envelope
          )
        ) {

          return envelope;

        }

      }

    } catch (error) {

      // Continue to lexical LAST_FORECAST.

    }


    /*
     * ---------------------------------------------------------
     * 2. REAL GLOBAL LEXICAL LAST_FORECAST
     * ---------------------------------------------------------
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

      // Continue to compatibility fallback.

    }


    /*
     * ---------------------------------------------------------
     * 3. WINDOW COMPATIBILITY FALLBACK
     * ---------------------------------------------------------
     */

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


    /*
     * Diagnostic RAM only.
     */

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
     * Expected Production Core schema:
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
        'PRODUCTION_PAIR_FORMULAS_NOT_AVAILABLE',
        {

          forecastProvince:
            normalizeTextController(
              forecast.province
            )

        }
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
            ),

          pairFormulaCount:
            pairFormulas.length

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

          selectedProvince,

          forecastProvince:
            normalizeTextController(
              forecast.province
            ),

          pairFormulaCount:
            pairFormulas.length

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
     *
     * We do NOT clone it.
     * We do NOT manufacture pairFormulas.
     * We do NOT rewrite forecast.
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

          forecastProvince:
            normalizeTextController(
              forecast.province
            ),

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

          forecastItemCount:
            Array.isArray(
              forecast.items
            )
              ? forecast.items.length
              : 0,

          pairFormulaCount:
            pairFormulas.length,

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
            ),

          preCommit:
            preCommit || null

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
     * =========================================================
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
    'FIX-03D5.9 Production Commit Controller V2 loaded / LEXICAL FALLBACK FIXED / READ ONLY / ZERO WRITE'
  );

})();
