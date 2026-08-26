/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — PRIZE_META ACCESS BRIDGE V1

   PURPOSE:
   - Expose existing lexical PRIZE_META through a read-only getter.
   - Support STEP 3.4B Preflight and Isolated Engine Executor.
   - Do NOT duplicate Production prize definitions.

   SAFETY:
   - READ ONLY.
   - ZERO ENGINE EXECUTION.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRIZE-META-BRIDGE-V1';


  function readPrizeMeta03D59() {

    /*
     * Preferred source:
     * existing Production lexical PRIZE_META
     * declared by app.js.
     */

    try {

      if (
        typeof PRIZE_META !==
          'undefined' &&
        Array.isArray(
          PRIZE_META
        ) &&
        PRIZE_META.length
      ) {

        /*
         * Return a shallow defensive copy.
         * Do not expose the original array itself.
         */

        return PRIZE_META.map(
          item =>
            item &&
            typeof item ===
              'object'
              ? Object.assign(
                  {},
                  item
                )
              : item
        );

      }

    } catch (error) {

      /*
       * Fail closed.
       */

    }


    /*
     * Compatibility source in case
     * PRIZE_META is already exposed.
     */

    if (
      Array.isArray(
        window.PRIZE_META
      ) &&
      window.PRIZE_META.length
    ) {

      return window.PRIZE_META.map(
        item =>
          item &&
          typeof item ===
            'object'
            ? Object.assign(
                {},
                item
              )
            : item
      );

    }


    return null;

  }


  window
    .getPrizeMeta03D59 =
    readPrizeMeta03D59;


  window
    .FIX03D59_PRIZE_META_BRIDGE_LOADED =
    true;


  window
    .FIX03D59_PRIZE_META_BRIDGE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 PRIZE_META Bridge loaded — READ ONLY'
  );

})();
