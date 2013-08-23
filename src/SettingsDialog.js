/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */

define(function (require, exports) {
    "use strict";

    var CommandManager             = brackets.getModule("command/CommandManager"),
        Dialogs                    = brackets.getModule("widgets/Dialogs"),
        DefaultPreferences         = require("../DefaultPreferences"),
        ChangelogDialog            = require("../src/ChangelogDialog"),
        Strings                    = require("../strings"),
        settingsDialogTemplate     = require("text!htmlContent/settings-dialog.html");

    var dialog,
        preferences;

    function setValues(values) {
        $("#git-settings-gitIsInSystemPath").prop("checked", values.gitIsInSystemPath);
        $("#git-settings-gitPath")
            .val(values.gitPath)
            .prop("disabled", values.gitIsInSystemPath);
        $("#git-settings-msysgitPath")
            .val(values.msysgitPath)
            .prop("disabled", brackets.platform !== "win");
    }

    function restorePlatformDefaults() {
        setValues(DefaultPreferences);
    }

    function assignActions() {
        $("#git-settings-gitIsInSystemPath").on("click", function () {
            $("#git-settings-gitPath").prop("disabled", $(this).is(":checked"));
        });
        $("button[data-button-id='defaults']").on("click", function (e) {
            e.stopPropagation();
            restorePlatformDefaults();
        });
        $("button[data-button-id='changelog']").on("click", function (e) {
            e.stopPropagation();
            ChangelogDialog.show(preferences);
        });
    }

    function init() {
        setValues(preferences.getAllValues());
        assignActions();
    }

    function showRestartDialog() {
        var restartDialogTemplate = require("text!htmlContent/restart-dialog.html");
        var compiledTemplate = Mustache.render(restartDialogTemplate, Strings);
        Dialogs.showModalDialogUsingTemplate(compiledTemplate).done(function (buttonId) {
            if (buttonId === "ok") {
                CommandManager.execute("debug.refreshWindow");
            }
        });
    }

    exports.show = function (prefs) {
        var compiledTemplate = Mustache.render(settingsDialogTemplate, Strings);

        dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);
        preferences = prefs;

        init();

        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                var $dialog = dialog.getElement();
                preferences.setValue("gitIsInSystemPath", $("#git-settings-gitIsInSystemPath", $dialog).prop("checked"));
                preferences.setValue("gitPath", $("#git-settings-gitPath", $dialog).val());
                // We need trailing slash for folders.
                var msysgitPath = $("#git-settings-msysgitPath", $dialog).val();
                if (msysgitPath[msysgitPath.length - 1] !== "\\") {
                    msysgitPath = msysgitPath + "\\";
                }
                preferences.setValue("msysgitPath", msysgitPath);
                // Restart brackets to reload changes.
                showRestartDialog();
            }
        });
    };
});