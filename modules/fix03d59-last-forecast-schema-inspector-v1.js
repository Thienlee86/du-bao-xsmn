/* =========================================================================
   FIX-03D5.9
   LAST_FORECAST SCHEMA INSPECTOR V1

   PURPOSE:
   - Inspect the REAL CURRENT LAST_FORECAST schema.
   - Read only through readLastForecast03D59().
   - Discover province-like fields.
   - Discover G1 -> G8 prize-like structures.
   - Show shallow object/array structure without guessing mappings.

   IMPORTANT:
   - READ ONLY.
   - ZERO ENGINE EXECUTION.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - DIAGNOSTIC RAM ONLY.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_V1';


  const MAX_DEPTH = 5;

  const MAX_ARRAY_PREVIEW = 5;

  const MAX_PATHS = 500;


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function clone03D59(value) {

    if (value === undefined) {
      return undefined;
    }

    try {

      return JSON.parse(
        JSON.stringify(value)
      );

    } catch (error) {

      return null;

    }

  }


  function valueType03D59(value) {

    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    return typeof value;

  }


  function previewValue03D59(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return value;

    }


    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {

      return value;

    }


    if (Array.isArray(value)) {

      return value
        .slice(
          0,
          MAX_ARRAY_PREVIEW
        )
        .map(
          item => {

            if (
              item === null ||
              item === undefined ||
              typeof item === 'string' ||
              typeof item === 'number' ||
              typeof item === 'boolean'
            ) {

              return item;

            }


            if (Array.isArray(item)) {

              return {
                type: 'array',
                length: item.length
              };

            }


            return {
              type: 'object',
              keys:
                Object.keys(item)
                  .slice(0, 15)
            };

          }
        );

    }


    if (
      typeof value === 'object'
    ) {

      return {
        type: 'object',
        keys:
          Object.keys(value)
            .slice(0, 30)
      };

    }


    return String(value);

  }


  function normalizeKey03D59(value) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  }


  /*
   * =========================================================
   * READ CURRENT LAST_FORECAST
   * =========================================================
   */

  function readForecast03D59() {

    if (
      typeof window
        .readLastForecast03D59 !==
      'function'
    ) {

      return {
        ready: false,
        reason:
          'LAST_FORECAST_READER_NOT_AVAILABLE'
      };

    }


    let forecast;


    try {

      forecast =
        window
          .readLastForecast03D59();

    } catch (error) {

      return {
        ready: false,
        reason:
          'LAST_FORECAST_READ_FAILED',
        error:
          error &&
          error.message
            ? error.message
            : String(error)
      };

    }


    if (
      !forecast ||
      typeof forecast !== 'object'
    ) {

      return {
        ready: false,
        reason:
          'LAST_FORECAST_NOT_AVAILABLE'
      };

    }


    return {
      ready: true,
      forecast:
        clone03D59(forecast)
    };

  }


  /*
   * =========================================================
   * SAFE STRUCTURE WALK
   * =========================================================
   */

  function walk03D59(
    value,
    path,
    depth,
    output,
    seen
  ) {

    if (
      output.length >= MAX_PATHS ||
      depth > MAX_DEPTH
    ) {

      return;

    }


    const type =
      valueType03D59(value);


    output.push({
      path:
        path || '$',
      depth,
      type,
      arrayLength:
        Array.isArray(value)
          ? value.length
          : null,
      keys:
        (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        )
          ? Object.keys(value)
              .slice(0, 40)
          : null,
      preview:
        previewValue03D59(value)
    });


    if (
      !value ||
      typeof value !== 'object'
    ) {

      return;

    }


    /*
     * JSON clone normally removes cycles,
     * but keep this guard fail-safe.
     */

    if (
      seen.has(value)
    ) {

      return;

    }


    seen.add(value);


    if (Array.isArray(value)) {

      value
        .slice(
          0,
          MAX_ARRAY_PREVIEW
        )
        .forEach(
          (item, index) => {

            walk03D59(
              item,
              (
                path || '$'
              ) +
              '[' +
              index +
              ']',
              depth + 1,
              output,
              seen
            );

          }
        );


      return;

    }


    Object.keys(value)
      .forEach(
        key => {

          if (
            output.length >= MAX_PATHS
          ) {

            return;

          }


          walk03D59(
            value[key],
            (
              path
                ? path + '.'
                : '$.'
            ) +
            key,
            depth + 1,
            output,
            seen
          );

        }
      );

  }


  /*
   * =========================================================
   * PROVINCE-LIKE FIELD DISCOVERY
   * =========================================================
   */

  function findProvinceFields03D59(
    structure
  ) {

    const patterns = [
      'province',
      'provinceslug',
      'provinceid',
      'provincename',
      'tinh',
      'tinhthanh',
      'slug'
    ];


    return structure
      .filter(
        item => {

          const lastSegment =
            String(item.path)
              .split('.')
              .pop()
              .replace(
                /\[\d+\]/g,
                ''
              );


          const normalized =
            normalizeKey03D59(
              lastSegment
            );


          return patterns.some(
            pattern =>
              normalized === pattern ||
              normalized.includes(
                pattern
              )
          );

        }
      )
      .map(
        item => ({
          path:
            item.path,
          type:
            item.type,
          preview:
            item.preview
        })
      );

  }


  /*
   * =========================================================
   * PRIZE-LIKE FIELD DISCOVERY
   * =========================================================
   */

  function findPrizeFields03D59(
    structure
  ) {

    const output = {};


    [
      'g1',
      'g2',
      'g3',
      'g4',
      'g5',
      'g6',
      'g7',
      'g8'
    ]
      .forEach(
        prize => {

          output[prize] =
            structure
              .filter(
                item => {

                  const segments =
                    String(item.path)
                      .split('.');


                  return segments.some(
                    segment => {

                      const cleaned =
                        segment
                          .replace(
                            /\[\d+\]/g,
                            ''
                          );


                      return (
                        normalizeKey03D59(
                          cleaned
                        ) ===
                        prize
                      );

                    }
                  );

                }
              )
              .slice(
                0,
                20
              )
              .map(
                item => ({
                  path:
                    item.path,
                  type:
                    item.type,
                  arrayLength:
                    item.arrayLength,
                  keys:
                    item.keys,
                  preview:
                    item.preview
                })
              );

        }
      );


    return output;

  }


  /*
   * =========================================================
   * ROOT SUMMARY
   * =========================================================
   */

  function rootSummary03D59(
    forecast
  ) {

    return {

      type:
        valueType03D59(
          forecast
        ),

      keys:
        (
          forecast &&
          typeof forecast === 'object'
        )
          ? Object.keys(
              forecast
            )
          : []

    };

  }


  /*
   * =========================================================
   * SAFETY
   * =========================================================
   */

  function safety03D59() {

    return {

      readOnly:
        true,

      engineExecuted:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      renderForecastCalled:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false

    };

  }


  /*
   * =========================================================
   * MAIN
   * =========================================================
   */

  function inspectLastForecastSchema03D59() {

    const access =
      readForecast03D59();


    if (
      access.ready !== true
    ) {

      const failed = {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          access.reason,

        error:
          access.error || null,

        safety:
          safety03D59(),

        inspectedAt:
          new Date()
            .toISOString()

      };


      window
        .LAST_FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_V1 =
        clone03D59(
          failed
        );


      return failed;

    }


    const forecast =
      access.forecast;


    /*
     * Snapshot before inspection.
     */

    const snapshotBefore =
      JSON.stringify(
        forecast
      );


    const structure = [];


    walk03D59(
      forecast,
      '$',
      0,
      structure,
      new WeakSet()
    );


    const provinceFields =
      findProvinceFields03D59(
        structure
      );


    const prizeFields =
      findPrizeFields03D59(
        structure
      );


    /*
     * Re-read original LAST_FORECAST after inspection.
     */

    const afterAccess =
      readForecast03D59();


    const snapshotAfter =
      (
        afterAccess.ready === true
      )
        ? JSON.stringify(
            afterAccess.forecast
          )
        : null;


    const unchanged =
      (
        snapshotAfter !== null &&
        snapshotBefore ===
          snapshotAfter
      );

 /*
 * =========================================================
 * FORECAST PAYLOAD DIAGNOSTIC
 * =========================================================
 */

const forecastPayload =
  forecast &&
  forecast.forecast &&
  typeof forecast.forecast === 'object'
    ? forecast.forecast
    : null;


const forecastPayloadDiagnostic =
  forecastPayload
    ? {

        type:
          valueType03D59(
            forecastPayload
          ),

        keys:
          Array.isArray(
            forecastPayload
          )
            ? []
            : Object.keys(
                forecastPayload
              ),

        arrayLength:
          Array.isArray(
            forecastPayload
          )
            ? forecastPayload.length
            : null,

        preview:
          previewValue03D59(
            forecastPayload
          ),

        childPaths:
          structure
            .filter(
              item =>
                String(
                  item.path
                ).startsWith(
                  '$.forecast.'
                )
            )
            .map(
              item => ({

                path:
                  item.path,

                type:
                  item.type,

                arrayLength:
                  item.arrayLength,

                keys:
                  item.keys,

                preview:
                  item.preview

              })
            )

      }
    : null;    

    const result = {

      version:
        VERSION,

      ready:
        true,

      passed:
        unchanged,

      reason:
        unchanged
          ? 'LAST_FORECAST_SCHEMA_INSPECTED'
          : 'LAST_FORECAST_SNAPSHOT_CHANGED',

      root:
        rootSummary03D59(
          forecast
        ),

       forecastPayloadDiagnostic,
      provinceFields,

      prizeFields,

      structure,

      structureCount:
        structure.length,

      lastForecastUnchanged:
        unchanged,

      safety:
        safety03D59(),

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_V1 =
      clone03D59(
        result
      );


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .inspectLastForecastSchema03D59 =
    inspectLastForecastSchema03D59;


  window
    .FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_V1_VERSION =
    VERSION;


  window
    .FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_V1_LOADED =
    true;


  console.log(
    'FIX-03D5.9 LAST_FORECAST Schema Inspector V1 loaded / READ ONLY / ZERO WRITE'
  );

})();
