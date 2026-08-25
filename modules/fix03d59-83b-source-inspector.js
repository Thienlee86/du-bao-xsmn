/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE INSPECTOR V2
   FILE:
   modules/fix03d59-83b-source-inspector.js

   PURPOSE:
   - Inspect the REAL STEP 8.2C runtime result directly.
   - Determine the actual STEP 8.2C envelope schema.
   - Locate candidate arrays without executing any engine.
   - Inspect candidate keys and nested province/prize/index fields.
   - Explain why STEP 8.3B Source Shadow may resolve 0 candidates.
   - Preserve the old STEP 8.3B inspection as supporting evidence.

   TARGET:
   window.LAST_FIX03D59_STEP82C_RESULT

   SAFETY:
   - DIAGNOSTIC ONLY
   - READ ONLY SOURCE DATA
   - ZERO PRODUCTION WRITE
   - ZERO STORAGE WRITE
   - NO ENGINE EXECUTION
   - NO savePrediction()
   - NO LAST_FORECAST MODIFICATION
   - NO STEP 8.2C MODIFICATION
   - NO STEP 8.3B MODIFICATION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-INSPECTOR-V2-82C-SCHEMA';


  const MAX_DEPTH =
    8;


  const MAX_ARRAY_SCAN =
    100;


  const MAX_SAMPLE_CANDIDATES =
    5;


  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  function safeType83BInspector(
    value
  ) {

    if (Array.isArray(value)) {

      return 'array';

    }


    if (value === null) {

      return 'null';

    }


    return typeof value;

  }


  function safeKeys83BInspector(
    value
  ) {

    if (
      !value ||
      typeof value !== 'object'
    ) {

      return [];

    }


    try {

      return Object.keys(value);

    } catch (error) {

      return [];

    }

  }


  function normalizeText83BInspector(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return '';

    }


    return String(value)
      .trim()
      .toLowerCase();

  }


  function safePreview83BInspector(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }


    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {

      return value;

    }


    if (Array.isArray(value)) {

      return (
        '[Array(' +
        value.length +
        ')]'
      );

    }


    if (
      typeof value === 'object'
    ) {

      return (
        '{' +
        safeKeys83BInspector(value)
          .slice(0, 12)
          .join(', ') +
        (
          safeKeys83BInspector(value)
            .length > 12
            ? ', ...'
            : ''
        ) +
        '}'
      );

    }


    return String(value);

  }


  /* =========================================================
     FIND ARRAYS
     ========================================================= */

  function collectArrays83BInspector(
    value,
    path,
    output,
    depth,
    seen
  ) {

    if (
      value === null ||
      value === undefined ||
      depth > MAX_DEPTH
    ) {

      return;

    }


    if (
      typeof value !== 'object'
    ) {

      return;

    }


    if (seen.has(value)) {

      return;

    }


    seen.add(value);


    if (Array.isArray(value)) {

      output.push({

        path,

        length:
          value.length,

        firstItemType:
          value.length > 0
            ? safeType83BInspector(
                value[0]
              )
            : null,

        firstItemKeys:
          (
            value.length > 0 &&
            value[0] &&
            typeof value[0] ===
              'object'
          )
            ? safeKeys83BInspector(
                value[0]
              )
            : []

      });


      const limit =
        Math.min(
          value.length,
          MAX_ARRAY_SCAN
        );


      for (
        let index = 0;
        index < limit;
        index += 1
      ) {

        collectArrays83BInspector(
          value[index],
          path +
            '[' +
            index +
            ']',
          output,
          depth + 1,
          seen
        );

      }


      return;

    }


    const keys =
      safeKeys83BInspector(
        value
      );


    keys.forEach(
      function (key) {

        let child = null;


        try {

          child =
            value[key];

        } catch (error) {

          return;

        }


        collectArrays83BInspector(
          child,
          path
            ? path + '.' + key
            : key,
          output,
          depth + 1,
          seen
        );

      }
    );

  }


  /* =========================================================
     FIND PROVINCE / PRIZE / INDEX-LIKE FIELDS
     ========================================================= */

  function collectInterestingFields83BInspector(
    value,
    path,
    output,
    depth,
    seen
  ) {

    if (
      value === null ||
      value === undefined ||
      depth > MAX_DEPTH
    ) {

      return;

    }


    if (
      typeof value !== 'object'
    ) {

      return;

    }


    if (seen.has(value)) {

      return;

    }


    seen.add(value);


    if (Array.isArray(value)) {

      const limit =
        Math.min(
          value.length,
          MAX_ARRAY_SCAN
        );


      for (
        let index = 0;
        index < limit;
        index += 1
      ) {

        collectInterestingFields83BInspector(
          value[index],
          path +
            '[' +
            index +
            ']',
          output,
          depth + 1,
          seen
        );

      }


      return;

    }


    safeKeys83BInspector(
      value
    ).forEach(
      function (key) {

        let child = null;


        try {

          child =
            value[key];

        } catch (error) {

          return;

        }


        const childPath =
          path
            ? path + '.' + key
            : key;


        const normalizedKey =
          normalizeText83BInspector(
            key
          );


        const interesting =
          (
            normalizedKey.includes(
              'province'
            ) ||
            normalizedKey.includes(
              'slug'
            ) ||
            normalizedKey.includes(
              'prize'
            ) ||
            normalizedKey.includes(
              'giai'
            ) ||
            normalizedKey ===
              'index' ||
            normalizedKey.includes(
              'candidate'
            )
          );


        if (
          interesting &&
          (
            child === null ||
            typeof child !==
              'object'
          )
        ) {

          output.push({

            path:
              childPath,

            key,

            type:
              safeType83BInspector(
                child
              ),

            value:
              safePreview83BInspector(
                child
              )

          });

        }


        collectInterestingFields83BInspector(
          child,
          childPath,
          output,
          depth + 1,
          seen
        );

      }
    );

  }


  /* =========================================================
     DETECT CANDIDATE ARRAY
     ========================================================= */

  function scoreCandidateArray83BInspector(
    descriptor
  ) {

    let score = 0;


    const path =
      normalizeText83BInspector(
        descriptor.path
      );


    const keys =
      (
        descriptor.firstItemKeys ||
        []
      )
        .map(
          normalizeText83BInspector
        );


    if (
      path.includes(
        'candidate'
      )
    ) {

      score += 100;

    }


    if (
      path.includes(
        'eligible'
      )
    ) {

      score += 80;

    }


    if (
      path.includes(
        'result'
      )
    ) {

      score += 15;

    }


    if (
      descriptor.length > 0
    ) {

      score += 10;

    }


    if (
      descriptor.firstItemType ===
        'object'
    ) {

      score += 20;

    }


    if (
      keys.some(
        key =>
          key.includes(
            'province'
          )
      )
    ) {

      score += 40;

    }


    if (
      keys.some(
        key =>
          (
            key.includes(
              'prize'
            ) ||
            key.includes(
              'giai'
            )
          )
      )
    ) {

      score += 30;

    }


    if (
      keys.includes(
        'index'
      )
    ) {

      score += 10;

    }


    return score;

  }


  function getValueByPath83BInspector(
    root,
    path
  ) {

    if (
      !root ||
      !path
    ) {

      return null;

    }


    const rootName =
      'LAST_FIX03D59_STEP82C_RESULT';


    let relative =
      path;


    if (
      relative === rootName
    ) {

      return root;

    }


    if (
      relative.startsWith(
        rootName + '.'
      )
    ) {

      relative =
        relative.slice(
          rootName.length + 1
        );

    }


    if (
      relative.startsWith(
        rootName + '['
      )
    ) {

      relative =
        relative.slice(
          rootName.length
        );

    }


    const tokens = [];


    relative.replace(
      /([^[.\]]+)|\[(\d+)\]/g,
      function (
        match,
        property,
        index
      ) {

        if (
          property !== undefined
        ) {

          tokens.push(
            property
          );

        } else {

          tokens.push(
            Number(index)
          );

        }


        return match;

      }
    );


    let current =
      root;


    for (
      const token
      of tokens
    ) {

      if (
        current === null ||
        current === undefined
      ) {

        return null;

      }


      try {

        current =
          current[token];

      } catch (error) {

        return null;

      }

    }


    return current;

  }


  function detectCandidateArray83BInspector(
    root,
    arrays
  ) {

    const ranked =
      arrays
        .map(
          function (descriptor) {

            return {

              descriptor,

              score:
                scoreCandidateArray83BInspector(
                  descriptor
                )

            };

          }
        )
        .sort(
          function (a, b) {

            return (
              b.score -
              a.score
            );

          }
        );


    for (
      const item
      of ranked
    ) {

      const value =
        getValueByPath83BInspector(
          root,
          item
            .descriptor
            .path
        );


      if (
        Array.isArray(value) &&
        value.length > 0
      ) {

        return {

          found: true,

          path:
            item
              .descriptor
              .path,

          score:
            item.score,

          candidates:
            value,

          ranked:
            ranked.slice(
              0,
              15
            )

        };

      }

    }


    return {

      found: false,

      path: null,

      score: 0,

      candidates: [],

      ranked:
        ranked.slice(
          0,
          15
        )

    };

  }


  /* =========================================================
     INSPECT ONE CANDIDATE
     ========================================================= */

  function inspectCandidate83BInspector(
    candidate,
    index
  ) {

    const fields = [];


    collectInterestingFields83BInspector(
      candidate,
      'candidate[' +
        index +
        ']',
      fields,
      0,
      new WeakSet()
    );


    return {

      index,

      type:
        safeType83BInspector(
          candidate
        ),

      keys:
        safeKeys83BInspector(
          candidate
        ),

      provinceDirect: {

        province:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.province
              )
            : null,

        provinceSlug:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.provinceSlug
              )
            : null,

        slug:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.slug
              )
            : null

      },

      prizeDirect: {

        prize:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.prize
              )
            : null,

        prizeKey:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.prizeKey
              )
            : null,

        giai:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.giai
              )
            : null,

        key:
          candidate &&
          typeof candidate ===
            'object'
            ? safePreview83BInspector(
                candidate.key
              )
            : null

      },

      interestingFields:
        fields.slice(
          0,
          100
        )

    };

  }


  /* =========================================================
     CURRENT UI / PRODUCTION CONTEXT
     ========================================================= */

  function getSelectedProvince83BInspector() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalizeText83BInspector(
          select.value
        );

      }

    } catch (error) {

      // READ ONLY

    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
          'undefined' &&
        SELECTED_PROVINCE
      ) {

        return normalizeText83BInspector(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // READ ONLY

    }


    return null;

  }


  function getProductionProvince83BInspector() {

    let forecast = null;


    try {

      forecast =
        window.LAST_FORECAST ||
        null;

    } catch (error) {

      forecast = null;

    }


    if (!forecast) {

      return null;

    }


    try {

      if (
        forecast.forecast &&
        forecast.forecast.province
      ) {

        return normalizeText83BInspector(
          forecast
            .forecast
            .province
        );

      }


      if (
        forecast.province
      ) {

        return normalizeText83BInspector(
          forecast.province
        );

      }

    } catch (error) {

      return null;

    }


    return null;

  }


  /* =========================================================
     MAIN INSPECTOR
     ========================================================= */

  function runFix03D59Step83BSourceInspector() {

    let step82C = null;

    let step83B = null;


    try {

      step82C =
        window
          .LAST_FIX03D59_STEP82C_RESULT ||
        null;

    } catch (error) {

      step82C = null;

    }


    try {

      step83B =
        window
          .LAST_FIX03D59_STEP83B_RESULT ||
        null;

    } catch (error) {

      step83B = null;

    }


    const selectedProvince =
      getSelectedProvince83BInspector();


    const productionProvince =
      getProductionProvince83BInspector();


    const arrays = [];


    if (step82C) {

      collectArrays83BInspector(
        step82C,
        'LAST_FIX03D59_STEP82C_RESULT',
        arrays,
        0,
        new WeakSet()
      );

    }


    const candidateDetection =
      detectCandidateArray83BInspector(
        step82C,
        arrays
      );


    const candidates =
      candidateDetection
        .candidates;


    const samples =
      candidates
        .slice(
          0,
          MAX_SAMPLE_CANDIDATES
        )
        .map(
          function (
            candidate,
            index
          ) {

            return (
              inspectCandidate83BInspector(
                candidate,
                index
              )
            );

          }
        );


    const allInterestingFields =
      [];


    if (step82C) {

      collectInterestingFields83BInspector(
        step82C,
        'LAST_FIX03D59_STEP82C_RESULT',
        allInterestingFields,
        0,
        new WeakSet()
      );

    }


    const provinceFields =
      allInterestingFields.filter(
        function (item) {

          const key =
            normalizeText83BInspector(
              item.key
            );


          return (
            key.includes(
              'province'
            ) ||
            key.includes(
              'slug'
            )
          );

        }
      );


    const prizeFields =
      allInterestingFields.filter(
        function (item) {

          const key =
            normalizeText83BInspector(
              item.key
            );


          return (
            key.includes(
              'prize'
            ) ||
            key.includes(
              'giai'
            )
          );

        }
      );


    const selectedProvinceMatches =
      provinceFields.filter(
        function (item) {

          return (
            normalizeText83BInspector(
              item.value
            ) ===
            selectedProvince
          );

        }
      );


    const result = {

      version:
        VERSION,

      timestamp:
        new Date()
          .toISOString(),

      ready:
        Boolean(step82C),

      reason:
        !step82C
          ? 'STEP82C_RESULT_NOT_AVAILABLE'
          : !candidateDetection.found
            ? 'STEP82C_FOUND_BUT_CANDIDATE_ARRAY_NOT_IDENTIFIED'
            : candidates.length === 0
              ? 'STEP82C_CANDIDATE_ARRAY_EMPTY'
              : 'STEP82C_SCHEMA_INSPECTED',

      selectedProvince,

      productionProvince,


      step82C: {

        exists:
          Boolean(step82C),

        type:
          safeType83BInspector(
            step82C
          ),

        topLevelKeys:
          safeKeys83BInspector(
            step82C
          ),

        arraysFound:
          arrays.length,

        arrays:
          arrays.slice(
            0,
            50
          )

      },


      candidateDetection: {

        found:
          candidateDetection.found,

        path:
          candidateDetection.path,

        score:
          candidateDetection.score,

        candidateCount:
          candidates.length,

        rankedArrays:
          candidateDetection
            .ranked
            .map(
              function (item) {

                return {

                  path:
                    item
                      .descriptor
                      .path,

                  length:
                    item
                      .descriptor
                      .length,

                  firstItemType:
                    item
                      .descriptor
                      .firstItemType,

                  firstItemKeys:
                    item
                      .descriptor
                      .firstItemKeys,

                  score:
                    item.score

                };

              }
            )

      },


      candidateSamples:
        samples,


      provinceInspection: {

        fieldCount:
          provinceFields.length,

        selectedProvince,

        selectedProvinceMatchCount:
          selectedProvinceMatches.length,

        selectedProvinceMatches:
          selectedProvinceMatches.slice(
            0,
            50
          ),

        fields:
          provinceFields.slice(
            0,
            100
          )

      },


      prizeInspection: {

        fieldCount:
          prizeFields.length,

        fields:
          prizeFields.slice(
            0,
            100
          )

      },


      current83B: {

        exists:
          Boolean(step83B),

        type:
          safeType83BInspector(
            step83B
          ),

        topLevelKeys:
          safeKeys83BInspector(
            step83B
          )

      },


      safety: {

        diagnosticOnly:
          true,

        sourceDataReadOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        engineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        step82CModified:
          false,

        step83BModified:
          false

      }

    };


    /*
     * Diagnostic RAM alias only.
     *
     * Does not modify STEP 8.2C,
     * STEP 8.3B or Production.
     */

    window
      .LAST_FIX03D59_STEP83B_SOURCE_INSPECTION =
      result;


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B SOURCE INSPECTOR V2'
    );

    console.log(
      'REAL STEP 8.2C SCHEMA · DIAGNOSTIC ONLY'
    );

    console.log(
      '=========================================='
    );


    console.log(
      'Selected Province:',
      result.selectedProvince
    );


    console.log(
      'Production Province:',
      result.productionProvince
    );


    console.log(
      'STEP 8.2C Exists:',
      result.step82C.exists
    );


    console.log(
      'STEP 8.2C Keys:',
      result.step82C.topLevelKeys
    );


    console.log(
      'Arrays Found:',
      result.step82C.arrays
    );


    console.log(
      'Candidate Detection:',
      result.candidateDetection
    );


    console.log(
      'Candidate Samples:',
      result.candidateSamples
    );


    console.log(
      'Province Inspection:',
      result.provinceInspection
    );


    console.log(
      'Prize Inspection:',
      result.prizeInspection
    );


    console.log(
      'Safety:',
      result.safety
    );


    return result;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .runFix03D59Step83BSourceInspector =
    runFix03D59Step83BSourceInspector;


  window
    .FIX03D59_STEP83B_SOURCE_INSPECTOR_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SOURCE_INSPECTOR_VERSION =
    VERSION;


  console.log(
    '🔬 FIX-03D5.9 STEP 8.3B Source Inspector V2 / REAL 8.2C SCHEMA / DIAGNOSTIC ONLY'
  );

})();
