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

	var describeWidgetBit = function(bits, name, value) {
		if (value) {
			var trimmedValue = value.toString();

			if (trimmedValue.length > 32) {
				trimmedValue = trimmedValue.substring(0, 32) + "...";

				bits.push(
					$tw.utils.domMaker('strong', {text: name + '='}).outerHTML
					+ $tw.utils.domMaker('span', {text: trimmedValue, class: 'ec_ap-annotated', attributes: {title: value}}).outerHTML
				);
			} else {
				bits.push(
					$tw.utils.domMaker('strong', {text: name + '='}).outerHTML
					+ $tw.utils.domMaker('span', {text: value}).outerHTML
				);
			}
		}
	}
	exports.describeWidgetAttributes = function(widgetName, widget) {
		var bits = [];
		switch(widgetName) {
			case 'set':
				describeWidgetBit(bits, 'Name', widget.setName);
				describeWidgetBit(bits, 'Value', widget.setValue);
				describeWidgetBit(bits, 'EmptyValue', widget.setEmptyValue);
				describeWidgetBit(bits, 'Filter', widget.setFilter);
				break;
			case 'reveal':
				describeWidgetBit(bits, 'State', widget.state);
				describeWidgetBit(bits, 'StateTitle', widget.stateTitle);
				describeWidgetBit(bits, 'StateField', widget.stateField);
				describeWidgetBit(bits, 'StateIndex', widget.stateIndex);
				describeWidgetBit(bits, 'Type', widget.type);
				describeWidgetBit(bits, 'Position', widget.position);
				break;
			case 'transclude':
				describeWidgetBit(bits, 'Title', widget.transcludeTitle);
				describeWidgetBit(bits, 'SubTiddler', widget.transcludeSubTiddler);
				describeWidgetBit(bits, 'Field', widget.transcludeField);
				describeWidgetBit(bits, 'Index', widget.transcludeIndex);
				describeWidgetBit(bits, 'Mode', widget.transcludeMode);
				break;
			case 'vars':
				$tw.utils.each(widget.attributes,function(value, name) {
					if(name.charAt(0) !== "$") {
						describeWidgetBit(bits, name, value)
					}
				});
				break;
			case 'macrocall':
				describeWidgetBit(bits, 'Name', widget.parseTreeNode.name || widget.getAttribute("$name"));
				break;
			case 'text':
				describeWidgetBit(bits, 'Text', widget.getAttribute("text", widget.parseTreeNode.text || ""));
				break;
			case 'element':
				describeWidgetBit(bits, 'Tag', widget.tag);
				break;
			case 'tiddler':
				describeWidgetBit(bits, 'Tiddler', widget.getAttribute("tiddler", widget.getVariable("currentTiddler")));
				break;
		}
		return bits.join('<br>');
	}

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
