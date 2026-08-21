/* =========================================================================
   FIX-03D5.9 STEP 8.3B
   RUNTIME SOURCE BRIDGE — DIAGNOSTIC V1

   PURPOSE:
   - Inspect runtime sources that may contain the real 8.3B candidate data.
   - Do NOT modify STEP 8.3B.
   - Do NOT modify LAST_FIX03D59_STEP83B_RESULT.
   - Do NOT modify LAST_FORECAST.
   - Do NOT execute prediction engine.
   - Do NOT write storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-RUNTIME-BRIDGE-DIAGNOSTIC-V1';


  /*
   * =========================================================
   * BASIC HELPERS
   * =========================================================
   */

  function safeObjectKeys83BRB(
    value
  ) {

    try {

      if (
        value &&
        typeof value ===
          'object'
      ) {

        return Object.keys(
          value
        );

      }

    } catch (
      error
    ) {

      return [];

    }


    return [];

  }


  function normalizeProvince83BRB(
    value
  ) {

    if (
      typeof value !==
      'string'
    ) {

      return null;

    }


    const normalized =
      value
        .trim()
        .toLowerCase();


    if (
      !normalized ||
      normalized.length > 40
    ) {

      return null;

    }


    if (
      !/^[a-z0-9-]+$/.test(
        normalized
      )
    ) {

      return null;

    }


    return normalized;

  }


  /*
   * =========================================================
   * PROVINCE DISCOVERY
   * =========================================================
   */

  function collectProvinces83BRB(
    value,
    output,
    depth = 0,
    visited = new WeakSet()
  ) {

    if (
      depth > 8 ||
      value === null ||
      value === undefined
    ) {

      return;

    }


    if (
      typeof value ===
      'string'
    ) {

      const province =
        normalizeProvince83BRB(
          value
        );


      if (
        province
      ) {

        output.add(
          province
        );

      }


      return;

    }


    if (
      typeof value !==
      'object'
    ) {

      return;

    }


    try {

      if (
        visited.has(
          value
        )
      ) {

        return;

      }


      visited.add(
        value
      );

    } catch (
      error
    ) {

      return;

    }


    if (
      Array.isArray(
        value
      )
    ) {

      value.forEach(
        item => {

          collectProvinces83BRB(
            item,
            output,
            depth + 1,
            visited
          );

        }
      );


      return;

    }


    Object.keys(
      value
    ).forEach(
      key => {

        /*
         * Prefer province-like fields,
         * but inspect nested structures too.
         */

        const child =
          value[key];


        if (
          /province|slug/i.test(
            key
          )
        ) {

          if (
            typeof child ===
            'string'
          ) {

            const province =
              normalizeProvince83BRB(
                child
              );


            if (
              province
            ) {

              output.add(
                province
              );

            }

          }

        }


        if (
          child &&
          typeof child ===
            'object'
        ) {

          collectProvinces83BRB(
            child,
            output,
            depth + 1,
            visited
          );

        }

      }
    );

  }


  /*
   * =========================================================
   * INSPECT ONE RUNTIME SOURCE
   * =========================================================
   */

  function inspectSource83BRB(
    name,
    value
  ) {

    const type =
      value === null
        ? 'null'
        : Array.isArray(value)
          ? 'array'
          : typeof value;


    const keys =
      safeObjectKeys83BRB(
        value
      );


    const provinces =
      new Set();


    collectProvinces83BRB(
      value,
      provinces
    );


    return {

      name,

      exists:
        value !== undefined &&
        value !== null,

      type,

      fieldCount:
        keys.length,

      provinces:
        Array.from(
          provinces
        ),

      provinceCount:
        provinces.size

    };

  }


  /*
   * =========================================================
   * MAIN INSPECTION
   * =========================================================
   */

  function inspectRuntimeBridge83B() {

    const sources = [];


    /*
     * Known 8.3B result.
     */

    sources.push(
      inspectSource83BRB(
        'LAST_FIX03D59_STEP83B_RESULT',
        window
          .LAST_FIX03D59_STEP83B_RESULT
      )
    );


    /*
     * Runtime objects already identified by
     * Source Inspector.
     */

    sources.push(
      inspectSource83BRB(
        'LAST_V26_B8_STARTUP_VERIFY',
        window
          .LAST_V26_B8_STARTUP_VERIFY
      )
    );


    sources.push(
      inspectSource83BRB(
        'LAST_FIX03D59_STEP82C_RESULT',
        window
          .LAST_FIX03D59_STEP82C_RESULT
      )
    );


    sources.push(
      inspectSource83BRB(
        'LAST_FIX03D59_STEP82A_RESULT',
        window
          .LAST_FIX03D59_STEP82A_RESULT
      )
    );


    /*
     * Inspect window itself only at top level.
     *
     * IMPORTANT:
     * We do NOT recursively inspect window here.
     */

    const interestingGlobals =
      Object.keys(
        window
      )
        .filter(
          key =>
            /FIX03D59|V26.*VERIFY|CANDIDATE/i
              .test(
                key
              )
        )
        .sort();


    const result = {

      ready: true,
      passed: true,

      step:
        '8.3B-RUNTIME-BRIDGE',

      version:
        VERSION,

      reason:
        'RUNTIME_SOURCE_DIAGNOSTIC_READY',

      readOnly: true,
      zeroWrite: true,

      step83BModified: false,
      forecastModified: false,
      storageWritten: false,
      engineExecuted: false,

      sources,

      interestingGlobals

    };


    window
      .LAST_FIX03D59_STEP83B_RUNTIME_BRIDGE =
        result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .inspectRuntimeBridge83B =
      inspectRuntimeBridge83B;


  window
    .FIX03D59_STEP83B_RUNTIME_BRIDGE_LOADED =
      true;


  console.log(
    'FIX-03D5.9 STEP 8.3B Runtime Bridge Diagnostic V1 loaded — READ ONLY / ZERO WRITE'
  );

})();
