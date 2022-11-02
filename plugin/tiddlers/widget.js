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
	exports.stats = {
		createdWidgetNames: [],
		refreshedWidgetsCount: 0,
		renderedWidgets: []
	};

	exports.clearStats = function() {
		exports.stats = {
			createdWidgetNames: [],
			refreshedWidgetsCount: 0,
			renderedWidgets: []
		};
	};

	exports.startup = function () {
		if ($tw.node) {
			return;
		}

		var widget = require("$:/core/modules/widgets/widget.js").widget;
		var widgets = $tw.modules.applyMethods("widget");

		widget.prototype.__widgetName = "Widget";

		injectCallback(widget, 'initialise', function(widget, timeTaken) {
			exports.stats.createdWidgetNames.push( widget.__widgetName);
		});

		$tw.utils.each(widgets, function(module, title) {
			module.prototype.__widgetName = title;

			injectCallback(module, 'refresh', function(widget) {
				exports.stats.refreshedWidgetsCount++;
			});

			injectCallback(module, 'render', function(widget, timeTaken) {
				exports.stats.renderedWidgets.push({
					name: widget.__widgetName,
					time: timeTaken,
					widget: widget,
					dom: getFirstNodes(widget).filter(function(node) {
						return node.getRootNode;
					})
				});
			});
		});
	};

	/**
	 * Return all the nodes in the first depth/child it finds dom nodes
	 */
	function getFirstNodes(widget) {
		if(widget.domNodes.length > 0) {
			return widget.domNodes;
		}

		// Otherwise, recursively call our children
		for(var t = 0; t < widget.children.length; t++) {
			var domNodes = getFirstNodes(widget.children[t]);
			if(domNodes) {
				return domNodes;
			}
		}

		return [];
	}

	var injectedMethods = new Set();
	function injectCallback(widgetClass, methodName, callback) {
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
			var startTime = $tw.utils.timer(),
				result = oldMethod.apply(this,arguments),
				timeTaken = $tw.utils.timer(startTime);

			callback(this, timeTaken);

			return result;
		};
	};
})();
