/* =========================================================================
   FIX-03D5.9
   PRODUCTION FORECAST PROVIDER V1

   PURPOSE:
   - Provide the forecast used by the REAL Forecast UI.
   - Consume the certified STEP 3.4B Engine Executor.
   - Support both PRODUCTION and ADAPTIVE routes.
   - Preserve app.js as the ONLY owner of LAST_FORECAST promotion.

   IMPORTANT:
   - ENGINE EXECUTION IS ALLOWED.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call renderForecast().
   - Does NOT call savePrediction().
   - Does NOT write localStorage.
   - Does NOT persist predictions.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59-PRODUCTION-FORECAST-PROVIDER-V1';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvince(
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


  function normalizeWindow(
    value
  ) {

    const number =
      Number(value);


    return (
      Number.isInteger(number) &&
      number > 0
    )
      ? number
      : null;

  }


  function failProvider(
    province,
    selectedWindow,
    reason,
    extra
  ) {

    const result =
      Object.assign(
        {

          ready:
            false,

          passed:
            false,

          version:
            VERSION,

          source:
            'STEP_3_4B',

          province:
            province || null,

          selectedWindow:
            selectedWindow || null,

          route:
            null,

          strategy:
            null,

          model:
            null,

          effectiveWindow:
            null,

          forecast:
            null,

          reason:
            reason ||
            'PRODUCTION_PROVIDER_FAILED',

          /*
           * SAFETY
           */

          lastForecastModified:
            false,

          productionWrite:
            false,

          storageWrite:
            false,

          savePredictionCalled:
            false,

          renderForecastCalled:
            false,

          failClosed:
            true

        },

        extra || {}

      );


    window
      .LAST_FIX03D59_PRODUCTION_FORECAST_PROVIDER =
      result;


    return result;

  }


  /*
   * =========================================================
   * FORECAST CONTRACT
   * =========================================================
   */

  function validateForecast(
    forecast,
    expectedProvince
  ) {

    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return {

        valid:
          false,

        reason:
          'FORECAST_NOT_OBJECT'

      };

    }


    if (
      forecast.empty ===
      true
    ) {

      return {

        valid:
          false,

        reason:
          'FORECAST_EMPTY'

      };

    }


    const province =
      normalizeProvince(
        forecast.province
      );


    if (!province) {

      return {

        valid:
          false,

        reason:
          'FORECAST_PROVINCE_NOT_AVAILABLE'

      };

    }


    if (
      expectedProvince &&
      province !==
        expectedProvince
    ) {

      return {

        valid:
          false,

        reason:
          'FORECAST_PROVINCE_MISMATCH',

        forecastProvince:
          province

      };

    }


    const windowSize =
      normalizeWindow(
        forecast.windowSize
      );


    if (!windowSize) {

      return {

        valid:
          false,

        reason:
          'FORECAST_WINDOW_INVALID'

      };

    }


    if (
      !Array.isArray(
        forecast.items
      ) ||
      !forecast.items.length
    ) {

      return {

        valid:
          false,

        reason:
          'FORECAST_ITEMS_NOT_AVAILABLE'

      };

    }


    const invalidItem =
      forecast.items.find(
        item =>
          !item ||
          typeof item !==
            'object' ||
          !item.key ||
          !Array.isArray(
            item.numbers
          ) ||
          !item.numbers.length
      );


    if (invalidItem) {

      return {

        valid:
          false,

        reason:
          'FORECAST_ITEM_SCHEMA_INVALID'

      };

    }


    return {

      valid:
        true,

      province,

      windowSize,

      itemCount:
        forecast.items.length

    };

  }


  /*
   * =========================================================
   * MAIN PROVIDER
   * =========================================================
   */

  function provideProductionForecast03D59(
    provinceSlug,
    selectedWindow
  ) {

    const province =
      normalizeProvince(
        provinceSlug
      );


    const requestedWindow =
      normalizeWindow(
        selectedWindow
      );


    if (!province) {

      return failProvider(
        province,
        requestedWindow,
        'INVALID_PROVINCE'
      );

    }


    if (!requestedWindow) {

      return failProvider(
        province,
        requestedWindow,
        'INVALID_SELECTED_WINDOW'
      );

    }


    const executor =
      window
        .executeProductionEngine03D59;


    if (
      typeof executor !==
      'function'
    ) {

      return failProvider(
        province,
        requestedWindow,
        'STEP_34B_EXECUTOR_NOT_AVAILABLE'
      );

    }


    let execution;


    try {

      execution =
        executor(
          province,
          requestedWindow
        );

    } catch (error) {

      return failProvider(
        province,
        requestedWindow,
        'STEP_34B_EXECUTOR_THROW',
        {

          error:
            error &&
            error.message
              ? error.message
              : String(error)

        }
      );

    }


    /*
     * =========================================================
     * STRICT EXECUTOR CONTRACT
     * =========================================================
     */

    if (
      !execution ||
      execution.ready !==
        true ||
      execution.passed !==
        true
    ) {

      return failProvider(
        province,
        requestedWindow,
        execution &&
        execution.reason
          ? execution.reason
          : 'STEP_34B_EXECUTION_NOT_READY',
        {

          execution:
            execution || null

        }
      );

    }


    if (
      execution.engineExecuted !==
        true
    ) {

      return failProvider(
        province,
        requestedWindow,
        'ENGINE_NOT_EXECUTED',
        {
          execution
        }
      );

    }


    /*
     * STEP 3.4B must still be isolated at this point.
     *
     * app.js will perform the real LAST_FORECAST promotion
     * only AFTER this provider returns successfully.
     */

    if (
      execution.isolated !==
        true ||
      execution.productionPromoted !==
        false ||
      execution.productionWrite !==
        false ||
      execution.storageWrite !==
        false ||
      execution.lastForecastModified !==
        false ||
      execution.savePredictionCalled !==
        false ||
      execution.renderForecastCalled !==
        false
    ) {

      return failProvider(
        province,
        requestedWindow,
        'STEP_34B_SAFETY_CONTRACT_FAILED',
        {
          execution
        }
      );

    }


    if (
      execution.route !==
        'PRODUCTION' &&
      execution.route !==
        'ADAPTIVE'
    ) {

      return failProvider(
        province,
        requestedWindow,
        'INVALID_EXECUTION_ROUTE',
        {
          execution
        }
      );

    }


    const forecast =
      execution.forecast;


    const validation =
      validateForecast(
        forecast,
        province
      );


    if (
      validation.valid !==
      true
    ) {

      return failProvider(
        province,
        requestedWindow,
        validation.reason ||
        'FORECAST_CONTRACT_INVALID',
        {

          validation,

          execution

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

      version:
        VERSION,

      source:
        'STEP_3_4B',

      province:
        validation.province,

      selectedWindow:
        requestedWindow,

      route:
        execution.route,

      strategy:
        execution.strategy ||
        null,

      model:
        execution.model ||
        null,

      effectiveWindow:
        validation.windowSize,

      itemCount:
        validation.itemCount,

      forecast,

      reason:
        'PRODUCTION_FORECAST_PROVIDER_READY',

      executionReason:
        execution.reason ||
        null,

      /*
       * Provider itself performs no promotion.
       */

      lastForecastModified:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      savePredictionCalled:
        false,

      renderForecastCalled:
        false,

      failClosed:
        true,

      providedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM only.
     */

    window
      .LAST_FIX03D59_PRODUCTION_FORECAST_PROVIDER =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .provideProductionForecast03D59 =
    provideProductionForecast03D59;


  window
    .FIX03D59_PRODUCTION_FORECAST_PROVIDER_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_FORECAST_PROVIDER_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Forecast Provider V1 loaded — STEP 3.4B / FAIL CLOSED'
  );

})();
