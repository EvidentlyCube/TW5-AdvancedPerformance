/*\
title: $:/plugins/EvidentlyCube/AdvancedPerformance/widget.js
type: application/javascript
module-type: startup

Hook itself to all widgets
\*/

(function () {

	/*jslint node: false, browser: true */
	/*global $tw: false */
	"use strict";

	// Export name and synchronous status
	exports.name = "evidentlycube-adv-perf--widget";
	exports.after = ["startup"];
	exports.synchronous = true;
	exports.startup = function () {
		if ($tw.node) {
			return;
		}

		var createdWidgets = 0;
		var refreshedWidgets = 0;
		var renderedWidgets = 0;

		var widget = require("$:/core/modules/widgets/widget.js").widget;
		var widgets = $tw.modules.applyMethods("widget");

		var injectedMethods = new Set();
		var injectCallback = function(widgetClass, methodName, callback) {
			var oldMethod = widgetClass.prototype[methodName];

			while (!oldMethod && widgetClass.prototype) {
				widgetClass = widgetClass.prototype;
				oldMethod = widgetClass.prototype[methodName];
			}

			if (!oldMethod || injectedMethods.has(oldMethod)) {
				return;
			}

			injectedMethods.add(oldMethod);

			widgetClass.prototype[methodName] = function() {
				callback.apply(this, arguments);
				return oldMethod.apply(this, arguments);
			};
		};

		injectCallback(widget, 'initialise', function() {
			createdWidgets++;
		})

		$tw.utils.each(widgets, function(module, title) {
			injectCallback(module, 'refresh', function() {
				refreshedWidgets++;
			});
			injectCallback(module, 'render', function() {
				renderedWidgets++;
			});
		});

		setInterval(function() {
			console.log(`Created: ${createdWidgets}, Rendered: ${renderedWidgets}, Refreshed: ${refreshedWidgets}`);
			createdWidgets = 0;
			refreshedWidgets = 0;
		}, 500);
	};

})();
