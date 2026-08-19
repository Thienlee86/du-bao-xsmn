/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH
   PRODUCTION FORECAST LIFECYCLE HOOK

   PURPOSE:
   - Observe creation/change of LAST_FORECAST.
   - After a valid production forecast exists, run the existing
     FIX-03D5.9 certification / mapping-preview pipeline.
   - Never create a forecast.
   - Never modify LAST_FORECAST.
   - Never call savePrediction().
   - Never write production/storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const POLL_INTERVAL_MS_84FLH =
    500;


  let lastForecastReference84FLH =
    null;


  let running84FLH =
    false;


  function getForecast84FLH() {

  /*
   * Use the same production forecast lookup
   * as STEP 8.4F-L.
   *
   * READ ONLY
   * ZERO WRITE
   */

  const envelope =
    typeof LAST_FORECAST !== 'undefined'
      ? LAST_FORECAST
      : null;


  return (
    envelope &&
    envelope.forecast
      ? envelope.forecast
      : null
  );

  }


  function forecastValid84FLH(
    forecast
  ) {

    return Boolean(
      forecast &&
      forecast.empty !== true &&
      forecast.province &&
      Number.isInteger(
        forecast.windowSize
      ) &&
      Array.isArray(
        forecast.items
      ) &&
      forecast.items.length > 0
    );

  }


  function buildForecastSignature84FLH(
    forecast
  ) {

    if (
      !forecastValid84FLH(
        forecast
      )
    ) {

      return null;

    }


    return [
      forecast.province,
      forecast.windowSize,
      forecast.items.length,
      forecast.items
        .map(
          item =>
            String(
              item?.key ||
              ''
            ) +
            ':' +
            (
              Array.isArray(
                item?.numbers
              )
                ? item.numbers
                    .map(
                      number =>
                        String(
                          number?.number ??
                          ''
                        )
                    )
                    .join(',')
                : ''
            )
        )
        .join('|')
    ].join('::');

  }


  function fail84FLH(
    reason,
    extra = {}
  ) {

    const result = {

      ready: false,
      passed: false,

      step:
        '8.4F-LH',

      reason,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      integrationPerformed:
        false,

      savePredictionCalled:
        false,

      forecastCreated:
        false,

      forecastModified:
        false,

      candidateModified:
        false,

      readOnly:
        true,

      failClosed:
        true,

      ...extra

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  function success84FLH(
    signature,
    mapping
  ) {

    const result = {

      ready: true,

      passed:
        Boolean(
          mapping &&
          mapping.ready === true &&
          mapping.passed === true &&
          mapping.mappingValid === true
        ),

      step:
        '8.4F-LH',

      reason:
        mapping &&
        mapping.mappingValid === true
          ? 'LIFECYCLE_MAPPING_PREVIEW_READY'
          : 'LIFECYCLE_MAPPING_PREVIEW_NOT_READY',

      forecastSignature:
        signature,

      mappingReady:
        Boolean(
          mapping &&
          mapping.mappingValid === true
        ),

      mappingStep:
        mapping?.step ||
        null,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      integrationPerformed:
        false,

      savePredictionCalled:
        false,

      forecastCreated:
        false,

      forecastModified:
        false,

      candidateModified:
        false,

      readOnly:
        true,

      failClosed:
        true

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  function runExistingPipeline84FLH() {

    /*
     * IMPORTANT:
     *
     * These are existing FIX-03D5.9 preview stages.
     * This hook does not contain any production-write logic.
     */
const certified83R =
  window.LAST_FIX03D59_STEP83R ||
  null;


if (
  !certified83R ||
  certified83R.ready !== true ||
  certified83R.passed !== true
) {

  return fail84FLH(
    'CERTIFIED_83R_NOT_AVAILABLE'
  );

}
    
    const stageNames = [

      'buildProductionIntegrationBaseline84A',

      'buildProductionIntegrationReadinessGate84B',
      
      'buildProductionIntegrationCandidateSnapshot84C',

      'buildProductionIntegrationBoundaryContract84D',

      'buildProductionWriteAdapterContract84E'

    ];


    for (
      const name
      of stageNames
    ) {

      const fn =
        window[name];


      if (
        typeof fn !==
        'function'
      ) {

        return fail84FLH(
          'PIPELINE_STAGE_NOT_AVAILABLE',
          {
            missingStage:
              name
          }
        );

      }


      const stageResult =
        fn();


      if (
        !stageResult ||
        stageResult.ready !== true ||
        stageResult.passed !== true
      ) {

        return fail84FLH(
          'PIPELINE_STAGE_FAILED',
          {
            failedStage:
              name,

            stageReason:
              stageResult?.reason ||
              null
          }
        );

      }

    }


    const mappingFn =
      window
        .buildProductionForecastMappingPreview84F;


    if (
      typeof mappingFn !==
      'function'
    ) {

      return fail84FLH(
        'MAPPING_STAGE_NOT_AVAILABLE'
      );

    }


    const mapping =
      mappingFn();


    return {
      ok: true,
      mapping
    };

  }


  function inspectLifecycle84FLH() {

    if (
      running84FLH
    ) {

      return;

    }


    const envelope =
  typeof LAST_FORECAST !== 'undefined'
    ? LAST_FORECAST
    : null;


const forecast =
  getForecast84FLH();


if (
  !forecastValid84FLH(
    forecast
  )
) {

  /*
   * 8.4F-LH DIAGNOSTIC
   * READ ONLY / ZERO WRITE
   *
   * Record why the lifecycle hook cannot
   * recognise the current production forecast.
   */

  fail84FLH(
    'FORECAST_NOT_VALID_FOR_HOOK',
    {

      envelopeExists:
        Boolean(
          envelope
        ),

      envelopeHasForecast:
        Boolean(
          envelope &&
          envelope.forecast
        ),

      forecastExists:
        Boolean(
          forecast
        ),

      forecastEmpty:
        forecast
          ? forecast.empty
          : null,

      forecastProvince:
        forecast
          ? forecast.province
          : null,

      forecastWindowSize:
        forecast
          ? forecast.windowSize
          : null,

      forecastWindowIsInteger:
        Boolean(
          forecast &&
          Number.isInteger(
            forecast.windowSize
          )
        ),

      forecastItemsIsArray:
        Boolean(
          forecast &&
          Array.isArray(
            forecast.items
          )
        ),

      forecastItemsLength:
        forecast &&
        Array.isArray(
          forecast.items
        )
          ? forecast.items.length
          : null

    }
  );


  lastForecastReference84FLH =
    null;


  return;

}


    const signature =
      buildForecastSignature84FLH(
        forecast
      );


    if (
      !signature ||
      signature ===
        lastForecastReference84FLH
    ) {

      return;

    }


    running84FLH =
      true;


    /*
     * Snapshot before running preview stages.
     * Used only to verify the hook did not replace LAST_FORECAST.
     */

    const envelopeBefore =
      window.LAST_FORECAST;


    try {

      
const pipeline =
  runExistingPipeline84FLH();


if (
  !pipeline ||
  pipeline.ok !== true
) {

  /*
   * Fail closed for this forecast instance.
   *
   * Do not retry every 500 ms.
   * A NEW forecast signature may trigger
   * another lifecycle inspection later.
   */

  lastForecastReference84FLH =
    signature;

  return;

}

      const envelopeAfter =
        window.LAST_FORECAST;


      if (
        envelopeBefore !==
        envelopeAfter
      ) {

        fail84FLH(
          'FORECAST_REFERENCE_CHANGED_DURING_PREVIEW'
        );

        return;

      }


      success84FLH(
        signature,
        pipeline.mapping
      );


      /*
       * Mark only after the preview attempt completed.
       */

      lastForecastReference84FLH =
        signature;


    } catch (
      error
    ) {

      fail84FLH(
        'LIFECYCLE_HOOK_EXCEPTION',
        {
          message:
            error &&
            error.message
              ? error.message
              : String(
                  error
                )
        }
      );


    } finally {

      running84FLH =
        false;

    }

  }


  /*
   * Polling is intentionally used instead of replacing
   * the production forecast function.
   *
   * Therefore:
   * - no monkey patch
   * - no interception of savePrediction()
   * - no change to forecast generation
   */

   window.inspectLifecycle84FLH =
  inspectLifecycle84FLH;

window.FIX03D59_STEP84FLH_HOOK_LOADED =
  true;
   
  window.setInterval(
    inspectLifecycle84FLH,
    POLL_INTERVAL_MS_84FLH
  );


  /*
   * Initial inspection is safe:
   * without LAST_FORECAST it simply returns.
   */

  inspectLifecycle84FLH();


  console.log(
    'FIX-03D5.9 STEP 8.4F-LH loaded — Production Forecast Lifecycle Hook / READ ONLY / ZERO WRITE'
  );

})();
