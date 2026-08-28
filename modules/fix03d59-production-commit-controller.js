/* =========================================================================
   FIX-03D5.9
   PRODUCTION COMMIT CONTROLLER V3

   FILE:
   modules/fix03d59-production-commit-controller.js

   PURPOSE:
   - Observe the REAL Production Forecast lifecycle after app.js forecast run.
   - Read CURRENT Production envelope through:
       1. Existing production forecast accessor when available.
       2. Direct global lexical LAST_FORECAST binding.
       3. window.LAST_FORECAST compatibility fallback.
   - Run the existing Production Pre-Commit Gate.
   - Surface precise Pre-Commit failure diagnostics.
   - Publish ONE downstream authorization state.

   IMPORTANT:
   - Does NOT intercept app.js assignment.
   - Does NOT replace renderForecast().
   - Does NOT execute the forecast engine.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify forecast.
   - Does NOT modify pairFormulas.
   - Does NOT call savePrediction().
   - Does NOT write Production/storage.

   READ ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   NO ENGINE EXECUTION
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_COMMIT_CONTROLLER_V3';


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
   * 2. lexical LAST_FORECAST
   * 3. window.LAST_FORECAST
   *
   * app.js may declare:
   *
   *   let LAST_FORECAST = ...
   *
   * Global lexical `let` does NOT become
   * window.LAST_FORECAST.
   * =========================================================
   */

  function getProductionEnvelopeController() {

    /*
     * ---------------------------------------------------------
     * 1. EXISTING ACCESSOR
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

      // Continue.

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

      // Continue.

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
   * 5. PRE-COMMIT FAILURE DIAGNOSTICS
   * =========================================================
   */

  function getPreCommitDiagnosticsController(
    preCommit
  ) {

    const diagnostics = {

      preCommitReason:
        preCommit &&
        preCommit.reason
          ? preCommit.reason
          : null,

      failedPrize:
        null,

      failedIndex:
        null,

      actualNumberCount:
        null,

      expectedNumberCount:
        null,

      expectedDigits:
        null,

      expectedKey:
        null,

      actualKey:
        null

    };


    if (
      !preCommit ||
      !isObjectController(
        preCommit
      )
    ) {

      return diagnostics;

    }


    const forecastCheck =
      isObjectController(
        preCommit.forecastCheck
      )
        ? preCommit.forecastCheck
        : null;


    if (!forecastCheck) {

      return diagnostics;

    }


    diagnostics.failedPrize =
      forecastCheck.prizeKey ||
      forecastCheck.expectedKey ||
      null;


    diagnostics.failedIndex =
      forecastCheck.failedIndex ??
      null;


    diagnostics.actualNumberCount =
      forecastCheck.actualCount ??
      null;


    diagnostics.expectedNumberCount =
      forecastCheck.expectedCount ??
      null;


    diagnostics.expectedDigits =
      forecastCheck.expectedDigits ??
      null;


    diagnostics.expectedKey =
      forecastCheck.expectedKey ||
      null;


    diagnostics.actualKey =
      forecastCheck.actualKey ||
      null;


    return diagnostics;

  }


  /*
   * =========================================================
   * 6. FAIL CLOSED RESULT
   * =========================================================
   */

  function failController(
    reason,
    extra = {}
  ) {

    const result = {

      ready:
        false,

      passed:
        false,

      authorized:
        false,

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
   * 7. MAIN AUTHORIZATION
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

          forecastItemCount:
            Array.isArray(
              forecast.items
            )
              ? forecast.items.length
              : 0,

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

          forecastItemCount:
            Array.isArray(
              forecast.items
            )
              ? forecast.items.length
              : 0,

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
            pairFormulas.length

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * RUN PRE-COMMIT GATE
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     *
     * Pass REAL envelope directly.
     *
     * No clone.
     * No rewrite.
     * No manufactured pairFormulas.
     * ---------------------------------------------------------
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

          forecastItemCount:
            Array.isArray(
              forecast.items
            )
              ? forecast.items.length
              : 0,

          pairFormulaCount:
            pairFormulas.length,

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
     * PRE-COMMIT DIAGNOSTICS
     * ---------------------------------------------------------
     */

    const preCommitDiagnostics =
      getPreCommitDiagnosticsController(
        preCommit
      );


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
            preCommitDiagnostics
              .preCommitReason,

          failedPrize:
            preCommitDiagnostics
              .failedPrize,

          failedIndex:
            preCommitDiagnostics
              .failedIndex,

          actualNumberCount:
            preCommitDiagnostics
              .actualNumberCount,

          expectedNumberCount:
            preCommitDiagnostics
              .expectedNumberCount,

          expectedDigits:
            preCommitDiagnostics
              .expectedDigits,

          expectedKey:
            preCommitDiagnostics
              .expectedKey,

          actualKey:
            preCommitDiagnostics
              .actualKey,

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

          /*
           * Preserve full diagnostic object.
           */

          preCommit:
            preCommit || null

        }
      );

    }


    /*
     * =========================================================
     * SUCCESS
     * =========================================================
     */

    const result = {

      ready:
        true,

      passed:
        true,

      authorized:
        true,

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

      /*
       * Failure fields remain null on PASS.
       */

      failedPrize:
        null,

      failedIndex:
        null,

      actualNumberCount:
        null,

      expectedNumberCount:
        null,

      expectedDigits:
        null,

      expectedKey:
        null,

      actualKey:
        null,

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
   * 8. PUBLIC API
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
    'FIX-03D5.9 Production Commit Controller V3 loaded / PRECOMMIT DIAGNOSTICS / READ ONLY / ZERO WRITE'
  );

})();
