/* =========================================================================
   FIX-03D5.9
   PRODUCTION FORECAST PRE-COMMIT GATE V2

   FILE:
   modules/fix03d59-production-precommit-gate.js

   PURPOSE:
   - Validate the CURRENT Production Forecast envelope.
   - Bind forecast province to CURRENT selected province.
   - Bind forecast windowSize to CURRENT production window.
   - Validate all 9 forecast prize identities: db -> g8.
   - Validate the REAL app.js forecast suggestion contract.
   - Validate forecast number schema.
   - Validate pairFormulas envelope.
   - Authorize ONLY the exact candidate supplied to this gate.

   IMPORTANT:
   - Forecast suggestion count is NOT PRIZE_META.count.
   - PRIZE_META.count describes real lottery result cardinality.
   - app.js pickCountFor() defines forecast suggestion cardinality:
       db / g1 / g2 = 2 suggestions
       g3 -> g8      = 3 suggestions
   - Forecast candidate numbers are 2-digit score identities 00 -> 99.
   - Does NOT create forecast.
   - Does NOT modify candidate.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT write Production/storage.
   - FAIL CLOSED.

   READ ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_PRECOMMIT_GATE_V2';


  /*
   * =========================================================
   * 1. REAL FORECAST SUGGESTION CONTRACT
   * =========================================================
   *
   * SOURCE:
   *
   * app.js:
   *
   * function pickCountFor(giaiKey) {
   *
   *   if (
   *     ['db', 'g1', 'g2']
   *       .includes(giaiKey)
   *   ) {
   *
   *     return 2;
   *
   *   }
   *
   *   return 3;
   *
   * }
   *
   * generateFullForecast() then picks from score identities
   * 00 -> 99.
   *
   * Therefore every forecast number is 2 digits.
   *
   * IMPORTANT:
   *
   * This contract is intentionally different from PRIZE_META.
   *
   * PRIZE_META describes actual lottery result structure.
   * This contract describes forecast suggestion structure.
   * =========================================================
   */

  const EXPECTED_FORECAST_PRIZES = [

    {
      key: 'db',
      count: 2,
      digits: 2
    },

    {
      key: 'g1',
      count: 2,
      digits: 2
    },

    {
      key: 'g2',
      count: 2,
      digits: 2
    },

    {
      key: 'g3',
      count: 3,
      digits: 2
    },

    {
      key: 'g4',
      count: 3,
      digits: 2
    },

    {
      key: 'g5',
      count: 3,
      digits: 2
    },

    {
      key: 'g6',
      count: 3,
      digits: 2
    },

    {
      key: 'g7',
      count: 3,
      digits: 2
    },

    {
      key: 'g8',
      count: 3,
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

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_NOT_OBJECT'

      };

    }


    const number =
      normalizeNumberPreCommit(
        numberItem.number
      );


    if (
      !number ||
      !/^\d+$/.test(number)
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_VALUE_INVALID',

        number

      };

    }


    if (
      number.length !==
      expectedDigits
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_DIGITS_INVALID',

        number,

        actualDigits:
          number.length,

        expectedDigits

      };

    }


    /*
     * REAL generateFullForecast() schema:
     *
     * {
     *   number,
     *   rank,
     *   score,
     *   confidence,
     *   reasoning
     * }
     */

    if (
      !Number.isFinite(
        Number(
          numberItem.rank
        )
      )
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_RANK_INVALID',

        number

      };

    }


    if (
      !Number.isFinite(
        Number(
          numberItem.score
        )
      )
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_SCORE_INVALID',

        number

      };

    }


    if (
      !Number.isFinite(
        Number(
          numberItem.confidence
        )
      )
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_CONFIDENCE_INVALID',

        number

      };

    }


    /*
     * reasoning exists in current app.js forecast schema.
     *
     * Require it to be a string.
     *
     * Empty string remains structurally acceptable because
     * authorization concerns schema, not prose quality.
     */

    if (
      typeof numberItem.reasoning !==
        'string'
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_NUMBER_REASONING_INVALID',

        number

      };

    }


    return {

      passed:
        true,

      reason:
        'FORECAST_NUMBER_VALID',

      number,

      digits:
        number.length

    };

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

        passed:
          false,

        reason:
          'FORECAST_NOT_OBJECT'

      };

    }


    if (
      forecast.empty === true
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_EMPTY'

      };

    }


    /*
     * ---------------------------------------------------------
     * PROVINCE
     * ---------------------------------------------------------
     */

    const forecastProvince =
      normalizeTextPreCommit(
        forecast.province
      );


    const selected =
      normalizeTextPreCommit(
        selectedProvince
      );


    if (!forecastProvince) {

      return {

        passed:
          false,

        reason:
          'FORECAST_PROVINCE_NOT_AVAILABLE'

      };

    }


    if (!selected) {

      return {

        passed:
          false,

        reason:
          'SELECTED_PROVINCE_NOT_AVAILABLE'

      };

    }


    if (
      forecastProvince !==
      selected
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_PROVINCE_MISMATCH',

        forecastProvince,

        selectedProvince:
          selected

      };

    }


    /*
     * ---------------------------------------------------------
     * WINDOW
     * ---------------------------------------------------------
     */

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

        passed:
          false,

        reason:
          'FORECAST_WINDOW_INVALID',

        forecastWindow,

        expectedWindow

      };

    }


    if (
      forecastWindow !==
      expectedWindow
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_WINDOW_MISMATCH',

        forecastWindow,

        expectedWindow

      };

    }


    /*
     * ---------------------------------------------------------
     * FORECAST ITEMS
     * ---------------------------------------------------------
     */

    if (
      !Array.isArray(
        forecast.items
      )
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_ITEMS_NOT_ARRAY'

      };

    }


    if (
      forecast.items.length !==
      EXPECTED_FORECAST_PRIZES.length
    ) {

      return {

        passed:
          false,

        reason:
          'FORECAST_PRIZE_COUNT_INVALID',

        itemCount:
          forecast.items.length,

        expectedCount:
          EXPECTED_FORECAST_PRIZES.length

      };

    }


    const itemDiagnostics =
      [];


    /*
     * ---------------------------------------------------------
     * VALIDATE ALL 9 PRIZES
     * ---------------------------------------------------------
     */

    for (
      let index = 0;
      index <
        EXPECTED_FORECAST_PRIZES.length;
      index += 1
    ) {

      const expected =
        EXPECTED_FORECAST_PRIZES[
          index
        ];


      const item =
        forecast.items[
          index
        ];


      if (
        !isObjectPreCommit(
          item
        )
      ) {

        return {

          passed:
            false,

          reason:
            'FORECAST_PRIZE_ITEM_INVALID',

          failedIndex:
            index,

          expectedKey:
            expected.key

        };

      }


      /*
       * -------------------------------------------------------
       * PRIZE IDENTITY
       * -------------------------------------------------------
       */

      const actualKey =
        normalizeTextPreCommit(
          item.key
        );


      if (
        actualKey !==
        expected.key
      ) {

        return {

          passed:
            false,

          reason:
            'FORECAST_PRIZE_IDENTITY_MISMATCH',

          failedIndex:
            index,

          expectedKey:
            expected.key,

          actualKey

        };

      }


      /*
       * -------------------------------------------------------
       * NUMBERS ARRAY
       * -------------------------------------------------------
       */

      if (
        !Array.isArray(
          item.numbers
        )
      ) {

        return {

          passed:
            false,

          reason:
            'FORECAST_NUMBERS_NOT_ARRAY',

          failedIndex:
            index,

          prizeKey:
            expected.key

        };

      }


      /*
       * -------------------------------------------------------
       * REAL FORECAST SUGGESTION COUNT
       * -------------------------------------------------------
       *
       * db / g1 / g2 = 2
       * g3 -> g8      = 3
       * -------------------------------------------------------
       */

      if (
        item.numbers.length !==
        expected.count
      ) {

        return {

          passed:
            false,

          reason:
            'FORECAST_NUMBER_COUNT_MISMATCH',

          failedIndex:
            index,

          prizeKey:
            expected.key,

          actualCount:
            item.numbers.length,

          expectedCount:
            expected.count

        };

      }


      /*
       * -------------------------------------------------------
       * VALIDATE EACH FORECAST NUMBER
       * -------------------------------------------------------
       */

      for (
        let numberIndex = 0;
        numberIndex <
          item.numbers.length;
        numberIndex += 1
      ) {

        const numberItem =
          item.numbers[
            numberIndex
          ];


        const numberCheck =
          validateNumberPreCommit(
            numberItem,
            expected.digits
          );


        if (
          numberCheck.passed !==
          true
        ) {

          return {

            passed:
              false,

            reason:
              numberCheck.reason ||
              'FORECAST_NUMBER_SCHEMA_INVALID',

            failedIndex:
              index,

            failedNumberIndex:
              numberIndex,

            prizeKey:
              expected.key,

            expectedDigits:
              expected.digits,

            actualDigits:
              numberCheck.actualDigits ??
              null,

            number:
              numberCheck.number ??
              null,

            numberCheck

          };

        }

      }


      itemDiagnostics.push({

        index,

        key:
          expected.key,

        actualKey,

        count:
          item.numbers.length,

        expectedCount:
          expected.count,

        digits:
          expected.digits,

        valid:
          true

      });

    }


    /*
     * ---------------------------------------------------------
     * FORECAST CONTRACT PASS
     * ---------------------------------------------------------
     */

    return {

      passed:
        true,

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

        passed:
          false,

        reason:
          'PAIR_FORMULAS_NOT_ARRAY'

      };

    }


    /*
     * Empty [] is valid.
     *
     * generatePairFormulas() can legitimately return []
     * when no usable pair formula exists.
     */

    for (
      let index = 0;
      index <
        pairFormulas.length;
      index += 1
    ) {

      const item =
        pairFormulas[
          index
        ];


      if (
        !isObjectPreCommit(
          item
        )
      ) {

        return {

          passed:
            false,

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

          passed:
            false,

          reason:
            'PAIR_FORMULA_SCHEMA_INVALID',

          failedIndex:
            index

        };

      }

    }


    return {

      passed:
        true,

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
     * Never fall back to old LAST_FORECAST.
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


    /*
     * ---------------------------------------------------------
     * FORECAST CONTRACT
     * ---------------------------------------------------------
     */

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


    /*
     * ---------------------------------------------------------
     * PAIR FORMULA CONTRACT
     * ---------------------------------------------------------
     */

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
     * 8. AUTHORIZATION
     * =========================================================
     *
     * authorized:true means ONLY:
     *
     * The exact current Production Forecast envelope passed
     * the structural Production contract.
     *
     * This gate itself performs NO commit.
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
        EXPECTED_FORECAST_PRIZES
          .length,

      pairFormulaCount:
        pairCheck
          .pairFormulaCount,

      forecastCheck,

      pairCheck,

      /*
       * Explicit contract diagnostic.
       */

      forecastContract: {

        db:
          2,

        g1:
          2,

        g2:
          2,

        g3:
          3,

        g4:
          3,

        g5:
          3,

        g6:
          3,

        g7:
          3,

        g8:
          3,

        candidateDigits:
          2

      },

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
   * 9. PUBLIC API
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
    'FIX-03D5.9 Production Pre-Commit Gate V2 loaded / REAL FORECAST CONTRACT / 2-DIGIT CANDIDATES / FAIL CLOSED / ZERO WRITE'
  );

})();
