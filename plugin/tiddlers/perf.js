/*\
title: $:/plugins/EvidentlyCube/AdvancedPerformance/perf.js
type: application/javascript
module-type: startup

Cleans up data after a TaskList is removed
\*/

(function(){

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "evidentlycube-adv-perf--performance";
exports.before = ["startup"];
exports.synchronous = true;
exports.startup = function() {
	if ($tw.node) {
		return;
	}

	$tw.Performance.prototype.showGreeting = function() {
		this.refreshTimes = {};
		this.refreshTimesHistory = [];
	};

	$tw.Performance.prototype.log = function() {
		console.log("Please use the UI instead");
	};

	$tw.Performance.prototype.report = function(name,fn) {
		var self = this;
		if(this.enabled) {
			return function() {
				this.currentRefreshName = name;

				var startTime = $tw.utils.timer(),
					result = fn.apply(this,arguments),
					timeTaken = $tw.utils.timer(startTime);
				self.refreshTimes[name] = timeTaken;
				self.logger.log(name + ": " + timeTaken.toFixed(2) + "ms");
				return result;
			};
		} else {
			return fn;
		}
	};

	$tw.Performance.prototype.storeRefresh = function(log) {
		this.refreshTimesHistory.push(log);

		if (this.refreshTimesHistory.length > 100) {
			this.refreshTimesHistory.shift();
		}
	}

	$tw.Performance.prototype.measure = function(name,fn) {
		var self = this;
		if(this.enabled) {
			return function() {
				var startTime = $tw.utils.timer(),
					result = fn.apply(this,arguments),
					totalTime = $tw.utils.timer(startTime);
				if(!(name in self.measures)) {
					self.measures[name] = {lastUse: 0, times: []};
				}
				self.measures[name].lastUse = Date.now();
				self.measures[name].times.push(totalTime);
				return result;
			};
		} else {
			return fn;
		}
	};


};

})();
