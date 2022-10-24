/*\
title: $:/plugins/EvidentlyCube/AdvancedPerformance/ui.js
type: application/javascript
module-type: startup

Cleans up data after a TaskList is removed
\*/

(function () {

	/*jslint node: false, browser: true */
	/*global $tw: false */
	"use strict";

	// Export name and synchronous status
	exports.name = "evidentlycube-adv-perf--footer";
	exports.after = ["startup"];
	exports.synchronous = true;
	exports.startup = function () {
		if ($tw.node) {
			return;
		}

		var isShowingDetails = false;
		var selectedTab = "ec_ap-tab--refresh-logs";

		var onShowDetailsClicked = function(event) {
			event.stopPropagation();
			event.preventDefault();

			isShowingDetails = true;
			showDetails();
		};

		var showDetails = function() {
			if (!isShowingDetails) {
				document.querySelector('#ec_ap-wrap').style.display = "none";
				return;
			}

			document.querySelectorAll('.ec_ap-tab-header').forEach(function(element) {
				if (element.getAttribute('data-for') === selectedTab) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			});

			var measures = {};
			$tw.utils.each($tw.perf.measures, function(measure, filterName) {
				var timesSorted = times.concat();
				timesSorted.sort();
				var half = Math.floor(timesCopy.length / 2);

				measures = {
					lastUse: measure.lastUse,
					longestRun: measure.longestRun,
					shortestRun: measure.shortestRun,
					totalCalls: measure.totalCalls,
					totalTime: measure.totalTime,
					times: measure.times,
					timesSorted: timesSorted,
					average: measure.totalTime / measure.totalCalls,
					median: timesSorted.length % 2
						? timesSorted[half]
						: (timesSorted[half - 1] + timesSorted[half]) / 2
				}
			});


		};

		$tw.wiki.addEventListener("change", function (changes) {
			var tempTiddlers = 0;
			var systemTiddlers = 0;
			var stateTiddlers = 0;
			var mainTiddlers = 0;
			var totalTiddlers = 0;
			var totalTime = 0;
			var refreshHtmls = [];

			$tw.utils.each(changes, function(_, tiddler) {
				if (tiddler.startsWith('$:/temp/')) {
					tempTiddlers++;
				} else if (tiddler.startsWith('$:/state/')) {
					stateTiddlers++;
				} else if (tiddler.startsWith('$:/')) {
					systemTiddlers++;
				} else {
					mainTiddlers++;
				}

				totalTiddlers++;
			});

			$tw.utils.each($tw.perf.refreshTimes, function(time, name) {
				if (name === 'mainRender') {
					// We don't include mainRender in our calculations because it happens infrequently
					return;
				}
				totalTime += time;
				refreshHtmls.push(
					'<span title="'
					+ name +
					'">'
					+ time.toFixed(2)
					+ 'ms</span>'
				);
			});

			var now = new Date();
			var time = now.getHours().toString().padStart(2, "0")
				+ ":"
				+ now.getMinutes().toString().padStart(2, "0")
				+ ":"
				+ now.getSeconds().toString().padStart(2, "0")
				+ "."
				+ (now.getTime() % 1000).toString().padStart(3, "0");

			$tw.perf.storeRefresh({
				time: time,
				tempTiddlers: tempTiddlers,
				stateTiddlers: stateTiddlers,
				systemTiddlers: systemTiddlers,
				mainTiddlers: mainTiddlers,
				totalTiddlers: totalTiddlers,
				changedTiddlerNames: Object.keys(changes),
				refreshTimes: JSON.parse(JSON.stringify($tw.perf.refreshTimes))
			});

			document.querySelector('#ec_ap-last-refresh').innerText = time;
			document.querySelector('#ec_ap-total-time').innerText = totalTime.toFixed(2) + "ms";
			document.querySelector('#ec_ap-times').innerHTML = '(' + refreshHtmls.join(" | ") + ')';
			document.querySelector('#ec_ap-tiddlers').innerHTML = totalTiddlers;
			document.querySelector('#ec_ap-tiddlers-temp').innerHTML = "Temp=" + tempTiddlers;
			document.querySelector('#ec_ap-tiddlers-state').innerHTML = "State=" + stateTiddlers;
			document.querySelector('#ec_ap-tiddlers-system').innerHTML = "System=" + systemTiddlers;
			document.querySelector('#ec_ap-tiddlers-main').innerHTML = "Main=" + mainTiddlers;

			var showDetailsButton = document.querySelector('#ec_ap-show-details');
			showDetailsButton.removeEventListener('click', onShowDetailsClicked);
			showDetailsButton.addEventListener('click', onShowDetailsClicked);
		});
	};

})();
