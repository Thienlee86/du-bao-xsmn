/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   FINAL MOBILE LIFECYCLE TEST — DIV CONTROL BUILD

   PURPOSE:
   - Verify 8.4F-L Lifecycle Gate.
   - Verify Read-Only Bridge.
   - Invoke 8.4F-LH Lifecycle Hook.
   - Diagnose 8.4F Mapping Preview.
   - Avoid native BUTTON elements completely.

   SAFETY:
   - Never create or modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().
   - Never write production/storage.

   TEST ONLY
   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText84FL(value) {

    return String(
      value ?? '--'
    );

  }


  function yesNo84FL(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function createLine84FL(
    label,
    value
  ) {

    const row =
      document.createElement('div');

    row.style.marginBottom =
      '7px';


    const labelSpan =
      document.createElement('span');

    labelSpan.textContent =
      label + ': ';


    const valueStrong =
      document.createElement('strong');

    valueStrong.textContent =
      safeText84FL(value);


    row.appendChild(labelSpan);
    row.appendChild(valueStrong);

    return row;

  }


  /* =========================================================
     CONTROL
     ========================================================= */

  function createControl84FL(
    id,
    text,
    handler
  ) {

    const control =
      document.createElement('div');


    control.id =
      id;


    control.setAttribute(
      'role',
      'button'
    );


    control.setAttribute(
      'tabindex',
      '0'
    );


    control.textContent =
      text;


    /*
     * Inline style deliberately isolates the diagnostic
     * control from the application's button CSS.
     */

    control.style.cssText = [
      'display:flex',
      'width:100%',
      'min-height:58px',
      'margin-top:16px',
      'padding:15px 14px',
      'border-radius:16px',
      'background:linear-gradient(90deg,#ffc13d,#ff963d)',
      'color:#17182a',
      'font-size:16px',
      'font-weight:900',
      'align-items:center',
      'justify-content:center',
      'text-align:center',
      'box-sizing:border-box',
      'cursor:pointer',
      'visibility:visible',
      'opacity:1',
      'position:relative',
      'z-index:100'
    ].join(';');


    control.addEventListener(
      'click',
      handler
    );


    control.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          handler();

        }

      }
    );


    return control;

  }


  /* =========================================================
     LIFECYCLE TEST
     ========================================================= */

  function runLifecycleTest84FL() {

    const output =
      document.getElementById(
        'fix03d59-84fl-test-output'
      );


    if (!output) {

      return;

    }


    output.replaceChildren();


    const inspector =
      window
        .inspectProductionForecastLifecycle84FL;


    if (
      typeof inspector !==
      'function'
    ) {

      output.appendChild(
        createLine84FL(
          'Lifecycle Gate',
          'NOT AVAILABLE ❌'
        )
      );

      return;

    }


    let lifecycle;


    try {

      lifecycle =
        inspector();

    } catch (error) {

      output.appendChild(
        createLine84FL(
          'Lifecycle Gate Error',
          error?.message ||
          String(error)
        )
      );

      return;

    }


    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    const hookLoaded =
      window
        .FIX03D59_STEP84FLH_HOOK_LOADED ===
      true;


    const hookInspector =
      window
        .inspectLifecycle84FLH;


    let hookResult =
      null;


    if (
      typeof hookInspector ===
      'function'
    ) {

      try {

        hookResult =
          hookInspector();

      } catch (error) {

        hookResult = {

          ready: false,
          passed: false,

          reason:
            'TEST_HOOK_EXCEPTION',

          stageReason:
            error?.message ||
            String(error),

          writeAuthorized: false,
          productionWrite: false,
          storageWrite: false,
          integrationPerformed: false,

          savePredictionCalled: false,

          forecastCreated: false,
          forecastModified: false,
          candidateModified: false,

          readOnly: true,
          failClosed: true

        };

      }

    }


    const lifecycleSafe =
      Boolean(
        lifecycle &&
        lifecycle.writeAuthorized === false &&
        lifecycle.productionWrite === false &&
        lifecycle.storageWrite === false &&
        lifecycle.integrationPerformed === false &&
        lifecycle.savePredictionCalled === false &&
        lifecycle.forecastCreated === false &&
        lifecycle.forecastModified === false &&
        lifecycle.candidateModified === false &&
        lifecycle.readOnly === true &&
        lifecycle.failClosed === true
      );


    const hookSafe =
      !hookResult ||
      Boolean(
        hookResult.writeAuthorized === false &&
        hookResult.productionWrite === false &&
        hookResult.storageWrite === false &&
        hookResult.integrationPerformed === false &&
        hookResult.savePredictionCalled === false &&
        hookResult.forecastCreated === false &&
        hookResult.forecastModified === false &&
        hookResult.candidateModified === false &&
        hookResult.readOnly === true &&
        hookResult.failClosed === true
      );


    const lines = [

      [
        'Lifecycle State',
        lifecycle?.lifecycleState
      ],

      [
        'Lifecycle Reason',
        lifecycle?.reason
      ],

      [
        'Forecast Exists',
        yesNo84FL(
          lifecycle?.forecastExists
        )
      ],

      [
        'Forecast Valid',
        yesNo84FL(
          lifecycle?.forecastValid
        )
      ],

      [
        'Mapping Preview Exists',
        yesNo84FL(
          lifecycle?.mappingPreviewExists
        )
      ],

      [
        'Mapping Ready',
        yesNo84FL(
          lifecycle?.mappingReady
        )
      ],

      [
        'Bridge Exists',
        yesNo84FL(
          Boolean(bridge)
        )
      ],

      [
        'Province',
        bridge?.forecastProvince
      ],

      [
        'Window Size',
        bridge?.forecastWindowSize
      ],

      [
        'Prize Count',
        bridge?.forecastPrizeCount
      ],

      [
        'Hook Script Loaded',
        yesNo84FL(
          hookLoaded
        )
      ],

      [
        'Hook Inspector',
        yesNo84FL(
          typeof hookInspector ===
          'function'
        )
      ],

      [
        'Hook Passed',
        yesNo84FL(
          hookResult?.passed
        )
      ],

      [
        'Hook Reason',
        hookResult?.reason ||
        'NOT AVAILABLE'
      ],

      [
        'Failed Stage',
        hookResult?.failedStage
      ],

      [
        'Stage Reason',
        hookResult?.stageReason
      ],

      [
        'Lifecycle Safety',
        yesNo84FL(
          lifecycleSafe
        )
      ],

      [
        'Hook Safety',
        yesNo84FL(
          hookSafe
        )
      ]

    ];


    lines.forEach(
      function (item) {

        output.appendChild(
          createLine84FL(
            item[0],
            item[1]
          )
        );

      }
    );


    const final =
      document.createElement('div');


    final.style.marginTop =
      '16px';

    final.style.padding =
      '14px';

    final.style.borderRadius =
      '14px';

    final.style.fontWeight =
      '900';


    if (
      lifecycleSafe &&
      hookSafe
    ) {

      final.style.background =
        'rgba(45,200,120,.15)';

      final.textContent =
        '🔒 SAFETY LOCKS VERIFIED — ZERO WRITE';

    } else {

      final.style.background =
        'rgba(255,80,80,.15)';

      final.textContent =
        '⚠️ SAFETY LOCK CHECK FAILED';

    }


    output.appendChild(final);

  }


  /* =========================================================
     8.4F MAPPING DIAGNOSIS
     ========================================================= */

  function runMappingDiagnosisUI84F() {

    const output =
      document.getElementById(
        'fix03d59-84f-diagnosis-output'
      );


    if (!output) {

      return;

    }


    output.replaceChildren();


    const result =
      window
        .LAST_FIX03D59_STEP84F ||
      null;


    if (!result) {

      output.appendChild(
        createLine84FL(
          '8.4F',
          'LAST_FIX03D59_STEP84F NOT AVAILABLE ❌'
        )
      );

      return;

    }


    const mappings =
      Array.isArray(
        result.mappings
      )
        ? result.mappings
        : [];


    const failed =
      mappings.filter(
        item =>
          item.mappingValid !== true
      );


    const summary = [

      [
        'Passed',
        yesNo84FL(
          result.passed
        )
      ],

      [
        'Reason',
        result.reason
      ],

      [
        'Expected Count',
        result.expectedCount
      ],

      [
        'Mapping Count',
        result.mappingCount
      ],

      [
        'Counts Match',
        yesNo84FL(
          result.countsMatch
        )
      ],

      [
        'All Mappings Valid',
        yesNo84FL(
          result.allMappingsValid
        )
      ],

      [
        'Failed Mappings',
        failed.length
      ]

    ];


    summary.forEach(
      function (item) {

        output.appendChild(
          createLine84FL(
            item[0],
            item[1]
          )
        );

      }
    );


    mappings.forEach(
      function (
        item,
        index
      ) {

        const box =
          document.createElement('div');


        box.style.marginTop =
          '14px';

        box.style.padding =
          '14px';

        box.style.borderRadius =
          '14px';

        box.style.background =
          item.mappingValid === true
            ? 'rgba(45,200,120,.10)'
            : 'rgba(255,80,80,.13)';


        const title =
          document.createElement('div');


        title.style.fontWeight =
          '900';

        title.style.marginBottom =
          '8px';


        title.textContent =
          (
            item.mappingValid === true
              ? '✅ '
              : '❌ '
          ) +
          'Mapping ' +
          (index + 1) +
          ' · ' +
          safeText84FL(
            item.prize ||
            item.forecastPrizeKey
          );


        box.appendChild(title);


        const details = [

          [
            'Mapping Index',
            item.mappingIndex
          ],

          [
            'Province',
            item.province
          ],

          [
            'Forecast Province',
            item.forecastProvince
          ],

          [
            'Forecast Prize',
            item.forecastPrizeKey
          ],

          [
            'Number Count',
            item.productionNumberCount
          ],

          [
            'Province Match',
            yesNo84FL(
              item.provinceMatch
            )
          ],

          [
            'Prize Meta Valid',
            yesNo84FL(
              item.prizeMetaValid
            )
          ],

          [
            'Forecast Item Valid',
            yesNo84FL(
              item.forecastItemValid
            )
          ],

          [
            'Number Schema Valid',
            yesNo84FL(
              item.numberSchemaValid
            )
          ],

          [
            'Mapping Valid',
            yesNo84FL(
              item.mappingValid
            )
          ]

        ];


        details.forEach(
          function (detail) {

            box.appendChild(
              createLine84FL(
                detail[0],
                detail[1]
              )
            );

          }
        );


        output.appendChild(box);

      }
    );

  }


  /* =========================================================
     BUILD UI
     ========================================================= */

  function buildLifecycleTestUI84FL() {

    [
      'fix03d59-84fl-test-panel',
      'fix03d59-84f-diagnosis-panel',
      'fix03d59-84fl-master-panel'
    ].forEach(
      function (id) {

        const old =
          document.getElementById(id);


        if (old) {

          old.remove();

        }

      }
    );


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'FIX-03D5.9: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement('section');


    panel.id =
      'fix03d59-84fl-master-panel';


    panel.style.cssText = [
      'margin:18px 24px 30px',
      'padding:22px',
      'border-radius:28px',
      'background:linear-gradient(145deg,#242d67,#1b214b)',
      'border:1px solid rgba(255,193,61,.35)',
      'color:#ffffff',
      'box-sizing:border-box'
    ].join(';');


    /*
     * TITLE
     */

    const title =
      document.createElement('h3');


    title.textContent =
      '🧪 FIX-03D5.9 FINAL TEST';


    title.style.cssText =
      'margin:0 0 8px;font-size:24px;font-weight:900;';


    panel.appendChild(title);


    const description =
      document.createElement('div');


    description.textContent =
      'Production Forecast Lifecycle';


    description.style.cssText =
      'opacity:.72;margin-bottom:6px;';


    panel.appendChild(description);


    const path =
      document.createElement('div');


    path.textContent =
      '8.4F-L Gate → Read-Only Bridge → 8.4F-LH Hook → 8.4F Mapping Diagnosis';


    path.style.cssText =
      'opacity:.72;line-height:1.55;margin-bottom:10px;';


    panel.appendChild(path);


    const safety =
      document.createElement('div');


    safety.textContent =
      'READ ONLY · ZERO WRITE · FAIL CLOSED';


    safety.style.cssText =
      'opacity:.72;margin-bottom:18px;';


    panel.appendChild(safety);


    /*
     * CONTROL 1
     */

    const lifecycleControl =
      createControl84FL(
        'fix03d59-84fl-test-control',
        '🧪 RUN FINAL LIFECYCLE TEST',
        runLifecycleTest84FL
      );


    panel.appendChild(
      lifecycleControl
    );


    /*
     * OUTPUT 1
     */

    const lifecycleOutput =
      document.createElement('div');


    lifecycleOutput.id =
      'fix03d59-84fl-test-output';


    lifecycleOutput.style.cssText =
      'margin-top:16px;line-height:1.6;font-size:13px;';


    panel.appendChild(
      lifecycleOutput
    );


    /*
     * DIVIDER
     */

    const divider =
      document.createElement('div');


    divider.style.cssText =
      'height:1px;background:rgba(255,255,255,.12);margin:24px 0 18px;';


    panel.appendChild(divider);


    /*
     * DIAGNOSIS
     */

    const diagnosisTitle =
      document.createElement('div');


    diagnosisTitle.textContent =
      '🔎 8.4F MAPPING DIAGNOSIS';


    diagnosisTitle.style.cssText =
      'font-size:18px;font-weight:900;margin-bottom:8px;';


    panel.appendChild(
      diagnosisTitle
    );


    const diagnosisDescription =
      document.createElement('div');


    diagnosisDescription.textContent =
      'Kiểm tra chính xác mapping nào đang làm Production Forecast Mapping Preview thất bại.';


    diagnosisDescription.style.cssText =
      'opacity:.72;line-height:1.55;';


    panel.appendChild(
      diagnosisDescription
    );


    /*
     * CONTROL 2
     */

    const diagnosisControl =
      createControl84FL(
        'fix03d59-84f-diagnosis-control',
        '🔎 RUN 8.4F MAPPING DIAGNOSIS',
        runMappingDiagnosisUI84F
      );


    panel.appendChild(
      diagnosisControl
    );


    /*
     * OUTPUT 2
     */

    const diagnosisOutput =
      document.createElement('div');


    diagnosisOutput.id =
      'fix03d59-84f-diagnosis-output';


    diagnosisOutput.style.cssText =
      'margin-top:16px;line-height:1.6;font-size:13px;';


    panel.appendChild(
      diagnosisOutput
    );


    /*
     * INSERT PANEL
     */

    settings.appendChild(panel);


    window
      .FIX03D59_FINAL_TEST_DOM_STATUS = {

        version:
          'DIV-CONTROL-1',

        panelExists:
          Boolean(
            document.getElementById(
              'fix03d59-84fl-master-panel'
            )
          ),

        lifecycleControlExists:
          Boolean(
            document.getElementById(
              'fix03d59-84fl-test-control'
            )
          ),

        diagnosisControlExists:
          Boolean(
            document.getElementById(
              'fix03d59-84f-diagnosis-control'
            )
          ),

        readOnly:
          true,

        writeAuthorized:
          false

      };


    console.log(
      'FIX-03D5.9 DIV CONTROL UI BUILT',
      window.FIX03D59_FINAL_TEST_DOM_STATUS
    );

  }


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize84FLTest() {

    window.setTimeout(
      buildLifecycleTestUI84FL,
      300
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize84FLTest,
      {
        once: true
      }
    );

  } else {

    initialize84FLTest();

  }


  /*
   * PUBLIC READ-ONLY DIAGNOSTIC API
   */

  window.runLifecycleTest84FL =
    runLifecycleTest84FL;


  window.runMappingDiagnosisUI84F =
    runMappingDiagnosisUI84F;


  window.rebuildLifecycleTestUI84FL =
    buildLifecycleTestUI84FL;


  window.FIX03D59_FINAL_TEST_UI_LOADED =
    true;


  console.log(
    'FIX-03D5.9 FINAL TEST DIV-CONTROL-1 loaded / READ ONLY / ZERO WRITE'
  );

})();

/* =========================================================================
   FIX-03D5.9 — MOBILE SHADOW STORE INSPECTOR

   PURPOSE:
   - Inspect current Shadow Snapshot Store directly on mobile.
   - Display province / prize / snapshot information.
   - READ ONLY.
   - ZERO WRITE.
   - Never modify snapshots.
   - Never modify production forecast.
   ========================================================================= */

(function () {

  'use strict';


  function safeShadowText(value) {

    return String(
      value ?? '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }


  function runMobileShadowInspector() {

    const output =
      document.getElementById(
        'fix03d59-shadow-store-output'
      );


    if (!output) {

      return;

    }


    if (
      typeof window.readShadowSnapshotsV26 !==
      'function'
    ) {

      output.innerHTML = `
        <div class="fix84fl-error">

          ❌ Không tìm thấy
          <b>readShadowSnapshotsV26()</b>.

          <br><br>

          Shadow Snapshot Engine chưa sẵn sàng.

        </div>
      `;

      return;

    }


    let snapshots;


    try {

      snapshots =
        window.readShadowSnapshotsV26();

    } catch (error) {

      output.innerHTML = `
        <div class="fix84fl-error">

          ❌ Không đọc được Shadow Store.

          <br><br>

          ${safeShadowText(
            error?.message || error
          )}

        </div>
      `;

      return;

    }


    if (
      !Array.isArray(snapshots)
    ) {

      output.innerHTML = `
        <div class="fix84fl-error">

          ❌ Shadow Store không trả về Array.

        </div>
      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * GROUP BY PROVINCE
     * ---------------------------------------------------------
     */

    const provinceMap = {};


    snapshots.forEach(
      snapshot => {

        const province =
          snapshot?.province ||
          snapshot?.provinceSlug ||
          'UNKNOWN';


        if (!provinceMap[province]) {

          provinceMap[province] = {

            province,

            count: 0,

            prizes: new Set()

          };

        }


        provinceMap[province].count++;


        const prize =
          snapshot?.prize ||
          snapshot?.giaiKey ||
          snapshot?.prizeKey ||
          null;


        if (prize) {

          provinceMap[
            province
          ].prizes.add(
            prize
          );

        }

      }
    );


    const provinces =
      Object.values(
        provinceMap
      )
        .sort(
          (a, b) =>
            String(a.province)
              .localeCompare(
                String(b.province)
              )
        );


    let html = `

      <div class="fix84fl-result">

        <div class="fix84fl-section-label">

          🔍 SHADOW STORE SUMMARY

        </div>


        <div class="fix84fl-locks">

          <div>

            Total Snapshots:

            <b>
              ${snapshots.length}
            </b>

          </div>


          <div>

            Provinces Found:

            <b>
              ${provinces.length}
            </b>

          </div>

        </div>

      </div>

    `;


    if (
      snapshots.length === 0
    ) {

      html += `

        <div class="fix84fl-warning">

          ⚠️ Shadow Store hiện đang rỗng.

        </div>

      `;

    }


    provinces.forEach(
      (item, index) => {

        html += `

          <div class="fix84fl-mapping-ok">

            <div class="fix84fl-mapping-title">

              ${index + 1}.
              ${safeShadowText(
                item.province
              )}

            </div>


            <div>

              Snapshots:

              <b>
                ${item.count}
              </b>

            </div>


            <div>

              Prizes:

              <b>
                ${
                  item.prizes.size
                    ? safeShadowText(
                        Array.from(
                          item.prizes
                        ).join(', ')
                      )
                    : '--'
                }
              </b>

            </div>

          </div>

        `;

      }
    );


    html += `

      <div class="fix84fl-safe">

        🔒 READ ONLY — ZERO WRITE

        <br>

        Không snapshot nào được sửa hoặc xóa.

      </div>

    `;


    output.innerHTML =
      html;

  }


  function buildMobileShadowInspector() {

    if (
      document.getElementById(
        'fix03d59-shadow-store-panel'
      )
    ) {

      return;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'fix03d59-shadow-store-panel';


    panel.innerHTML = `

      <div
        style="
          margin:18px 0 30px;
          padding:18px;
          border-radius:20px;
          background:#20264f;
          color:white;
        "
      >

        <h3 style="margin-top:0;">

          🔍 SHADOW STORE INSPECTOR

        </h3>


        <div
          style="
            opacity:.72;
            font-size:13px;
            line-height:1.5;
          "
        >

          Kiểm tra dữ liệu Shadow Snapshot
          hiện đang lưu trên điện thoại.

          <br>

          READ ONLY · ZERO WRITE

        </div>


        <button
          id="fix03d59-shadow-store-button"
          type="button"
          style="
            display:block;
            width:100%;
            min-height:52px;
            margin-top:16px;
            border:0;
            border-radius:14px;
            background:#ffbd3c;
            color:#17192f;
            font-size:15px;
            font-weight:900;
          "
        >

          🔍 KIỂM TRA SHADOW STORE

        </button>


        <div
          id="fix03d59-shadow-store-output"
        ></div>

      </div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-shadow-store-button'
      );


    if (button) {

      button.addEventListener(
        'click',
        runMobileShadowInspector
      );

    }

  }


  /*
   * File 3 đang được load cuối app.js,
   * nhưng vẫn hỗ trợ cả hai trạng thái DOM.
   */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildMobileShadowInspector
    );

  } else {

    buildMobileShadowInspector();

  }


  window.runMobileShadowInspector =
    runMobileShadowInspector;


  console.log(
    'FIX-03D5.9 Mobile Shadow Store Inspector loaded / READ ONLY / ZERO WRITE'
  );

})();

