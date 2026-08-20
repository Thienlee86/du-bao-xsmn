/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   FINAL MOBILE LIFECYCLE TEST — STABLE DOM BUILD

   PURPOSE:
   - Verify 8.4F-L Lifecycle Gate.
   - Verify Read-Only Bridge.
   - Invoke 8.4F-LH Lifecycle Hook.
   - Diagnose 8.4F Mapping Preview.
   - Build mobile controls using direct DOM creation.

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


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

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
      document.createElement(
        'div'
      );


    row.style.marginBottom =
      '7px';


    const labelSpan =
      document.createElement(
        'span'
      );


    labelSpan.textContent =
      label + ': ';


    const valueStrong =
      document.createElement(
        'strong'
      );


    valueStrong.textContent =
      safeText84FL(
        value
      );


    row.appendChild(
      labelSpan
    );


    row.appendChild(
      valueStrong
    );


    return row;

  }


  /*
   * =========================================================
   * PANEL STYLING
   * =========================================================
   */

  function applyPanelStyle84FL(
    panel
  ) {

    panel.style.margin =
      '18px 24px 30px';


    panel.style.padding =
      '22px';


    panel.style.borderRadius =
      '28px';


    panel.style.background =
      'linear-gradient(145deg,#242d67,#1b214b)';


    panel.style.border =
      '1px solid rgba(255,193,61,.35)';


    panel.style.color =
      '#ffffff';


    panel.style.boxSizing =
      'border-box';

  }


  function applyButtonStyle84FL(
    button
  ) {

    button.style.display =
      'block';


    button.style.width =
      '100%';


    button.style.minHeight =
      '56px';


    button.style.marginTop =
      '14px';


    button.style.padding =
      '15px 12px';


    button.style.border =
      '0';


    button.style.borderRadius =
      '16px';


    button.style.background =
      'linear-gradient(90deg,#ffc13d,#ff9a3d)';


    button.style.color =
      '#17182a';


    button.style.fontSize =
      '16px';


    button.style.fontWeight =
      '900';


    button.style.textAlign =
      'center';


    button.style.cursor =
      'pointer';


    button.style.visibility =
      'visible';


    button.style.opacity =
      '1';


    button.style.position =
      'relative';


    button.style.zIndex =
      '10';

  }


  /*
   * =========================================================
   * FINAL LIFECYCLE TEST
   * =========================================================
   */

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
      document.createElement(
        'div'
      );


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


    output.appendChild(
      final
    );

  }


  /*
   * =========================================================
   * 8.4F MAPPING DIAGNOSIS
   * =========================================================
   */

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


    output.appendChild(
      createLine84FL(
        'Passed',
        yesNo84FL(
          result.passed
        )
      )
    );


    output.appendChild(
      createLine84FL(
        'Reason',
        result.reason
      )
    );


    output.appendChild(
      createLine84FL(
        'Expected Count',
        result.expectedCount
      )
    );


    output.appendChild(
      createLine84FL(
        'Mapping Count',
        result.mappingCount
      )
    );


    output.appendChild(
      createLine84FL(
        'Counts Match',
        yesNo84FL(
          result.countsMatch
        )
      )
    );


    output.appendChild(
      createLine84FL(
        'All Mappings Valid',
        yesNo84FL(
          result.allMappingsValid
        )
      )
    );


    output.appendChild(
      createLine84FL(
        'Failed Mappings',
        failed.length
      )
    );


    mappings.forEach(
      function (
        item,
        index
      ) {

        const box =
          document.createElement(
            'div'
          );


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
          document.createElement(
            'div'
          );


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


        box.appendChild(
          title
        );


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


        output.appendChild(
          box
        );

      }
    );

  }


  /*
   * =========================================================
   * BUILD PANEL
   * =========================================================
   */

  function buildLifecycleTestUI84FL() {

    /*
     * Remove any old diagnostic panels first.
     */

    [
      'fix03d59-84fl-test-panel',
      'fix03d59-84f-diagnosis-panel',
      'fix03d59-84fl-master-panel'
    ].forEach(
      function (id) {

        const old =
          document.getElementById(
            id
          );


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


    /*
     * ---------------------------------------------------------
     * MASTER PANEL
     * ---------------------------------------------------------
     */

    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      'fix03d59-84fl-master-panel';


    applyPanelStyle84FL(
      panel
    );


    /*
     * TITLE
     */

    const title =
      document.createElement(
        'h3'
      );


    title.textContent =
      '🧪 FIX-03D5.9 FINAL TEST';


    title.style.margin =
      '0 0 8px';


    title.style.fontSize =
      '24px';


    panel.appendChild(
      title
    );


    /*
     * DESCRIPTION
     */

    const description =
      document.createElement(
        'div'
      );


    description.textContent =
      'Production Forecast Lifecycle';


    description.style.opacity =
      '.72';


    description.style.marginBottom =
      '6px';


    panel.appendChild(
      description
    );


    const path =
      document.createElement(
        'div'
      );


    path.textContent =
      '8.4F-L Gate → Read-Only Bridge → 8.4F-LH Hook → 8.4F Mapping Diagnosis';


    path.style.opacity =
      '.72';


    path.style.lineHeight =
      '1.55';


    path.style.marginBottom =
      '10px';


    panel.appendChild(
      path
    );


    const safety =
      document.createElement(
        'div'
      );


    safety.textContent =
      'READ ONLY · ZERO WRITE · FAIL CLOSED';


    safety.style.opacity =
      '.72';


    safety.style.marginBottom =
      '18px';


    panel.appendChild(
      safety
    );


    /*
     * ---------------------------------------------------------
     * BUTTON 1
     * ---------------------------------------------------------
     */

    const lifecycleButton =
      document.createElement(
        'button'
      );


    lifecycleButton.id =
      'fix03d59-84fl-test-button';


    lifecycleButton.type =
      'button';


    lifecycleButton.textContent =
      '🧪 RUN FINAL LIFECYCLE TEST';


    applyButtonStyle84FL(
      lifecycleButton
    );


    lifecycleButton.addEventListener(
      'click',
      runLifecycleTest84FL
    );


    panel.appendChild(
      lifecycleButton
    );


    /*
     * OUTPUT 1
     */

    const lifecycleOutput =
      document.createElement(
        'div'
      );


    lifecycleOutput.id =
      'fix03d59-84fl-test-output';


    lifecycleOutput.style.marginTop =
      '16px';


    lifecycleOutput.style.lineHeight =
      '1.6';


    lifecycleOutput.style.fontSize =
      '13px';


    panel.appendChild(
      lifecycleOutput
    );


    /*
     * ---------------------------------------------------------
     * DIVIDER
     * ---------------------------------------------------------
     */

    const divider =
      document.createElement(
        'div'
      );


    divider.style.height =
      '1px';


    divider.style.background =
      'rgba(255,255,255,.12)';


    divider.style.margin =
      '24px 0 18px';


    panel.appendChild(
      divider
    );


    /*
     * DIAGNOSIS TITLE
     */

    const diagnosisTitle =
      document.createElement(
        'div'
      );


    diagnosisTitle.textContent =
      '🔎 8.4F MAPPING DIAGNOSIS';


    diagnosisTitle.style.fontSize =
      '18px';


    diagnosisTitle.style.fontWeight =
      '900';


    diagnosisTitle.style.marginBottom =
      '8px';


    panel.appendChild(
      diagnosisTitle
    );


    const diagnosisDescription =
      document.createElement(
        'div'
      );


    diagnosisDescription.textContent =
      'Kiểm tra chính xác mapping nào đang làm Production Forecast Mapping Preview thất bại.';


    diagnosisDescription.style.opacity =
      '.72';


    diagnosisDescription.style.lineHeight =
      '1.55';


    panel.appendChild(
      diagnosisDescription
    );


    /*
     * ---------------------------------------------------------
     * BUTTON 2
     * ---------------------------------------------------------
     */

    const diagnosisButton =
      document.createElement(
        'button'
      );


    diagnosisButton.id =
      'fix03d59-84f-diagnosis-button';


    diagnosisButton.type =
      'button';


    diagnosisButton.textContent =
      '🔎 RUN 8.4F MAPPING DIAGNOSIS';


    applyButtonStyle84FL(
      diagnosisButton
    );


    diagnosisButton.addEventListener(
      'click',
      runMappingDiagnosisUI84F
    );


    panel.appendChild(
      diagnosisButton
    );


    /*
     * OUTPUT 2
     */

    const diagnosisOutput =
      document.createElement(
        'div'
      );


    diagnosisOutput.id =
      'fix03d59-84f-diagnosis-output';


    diagnosisOutput.style.marginTop =
      '16px';


    diagnosisOutput.style.lineHeight =
      '1.6';


    diagnosisOutput.style.fontSize =
      '13px';


    panel.appendChild(
      diagnosisOutput
    );


    /*
     * ---------------------------------------------------------
     * INSERT AT END OF SETTINGS
     * ---------------------------------------------------------
     */

    settings.appendChild(
      panel
    );


    console.log(
      'FIX-03D5.9 FINAL TEST UI BUILT',
      {
        panel:
          Boolean(
            document.getElementById(
              'fix03d59-84fl-master-panel'
            )
          ),

        lifecycleButton:
          Boolean(
            document.getElementById(
              'fix03d59-84fl-test-button'
            )
          ),

        diagnosisButton:
          Boolean(
            document.getElementById(
              'fix03d59-84f-diagnosis-button'
            )
          )
      }
    );

  }


  /*
   * =========================================================
   * INITIALIZE
   * =========================================================
   */

  function initialize84FLTest() {

    /*
     * Small delay deliberately allows the normal application
     * UI to finish constructing tab-settings first.
     */

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
   * Public diagnostic access.
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
    'FIX-03D5.9 FINAL TEST loaded — DIRECT DOM / READ ONLY / ZERO WRITE'
  );

})();

