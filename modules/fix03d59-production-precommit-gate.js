/* =========================================================================
   FIX-03D5.9
   PRODUCTION FORECAST PRE-COMMIT GATE V1

   FILE:
   modules/fix03d59-production-precommit-gate.js

   PURPOSE:
   - Validate the NEW Production Forecast candidate BEFORE LAST_FORECAST commit.
   - Bind candidate province to CURRENT selected province.
   - Bind candidate windowSize to CURRENT production window.
   - Validate the complete XSMN prize identity db -> g8.
   - Validate forecast number schema.
   - Validate pairFormulas envelope.
   - Authorize ONLY the candidate passed directly into this gate.

   IMPORTANT:
   - Does NOT read old LAST_FORECAST as source of truth.
   - Does NOT create a forecast.
   - Does NOT modify candidate.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT write Production/storage.
   - FAIL CLOSED.

   DIAGNOSTIC RAM ALIAS ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_PRECOMMIT_GATE_V1';


  /*
   * =========================================================
   * 1. CANONICAL EXPECTED PRIZE CONTRACT
   * =========================================================
   *
   * Mirrors the real app.js PRIZE_META production contract.
   *
   * db : 1 x 6 digits
   * g1 : 1 x 5 digits
   * g2 : 1 x 5 digits
   * g3 : 2 x 5 digits
   * g4 : 7 x 5 digits
   * g5 : 1 x 4 digits
   * g6 : 3 x 4 digits
   * g7 : 1 x 3 digits
   * g8 : 1 x 2 digits
   * =========================================================
   */

  const EXPECTED_PRIZES = [

    {
      key: 'db',
      count: 1,
      digits: 6
    },

    {
      key: 'g1',
      count: 1,
      digits: 5
    },

    {
      key: 'g2',
      count: 1,
      digits: 5
    },

    {
      key: 'g3',
      count: 2,
      digits: 5
    },

    {
      key: 'g4',
      count: 7,
      digits: 5
    },

    {
      key: 'g5',
      count: 1,
      digits: 4
    },

    {
      key: 'g6',
      count: 3,
      digits: 4
    },

    {
      key: 'g7',
      count: 1,
      digits: 3
    },

    {
      key: 'g8',
      count: 1,
      digits: 2
    }

  ];


  /*
   * =========================================================
   * 2. HELPERS
   * =========================================================
   */

  function isObjectPreCommit(
    value
  ) {

    return Boolean(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );

  }


  function normalizeTextPreCommit(
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


  function normalizeNumberPreCommit(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim();

  }


  /*
   * =========================================================
   * 3. FAIL CLOSED
   * =========================================================
   */

  function failPreCommit(
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
        'PRODUCTION_PRECOMMIT',

      ...extra,

      safety: {

        candidateModified:
          false,

        lastForecastModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        commitPerformed:
          false

      },

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM only.
     *
     * NOT LAST_FORECAST.
     * NOT Production persistence.
     */

    window
      .LAST_FIX03D59_PRODUCTION_PRECOMMIT =
      result;


    return result;

  }


  /*
   * =========================================================
   * 4. VALIDATE ONE FORECAST NUMBER
   * =========================================================
   */

  function validateNumberPreCommit(
    numberItem,
    expectedDigits
  ) {

    if (
      !isObjectPreCommit(
        numberItem
      )
    ) {

      return false;

    }


    const number =
      normalizeNumberPreCommit(
        numberItem.number
      );


    if (
      !number ||
      !/^\d+$/.test(number)
    ) {

      return false;

    }


    if (
      number.length !==
      expectedDigits
    ) {

      return false;

    }


    /*
     * Existing app.js forecast schema exposes
     * rank / score / confidence / reasoning.
     *
     * We do not require arbitrary score values,
     * but identity fields must be structurally usable.
     */

    if (
      !Number.isFinite(
        Number(
          numberItem.rank
        )
      )
    ) {

      return false;

    }


    if (
      !Number.isFinite(
        Number(
          numberItem.score
        )
      )
    ) {

      return false;

    }


    if (
      !Number.isFinite(
        Number(
          numberItem.confidence
        )
      )
    ) {

      return false;

    }


    return true;

  }


  /*
   * =========================================================
   * 5. VALIDATE FORECAST
   * =========================================================
   */

  function validateForecastPreCommit(
    forecast,
    selectedProvince,
    expectedWindowSize
  ) {

    if (
      !isObjectPreCommit(
        forecast
      )
    ) {

      return {
        passed: false,
        reason:
          'FORECAST_NOT_OBJECT'
      };

    }


    if (
      forecast.empty === true
    ) {

      return {
        passed: false,
        reason:
          'FORECAST_EMPTY'
      };

    }


    const forecastProvince =
      normalizeTextPreCommit(
        forecast.province
      );


    const selected =
      normalizeTextPreCommit(
        selectedProvince
      );


    if (
      !forecastProvince
    ) {

      return {
        passed: false,
        reason:
          'FORECAST_PROVINCE_NOT_AVAILABLE'
      };

    }


    if (
      !selected
    ) {

      return {
        passed: false,
        reason:
          'SELECTED_PROVINCE_NOT_AVAILABLE'
      };

    }


    if (
      forecastProvince !==
      selected
    ) {

      return {

        passed: false,

        reason:
          'FORECAST_PROVINCE_MISMATCH',

        forecastProvince,

        selectedProvince:
          selected

      };

    }


    const forecastWindow =
      Number(
        forecast.windowSize
      );


    const expectedWindow =
      Number(
        expectedWindowSize
      );


    if (
      !Number.isFinite(
        forecastWindow
      ) ||
      !Number.isFinite(
        expectedWindow
      )
    ) {

      return {

        passed: false,

        reason:
          'FORECAST_WINDOW_INVALID'

      };

    }


    if (
      forecastWindow !==
      expectedWindow
    ) {

      return {

        passed: false,

        reason:
          'FORECAST_WINDOW_MISMATCH',

        forecastWindow,

        expectedWindow

      };

    }


    if (
      !Array.isArray(
        forecast.items
      )
    ) {

      return {

        passed: false,

        reason:
          'FORECAST_ITEMS_NOT_ARRAY'

      };

    }


    if (
      forecast.items.length !==
      EXPECTED_PRIZES.length
    ) {

      return {

        passed: false,

        reason:
          'FORECAST_PRIZE_COUNT_INVALID',

        itemCount:
          forecast.items.length,

        expectedCount:
          EXPECTED_PRIZES.length

      };

    }


    const itemDiagnostics =
      [];


    for (
      let index = 0;
      index <
        EXPECTED_PRIZES.length;
      index += 1
    ) {

      const expected =
        EXPECTED_PRIZES[index];


      const item =
        forecast.items[index];


      if (
        !isObjectPreCommit(
          item
        )
      ) {

        return {

          passed: false,

          reason:
            'FORECAST_PRIZE_ITEM_INVALID',

          failedIndex:
            index,

          expectedKey:
            expected.key

        };

      }


      const actualKey =
        normalizeTextPreCommit(
          item.key
        );


      if (
        actualKey !==
        expected.key
      ) {

        return {

          passed: false,

          reason:
            'FORECAST_PRIZE_IDENTITY_MISMATCH',

          failedIndex:
            index,

          expectedKey:
            expected.key,

          actualKey

        };

      }


      if (
        !Array.isArray(
          item.numbers
        )
      ) {

        return {

          passed: false,

          reason:
            'FORECAST_NUMBERS_NOT_ARRAY',

          prizeKey:
            expected.key

        };

      }


      if (
        item.numbers.length !==
        expected.count
      ) {

        return {

          passed: false,

          reason:
            'FORECAST_NUMBER_COUNT_MISMATCH',

          prizeKey:
            expected.key,

          actualCount:
            item.numbers.length,

          expectedCount:
            expected.count

        };

      }


      const numbersValid =
        item.numbers.every(
          function (
            numberItem
          ) {

            return (
              validateNumberPreCommit(
                numberItem,
                expected.digits
              )
            );

          }
        );


      if (
        !numbersValid
      ) {

        return {

          passed: false,

          reason:
            'FORECAST_NUMBER_SCHEMA_INVALID',

          prizeKey:
            expected.key,

          expectedDigits:
            expected.digits

        };

      }


      itemDiagnostics.push({

        key:
          expected.key,

        count:
          item.numbers.length,

        digits:
          expected.digits,

        valid:
          true

      });

    }


    return {

      passed: true,

      reason:
        'FORECAST_CONTRACT_VALID',

      forecastProvince,

      forecastWindow,

      itemCount:
        forecast.items.length,

      itemDiagnostics

    };

  }


  /*
   * =========================================================
   * 6. VALIDATE PAIR FORMULAS
   * =========================================================
   */

  function validatePairFormulasPreCommit(
    pairFormulas
  ) {

    if (
      !Array.isArray(
        pairFormulas
      )
    ) {

      return {

        passed: false,

        reason:
          'PAIR_FORMULAS_NOT_ARRAY'

      };

    }


    /*
     * Empty [] is allowed.
     *
     * generatePairFormulas() legitimately returns []
     * when no usable pair formula exists.
     */

    for (
      let index = 0;
      index <
        pairFormulas.length;
      index += 1
    ) {

      const item =
        pairFormulas[index];


      if (
        !isObjectPreCommit(
          item
        )
      ) {

        return {

          passed: false,

          reason:
            'PAIR_FORMULA_ITEM_INVALID',

          failedIndex:
            index

        };

      }


      const formula =
        String(
          item.formula == null
            ? ''
            : item.formula
        )
          .trim();


      const pair =
        String(
          item.pair == null
            ? ''
            : item.pair
        )
          .trim();


      if (
        !formula ||
        !pair
      ) {

        return {

          passed: false,

          reason:
            'PAIR_FORMULA_SCHEMA_INVALID',

          failedIndex:
            index

        };

      }

    }


    return {

      passed: true,

      reason:
        'PAIR_FORMULAS_VALID',

      pairFormulaCount:
        pairFormulas.length

    };

  }


  /*
   * =========================================================
   * 7. MAIN PRE-COMMIT GATE
   * =========================================================
   */

  function inspectProductionPreCommit03D59(
    candidate,
    context = {}
  ) {

    /*
     * Candidate MUST be supplied explicitly.
     *
     * We intentionally do NOT fall back to
     * window.LAST_FORECAST.
     */

    if (
      !isObjectPreCommit(
        candidate
      )
    ) {

      return failPreCommit(
        'PRODUCTION_CANDIDATE_NOT_AVAILABLE'
      );

    }


    if (
      !isObjectPreCommit(
        candidate.forecast
      )
    ) {

      return failPreCommit(
        'PRODUCTION_CANDIDATE_FORECAST_NOT_AVAILABLE'
      );

    }


    if (
      !Array.isArray(
        candidate.pairFormulas
      )
    ) {

      return failPreCommit(
        'PRODUCTION_CANDIDATE_PAIR_FORMULAS_NOT_AVAILABLE'
      );

    }


    const forecastCheck =
      validateForecastPreCommit(

        candidate.forecast,

        context.selectedProvince,

        context.windowSize

      );


    if (
      forecastCheck.passed !==
      true
    ) {

      return failPreCommit(
        forecastCheck.reason ||
        'FORECAST_CONTRACT_INVALID',
        {
          forecastCheck
        }
      );

    }


    const pairCheck =
      validatePairFormulasPreCommit(
        candidate.pairFormulas
      );


    if (
      pairCheck.passed !==
      true
    ) {

      return failPreCommit(
        pairCheck.reason ||
        'PAIR_FORMULAS_INVALID',
        {
          forecastCheck,
          pairCheck
        }
      );

    }


    /*
     * =========================================================
     * AUTHORIZATION
     * =========================================================
     *
     * authorized:true means ONLY:
     *
     * This exact candidate is structurally approved
     * for the immediate LAST_FORECAST commit performed
     * by app.js.
     *
     * This gate itself performs NO commit.
     */

    const result = {

      ready: true,

      passed: true,

      authorized: true,

      reason:
        'PRODUCTION_PRECOMMIT_GATE_PASS',

      version:
        VERSION,

      mode:
        'PRODUCTION_PRECOMMIT',

      province:
        forecastCheck
          .forecastProvince,

      windowSize:
        forecastCheck
          .forecastWindow,

      forecastItemCount:
        forecastCheck
          .itemCount,

      expectedPrizeCount:
        EXPECTED_PRIZES.length,

      pairFormulaCount:
        pairCheck
          .pairFormulaCount,

      forecastCheck,

      pairCheck,

      safety: {

        candidateModified:
          false,

        lastForecastModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        commitPerformed:
          false

      },

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
      .LAST_FIX03D59_PRODUCTION_PRECOMMIT =
      result;


    return result;

  }


  /*
   * =========================================================
   * 8. PUBLIC API
   * =========================================================
   */

  window
    .inspectFix03D59ProductionPreCommit =
    inspectProductionPreCommit03D59;


  window
    .FIX03D59_PRODUCTION_PRECOMMIT_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_PRECOMMIT_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Pre-Commit Gate V1 loaded / FAIL CLOSED / ZERO PRODUCTION WRITE'
  );

})();
