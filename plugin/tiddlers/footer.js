/*\
title: $:/plugins/EvidentlyCube/AdvancedPerformance/footer.js
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

			document.querySelector('#ec_ap-footer').innerHTML =
				"<strong>Refreshed:</strong> "
				+ time
				+ " &mdash; "
				+ "<strong>Time taken:</strong> "
				+ totalTime.toFixed(2) + "ms "
				+ '<span class="ec_ap-muted">('
				+ refreshHtmls.join(" | ")
				+ ")</span>"
				+ " &mdash; "
				+ "<strong>Tiddlers refreshed:</strong> "
				+ totalTiddlers
				+ '&nbsp;<span class="ec_ap-muted">('
				+ 'Temp=' + tempTiddlers + ", "
				+ 'State=' + stateTiddlers + ", "
				+ 'System=' + systemTiddlers + ", "
				+ 'Regular=' + mainTiddlers
				+ ")</span>";
		});
	};

})();
