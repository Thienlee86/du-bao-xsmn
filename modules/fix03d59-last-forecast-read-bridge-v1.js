/* =========================================================================
   FIX-03D5.9
   LAST_FORECAST READ BRIDGE V1

   PURPOSE:
   - Read lexical LAST_FORECAST from classic-script global scope.
   - Expose a READ-ONLY cloned snapshot for verification modules.
   - Support Production Adapter shadow safety verification.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   - NO renderForecast().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_LAST_FORECAST_READ_BRIDGE_V1';


  function clone03D59(
    value
  ) {

    if (
      value === undefined
    ) {

      return undefined;

    }


    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch (error) {

      return null;

    }

  }


  function readLastForecast03D59() {

    /*
     * IMPORTANT:
     *
     * LAST_FORECAST may be declared in app.js as:
     *
     *   let LAST_FORECAST = ...
     *
     * A global lexical binding is not necessarily
     * available as window.LAST_FORECAST.
     *
     * But classic scripts in the same global realm
     * can still resolve the lexical identifier.
     */

    try {

      if (
        typeof LAST_FORECAST !==
        'undefined'
      ) {

        return clone03D59(
          LAST_FORECAST
        );

      }

    } catch (error) {

      /*
       * Fail closed and try window fallback.
       */

    }


    if (
      Object.prototype
        .hasOwnProperty.call(
          window,
          'LAST_FORECAST'
        )
    ) {

      return clone03D59(
        window.LAST_FORECAST
      );

    }


    return null;

  }


  function inspectLastForecastReadBridge03D59() {

    let lexicalAvailable =
      false;


    try {

      lexicalAvailable =
        typeof LAST_FORECAST !==
        'undefined';

    } catch (error) {

      lexicalAvailable =
        false;

    }


    const windowAvailable =
      Object.prototype
        .hasOwnProperty.call(
          window,
          'LAST_FORECAST'
        );


    return {

      version:
        VERSION,

      ready:
        lexicalAvailable ||
        windowAvailable,

      lexicalAvailable,

      windowAvailable,

      readOnly:
        true,

      productionWrite:
        false,

      storageWrite:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false,

      renderForecastCalled:
        false

    };

  }


  window
    .readLastForecast03D59 =
    readLastForecast03D59;


  window
    .inspectLastForecastReadBridge03D59 =
    inspectLastForecastReadBridge03D59;


  window
    .FIX03D59_LAST_FORECAST_READ_BRIDGE_VERSION =
    VERSION;


  window
    .FIX03D59_LAST_FORECAST_READ_BRIDGE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 LAST_FORECAST Read Bridge V1 loaded / READ ONLY'
  );

})();
