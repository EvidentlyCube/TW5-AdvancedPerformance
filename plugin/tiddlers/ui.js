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

		var footerText = $tw.wiki.getTiddlerText('$:/config/Performance/Instrumentation') !== "yes"
			? "Performance instrumentation has been enabled, please save your wiki and refresh it to allow collecting data"
			: "";
		var isShowingDetails = false;
		var selectedTab = "ec_ap-tab--refresh-logs";

		var onCloseClicked = function(event) {
			isShowingDetails = false;
			showDetails();
		};

		var onTabClicked = function(event) {
			selectedTab = event.target.getAttribute('data-for') || selectedTab;
			refreshTabs();
		}

		var onShowDetailsClicked = function(event) {
			event.stopPropagation();
			event.preventDefault();

			isShowingDetails = true;
			showDetails();
		};

		var onClearPerfDataClicked = function(event) {
			event.stopPropagation();
			event.preventDefault();

			$tw.perf.measures = {};
			$tw.perf.refreshTimes = {};
			$tw.perf.refreshTimesHistory = [];

			footerText = "Performance data was cleared, please interact with the wiki to start collecting data";

			showDetails();
			refreshFooter();
		}

		var refreshTabs = function() {
			document.querySelectorAll('.ec_ap-tab-header').forEach(function(element) {
				if (element.getAttribute('data-for') === selectedTab) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			});
			document.querySelectorAll('#ec_ap-tabs > *').forEach(function(element) {
				if (element.classList.contains(selectedTab)) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			});
		};

		var showDetails = function() {
			if (!isShowingDetails) {
				document.querySelector('#ec_ap-wrap').style.display = "none";
				return;
			}

			document.querySelector('#ec_ap-wrap').style.display = "block";

			refreshTabs();

			var measures = [];
			$tw.utils.each($tw.perf.measures, function(measure, filterName) {
				var lastTen = measure.times.slice(-10);
				var timesSorted = measure.times.concat();
				timesSorted.sort();

				var half = Math.floor(timesSorted.length / 2);

				measures.push({
					filterName: filterName.replace(/^filter:\s*/, ''),
					lastUse: measure.lastUse,
					longestRun: measure.longestRun,
					shortestRun: measure.shortestRun,
					totalCalls: measure.totalCalls,
					totalTime: measure.totalTime,
					totalTimeLastTen: lastTen.reduce(function(sum, next) { return sum + next; }, 0),
					times: measure.times,
					timesSorted: timesSorted,
					timesLastTen: lastTen,
					average: measure.totalTime / measure.totalCalls,
					median: timesSorted.length % 2
						? timesSorted[half]
						: (timesSorted[half - 1] + timesSorted[half]) / 2
				});
			});

			var recordsToShow = 50;
			var mostUsedFilters = measures.concat().sort(createSortByCallback(['totalCalls', 'lastUse']));
			var singleLongestExecution = measures.concat().sort(createSortByCallback(['longestRun', 'lastUse']));
			var totalLongestExecution = measures.concat().sort(createSortByCallback(['totalTime', 'lastUse']));
			var averageLongest = measures.concat().sort(createSortByCallback(['average', 'lastUse']));
			var medianLongest = measures.concat().sort(createSortByCallback(['median', 'lastUse']));

			createTable(
				document.querySelector('#ec_ap--last-refreshes'),
				[
					{name: 'Refresh time', field: 'time'},
					{name: 'Total time', getText: function(m) {
						return Object.values(m.refreshTimes).reduce(function(sum, next) { return sum + next}, 0).toFixed(2) + "ms";
					}},
					{
						name: 'Individual times',
						getText: function(m) {
							return Object.keys(m.refreshTimes).map(function(key) {
								return key + ": " + m.refreshTimes[key].toFixed(2) + "ms";
							}).join("<br>");
						}
					},
					{
						name: 'Changed tiddlers',
						getText: function(m) {
							return m.changedTiddlerNames.length;
						},
						getTitle: function(m) {
							return m.changedTiddlerNames.join("\n");
						}
					},
					{name: "Temp", getText: function(m) { return m.tempTiddlers; }},
					{name: "State", getText: function(m) { return m.stateTiddlers; }},
					{name: "System", getText: function(m) { return m.systemTiddlers; }},
					{name: "Main", getText: function(m) { return m.mainTiddlers; }},
				],
				$tw.perf.refreshTimesHistory.slice(-recordsToShow).reverse()
			);

			createTable(
				document.querySelector('#ec_ap--most-used'),
				[
					{name: 'Filter', field: 'filterName'},
					{name: 'Uses', field: 'totalCalls' },
					{name: 'Total time', getText: function(m) { return m.totalTime.toFixed(2) + 'ms'; }},
					{
						name: 'Total time (last 10)',
						getText: function(m) { return m.totalTimeLastTen.toFixed(2) + 'ms'; },
						getTitle: function(m) { return m.timesLastTen.map(function(x) { return x.toFixed(2) + 'ms'}).join("\n"); }
					},
					{name: 'Longest run', getText: function(m) { return m.longestRun.toFixed(2) + 'ms'; }},
					{name: 'Average time', getText: function(m) { return m.average.toFixed(2) + 'ms'; }},
					{name: 'Median time', getText: function(m) { return m.median.toFixed(2) + 'ms'; }},
				],
				mostUsedFilters.slice(0, recordsToShow)
			);

			createTable(
				document.querySelector('#ec_ap--single-longest'),
				[
					{name: 'Filter', field: 'filterName'},
					{name: 'Longest run', getText: function(m) { return m.longestRun.toFixed(2) + 'ms'; }},
					{name: 'Uses', field: 'totalCalls' },
					{name: 'Total time', getText: function(m) { return m.totalTime.toFixed(2) + 'ms'; }},
					{
						name: 'Total time (last 10)',
						getText: function(m) { return m.totalTimeLastTen.toFixed(2) + 'ms'; },
						getTitle: function(m) { return m.timesLastTen.map(function(x) { return x.toFixed(2) + 'ms'}).join("\n"); }
					},
					{name: 'Average time', getText: function(m) { return m.average.toFixed(2) + 'ms'; }},
					{name: 'Median time', getText: function(m) { return m.median.toFixed(2) + 'ms'; }},
				],
				singleLongestExecution.slice(0, recordsToShow)
			);

			createTable(
				document.querySelector('#ec_ap--total-longest'),
				[
					{name: 'Filter', field: 'filterName'},
					{name: 'Total time', getText: function(m) { return m.totalTime.toFixed(2) + 'ms'; }},
					{name: 'Uses', field: 'totalCalls' },
					{
						name: 'Total time (last 10)',
						getText: function(m) { return m.totalTimeLastTen.toFixed(2) + 'ms'; },
						getTitle: function(m) { return m.timesLastTen.map(function(x) { return x.toFixed(2) + 'ms'}).join("\n"); }
					},
					{name: 'Longest run', getText: function(m) { return m.longestRun.toFixed(2) + 'ms'; }},
					{name: 'Average time', getText: function(m) { return m.average.toFixed(2) + 'ms'; }},
					{name: 'Median time', getText: function(m) { return m.median.toFixed(2) + 'ms'; }},
				],
				totalLongestExecution.slice(0, recordsToShow)
			);

			createTable(
				document.querySelector('#ec_ap--average'),
				[
					{name: 'Filter', field: 'filterName'},
					{name: 'Average time', getText: function(m) { return m.average.toFixed(2) + 'ms'; }},
					{name: 'Uses', field: 'totalCalls' },
					{name: 'Total time', getText: function(m) { return m.totalTime.toFixed(2) + 'ms'; }},
					{
						name: 'Total time (last 10)',
						getText: function(m) { return m.totalTimeLastTen.toFixed(2) + 'ms'; },
						getTitle: function(m) { return m.timesLastTen.map(function(x) { return x.toFixed(2) + 'ms'}).join("\n"); }
					},
					{name: 'Longest run', getText: function(m) { return m.longestRun.toFixed(2) + 'ms'; }},
					{name: 'Median time', getText: function(m) { return m.median.toFixed(2) + 'ms'; }},
				],
				averageLongest.slice(0, recordsToShow)
			);

			createTable(
				document.querySelector('#ec_ap--median'),
				[
					{name: 'Filter', field: 'filterName'},
					{name: 'Median time', getText: function(m) { return m.median.toFixed(2) + 'ms'; }},
					{name: 'Uses', field: 'totalCalls' },
					{name: 'Total time', getText: function(m) { return m.totalTime.toFixed(2) + 'ms'; }},
					{
						name: 'Total time (last 10)',
						getText: function(m) { return m.totalTimeLastTen.toFixed(2) + 'ms'; },
						getTitle: function(m) { return m.timesLastTen.map(function(x) { return x.toFixed(2) + 'ms'}).join("\n"); }
					},
					{name: 'Longest run', getText: function(m) { return m.longestRun.toFixed(2) + 'ms'; }},
					{name: 'Average time', getText: function(m) { return m.average.toFixed(2) + 'ms'; }},
				],
				medianLongest.slice(0, recordsToShow)
			);
		};

		var createSortByCallback = function(fields, reverse) {
			var orderMultiplier = reverse ? -1 : 1;

			return function(left, right) {
				for(var i = 0; i < fields.length; i++) {
					var field = fields[i];
					if (left[field] !== right[field]) {
						return (right[field] - left[field]) * orderMultiplier;
					}
				}

				return left.filterName.localeCompare(right.filterName) * orderMultiplier;
			}
		}

		var createTable = function(tableElement, headers, measures) {
			var dm = $tw.utils.domMaker;
			var theadThs = headers.map(function(header) {
				return dm('th', {text: header.name});
			});
			var theadTr = dm("tr", {children: theadThs});
			var tbodyTrs = measures.map(function(measure) {
				var tds = headers.map(function(header) {
					var content = dm('span', {
						class: header.getTitle ? 'ec_ap-annotated' : '',
						innerHTML: header.getText ? header.getText(measure) : measure[header.field],
						attributes: {title: header.getTitle ? header.getTitle(measure) : ''}
					});

					return dm('td', {children: [content]});
				});

				return dm('tr', {children: tds});
			});
			var thead = dm('thead', {children: [theadTr]});
			var tbody = dm('tbody', {children: tbodyTrs});
			var table = dm('table', {children: [thead, tbody]});

			tableElement.innerHTML = table.innerHTML;
		}

		var refreshFooter = function() {
			var hasMeasurements = Object.keys($tw.perf.measures).length > 0;

			if (!hasMeasurements) {
				document.querySelectorAll('#ec_ap-footer > *').forEach(function(element) {
					element.style.display = "none";
				});

				var message = document.querySelector('#ec_ap-message')
				message.style.display = "block";
				message.innerText = footerText;
				return true;
			}

			document.querySelectorAll('#ec_ap-footer > *').forEach(function(element) {
				element.style.display = null;
			});
			document.querySelector('#ec_ap-message').style.display = "none";

			return false;
		}

		$tw.wiki.addEventListener("change", function (changes) {
			if (!document.querySelector('#ec_ap-footer') || refreshFooter()) {
				return;
			}

			var tempTiddlers = 0;
			var systemTiddlers = 0;
			var stateTiddlers = 0;
			var mainTiddlers = 0;
			var totalTiddlers = 0;
			var totalTime = 0;
			var refreshTimes = JSON.parse(JSON.stringify($tw.perf.refreshTimes));
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
				refreshTimes: refreshTimes
			});

			document.querySelector('#ec_ap-last-refresh').innerText = time;
			document.querySelector('#ec_ap-total-time').innerText = totalTime.toFixed(2) + "ms";
			document.querySelector('#ec_ap-times').innerHTML = '(' + refreshHtmls.join(" | ") + ')';
			document.querySelector('#ec_ap-tiddlers').innerHTML = totalTiddlers;
			document.querySelector('#ec_ap-tiddlers-temp').innerHTML = "Temp=" + tempTiddlers;
			document.querySelector('#ec_ap-tiddlers-state').innerHTML = "State=" + stateTiddlers;
			document.querySelector('#ec_ap-tiddlers-system').innerHTML = "System=" + systemTiddlers;
			document.querySelector('#ec_ap-tiddlers-main').innerHTML = "Main=" + mainTiddlers;

			// Clear current refresh times to avoid outdated `mainRender` polluting our logs
			$tw.perf.refreshTimes = {};

			var showDetailsButton = document.querySelector('#ec_ap-show-details');
			showDetailsButton.removeEventListener('click', onShowDetailsClicked);
			showDetailsButton.addEventListener('click', onShowDetailsClicked);

			var tabsContainer = document.querySelector('#ec_ap-tab-headers');
			tabsContainer.removeEventListener('click', onTabClicked, true);
			tabsContainer.addEventListener('click', onTabClicked, true);

			var closeButton = document.querySelector('#ec_ap-close');
			closeButton.removeEventListener('click', onCloseClicked, true);
			closeButton.addEventListener('click', onCloseClicked, true);

			var clearPerfDataButton = document.querySelector('#ec_ap-clear');
			clearPerfDataButton.removeEventListener('click', onClearPerfDataClicked, true);
			clearPerfDataButton.addEventListener('click', onClearPerfDataClicked, true);
		});
	};

})();
