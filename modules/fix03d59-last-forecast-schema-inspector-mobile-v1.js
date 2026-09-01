/* =========================================================================
   FIX-03D5.9
   LAST_FORECAST SCHEMA INSPECTOR — MOBILE REPORTER V1

   PURPOSE:
   - Run LAST_FORECAST Schema Inspector V1 from mobile.
   - Display REAL LAST_FORECAST root schema.
   - Display province-like fields.
   - Display G1 -> G8 prize-like paths.
   - Help determine exact schema for Production Shadow Comparison V2.

   IMPORTANT:
   - READ ONLY.
   - ZERO ENGINE EXECUTION.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-last-forecast-schema-inspector-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-last-forecast-schema-inspector-mobile-output';


  const BUTTON_ID =
    'fix03d59-last-forecast-schema-inspector-mobile-button';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function text03D59(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return '--';

    }


    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {

      return String(value);

    }


    try {

      return JSON.stringify(
        value
      );

    } catch (error) {

      return '[unprintable]';

    }

  }


  function yesNo03D59(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : value === false
        ? 'NO ❌'
        : '--';

  }


  function appendLine03D59(
    lines,
    value
  ) {

    lines.push(
      value === undefined
        ? ''
        : String(value)
    );

  }


  /*
   * =========================================================
   * FORMAT PROVINCE FIELDS
   * =========================================================
   */

  function appendProvinceFields03D59(
    lines,
    fields
  ) {

    appendLine03D59(
      lines,
      'PROVINCE-LIKE FIELDS'
    );

    appendLine03D59(
      lines,
      '------------------------'
    );


    if (
      !Array.isArray(fields) ||
      !fields.length
    ) {

      appendLine03D59(
        lines,
        'NONE FOUND'
      );

      return;

    }


    fields.forEach(
      (
        item,
        index
      ) => {

        appendLine03D59(
          lines,
          '#' + (index + 1)
        );

        appendLine03D59(
          lines,
          'Path: ' +
          text03D59(
            item.path
          )
        );

        appendLine03D59(
          lines,
          'Type: ' +
          text03D59(
            item.type
          )
        );

        appendLine03D59(
          lines,
          'Value: ' +
          text03D59(
            item.preview
          )
        );

        appendLine03D59(
          lines,
          ''
        );

      }
    );

  }


  /*
   * =========================================================
   * FORMAT PRIZE FIELDS
   * =========================================================
   */

  function appendPrizeFields03D59(
    lines,
    prizeFields
  ) {

    appendLine03D59(
      lines,
      'PRIZE-LIKE FIELDS'
    );

    appendLine03D59(
      lines,
      '------------------------'
    );


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

          const entries =
            (
              prizeFields &&
              Array.isArray(
                prizeFields[
                  prize
                ]
              )
            )
              ? prizeFields[
                  prize
                ]
              : [];


          appendLine03D59(
            lines,
            prize.toUpperCase()
          );


          if (
            !entries.length
          ) {

            appendLine03D59(
              lines,
              '  NONE FOUND'
            );

            appendLine03D59(
              lines,
              ''
            );

            return;

          }


          entries.forEach(
            item => {

              appendLine03D59(
                lines,
                '  Path: ' +
                text03D59(
                  item.path
                )
              );

              appendLine03D59(
                lines,
                '  Type: ' +
                text03D59(
                  item.type
                )
              );


              if (
                item.arrayLength !==
                null &&
                item.arrayLength !==
                undefined
              ) {

                appendLine03D59(
                  lines,
                  '  Array Length: ' +
                  item.arrayLength
                );

              }


              if (
                Array.isArray(
                  item.keys
                ) &&
                item.keys.length
              ) {

                appendLine03D59(
                  lines,
                  '  Keys: ' +
                  item.keys.join(
                    ', '
                  )
                );

              }


              appendLine03D59(
                lines,
                '  Preview: ' +
                text03D59(
                  item.preview
                )
              );

            }
          );


          appendLine03D59(
            lines,
            ''
          );

        }
      );

  }


  /*
   * =========================================================
   * FORMAT RESULT
   * =========================================================
   */

  function formatResult03D59(
    result
  ) {

    const lines = [];


    appendLine03D59(
      lines,
      'LAST_FORECAST SCHEMA INSPECTOR V1'
    );

    appendLine03D59(
      lines,
      '========================'
    );


    if (!result) {

      appendLine03D59(
        lines,
        'NO RESULT'
      );

      return lines.join(
        '\n'
      );

    }


    appendLine03D59(
      lines,
      'Ready: ' +
      yesNo03D59(
        result.ready
      )
    );

    appendLine03D59(
      lines,
      'Passed: ' +
      yesNo03D59(
        result.passed
      )
    );

    appendLine03D59(
      lines,
      'Reason: ' +
      text03D59(
        result.reason
      )
    );


    if (
      result.error
    ) {

      appendLine03D59(
        lines,
        'Error: ' +
        text03D59(
          result.error
        )
      );

    }


    appendLine03D59(
      lines,
      ''
    );


    /*
     * ROOT
     */

    appendLine03D59(
      lines,
      'ROOT SCHEMA'
    );

    appendLine03D59(
      lines,
      '------------------------'
    );


    appendLine03D59(
      lines,
      'Type: ' +
      text03D59(
        result.root &&
        result.root.type
      )
    );


    appendLine03D59(
      lines,
      'Keys: ' +
      (
        result.root &&
        Array.isArray(
          result.root.keys
        )
          ? result.root.keys.join(
              ', '
            )
          : '--'
      )
    );


    appendLine03D59(
      lines,
      'Structure Paths: ' +
      text03D59(
        result.structureCount
      )
    );


    appendLine03D59(
      lines,
      ''
    );


    appendProvinceFields03D59(
      lines,
      result.provinceFields
    );


    appendLine03D59(
      lines,
      ''
    );


    appendPrizeFields03D59(
      lines,
      result.prizeFields
    );


    /*
     * SAFETY
     */

    appendLine03D59(
      lines,
      'LAST_FORECAST'
    );

    appendLine03D59(
      lines,
      '------------------------'
    );

    appendLine03D59(
      lines,
      'Unchanged: ' +
      yesNo03D59(
        result.lastForecastUnchanged
      )
    );


    appendLine03D59(
      lines,
      ''
    );


    appendLine03D59(
      lines,
      'SAFETY'
    );

    appendLine03D59(
      lines,
      '------------------------'
    );


    const safety =
      result.safety || {};


    appendLine03D59(
      lines,
      'Read Only: ' +
      yesNo03D59(
        safety.readOnly
      )
    );

    appendLine03D59(
      lines,
      'Engine Executed: ' +
      yesNo03D59(
        safety.engineExecuted
      )
    );

    appendLine03D59(
      lines,
      'Production Write: ' +
      yesNo03D59(
        safety.productionWrite
      )
    );

    appendLine03D59(
      lines,
      'Storage Write: ' +
      yesNo03D59(
        safety.storageWrite
      )
    );

    appendLine03D59(
      lines,
      'renderForecast Called: ' +
      yesNo03D59(
        safety.renderForecastCalled
      )
    );

    appendLine03D59(
      lines,
      'savePrediction Called: ' +
      yesNo03D59(
        safety.savePredictionCalled
      )
    );

    appendLine03D59(
      lines,
      'LAST_FORECAST Modified: ' +
      yesNo03D59(
        safety.lastForecastModified
      )
    );


    appendLine03D59(
      lines,
      ''
    );

    appendLine03D59(
      lines,
      '========================'
    );


    return lines.join(
      '\n'
    );

  }


  /*
   * =========================================================
   * RUN
   * =========================================================
   */

  function runMobile03D59() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    if (
      typeof window
        .inspectLastForecastSchema03D59 !==
      'function'
    ) {

      output.textContent =
        'LAST_FORECAST SCHEMA INSPECTOR V1\n' +
        '========================\n' +
        'Ready: NO ❌\n' +
        'Reason: SCHEMA_INSPECTOR_NOT_AVAILABLE';

      return;

    }


    let result;


    try {

      result =
        window
          .inspectLastForecastSchema03D59();

    } catch (error) {

      output.textContent =
        'LAST_FORECAST SCHEMA INSPECTOR V1\n' +
        '========================\n' +
        'Ready: NO ❌\n' +
        'Reason: INSPECTOR_EXECUTION_FAILED\n' +
        'Error: ' +
        (
          error &&
          error.message
            ? error.message
            : String(error)
        );

      return;

    }


    output.textContent =
      formatResult03D59(
        result
      );

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function installPanel03D59() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      [
        'margin:24px',
        'padding:24px',
        'border:1px solid rgba(103,232,249,.35)',
        'border-radius:26px',
        'background:rgba(20,24,48,.92)',
        'color:#f8fafc',
        'box-sizing:border-box'
      ].join(';');


    const title =
      document.createElement(
        'h2'
      );


    title.textContent =
      '🧬 LAST_FORECAST Schema Inspector V1';


    title.style.cssText =
      [
        'margin:0 0 12px 0',
        'font-size:24px',
        'line-height:1.25'
      ].join(';');


    const description =
      document.createElement(
        'div'
      );


    description.textContent =
      'Đọc schema thật của CURRENT LAST_FORECAST · Province + G1→G8 · READ ONLY · ZERO WRITE';


    description.style.cssText =
      [
        'opacity:.78',
        'font-size:16px',
        'line-height:1.5',
        'margin-bottom:20px'
      ].join(';');


    const button =
      document.createElement(
        'button'
      );


    button.id =
      BUTTON_ID;


    button.type =
      'button';


    button.textContent =
      '🧬 Inspect LAST_FORECAST Schema';


    button.style.cssText =
      [
        'width:100%',
        'padding:18px 14px',
        'border:0',
        'border-radius:20px',
        'font-size:18px',
        'font-weight:800',
        'cursor:pointer',
        'background:linear-gradient(90deg,#67e8f9,#a78bfa)',
        'color:#111827'
      ].join(';');


    const output =
      document.createElement(
        'pre'
      );


    output.id =
      OUTPUT_ID;


    output.textContent =
      'Chưa chạy kiểm tra.';


    output.style.cssText =
      [
        'margin:20px 0 0 0',
        'padding:18px',
        'border-radius:18px',
        'background:rgba(5,8,24,.72)',
        'white-space:pre-wrap',
        'overflow-wrap:anywhere',
        'word-break:break-word',
        'font-size:14px',
        'line-height:1.55',
        'max-height:70vh',
        'overflow:auto'
      ].join(';');


    button.addEventListener(
      'click',
      runMobile03D59
    );


    panel.appendChild(
      title
    );

    panel.appendChild(
      description
    );

    panel.appendChild(
      button
    );

    panel.appendChild(
      output
    );


    /*
     * Prefer Settings content if identifiable.
     * Otherwise insert before bottom navigation/body end.
     */

    const settings =
      document.querySelector(
        '#settings'
      ) ||
      document.querySelector(
        '#settingsTab'
      ) ||
      document.querySelector(
        '[data-tab="settings"]'
      ) ||
      document.querySelector(
        '.settings'
      );


    if (settings) {

      settings.appendChild(
        panel
      );

    } else {

      document.body.appendChild(
        panel
      );

    }

  }


  /*
   * =========================================================
   * INSTALL
   * =========================================================
   */

  function boot03D59() {

    installPanel03D59();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot03D59
    );

  } else {

    boot03D59();

  }


  window
    .runLastForecastSchemaInspectorMobile03D59 =
    runMobile03D59;


  window
    .FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_MOBILE_V1_LOADED =
    true;


  window
    .FIX03D59_LAST_FORECAST_SCHEMA_INSPECTOR_MOBILE_V1_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 LAST_FORECAST Schema Inspector Mobile V1 loaded'
  );

})();
