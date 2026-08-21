/* =========================================================================
   FIX-03D5.9 STEP 8.3B SOURCE INSPECTOR V1

   PURPOSE:
   - Inspect STEP 8.3B runtime result.
   - Trace the legacy 4-province test scope.
   - Inspect nearby global RAM objects that may carry the same provinces.
   - Help identify the upstream source before any production change.

   SAFETY:
   - READ ONLY
   - ZERO WRITE
   - NO ENGINE EXECUTION
   - NO savePrediction()
   - NO LAST_FORECAST MODIFICATION
   - NO STORAGE WRITE
   ========================================================================= */

(function () {

  'use strict';


  const LEGACY_PROVINCES = [
    'tp-hcm',
    'tay-ninh',
    'tien-giang',
    'binh-duong'
  ];


  function normalizeProvince83BSource(value) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  function unique83BSource(values) {

    return Array.from(
      new Set(
        (values || [])
          .map(normalizeProvince83BSource)
          .filter(Boolean)
      )
    );

  }


  function collectProvinceFields83BSource(
    value,
    path,
    output,
    depth,
    seen
  ) {

    if (
      value == null ||
      depth > 6
    ) {
      return;
    }


    if (
      typeof value !== 'object'
    ) {
      return;
    }


    if (
      seen.has(value)
    ) {
      return;
    }

    seen.add(value);


    if (Array.isArray(value)) {

      value.forEach(
        (item, index) => {

          collectProvinceFields83BSource(
            item,
            `${path}[${index}]`,
            output,
            depth + 1,
            seen
          );

        }
      );

      return;

    }


    Object.keys(value).forEach(
      key => {

        let child;

        try {

          child = value[key];

        } catch (error) {

          return;

        }


        const childPath =
          path
            ? `${path}.${key}`
            : key;


        if (
          /province/i.test(key) &&
          (
            typeof child === 'string' ||
            typeof child === 'number'
          )
        ) {

          output.push({

            path: childPath,

            value:
              normalizeProvince83BSource(
                child
              )

          });

        }


        collectProvinceFields83BSource(
          child,
          childPath,
          output,
          depth + 1,
          seen
        );

      }
    );

  }


  function inspectObject83BSource(
    name,
    value
  ) {

    const fields = [];

    collectProvinceFields83BSource(
      value,
      name,
      fields,
      0,
      new WeakSet()
    );


    const provinces =
      unique83BSource(
        fields.map(
          item => item.value
        )
      );


    const legacyMatches =
      LEGACY_PROVINCES.filter(
        province =>
          provinces.includes(
            province
          )
      );


    return {

      name,

      type:
        Array.isArray(value)
          ? 'array'
          : typeof value,

      fieldCount:
        fields.length,

      provinces,

      legacyMatches,

      carriesLegacyScope:
        legacyMatches.length ===
        LEGACY_PROVINCES.length,

      fields

    };

  }


  function runFix03D59Step83BSourceInspector() {

    const step83B =
      window
        .LAST_FIX03D59_STEP83B_RESULT ||
      null;


    const productionForecast =
      window.LAST_FORECAST ||
      null;


    const step83BInspection =
      inspectObject83BSource(
        'LAST_FIX03D59_STEP83B_RESULT',
        step83B
      );


    const globalCandidates = [];


    Object.keys(window).forEach(
      key => {

        if (
          key ===
            'LAST_FIX03D59_STEP83B_RESULT' ||
          key ===
            'LAST_FORECAST'
        ) {

          return;

        }


        let value;

        try {

          value = window[key];

        } catch (error) {

          return;

        }


        if (
          value == null ||
          typeof value !== 'object'
        ) {

          return;

        }


        let inspection;

        try {

          inspection =
            inspectObject83BSource(
              key,
              value
            );

        } catch (error) {

          return;

        }


        if (
          inspection
            .legacyMatches
            .length > 0
        ) {

          globalCandidates.push(
            inspection
          );

        }

      }
    );


    globalCandidates.sort(
      (a, b) =>
        b.legacyMatches.length -
        a.legacyMatches.length
    );


    const result = {

      ready:
        Boolean(step83B),

      safety: {

        readOnly: true,

        zeroWrite: true,

        engineExecuted: false,

        lastForecastModified: false,

        storageWritten: false

      },

      legacyScope:
        LEGACY_PROVINCES.slice(),

      productionProvince:
        productionForecast &&
        productionForecast.province
          ? normalizeProvince83BSource(
              productionForecast.province
            )
          : null,

      step83B:
        step83BInspection,

      upstreamCandidates:
        globalCandidates.slice(
          0,
          25
        )

    };


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B SOURCE INSPECTOR V1'
    );

    console.log(
      'READ ONLY · ZERO WRITE · NO ENGINE EXECUTION'
    );

    console.log(
      '=========================================='
    );

    console.log(
      'Production Province:',
      result.productionProvince
    );

    console.log(
      'Legacy Scope:',
      result.legacyScope
    );

    console.log(
      'STEP 8.3B:',
      result.step83B
    );

    console.log(
      'UPSTREAM CANDIDATES:',
      result.upstreamCandidates
    );


    window
      .LAST_FIX03D59_STEP83B_SOURCE_INSPECTION =
      result;


    return result;

  }


  window
    .runFix03D59Step83BSourceInspector =
    runFix03D59Step83BSourceInspector;


  window
    .FIX03D59_STEP83B_SOURCE_INSPECTOR_LOADED =
    true;


  console.log(
    '🔬 FIX-03D5.9 STEP 8.3B SOURCE INSPECTOR V1 LOADED'
  );

})();

