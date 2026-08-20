/* =========================================================================
   FIX-03D5.9 — PRODUCTION FORECAST SHADOW INSPECTOR
   FILE:
   modules/fix-03d5-9-shadow-inspector.js

   PURPOSE:
   - Inspect the current Production Forecast structure.
   - Inspect candidate province/prize sources.
   - Detect stale 4-province shadow/test mappings.
   - READ ONLY.
   - ZERO WRITE.
   - NEVER modifies LAST_FORECAST.
   - NEVER calls savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const INSPECTOR_ID =
    'fix03d59-shadow-inspector';


  function safeValue(
    value
  ) {

    if (
      value === undefined
    ) {

      return '[undefined]';

    }


    if (
      value === null
    ) {

      return '[null]';

    }


    if (
      typeof value ===
      'function'
    ) {

      return '[function]';

    }


    try {

      return JSON.stringify(
        value,
        null,
        2
      );

    } catch (
      error
    ) {

      return String(
        value
      );

    }

  }


  function getSelectedProvince() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return select.value;

      }

    } catch (
      error
    ) {

      // READ ONLY
    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
        'undefined'
      ) {

        return SELECTED_PROVINCE;

      }

    } catch (
      error
    ) {

      // READ ONLY
    }


    return null;

  }


  function getForecast() {

    try {

      if (
        typeof LAST_FORECAST !==
        'undefined'
      ) {

        return LAST_FORECAST;

      }

    } catch (
      error
    ) {

      // Continue.
    }


    try {

      if (
        window.LAST_FORECAST !==
        undefined
      ) {

        return window.LAST_FORECAST;

      }

    } catch (
      error
    ) {

      // Continue.
    }


    return null;

  }


  function getObjectSummary(
    obj
  ) {

    if (
      !obj ||
      typeof obj !==
        'object'
    ) {

      return {

        type:
          typeof obj,

        keys: []

      };

    }


    return {

      type:
        Array.isArray(
          obj
        )
          ? 'array'
          : 'object',

      keys:
        Object.keys(
          obj
        )

    };

  }


  function findProvinceValues(
    root
  ) {

    const found =
      [];


    const visited =
      new WeakSet();


    function walk(
      value,
      path,
      depth
    ) {

      if (
        depth > 7
      ) {

        return;

      }


      if (
        !value ||
        typeof value !==
          'object'
      ) {

        return;

      }


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


      Object.keys(
        value
      ).forEach(
        key => {

          let child;


          try {

            child =
              value[
                key
              ];

          } catch (
            error
          ) {

            return;

          }


          const childPath =
            path
              ? path +
                '.' +
                key
              : key;


          const lowerKey =
            String(
              key
            ).toLowerCase();


          if (
            lowerKey.includes(
              'province'
            )
          ) {

            found.push({

              path:
                childPath,

              value:
                (
                  child &&
                  typeof child ===
                    'object'
                )
                  ? safeValue(
                      child
                    )
                  : String(
                      child
                    )

            });

          }


          if (
            child &&
            typeof child ===
              'object'
          ) {

            walk(
              child,
              childPath,
              depth + 1
            );

          }

        }
      );

    }


    if (
      root &&
      typeof root ===
        'object'
    ) {

      walk(
        root,
        'LAST_FORECAST',
        0
      );

    }


    return found;

  }


  function detectLegacyProvince(
    value
  ) {

    const legacy =
      [
        'tp-hcm',
        'tphcm',
        'tay-ninh',
        'tien-giang',
        'binh-duong'
      ];


    const text =
      String(
        value || ''
      ).toLowerCase();


    return legacy.some(
      slug =>
        text.includes(
          slug
        )
    );

  }


  function inspectShadow() {

    const selectedProvince =
      getSelectedProvince();


    const forecast =
      getForecast();


    const summary =
      getObjectSummary(
        forecast
      );


    const provinceValues =
      findProvinceValues(
        forecast
      );


    const suspicious =
      provinceValues.filter(
        item =>
          detectLegacyProvince(
            item.value
          )
      );


    return {

      timestamp:
        new Date()
          .toISOString(),

      selectedProvince:
        selectedProvince,

      forecastExists:
        Boolean(
          forecast
        ),

      forecastType:
        summary.type,

      forecastKeys:
        summary.keys,

      provinceValues:
        provinceValues,

      suspiciousLegacyMappings:
        suspicious,

      suspiciousCount:
        suspicious.length,

      forecast:
        forecast

    };

  }


  function escapeHtml(
    value
  ) {

    return String(
      value ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }


  function renderResult(
    result,
    output
  ) {

    const provinceRows =
      result.provinceValues
        .map(
          item => `

            <div
              style="
                padding:12px;
                margin-top:10px;
                border-radius:12px;
                background:rgba(255,255,255,.06);
              "
            >

              <div>
                <b>
                  ${escapeHtml(
                    item.path
                  )}
                </b>
              </div>

              <div
                style="
                  margin-top:6px;
                  word-break:break-word;
                  color:#c6cae7;
                "
              >
                ${escapeHtml(
                  item.value
                )}
              </div>

            </div>

          `
        )
        .join(
          ''
        );


    output.innerHTML = `

      <div
        style="
          margin-top:18px;
          padding:16px;
          border-radius:16px;
          background:rgba(0,0,0,.14);
          line-height:1.6;
        "
      >

        <div>
          Selected Province:
          <b>
            ${escapeHtml(
              result.selectedProvince ||
              '--'
            )}
          </b>
        </div>

        <div>
          Forecast Exists:
          <b>
            ${
              result.forecastExists
                ? 'YES ✅'
                : 'NO ❌'
            }
          </b>
        </div>

        <div>
          Forecast Type:
          <b>
            ${escapeHtml(
              result.forecastType
            )}
          </b>
        </div>

        <div>
          Province Fields Found:
          <b>
            ${result.provinceValues.length}
          </b>
        </div>

        <div>
          Legacy/Test Province Matches:
          <b>
            ${result.suspiciousCount}
          </b>
        </div>


        <div
          style="
            margin-top:14px;
            font-weight:800;
            color:#ffbd3c;
          "
        >
          FORECAST ROOT KEYS
        </div>

        <div
          style="
            margin-top:7px;
            word-break:break-word;
            color:#c6cae7;
          "
        >
          ${escapeHtml(
            result.forecastKeys.join(
              ', '
            ) ||
            '[none]'
          )}
        </div>


        <div
          style="
            margin-top:18px;
            font-weight:800;
            color:#ffbd3c;
          "
        >
          PROVINCE PATHS
        </div>

        ${
          provinceRows ||
          `
            <div
              style="
                margin-top:8px;
                color:#c6cae7;
              "
            >
              Không tìm thấy field chứa chữ
              "province" trong LAST_FORECAST.
            </div>
          `
        }


        <div
          style="
            margin-top:18px;
            padding:12px;
            border-radius:12px;
            background:rgba(52,211,153,.10);
            color:#dfffee;
            font-weight:700;
          "
        >
          🔒 READ ONLY · ZERO WRITE
        </div>

      </div>

    `;

  }


  function buildInspector() {

    if (
      document.getElementById(
        INSPECTOR_ID
      )
    ) {

      return;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (
      !settings
    ) {

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      INSPECTOR_ID;


    panel.className =
      'card';


    panel.style.marginTop =
      '18px';


    panel.innerHTML = `

      <h2>
        🕵️ PRODUCTION SHADOW INSPECTOR
      </h2>

      <p class="sub">
        Kiểm tra cấu trúc Production Forecast
        và tìm dấu vết mapping 4 tỉnh test cũ.
      </p>


      <button
        type="button"
        id="fix03d59-shadow-inspector-button"
        class="btn-primary"
      >
        🕵️ RUN SHADOW INSPECTOR
      </button>


      <div
        id="fix03d59-shadow-inspector-output"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-shadow-inspector-button'
      );


    const output =
      document.getElementById(
        'fix03d59-shadow-inspector-output'
      );


    button.addEventListener(
      'click',
      function () {

        const result =
          inspectShadow();


        window
          .LAST_FIX03D59_SHADOW_INSPECTION =
          result;


        renderResult(
          result,
          output
        );

      }
    );

  }


  window.inspectProductionShadow03D59 =
    inspectShadow;


  window.FIX03D59_SHADOW_INSPECTOR_LOADED =
    true;


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildInspector
    );

  } else {

    buildInspector();

  }

})();

