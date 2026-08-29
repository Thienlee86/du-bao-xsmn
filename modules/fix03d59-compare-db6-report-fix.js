/* =========================================================================
   FIX-03D5.9
   COMPARE DB6 REPORT FIX V1

   FILE:
   modules/fix03d59-compare-db6-report-fix.js

   PURPOSE:
   - Fix Compare/Deviation reporting for FULL 6-digit Special Prize.
   - Prevent Giải Đặc Biệt from being ranked by the legacy 00 -> 99 engine.
   - Keep G1 -> G8 legacy /100 ranking behavior unchanged.
   - Override ONLY buildDeviationNote() reporting behavior.

   IMPORTANT:
   - DOES NOT modify forecast engine.
   - DOES NOT modify LAST_FORECAST.
   - DOES NOT modify Production Pre-Commit Gate.
   - DOES NOT modify Production Commit Controller.
   - DOES NOT call savePrediction().
   - DOES NOT write storage.
   - REPORTING PATCH ONLY.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_COMPARE_DB6_REPORT_FIX_V1';


  /*
   * =========================================================
   * ORIGINAL DEPENDENCY CHECK
   * =========================================================
   */

  if (
    typeof buildDeviationNote !==
      'function'
  ) {

    console.warn(
      'FIX-03D5.9 Compare DB6 Report Fix not installed: buildDeviationNote() unavailable'
    );

    return;

  }


  if (
    typeof getAllDrawsForProvince !==
      'function' ||
    typeof computeScoresForGiai !==
      'function' ||
    typeof rankOf !==
      'function'
  ) {

    console.warn(
      'FIX-03D5.9 Compare DB6 Report Fix not installed: required compare helpers unavailable'
    );

    return;

  }


  /*
   * =========================================================
   * OVERRIDE REPORTING ONLY
   * =========================================================
   */

  buildDeviationNote =
  function (
    pred,
    evaluation
  ) {

    if (
      !evaluation ||
      evaluation.status ===
        'pending'
    ) {

      return '';

    }


    const historical =
      getAllDrawsForProvince(
        pred.province
      )
      .filter(
        draw =>
          draw.date <
          pred.targetDate
      );


    const notes = [];


    const hits =
      Array.isArray(
        evaluation.hits
      )
        ? evaluation.hits
        : [];


    hits.forEach(
      function (
        h
      ) {

        if (!h) {

          return;

        }


        /*
         * ---------------------------------------------------------
         * MATCHED
         * ---------------------------------------------------------
         */

        if (
          Array.isArray(
            h.matched
          ) &&
          h.matched.length
        ) {

          notes.push(
            `${h.label}: dự báo đúng số <b>${h.matched.join(', ')}</b>.`
          );

          return;

        }


        if (
          !Array.isArray(
            h.actual
          ) ||
          !h.actual.length
        ) {

          return;

        }


        /*
         * =========================================================
         * DB FULL 6-DIGIT REPORTING
         * =========================================================
         *
         * IMPORTANT:
         *
         * Do NOT use:
         *
         *   computeScoresForGiai(..., 'db')
         *   rankOf(..., sixDigitNumber)
         *
         * because that legacy engine ranks 00 -> 99 identities.
         *
         * Current DB Production forecast is FULL 6 digits.
         * =========================================================
         */

        if (
          h.key ===
            'db'
        ) {

          notes.push(
            `${h.label}: thực tế ${h.actual.join(', ')} — không nằm trong TOP 2 dự báo Full 6 chữ số.`
          );

          return;

        }


        /*
         * =========================================================
         * G1 -> G8
         * LEGACY 2-DIGIT RANKING REMAINS VALID
         * =========================================================
         */

        if (
          !historical.length
        ) {

          notes.push(
            `${h.label}: thực tế ${h.actual.join(', ')} — không nằm trong nhóm dự báo V2.`
          );

          return;

        }


        const stat =
          computeScoresForGiai(
            historical,
            h.key,
            pred.windowSize ||
            30
          );


        const ranks =
          h.actual.map(
            function (
              number
            ) {

              return (
                `${number} (hạng ${rankOf(stat.scores, number)}/100)`
              );

            }
          );


        notes.push(
          `${h.label}: thực tế ${ranks.join(', ')} — không nằm trong nhóm dự báo V2.`
        );

      }
    );


    return notes.join(' ');

  };


  /*
   * =========================================================
   * PUBLIC DIAGNOSTIC FLAGS
   * =========================================================
   */

  window
    .FIX03D59_COMPARE_DB6_REPORT_FIX_VERSION =
    VERSION;


  window
    .FIX03D59_COMPARE_DB6_REPORT_FIX_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Compare DB6 Report Fix V1 loaded / DB FULL 6-DIGIT REPORTING / G1-G8 RANK UNCHANGED'
  );

})();
