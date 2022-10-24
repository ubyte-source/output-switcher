(function (window) {

	'use strict';

	Array.prototype.average = Array.prototype.average || function () {
		return this.reduce(function (p, c, i, a) {
			return p + (c / a.length)
		}, 0);
	};

	class Dictionary {

		static voltage() {
			return 'tensione';
		}
		static power() {
			return 'potenza';
		}
		static from() {
			return 'dal momento';
		}
		static to() {
			return 'al momento';
		}
		static interval() {
			return 'intervallo';
		}
		static sample() {
			return 'campioni';
		}
		static average() {
			return 'potenza media';
		}
		static saving() {
			return 'efficientamento';
		}
		static total() {
			return 'tabella PTM';
		}
	}

	class Color {

		static voltage() {
			return '#47a447';
		}
		static power() {
			return '#c9302c';
		}
		static switch() {
			return '#ccd6eb';
		}
		static unselected() {
			return '#cccccc';
		}
	}

	class Um {

		static voltage() {
			return 'V';
		}
		static power() {
			return 'kW';
		}
		static original() {
			return 'W';
		}
		static time() {
			return 's';
		}
		static percentage() {
			return '%';
		}
	}

	class Report {

		static progressive() {
			return 'progressivo';
		}
		static time() {
			return 'data/ora commutazione saving/bypass';
		}
		static saving() {
			return 'potenza media [W] in saving';
		}
		static bypass() {
			return 'potenza media [W] in bypass';
		}
		static percentage() {
			return '% efficientamento energetico in potenza';
		}
	}

	class Info {

		static format() {
			return 'DD/MM/YYYY HH:mm:ss';
		}

		constructor(switcher) {
			this.switcher = switcher;
			this.date = {
				from: 0,
				to: 0
			};
			this.sample = []
		}

		getSwitcher() {
			return this.switcher;
		}
		getDate() {
			return this.date;
		}
		getInterval() {
			let date = this.getDate();
			return date.to - date.from;
		}
		setDate(array) {
			let date = this.getDate(),
				last = array.length - 1;
			if (last < 0) return this;

			date.from = array[0][0];
			date.to = array[last][0];

			return this;
		}
		setSample(sample) {
			this.setDate(sample);
			this.sample = this.constructor.sample(sample);
			if (0 < sample.length) this.getSwitcher().getResult().update();
			return this;
		}
		getSample() {
			return this.sample;
		}
		static percentage(saving, bypass) {
			if (saving === 0
				&& 0 === bypass) return 0;

			let x = 1e2 * (bypass - saving) / saving,
				r = Math.round(x * 1e2) / 1e2;
			return r.toFixed(2);
		}
		static sample(array) {
			return array.map(function (item) {
				return item[1];
			});
		}
	}

	class Result {

		constructor(switcher) {
			this.switcher = switcher;
			this.elements = {};
			this.elements.table = new Table();

			this.getTable().getThead().drop().addRow(
				window.Table.Tr.Td.content(window.Switcher.Dictionary.from()),
				window.Table.Tr.Td.content(window.Switcher.Dictionary.to()),
				window.Table.Tr.Td.content(window.Switcher.Dictionary.interval()),
				window.Table.Tr.Td.content(window.Switcher.Dictionary.sample()),
				window.Table.Tr.Td.content(window.Switcher.Dictionary.average()),
				window.Table.Tr.Td.content(window.Switcher.Dictionary.saving())
			);
		}

		getSwitcher() {
			return this.switcher;
		}
		getTable() {
			return this.elements.table;
		}
		update() {
			let bypass = this.getSwitcher().getBypass(),
				bypass_date = bypass.getDate(),
				bypass_sample = bypass.getSample(),
				bypass_sample_average = bypass_sample.average(),
				saving = this.getSwitcher().getSaving(),
				saving_date = saving.getDate(),
				saving_sample = saving.getSample(),
				saving_sample_average = saving_sample.average(),
				tbody = this.getTable().getTbody();

			tbody.drop();
			tbody.addRow(
				window.Table.Tr.Td.content(window.moment.unix(saving_date.from).tz(window.Switcher.timezone()).format(window.Switcher.Info.format())),
				window.Table.Tr.Td.content(window.moment.unix(saving_date.to).tz(window.Switcher.timezone()).format(window.Switcher.Info.format())),
				window.Table.Tr.Td.content(saving.getInterval().toString() + String.fromCharCode(32) + window.Switcher.option.Um.time()),
				window.Table.Tr.Td.content(saving_sample.length.toString()),
				window.Table.Tr.Td.content(saving_sample_average.toFixed(1) + String.fromCharCode(32) + window.Switcher.option.Um.original()),
				window.Table.Tr.Td.content(this.getSwitcher().getPercentage().toFixed(2) + String.fromCharCode(32) + window.Switcher.option.Um.percentage())
			).getColumn(5).setRowspan(2);

			tbody.addRow(
				window.Table.Tr.Td.content(window.moment.unix(bypass_date.from).tz(window.Switcher.timezone()).format(window.Switcher.Info.format())),
				window.Table.Tr.Td.content(window.moment.unix(bypass_date.to).tz(window.Switcher.timezone()).format(window.Switcher.Info.format())),
				window.Table.Tr.Td.content(bypass.getInterval().toString() + String.fromCharCode(32) + window.Switcher.option.Um.time()),
				window.Table.Tr.Td.content(bypass_sample.length.toString()),
				window.Table.Tr.Td.content(bypass_sample_average.toFixed(1) + String.fromCharCode(32) + window.Switcher.option.Um.original())
			);

			this.getSwitcher().render();

			return this;
		}
		out() {
			return this.getTable().out();
		}
	}

	class Zoom {

		constructor(switcher) {
			this.switcher = switcher;
		}

		getSwitcher() {
			return this.switcher;
		}
		getData() {
			let power = this.getSwitcher().getPower(), data = [];
			for (let item = 0; item < power.length; item++) {
				if (null === power[item][1]) continue;
				data.push(power[item][1]);
			}
			return data;
		}
		getMax() {
			let data = this.getData();
			return Math.max.apply(Math, data);
		}
		getMin() {
			let data = this.getData();
			return Math.min.apply(Math, data);
		}
	}

	class Switcher {

		static timezone() {
			return 'Europe/Rome'
		}
		static template() {
			return {
				chart: {
					type: 'line',
					marginTop: 40,
					animation: false,
					height: 280
				},
				plotOptions: {
					series: {
						animation: false
					}
				},
				credits: {
					enabled: false
				},
				title: {
					text: null
				},
				yAxis: [
					{
						title: {
							text: null,
							style: {
								color: window.Switcher.option.Color.voltage()
							}
						},
						showEmpty: !1,
						opposite: !0,
						labels: {
							style: {
								color: window.Switcher.option.Color.voltage()
							},
							formatter: function () {
								return this.value.toString() + String.fromCharCode(32) + window.Switcher.option.Um.voltage();
							},
						},
					},
					{
						title: {
							text: null,
							style: {
								color: window.Switcher.option.Color.power()
							}
						},
						showEmpty: !1,
						labels: {
							style: {
								color: window.Switcher.option.Color.power()
							},
							formatter: function () {
								let value = this.value / 1e3;
								return value.toString() + String.fromCharCode(32) + window.Switcher.option.Um.power();
							},
						},
					},
				],
				xAxis: {
					type: 'datetime',
					minRange: 1e3,
					plotLines: [
						{
							color: window.Switcher.option.Color.switch(),
							width: 1
						}
					]
				},
				series: [],
			}
		}
		static power() {
			return 1;
		}
		static voltage() {
			return 2;
		}

		constructor(saving, bypass, select) {
			this.series = {
				saving: saving,
				bypass: bypass
			}

			this.zoom = new window.Switcher.Zoom(this);
			this.saving = new window.Switcher.Info(this);
			this.bypass = new window.Switcher.Info(this);

			this.elements = {};
			this.elements.result = new window.Switcher.Result(this);

			this.setSelect(select);
		}

		getSaving() {
			return this.saving;
		}
		getBypass() {
			return this.bypass;
		}
		getZoom() {
			return this.zoom;
		}
		getSeries() {
			return this.series;
		}
		getResult() {
			return this.elements.result;
		}
		getLine() {
			let series = this.getSeries();
			return series.saving[series.saving.length - 1][0] * 1e3;
		}
		setSelect(select) {
			let series = this.getSeries(),
				saving = select <= 1 ? [] : series.saving.slice(0 - select),
				bypass = select <= 1 ? [] : series.bypass.slice(0, select);

			this.getSaving().setSample(saving);
			this.getBypass().setSample(bypass);
			this.render();
		}
		getPercentage() {
			let saving = this.getSaving().getSample(),
				bypass = this.getBypass().getSample();

			return window.Switcher.Info.percentage(saving.average(), bypass.average());
		}
		remap(index) {
			let output = [];
			if (index !== this.constructor.power()
				&& index !== this.constructor.voltage()) return output;

			let series = this.getSeries();
			for (let item = 0; item < series.saving.length; item++)
				output.push([
					series.saving[item][0] * 1e3,
					series.saving[item][index]
				]);

			if (index === this.constructor.power()) {
				let line = this.getLine();
				output.push([line, null]);
			}

			for (let item = 0; item < series.bypass.length; item++)
				output.push([
					series.bypass[item][0] * 1e3,
					series.bypass[item][index]
				]);

			return output;
		}
		getPower() {
			return this.remap(this.constructor.power());
		}
		getVoltage() {
			return this.remap(this.constructor.voltage());
		}
		getWrapper() {
			if (this.elements.hasOwnProperty('p')) return this.elements.p;
			let figure = this.getFigure(), result = this.getResult().out();
			this.elements.p = document.createElement('p');
			this.elements.p.className = 'switch';
			this.elements.p.appendChild(figure);
			this.elements.p.appendChild(result);
			return this.elements.p;
		}
		getFigure() {
			if (this.elements.hasOwnProperty('figure')) return this.elements.figure;
			this.elements.figure = document.createElement('figure');
			this.elements.figure.className = 'highcharts-figure';
			return this.elements.figure;
		}
		getConfiguration() {
			let configuration = this.constructor.template();
			configuration.xAxis.plotLines[0].value = this.getLine();
			configuration.series = [];
			configuration.series.push({
				name: window.Switcher.Dictionary.voltage(),
				data: this.getVoltage(),
				enableMouseTracking: !1,
				marker: {
					enabled: !1
				},
				color: window.Switcher.option.Color.voltage(),
				zIndex: 1
			});
			configuration.series.push({
				name: window.Switcher.Dictionary.power(),
				data: this.getPower(),
				color: window.Switcher.option.Color.power(),
				zoneAxis: 'x',
				zIndex: 2,
				yAxis: 1
			});

			configuration.series[1].zones = [];
			configuration.series[1].zones.push({
				color: window.Switcher.option.Color.unselected()
			});

			let saving_select = this.getSaving().getSample(),
				bypass_select = this.getBypass().getSample();
			if (saving_select.length > 0 && 0 < bypass_select.length) {
				let series = this.getSeries();
				configuration.series[1].zones.unshift({
					value: series.bypass[bypass_select.length - 1][0] * 1e3 + 1,
					color: window.Switcher.option.Color.power()
				});
				configuration.series[1].zones.unshift({
					value: series.saving[series.saving.length - saving_select.length][0] * 1e3,
					color: window.Switcher.option.Color.unselected()
				});
			}

			return configuration;
		}
		render(zoom) {
			let configuration = this.getConfiguration();
			if (configuration === null) return null;

			if (typeof zoom === 'number') {
				configuration.yAxis[1].min = this.getZoom().getMin();
				configuration.yAxis[1].max = zoom * this.getZoom().getMax();
			}

			let figure = this.getFigure();
			Highcharts.chart(figure, configuration);

			return this;
		}
		out() {
			return this.getWrapper();
		}
		static removeElementDOM(element) {
			let parent = element === null || typeof element === 'undefined' || typeof element.parentNode === 'undefined' ? null : element.parentNode;
			if (parent === null) return false;
			parent.removeChild(element);
			return true;
		}
	}

	class Total {

		constructor() {
			this.elements = {};
			this.elements.table = new Table();

			this.getTable().getClassList().add('switcher');

			this.getTable().getThead().addRow(
				window.Table.Tr.Td.content(window.Switcher.Dictionary.total())
			).getColumn(0).setColspan(5);

			this.getTable().getThead().addRow(
				window.Table.Tr.Td.content(window.Switcher.Total.Report.progressive()),
				window.Table.Tr.Td.content(window.Switcher.Total.Report.time()),
				window.Table.Tr.Td.content(window.Switcher.Total.Report.saving()),
				window.Table.Tr.Td.content(window.Switcher.Total.Report.bypass()),
				window.Table.Tr.Td.content(window.Switcher.Total.Report.percentage())
			);
		}

		getTable() {
			return this.elements.table;
		}
		addRow(date, saving, bypass) {
			let tbody = this.getTable().getTbody(),
				rows = tbody.getRows(),
				id = rows.length + 1,
				percentage = window.Switcher.Info.percentage(saving, bypass);

			tbody.addRow(
				window.Table.Tr.Td.content(id),
				window.Table.Tr.Td.content(window.moment.unix(date).tz(window.Switcher.timezone()).format(window.Switcher.Info.format())),
				window.Table.Tr.Td.content(saving.toFixed(2)),
				window.Table.Tr.Td.content(bypass.toFixed(2)),
				window.Table.Tr.Td.content(percentage.toString() + String.fromCharCode(32) + String.fromCharCode(37))
			);

			return percentage;
		}
		out() {
			return this.getTable().out();
		}
	}

	window.Switcher = Switcher;
	window.Switcher.option = {};
	window.Switcher.option.Color = Color;
	window.Switcher.option.Um = Um;
	window.Switcher.Zoom = Zoom;
	window.Switcher.Info = Info;
	window.Switcher.Total = Total;
	window.Switcher.Result = Result;
	window.Switcher.Total.Report = Report;
	window.Switcher.Dictionary = Dictionary;

})(window);
