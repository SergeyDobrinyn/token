/*!
 * donutgraph.js 1.0.0
 * https://github.com/jpweinerdev/donutgraph.js
 *
 * @license MIT (https://github.com/jpweinerdev/donutgraph.js/blob/master/LICENSE)
 *
 * @copyright 2021 http://developer.jpweiner.net/donutgraph.html - A project by Jean-Pierre Weiner - Developer
 */


// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, d3, undefined ) {

	"use strict";

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variables rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "donutgraph",
			defaults = {
				container: "#graph",
				measureElement: "#measure",
				width: 400,
				height: 400,
				donutWidth: 20,
				padAngle: 0.02,
				animationDuration: 750,
				labelColor: "#9e9e9e",
				accentColor: ["#d81b60","#80c441"],
				colorSetting: ["#33876b","#559559","#77a347","#98b236","#bac024","#dcce12","#e0e0e0"],
				useColorRange: true
			};
			
			
		var Donut = {
			
			//set the plugin options
			updateGraphSettings: function(settings) {
				if(typeof settings === "object") {					
					this.graph.settings.container = settings.container;
					this.graph.settings.measureElement = settings.measureElement;
					this.graph.settings.width = settings.width;
					this.graph.settings.height = settings.height;
					this.graph.settings.donutWidth = settings.donutWidth;
					this.graph.settings.padAngle = settings.padAngle;
					this.graph.settings.animationDuration = settings.animationDuration;
					this.graph.settings.labelColor = settings.labelColor;
					this.graph.settings.accentColor = settings.accentColor;
					this.graph.settings.colorSetting = settings.colorSetting;
					this.graph.settings.useColorRange = settings.useColorRange;
				}				
				
			},
			
			

			graph: {
				svg: {},
				pie: {},
				arc: {},
				
				infoData: [],
				
				settings: {					
					container: "#graph",
					measureElement: "#measure",
					width: 0,
					height: 0,
					donutWidth: 0,
					padAngle: 0,
					animationDuration: 0,
					labelColor: "",
					accentColor: [],
					colorSetting: [],
					useColorRange: true
					
				},
				
				setColor: function(d,i) {
					var colorScale = this.settings.colorSetting;
					if(Object.hasOwn(d.data, "color")) return d.data.color; //overrides all set color of dataset
					
					if(i < colorScale.length) {
						
						if(this.settings.useColorRange) return colorScale[i]; else return colorScale[0]; //useColorRange to false use only first color for all
						
					} else {
						
						return colorScale[colorScale.length-1]; //if colorrange is exeded return last color
					}
										
					return colorScale[i]; //default
				},
						
				setColorByIndex: function(index) {
					var colorScale = this.settings.accentColor;
					if(index < 0 || index > colorScale.length-1) { console.log("Out of color range!"); return colorScale[0]; } //fallback to default first color on false input
					return colorScale[index];
				},

				initDonutGraph: function() {
					var width = this.settings.width,
					height = this.settings.height,
					radius = Math.min(width, height) / 2,
					radiusOuter = radius - 50,
					radiusInner = radius - 50 - this.settings.donutWidth;					
					
					//append a span element out of visible content to measure real pixel textlength
					d3.select("body").append("span").attr('id', this.settings.measureElement.substring(1)).style('position', 'absolute').style('left', '-11000px');					
					
					//reset and show container first
					$(this.settings.container).empty();
					
					this.svg = d3.select(this.settings.container).append("svg")
						.attr("width", this.settings.width)
						.attr("height", this.settings.height)				
						.append("g")
							.attr("id", "donutg")
							.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");					

					//construct default pie layout 
					this.pie = d3.pie().value(function(d){	return d.value; })
						.padAngle(this.settings.padAngle)
						.sort(null);

					this.arc = d3.arc()
						.innerRadius(radiusInner)
						.outerRadius(radiusOuter)
						.padAngle(this.settings.padAngle); //important for exit transition!						
				
				},
				
				/* 
				  @ data: Array of objects
				*/
				refreshDonutGraph: function(data) {					
					var _this = this;
					var labeltext = null;
					var myDuration = this.settings.animationDuration;
					var width = this.settings.width,
					height = this.settings.height,
					radius = (Math.min(width, height) / 2) - 50;
					
					var data = data || [];
					
					var setColor = function(d, i) {			
						var colorScale = _this.settings.colorSetting;
					
						if(Object.hasOwn(d.data, 'color')) return d.data.color; //overrides all
						if(_this.settings.useColorRange) return colorScale[i]; else return colorScale[0];
						return colorScale[i]; //default
					}
					
					//sort array
					data = data.sort(function(a, b) { return d3.descending(a.value, b.value); });
					this.infoData = [];
					
					
					var arc = this.arc;			
					var svg = this.svg;			
					var pie = this.pie;
					var path = svg.selectAll("path");					
					
					var data0 = path.data();
					var data1 = pie(data); //new data			
					path = svg.selectAll("path").data(data1); //pie data
					
			  
					var formatNumber = d3.format(",d");
			  
					//total of values in dataset
					var totalValue = 0; 
					data1.forEach(function(d){
						totalValue+= d.value;
					});

					//calculate info for each segment
					var generateInfoData = function(d,i) {
						var labelInfo = d.data.label;
						var valueInfo = formatNumber(d.value);
						var percentInfo = ( Math.round((d.value/totalValue)*100, 2) )+"%";						
						
						//d.data.label+ "\n" + 'Items: '+ formatNumber(d.value) + "\n" + ( Math.round((d.value/totalValue)*100, 2) )+'%';
						
						_this.infoData.push({
							id: i,
							label: labelInfo,
							value: d.value,
							valueFormated: valueInfo,
							percent: percentInfo
						});
						
						return labelInfo + "\n" + "Items: " + valueInfo + "\n" + percentInfo;
					}

					
					//show textlabel after transistion end
					var showtextLabels = function(){
						d3.selectAll(".textlabel").transition()
							.duration(300)      
								.style("opacity", 1);
					}
					
					var findNeighborArc = function(i, data0, data1) {
						var d;
						return (d = findPreceding(i, data0, data1)) ? {startAngle: d.endAngle, endAngle: d.endAngle} : null;
					}
					
					
					var findPreceding = function(i, data0, data1) {
						var m = data0.length;
						while (--i >= 0) {
							if(i+1 == m) return data0[i];
						}
					}
					
					var arcTween = function(d) {
						var i = d3.interpolate(this._current, d);
						this._current = i(0);
						return function(t) { return arc(i(t)); };
					}
					

					
					/* ************ Generate Pie ************ */
					path.transition()
						.duration(myDuration)
						.attrTween("d", arcTween);
						
						
					path.enter().append("path")
						.attr('d', arc)
						.each(function(d, i) { this._current = findNeighborArc(i, data0, data1) || d; })					
							.attr("class", 'donut')
							.attr("id", function(d,i) { return "tArc_"+i; }) //give each slice a unique ID for label text!!!
							.style("opacity", 0)
							.attr("fill", function(d, i) { return _this.setColor(d,i); })
							.merge(path) //update				
							.transition()
								.duration(myDuration)
									.attr("fill", function(d, i) { return _this.setColor(d,i); }) //update color if dataset has custom values -> transition	  
									.style("opacity", 1)
									.attrTween("d", arcTween).on("end", showtextLabels);
				

					if(data.length == 0) {
						//fade out graph
						path.exit()
						.datum(function(d, i) { return findNeighborArc(i, data1, data0) || d; })
							.transition()
								.duration(myDuration)
									.style("opacity", 0)
									.remove();
					} else {
						path.exit()
						.datum(function(d, i) { return findNeighborArc(i, data1, data0) || d; })
						.transition()
							.duration(myDuration)
								.attrTween("d", arcTween)
								.remove();

					} 
					
					
					
					
					/* ************ Generate Title for Hover Info ************ */
					svg.selectAll("title").remove();
			
					svg.selectAll("path")
					.data(data1).append("title")
						.text(function(d,i) {
							return generateInfoData(d,i);//d.data.label+ "\n" + 'Items: '+ formatNumber(d.value) + "\n" + ( Math.round((d.value/totalValue)*100, 2) )+'%';
						});

					
					/* ************ Label Text ************ */
					svg.selectAll(".textlabel").remove();			
					
					labeltext = svg.selectAll(".textlabel")
						.data(data1); //we need the arc data with angles

					labeltext.enter().append("text")
						.style("opacity", 0)
						.attr("class", "textlabel")
						.attr("dx", 2) //move the text from the start angle of the arc
						.attr("dy", -5) //move the text down	
						.attr("fill", _this.settings.labelColor)
						.append("textPath")
							.attr("xlink:href",function(d,i){return "#tArc_"+i;})
							.style("text-anchor","left")
							.attr("startOffset", function(d){
								if(d.startAngle == 0 && d.endAngle == Math.PI*2) {							
										return "25.5%"; //this value is by 100% --> move startposition to top
									} else {
										return null;
									}					
							})
							.text(function(d,i){ 
								var percent = (d.endAngle - d.startAngle) / Math.PI / 2 * 100;
								var phiRad = d.endAngle - d.startAngle;
								var l = d.data.label.length;
								var pixelLength = 0; //text
								var arcLength = 0;
								var x = 0;
								
								if(i > _this.settings.colorSetting.length && Math.round(percent) <= 1) { if(percent > 0.5) { return '.'; } else { return '';} }
															
									//measure the textlength in pixel 
									$("#measure").html(d.data.label); //fill with text and measure
									pixelLength = d3.select(_this.settings.measureElement).node().getBoundingClientRect().width; //$(_this.settings.measureElement).innerWidth();

									
									
									//L = (θ × π/180) × r (when θ is in degrees)
									//L = θ × r (when θ is in radians)
									arcLength = phiRad * radius;
									x = l - Math.round(arcLength * .9 / (pixelLength / l));									
									if(Math.round(arcLength*.9) > Math.round(pixelLength)*1) { return d.data.label; } else { return d.data.label.substr(0, (l-x-3))+'...'; }
							});
							
					labeltext.exit()
						.datum(function(d, i) { return findNeighborArc(i, data1, data0) || d; })
						.remove();

					
				},
				
				changeColorOfGraph: function(setColorIndex) {
					var svg = this.svg;
					var color = this.setColorByIndex(setColorIndex);
					
					svg.selectAll(".donut")
						.transition().duration(500)	
							.attr("fill", function(d,i){ return color; })
				},



				/*
				resize: function() {
					this.updateGraph();					
				},
				
				initOnWindowResize: function() {
					$(window).resize(function(){       
						if(Donut.graph.getDataSize() != 0) Donut.graph.resize();
					});
				}
				*/
				
			},
			
			init: function(data) {
				this.graph.initDonutGraph();		
				this.graph.refreshDonutGraph(data);
			},
			
			update: function(data) {		
				this.graph.refreshDonutGraph(data);
			},

			changeColor: function(index) {		
				this.graph.changeColorOfGraph(index);
			},
			
			getValues: function() {		
				return this.graph.infoData;
			},
			
			
		};
			

		// The actual plugin constructor
		function Plugin ( element, options ) {
			var _self = this;
						
			this.element = element;
			//this.options = options;

			// jQuery has an extend method which merges the contents of two or
			// more objects, storing the result in the first object. The first object
			// is generally empty as we don't want to alter the default options for
			// future instances of the plugin
			this.settings = $.extend( {}, defaults, options );
			this._defaults = defaults;
			this._name = pluginName;

						
			//public method
			this.update = function(data) {
				//this references the div not the plugin object
				//_self = this object
				
				_self.settings.data = data;				
				_self.drawAndUpdate();
			}
			
			//public method
			this.setColor = function(colorIndex) {
				//this references the div not the plugin object
				//_self = this object
			
				_self.setColorByIndex(colorIndex);
			}
		
		
			this.init();
			
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {

			init: function() {

				//Place initialization logic here
				//You already have access to the DOM element and
				//the options via the instance, e.g. this.element
				//and this.settings
				//you can add more functions like the one below and
				//call them like the example below
				//this.yourOtherFunction( this.settings.propertyName );

				//update settings of graph - override defaults
				Donut.updateGraphSettings(this.settings);
				
				Donut.init();
				Donut.update(this.settings.data);
				
				//update on init
				this.updateInfo();
								
			},
			
			//data is updated
			drawAndUpdate: function() {				
				Donut.update(this.settings.data); //update data	
				this.updateInfo();
			},

			//change color of donut graph
			setColorByIndex: function(colorIndex) {
				Donut.changeColor(colorIndex);				
			},
			
			//call the onChange method when data is updated
			updateInfo: function() {
				if (typeof this.settings.onChange === "function") {
					this.settings.onChange(Donut.getValues());
				}
			}
			
		} );

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function( options ) {	
			
			if (typeof arguments[0] === 'string') {
				var methodName = arguments[0];
				var args = Array.prototype.slice.call(arguments, 1);
				var returnVal;
				this.each(function() {
					if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
						returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
					// Allow instances to be destroyed via the 'destroy' method
					//https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Extending-jQuery-Boilerplate
					} else if (methodName === 'destroy') {
							$.data(this, 'plugin_' + pluginName, null);
						} else {
							throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
						}
				});
				if (returnVal !== undefined){
					return returnVal;
				} else {
					return this;
				}
			} else if (typeof options === "object" || !options) {
				return this.each(function() {
					if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
					}
				});
			}

			
		};
		

} )( jQuery, window, document, d3 );