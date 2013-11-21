/*
 * jQuery SmoothDivScroll 1.3
 *
 * Copyright (c) 2013 Thomas Kahn
 * Licensed under the GPL license.
 *
 * http://www.smoothdivscroll.com/
 *
 * Depends:
 * jquery-1.10.2.min.js
   Please use https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
   ...or later

 * jquery-ui-1.10.3.custom.min
   Make your own custom download at http://jqueryui.com/download.
   First deselect all components. Then check just "Widget" and "Effects Core".
   Download the file and put it in your javascript folder.

 * jquery.mousewheel.min.js
   Used for mousewheel functionality.
   Download the latest version at https://github.com/brandonaaron/jquery-mousewheel
 *

 * jquery.kinetic.min.js
   Used for scrolling by dragging, mainly used on touch devices.
   Download the latest version at https://github.com/davetayls/jquery.kinetic
 *
 */
(function ($) {

	$.widget("thomaskahn.smoothDivScroll", {
		// Default options
		options: {
			// Classes for elements added by Smooth Div Scroll
			scrollingHotSpotLeftClass: "scrollingHotSpotLeft", // String
			scrollingHotSpotRightClass: "scrollingHotSpotRight", // String
			scrollingHotSpotLeftVisibleClass: "scrollingHotSpotLeftVisible", // String
			scrollingHotSpotRightVisibleClass: "scrollingHotSpotRightVisible", // String
			scrollableAreaClass: "scrollableArea", // String
			scrollWrapperClass: "scrollWrapper", // String

			// Misc settings
			hiddenOnStart: false, // Boolean
			getContentOnLoad: {}, // Object
			countOnlyClass: "", // String
			startAtElementId: "", // String

			// Hotspot scrolling
			hotSpotScrolling: true, // Boolean
			hotSpotScrollingStep: 15, // Pixels
			hotSpotScrollingInterval: 10, // Milliseconds
			hotSpotMouseDownSpeedBooster: 3, // Integer
			visibleHotSpotBackgrounds: "hover", // always, onStart, hover or empty (no visible hotspots)
			hotSpotsVisibleTime: 5000, // Milliseconds
			easingAfterHotSpotScrolling: true, // Boolean
			easingAfterHotSpotScrollingDistance: 10, // Pixels
			easingAfterHotSpotScrollingDuration: 300, // Milliseconds
			easingAfterHotSpotScrollingFunction: "easeOutQuart", // String

			// Mousewheel scrolling
			mousewheelScrolling: "", // vertical, horizontal, allDirections or empty (no mousewheel scrolling) String
			mousewheelScrollingStep: 70, // Pixels
			easingAfterMouseWheelScrolling: true, // Boolean
			easingAfterMouseWheelScrollingDuration: 300, // Milliseconds
			easingAfterMouseWheelScrollingFunction: "easeOutQuart", // String

			// Manual scrolling (hotspot and/or mousewheel scrolling)
			manualContinuousScrolling: false, // Boolean

			// Autoscrolling
			autoScrollingMode: "", // always, onStart or empty (no auto scrolling) String
			autoScrollingDirection: "endlessLoopRight", // right, left, backAndForth, endlessLoopRight, endlessLoopLeft String
			autoScrollingStep: 1, // Pixels
			autoScrollingInterval: 10, // Milliseconds

			// Touch scrolling
			touchScrolling: false,

			// Easing for when the scrollToElement method is used
			scrollToAnimationDuration: 1000, // Milliseconds
			scrollToEasingFunction: "easeOutQuart" // String
		},
		_create: function () {
			var self = this, o = this.options, el = this.element;

			// Create variables for any existing or not existing 
			// scroller elements on the page.
			$.data(el, {
				"scrollWrapper": el.find("." + o.scrollWrapperClass),
				"scrollingHotSpotRight": el.find("." + o.scrollingHotSpotRightClass),
				"scrollingHotSpotLeft": el.find("." + o.scrollingHotSpotLeftClass),
				"scrollableArea": el.find("." + o.scrollableAreaClass)
			});

			// Check which elements are already present on the page. 
			// Create any elements needed by the plugin if
			// the user hasn't already created them.

			// First detach any present hot spots
			if ($.data(el, "scrollingHotSpotRight").length > 0) {

				$.data(el, "scrollingHotSpotRight").detach();
			}
			if ($.data(el, "scrollingHotSpotLeft").length > 0) {

				$.data(el, "scrollingHotSpotLeft").detach();
			}

			// Both the scrollable area and the wrapper are missing
			if ($.data(el, "scrollableArea").length === 0 && $.data(el, "scrollWrapper").length === 0) {
				el.wrapInner("<div class='" + o.scrollableAreaClass + "'>").wrapInner("<div class='" + o.scrollWrapperClass + "'>");

				$.data(el, {
					"scrollWrapper": el.find("." + o.scrollWrapperClass),
					"scrollableArea": el.find("." + o.scrollableAreaClass)
				});
			}
			// Only the wrapper is missing
			else if ($.data(el, "scrollWrapper").length === 0) {
				el.wrapInner("<div class='" + o.scrollWrapperClass + "'>");
				$.data(el, "scrollWrapper", el.find("." + o.scrollWrapperClass));
			}
			// Only the scrollable area is missing
			else if ($.data(el, "scrollableArea").length === 0) {
				$.data(el, "scrollWrapper").wrapInner("<div class='" + o.scrollableAreaClass + "'>");
				$.data(el, "scrollableArea", el.find("." + o.scrollableAreaClass));
			}

			// Put the right and left hot spot back into the scroller again
			// or create them if they where not present from the beginning.
			if ($.data(el, "scrollingHotSpotRight").length === 0) {
				el.prepend("<div class='" + o.scrollingHotSpotRightClass + "'></div>");
				$.data(el, "scrollingHotSpotRight", el.find("." + o.scrollingHotSpotRightClass));
			} else {
				el.prepend($.data(el, "scrollingHotSpotRight"));
			}

			if ($.data(el, "scrollingHotSpotLeft").length === 0) {
				el.prepend("<div class='" + o.scrollingHotSpotLeftClass + "'></div>");
				$.data(el, "scrollingHotSpotLeft", el.find("." + o.scrollingHotSpotLeftClass));
			} else {
				el.prepend($.data(el, "scrollingHotSpotLeft"));
			}


			// Create variables in the element data storage
			$.data(el, {
				"speedBooster": 1,
				"scrollXPos": 0,
				"hotSpotWidth": $.data(el, "scrollingHotSpotLeft").innerWidth(),
				"scrollableAreaWidth": 0,
				"startingPosition": 0,
				"rightScrollingInterval": null,
				"leftScrollingInterval": null,
				"autoScrollingInterval": null,
				"hideHotSpotBackgroundsInterval": null,
				"previousScrollLeft": 0,
				"pingPongDirection": "right",
				"getNextElementWidth": true,
				"swapAt": null,
				"startAtElementHasNotPassed": true,
				"swappedElement": null,
				"originalElements": $.data(el, "scrollableArea").children(o.countOnlyClass),
				"visible": true,
				"enabled": true,
				"scrollableAreaHeight": $.data(el, "scrollableArea").height(),
				"scrollerOffset": el.offset()
			});

			/*****************************************
			SET UP EVENTS FOR TOUCH SCROLLING
			*****************************************/
			if (o.touchScrolling && $.data(el, "enabled")) {
				// Use jquery.kinetic.js for touch scrolling
				// Vertical scrolling disabled
				$.data(el, "scrollWrapper").kinetic({
					y: false,
					moved: function (settings) {
						if (o.manualContinuousScrolling) {
							if ($.data(el, "scrollWrapper").scrollLeft() <= 0) {
								self._checkContinuousSwapLeft();
							} else {
								self._checkContinuousSwapRight();
							}
						}
						
						// Callback
						self._trigger("touchMoved");
					},
					stopped: function (settings) {
						// Stop any ongoing animations
						$.data(el, "scrollWrapper").stop(true, false);

						// Stop any ongoing auto scrolling
						self.stopAutoScrolling();
						
						// Callback
						self._trigger("touchStopped");
					}
				});
			}

			/*****************************************
			SET UP EVENTS FOR SCROLLING RIGHT
			*****************************************/
			// Check the mouse X position and calculate 
			// the relative X position inside the right hotspot
			$.data(el, "scrollingHotSpotRight").bind("mousemove", function (e) {
				if (o.hotSpotScrolling) {
					var x = e.pageX - (this.offsetLeft + $.data(el, "scrollerOffset").left);
					$.data(el, "scrollXPos", Math.round((x / $.data(el, "hotSpotWidth")) * o.hotSpotScrollingStep));

					// If the position is less then 1, it's set to 1
					if ($.data(el, "scrollXPos") === Infinity || $.data(el, "scrollXPos") < 1) {
						$.data(el, "scrollXPos", 1);
					}
				}
			});

			// Mouseover right hotspot - scrolling
			$.data(el, "scrollingHotSpotRight").bind("mouseover", function () {
				if (o.hotSpotScrolling) {
					// Stop any ongoing animations
					$.data(el, "scrollWrapper").stop(true, false);

					// Stop any ongoing auto scrolling
					self.stopAutoScrolling();

					// Start the scrolling interval
					$.data(el, "rightScrollingInterval", setInterval(function () {
						if ($.data(el, "scrollXPos") > 0 && $.data(el, "enabled")) {
							$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + ($.data(el, "scrollXPos") * $.data(el, "speedBooster")));

							if (o.manualContinuousScrolling) {
								self._checkContinuousSwapRight();
							}

							self._showHideHotSpots();
						}
					}, o.hotSpotScrollingInterval));

					// Callback
					self._trigger("mouseOverRightHotSpot");
				}
			});

			// Mouseout right hotspot - stop scrolling
			$.data(el, "scrollingHotSpotRight").bind("mouseout", function () {
				if (o.hotSpotScrolling) {
					clearInterval($.data(el, "rightScrollingInterval"));
					$.data(el, "scrollXPos", 0);

					// Easing out after scrolling
					if (o.easingAfterHotSpotScrolling && $.data(el, "enabled")) {
						$.data(el, "scrollWrapper").animate({ scrollLeft: $.data(el, "scrollWrapper").scrollLeft() + o.easingAfterHotSpotScrollingDistance }, { duration: o.easingAfterHotSpotScrollingDuration, easing: o.easingAfterHotSpotScrollingFunction });
					}
				}
			});


			// mousedown right hotspot (add scrolling speed booster)
			$.data(el, "scrollingHotSpotRight").bind("mousedown", function () {
				$.data(el, "speedBooster", o.hotSpotMouseDownSpeedBooster);
			});

			// mouseup anywhere (stop boosting the scrolling speed)
			$("body").bind("mouseup", function () {
				$.data(el, "speedBooster", 1);
			});

			/*****************************************
			SET UP EVENTS FOR SCROLLING LEFT
			*****************************************/
			// Check the mouse X position and calculate
			// the relative X position inside the left hotspot
			$.data(el, "scrollingHotSpotLeft").bind("mousemove", function (e) {
				if (o.hotSpotScrolling) {
					var x = ((this.offsetLeft + $.data(el, "scrollerOffset").left + $.data(el, "hotSpotWidth")) - e.pageX);

					$.data(el, "scrollXPos", Math.round((x / $.data(el, "hotSpotWidth")) * o.hotSpotScrollingStep));

					// If the position is less then 1, it's set to 1
					if ($.data(el, "scrollXPos") === Infinity || $.data(el, "scrollXPos") < 1) {
						$.data(el, "scrollXPos", 1);
					}
				}
			});

			// Mouseover left hotspot
			$.data(el, "scrollingHotSpotLeft").bind("mouseover", function () {
				if (o.hotSpotScrolling) {
					// Stop any ongoing animations
					$.data(el, "scrollWrapper").stop(true, false);

					// Stop any ongoing auto scrolling
					self.stopAutoScrolling();

					$.data(el, "leftScrollingInterval", setInterval(function () {
						if ($.data(el, "scrollXPos") > 0 && $.data(el, "enabled")) {
							$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() - ($.data(el, "scrollXPos") * $.data(el, "speedBooster")));

							if (o.manualContinuousScrolling) {
								self._checkContinuousSwapLeft();
							}

							self._showHideHotSpots();
						}
					}, o.hotSpotScrollingInterval));

					// Callback
					self._trigger("mouseOverLeftHotSpot");
				}
			});

			// mouseout left hotspot
			$.data(el, "scrollingHotSpotLeft").bind("mouseout", function () {
				if (o.hotSpotScrolling) {
					clearInterval($.data(el, "leftScrollingInterval"));
					$.data(el, "scrollXPos", 0);

					// Easing out after scrolling
					if (o.easingAfterHotSpotScrolling && $.data(el, "enabled")) {
						$.data(el, "scrollWrapper").animate({ scrollLeft: $.data(el, "scrollWrapper").scrollLeft() - o.easingAfterHotSpotScrollingDistance }, { duration: o.easingAfterHotSpotScrollingDuration, easing: o.easingAfterHotSpotScrollingFunction });
					}
				}
			});

			// mousedown left hotspot (add scrolling speed booster)
			$.data(el, "scrollingHotSpotLeft").bind("mousedown", function () {
				$.data(el, "speedBooster", o.hotSpotMouseDownSpeedBooster);
			});

			/*****************************************
			SET UP EVENT FOR MOUSEWHEEL SCROLLING
			*****************************************/
			$.data(el, "scrollableArea").mousewheel(function (event, delta, deltaX, deltaY) {

				if ($.data(el, "enabled") && o.mousewheelScrolling.length > 0) {
					var pixels;

					// Can be either positive or negative
					// Is multiplied/inverted by minus one since you want it to scroll 
					// left when moving the wheel down/right and right when moving the wheel up/left
					if (o.mousewheelScrolling === "vertical" && deltaY !== 0) {
						// Stop any ongoing auto scrolling if it's running
						self.stopAutoScrolling();
						event.preventDefault();
						pixels = Math.round((o.mousewheelScrollingStep * deltaY) * -1);
						self.move(pixels);
					} else if (o.mousewheelScrolling === "horizontal" && deltaX !== 0) {
						// Stop any ongoing auto scrolling if it's running
						self.stopAutoScrolling();
						event.preventDefault();
						pixels = Math.round((o.mousewheelScrollingStep * deltaX) * -1);
						self.move(pixels);
					} else if (o.mousewheelScrolling === "allDirections") {
						// Stop any ongoing auto scrolling if it's running
						self.stopAutoScrolling();
						event.preventDefault();
						pixels = Math.round((o.mousewheelScrollingStep * delta) * -1);
						self.move(pixels);
					}


				}
			});

			// Capture and disable mousewheel events when the pointer
			// is over any of the hotspots
			if (o.mousewheelScrolling) {
				$.data(el, "scrollingHotSpotLeft").add($.data(el, "scrollingHotSpotRight")).mousewheel(function (event) {
					event.preventDefault();
				});
			}

			/*****************************************
			SET UP EVENT FOR RESIZING THE BROWSER WINDOW
			*****************************************/
			$(window).bind("resize", function () {
				self._showHideHotSpots();
				self._trigger("windowResized");
			});

			/*****************************************
			FETCHING CONTENT ON INITIALIZATION
			*****************************************/
			// If getContentOnLoad is present in the options, 
			// sort out the method and parameters and get the content

			if (!(jQuery.isEmptyObject(o.getContentOnLoad))) {
				self[o.getContentOnLoad.method](o.getContentOnLoad.content, o.getContentOnLoad.manipulationMethod, o.getContentOnLoad.addWhere, o.getContentOnLoad.filterTag);
			}

			// Should it be hidden on start?
			if (o.hiddenOnStart) {
				self.hide();
			}

			/*****************************************
			AUTOSCROLLING
			*****************************************/
			// The $(window).load event handler is used because the width of the elements are not calculated
			// properly until then, at least not in Google Chrome. The start of the auto scrolling and the
			// setting of the hotspot backgrounds is started here as well for the same reason. 
			// If the auto scrolling is not started in $(window).load, it won't start because it 
			// will interpret the scrollable areas as too short.
			$(window).load(function () {

				// If scroller is not hidden, recalculate the scrollable area
				if (!(o.hiddenOnStart)) {
					self.recalculateScrollableArea();
				}

				// Autoscrolling is active
				if ((o.autoScrollingMode.length > 0) && !(o.hiddenOnStart)) {
					self.startAutoScrolling();
				}

				// If the user wants to have visible hotspot backgrounds, 
				// here is where it's taken care of
				if (o.autoScrollingMode !== "always") {

					switch (o.visibleHotSpotBackgrounds) {
						case "always":
							self.showHotSpotBackgrounds();
							break;
						case "onStart":
							self.showHotSpotBackgrounds();
							$.data(el, "hideHotSpotBackgroundsInterval", setTimeout(function () {
								self.hideHotSpotBackgrounds(250);
							}, o.hotSpotsVisibleTime));
							break;
						case "hover":
							el.mouseenter(function (event) {
								if (o.hotSpotScrolling) {
									event.stopPropagation();
									self.showHotSpotBackgrounds(250);
								}
							}).mouseleave(function (event) {
								if (o.hotSpotScrolling) {
									event.stopPropagation();
									self.hideHotSpotBackgrounds(250);
								}
							});
							break;
						default:
							break;
					}
				}

				self._showHideHotSpots();

				self._trigger("setupComplete");

			});

		},
		/**********************************************************
		Override _setOption and handle altered options
		**********************************************************/
		_setOption: function (key, value) {
			var self = this, o = this.options, el = this.element;

			// Update option
			o[key] = value;

			if (key === "hotSpotScrolling") {
				// Handler if the option hotSpotScrolling is altered
				if (value === true) {
					self._showHideHotSpots();
				} else {
					$.data(el, "scrollingHotSpotLeft").hide();
					$.data(el, "scrollingHotSpotRight").hide();
				}
			} else if (key === "autoScrollingStep" ||
			// Make sure that certain values are integers, otherwise
			// they will summon bad spirits in the plugin
				key === "easingAfterHotSpotScrollingDistance" ||
				key === "easingAfterHotSpotScrollingDuration" ||
				key === "easingAfterMouseWheelScrollingDuration") {
				o[key] = parseInt(value, 10);
			} else if (key === "autoScrollingInterval") {
				// Handler if the autoScrollingInterval is altered
				o[key] = parseInt(value, 10);
				self.startAutoScrolling();
			}

		},
		/**********************************************************
		Hotspot functions
		**********************************************************/
		showHotSpotBackgrounds: function (fadeSpeed) {

			// Alter the CSS (SmoothDivScroll.css) if you want to customize
			// the look'n'feel of the visible hotspots
			var self = this, el = this.element, o = this.options;


			// Fade in the hotspot backgrounds
			if (fadeSpeed !== undefined) {
				// Before the fade-in starts, we need to make sure the opacity is zero
				//$.data(el, "scrollingHotSpotLeft").add($.data(el, "scrollingHotSpotRight")).css("opacity", "0.0");

				$.data(el, "scrollingHotSpotLeft").addClass(o.scrollingHotSpotLeftVisibleClass);
				$.data(el, "scrollingHotSpotRight").addClass(o.scrollingHotSpotRightVisibleClass);

				// Fade in the hotspots
				$.data(el, "scrollingHotSpotLeft").add($.data(el, "scrollingHotSpotRight")).fadeTo(fadeSpeed, 0.35);
			}
			// Don't fade, just show them
			else {

				// The left hotspot
				$.data(el, "scrollingHotSpotLeft").addClass(o.scrollingHotSpotLeftVisibleClass);
				$.data(el, "scrollingHotSpotLeft").removeAttr("style");

				// The right hotspot
				$.data(el, "scrollingHotSpotRight").addClass(o.scrollingHotSpotRightVisibleClass);
				$.data(el, "scrollingHotSpotRight").removeAttr("style");
			}

			self._showHideHotSpots();

		},
		hideHotSpotBackgrounds: function (fadeSpeed) {
			var el = this.element, o = this.option;

			// Fade out the hotspot backgrounds
			if (fadeSpeed !== undefined) {

				// Fade out the left hotspot
				$.data(el, "scrollingHotSpotLeft").fadeTo(fadeSpeed, 0.0, function () {
					$.data(el, "scrollingHotSpotLeft").removeClass(o.scrollingHotSpotLeftVisibleClass);
				});

				// Fade out the right hotspot
				$.data(el, "scrollingHotSpotRight").fadeTo(fadeSpeed, 0.0, function () {
					$.data(el, "scrollingHotSpotRight").removeClass(o.scrollingHotSpotRightVisibleClass);
				});

			}
			// Don't fade, just hide them
			else {
				$.data(el, "scrollingHotSpotLeft").removeClass(o.scrollingHotSpotLeftVisibleClass).removeAttr("style");
				$.data(el, "scrollingHotSpotRight").removeClass(o.scrollingHotSpotRightVisibleClass).removeAttr("style");
			}

		},
		// Function for showing and hiding hotspots depending on the
		// offset of the scrolling
		_showHideHotSpots: function () {
			var self = this, el = this.element, o = this.options;

			// Hot spot scrolling is not enabled so show no hot spots
			if (!(o.hotSpotScrolling)) {
				$.data(el, "scrollingHotSpotLeft").hide();
				$.data(el, "scrollingHotSpotRight").hide();
			} else {

				// If the manual continuous scrolling option is set show both
				if (o.manualContinuousScrolling && o.hotSpotScrolling && o.autoScrollingMode !== "always") {
					$.data(el, "scrollingHotSpotLeft").show();
					$.data(el, "scrollingHotSpotRight").show();
				}
				// Autoscrolling not set to always and hotspot scrolling enabled.
				// Regular hot spot scrolling.
				else if (o.autoScrollingMode !== "always" && o.hotSpotScrolling) {
					// If the scrollable area is shorter than the scroll wrapper, both hotspots
					// should be hidden
					if ($.data(el, "scrollableAreaWidth") <= ($.data(el, "scrollWrapper").innerWidth())) {
						$.data(el, "scrollingHotSpotLeft").hide();
						$.data(el, "scrollingHotSpotRight").hide();
					}
					// When you can't scroll further left the left scroll hotspot should be hidden
					// and the right hotspot visible.
					else if ($.data(el, "scrollWrapper").scrollLeft() === 0) {
						$.data(el, "scrollingHotSpotLeft").hide();
						$.data(el, "scrollingHotSpotRight").show();
						// Callback
						self._trigger("scrollerLeftLimitReached");
						// Clear interval
						clearInterval($.data(el, "leftScrollingInterval"));
						$.data(el, "leftScrollingInterval", null);
					}
					// When you can't scroll further right
					// the right scroll hotspot should be hidden
					// and the left hotspot visible
					else if ($.data(el, "scrollableAreaWidth") <= ($.data(el, "scrollWrapper").innerWidth() + $.data(el, "scrollWrapper").scrollLeft())) {
						$.data(el, "scrollingHotSpotLeft").show();
						$.data(el, "scrollingHotSpotRight").hide();
						// Callback
						self._trigger("scrollerRightLimitReached");
						// Clear interval
						clearInterval($.data(el, "rightScrollingInterval"));
						$.data(el, "rightScrollingInterval", null);
					}
					// If you are somewhere in the middle of your
					// scrolling, both hotspots should be visible
					else {
						$.data(el, "scrollingHotSpotLeft").show();
						$.data(el, "scrollingHotSpotRight").show();
					}
				}
				// If auto scrolling is set to always, there should be no hotspots
				else {
					$.data(el, "scrollingHotSpotLeft").hide();
					$.data(el, "scrollingHotSpotRight").hide();
				}
			}



		},
		// Function for calculating the scroll position of a certain element
		_setElementScrollPosition: function (method, element) {
			var el = this.element, o = this.options, tempScrollPosition = 0;

			switch (method) {
				case "first":
					$.data(el, "scrollXPos", 0);
					return true;
				case "start":
					// Check to see if there is a specified start element in the options 
					// and that the element exists in the DOM
					if (o.startAtElementId !== "") {
						if ($.data(el, "scrollableArea").has("#" + o.startAtElementId)) {
							tempScrollPosition = $("#" + o.startAtElementId).position().left;
							$.data(el, "scrollXPos", tempScrollPosition);
							return true;
						}
					}
					return false;
				case "last":
					$.data(el, "scrollXPos", ($.data(el, "scrollableAreaWidth") - $.data(el, "scrollWrapper").innerWidth()));
					return true;
				case "number":
					// Check to see that an element number is passed
					if (!(isNaN(element))) {
						tempScrollPosition = $.data(el, "scrollableArea").children(o.countOnlyClass).eq(element - 1).position().left;
						$.data(el, "scrollXPos", tempScrollPosition);
						return true;
					}
					return false;
				case "id":
					// Check that an element id is passed and that the element exists in the DOM
					if (element.length > 0) {
						if ($.data(el, "scrollableArea").has("#" + element)) {
							tempScrollPosition = $("#" + element).position().left;
							$.data(el, "scrollXPos", tempScrollPosition);
							return true;
						}
					}
					return false;
				default:
					return false;
			}


		},
		/**********************************************************
		Jumping to a certain element
		**********************************************************/
		jumpToElement: function (jumpTo, element) {
			var self = this, el = this.element;

			// Check to see that the scroller is enabled
			if ($.data(el, "enabled")) {
				// Get the position of the element to scroll to
				if (self._setElementScrollPosition(jumpTo, element)) {
					// Jump to the element
					$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollXPos"));
					// Check the hotspots
					self._showHideHotSpots();
					// Trigger the right callback
					switch (jumpTo) {
						case "first":
							self._trigger("jumpedToFirstElement");
							break;
						case "start":
							self._trigger("jumpedToStartElement");
							break;
						case "last":
							self._trigger("jumpedToLastElement");
							break;
						case "number":
							self._trigger("jumpedToElementNumber", null, { "elementNumber": element });
							break;
						case "id":
							self._trigger("jumpedToElementId", null, { "elementId": element });
							break;
						default:
							break;
					}

				}
			}
		},
		/**********************************************************
		Scrolling to a certain element
		**********************************************************/
		scrollToElement: function (scrollTo, element) {
			var self = this, el = this.element, o = this.options, autoscrollingWasRunning = false;

			if ($.data(el, "enabled")) {
				// Get the position of the element to scroll to
				if (self._setElementScrollPosition(scrollTo, element)) {
					// Stop any ongoing auto scrolling
					if ($.data(el, "autoScrollingInterval") !== null) {
						self.stopAutoScrolling();
						autoscrollingWasRunning = true;
					}

					// Stop any other running animations
					// (clear queue but don't jump to the end)
					$.data(el, "scrollWrapper").stop(true, false);

					// Do the scolling animation
					$.data(el, "scrollWrapper").animate({
						scrollLeft: $.data(el, "scrollXPos")
					}, { duration: o.scrollToAnimationDuration, easing: o.scrollToEasingFunction, complete: function () {
						// If auto scrolling was running before, start it again
						if (autoscrollingWasRunning) {
							self.startAutoScrolling();
						}

						self._showHideHotSpots();

						// Trigger the right callback
						switch (scrollTo) {
							case "first":
								self._trigger("scrolledToFirstElement");
								break;
							case "start":
								self._trigger("scrolledToStartElement");
								break;
							case "last":
								self._trigger("scrolledToLastElement");
								break;
							case "number":
								self._trigger("scrolledToElementNumber", null, { "elementNumber": element });
								break;
							case "id":
								self._trigger("scrolledToElementId", null, { "elementId": element });
								break;
							default:
								break;
						}
					}
					});
				}
			}

		},
		move: function (pixels) {
			var self = this, el = this.element, o = this.options;
			// clear queue, move to end
			$.data(el, "scrollWrapper").stop(true, true);

			// Only run this code if it's possible to scroll left or right,
			if ((pixels < 0 && $.data(el, "scrollWrapper").scrollLeft() > 0) || (pixels > 0 && $.data(el, "scrollableAreaWidth") > ($.data(el, "scrollWrapper").innerWidth() + $.data(el, "scrollWrapper").scrollLeft())) || o.manualContinuousScrolling ) {

        var scrollLength = $.data(el, "scrollableArea").width() - $.data(el, "scrollWrapper").width();
        var sOffset = $.data(el, "scrollWrapper").scrollLeft() + pixels;

        if( sOffset < 0 ) { // Swap last element to be the first one if scroll out of the left edge of view
                
            function forceSwapElementLeft(){
              $.data(el, "swappedElement", $.data(el, "scrollableArea").children(":last").detach());
              $.data(el, "scrollableArea").prepend($.data(el, "swappedElement"));
              $.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + $.data(el, "swappedElement").outerWidth(true));              
            }
            
            while(sOffset < 0 ){ // keep swap elements left until it has enough length for scrolling left
              forceSwapElementLeft();
              sOffset = $.data(el, "scrollableArea").children(":first").outerWidth(true) + sOffset;                   
            }

        } else if( sOffset - scrollLength > 0 ){ // Swap the first element to be the last one if scroll out of the right edge of view
           
          function forceSwapElementRight(){            
            $.data(el, "swappedElement", $.data(el, "scrollableArea").children(":first").detach());
            $.data(el, "scrollableArea").append($.data(el, "swappedElement"));
            var wrapperLeft = $.data(el, "scrollWrapper").scrollLeft();
            $.data(el, "scrollWrapper").scrollLeft(wrapperLeft - $.data(el, "swappedElement").outerWidth(true));            
          }
          
          while( sOffset - scrollLength > 0 ){ // keep swap elements right until it has enough length for scrolling right
            forceSwapElementRight();
            sOffset = sOffset - $.data(el, "scrollableArea").children(":last").outerWidth(true);              
          }
          
        }
          
				if (o.easingAfterMouseWheelScrolling) {
        
          $.data(el, "scrollWrapper").animate({ scrollLeft: $.data(el, "scrollWrapper").scrollLeft() + pixels }, { duration: o.easingAfterMouseWheelScrollingDuration, easing: o.easingAfterMouseWheelFunction, complete: function () {
            self._showHideHotSpots();
            if (o.manualContinuousScrolling) {
              if (pixels > 0) {
                self._checkContinuousSwapRight();
              } else {
                self._checkContinuousSwapLeft();
              }
            }
          }
          });
          
				} else {
					$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + pixels);
					self._showHideHotSpots();

					if (o.manualContinuousScrolling) {
						if (pixels > 0) {
							self._checkContinuousSwapRight();
						} else {
							self._checkContinuousSwapLeft();
						}
					}
				}
         

			}

   },
		/**********************************************************
		Adding or replacing content
		**********************************************************/
		/*  Arguments are:
		content - a valid URL to a Flickr feed - string
		manipulationMethod - addFirst, addLast or replace (default) - string
		*/
		getFlickrContent: function (content, manipulationMethod) {
			var self = this, el = this.element;

			$.getJSON(content, function (data) {
				// small square - size is 75x75
				// thumbnail -> large - size is the longest side
				var flickrImageSizes = [{ size: "small square", pixels: 75, letter: "_s" },
										{ size: "thumbnail", pixels: 100, letter: "_t" },
										{ size: "small", pixels: 240, letter: "_m" },
										{ size: "medium", pixels: 500, letter: "" },
										{ size: "medium 640", pixels: 640, letter: "_z" },
										{ size: "large", pixels: 1024, letter: "_b"}];
				var loadedFlickrImages = [];
				var imageIdStringBuffer = [];
				var startingIndex;
				var numberOfFlickrItems = data.items.length;
				var loadedFlickrImagesCounter = 0;

				// Determine a plausible starting value for the
				// image height
				if ($.data(el, "scrollableAreaHeight") <= 75) {
					startingIndex = 0;
				} else if ($.data(el, "scrollableAreaHeight") <= 100) {
					startingIndex = 1;
				} else if ($.data(el, "scrollableAreaHeight") <= 240) {
					startingIndex = 2;
				} else if ($.data(el, "scrollableAreaHeight") <= 500) {
					startingIndex = 3;
				} else if ($.data(el, "scrollableAreaHeight") <= 640) {
					startingIndex = 4;
				} else {
					startingIndex = 5;
				}

				// Put all items from the feed in an array.
				// This is necessary
				$.each(data.items, function (index, item) {
					loadFlickrImage(item, startingIndex);
				});

				function loadFlickrImage(item, sizeIndex) {
					var path = item.media.m;
					var imgSrc = path.replace("_m", flickrImageSizes[sizeIndex].letter);
					var tempImg = $("<img />").attr("src", imgSrc);

					tempImg.load(function () {
						// Is it still smaller? Load next size
						if (this.height < $.data(el, "scrollableAreaHeight")) {
							// Load a bigger image, if possible
							if ((sizeIndex + 1) < flickrImageSizes.length) {
								loadFlickrImage(item, sizeIndex + 1);
							} else {
								addImageToLoadedImages(this);
							}
						}
						else {
							addImageToLoadedImages(this);
						}

						// Finishing stuff to do when all images have been loaded
						if (loadedFlickrImagesCounter === numberOfFlickrItems) {
							switch (manipulationMethod) {
								case "addFirst":
									// Add the loaded content first in the scrollable area
									$.data(el, "scrollableArea").children(":first").before(loadedFlickrImages);
									break;
								case "addLast":
									// Add the loaded content last in the scrollable area
									$.data(el, "scrollableArea").children(":last").after(loadedFlickrImages);
									break;
								default:
									// Replace the content in the scrollable area
									$.data(el, "scrollableArea").html(loadedFlickrImages);
									break;
							}

							// Recalculate the total width of the elements inside the scrollable area
							self.recalculateScrollableArea();

							// Determine which hotspots to show
							self._showHideHotSpots();

							// Trigger callback
							self._trigger("addedFlickrContent", null, { "addedElementIds": imageIdStringBuffer });
						}

					});
				}

				// Add the loaded content first or last in the scrollable area
				function addImageToLoadedImages(imageObj) {
					// Calculate the scaled width
					var widthScalingFactor = $.data(el, "scrollableAreaHeight") / imageObj.height;
					var tempWidth = Math.round(imageObj.width * widthScalingFactor);
					// Set an id for the image - the filename is used as an id
					var tempIdArr = $(imageObj).attr("src").split("/");
					var lastElemIndex = (tempIdArr.length - 1);
					tempIdArr = tempIdArr[lastElemIndex].split(".");
					$(imageObj).attr("id", tempIdArr[0]);
					// Set the height of the image to the height of the scrollable area and add the width
					$(imageObj).css({ "height": $.data(el, "scrollableAreaHeight"), "width": tempWidth });
					// Add the id of the image to the array of id's - this
					// is used as a parameter when the callback is triggered
					imageIdStringBuffer.push(tempIdArr[0]);
					// Add the image to the array of loaded images
					loadedFlickrImages.push(imageObj);

					// Increment counter for loaded images
					loadedFlickrImagesCounter++;
				}

			});
		},
		/*  Arguments are:
		content - a valid URL to an AJAX content source - string
		manipulationMethod - addFirst, addLast or replace (default) - string
		filterTag - a jQuery selector that matches the elements from the AJAX content
		source that you want, for example ".myClass" or "#thisDiv" or "div" - string
		*/
		getAjaxContent: function (content, manipulationMethod, filterTag) {
			var self = this, el = this.element;
			$.ajaxSetup({ cache: false });

			$.get(content, function (data) {
				var filteredContent;

				if (filterTag !== undefined) {
					if (filterTag.length > 0) {
						// A bit of a hack since I can't know if the element
						// that the user wants is a direct child of body (= use filter)
						// or other types of elements (= use find)
						filteredContent = $("<div>").html(data).find(filterTag);
					} else {
						filteredContent = content;
					}
				} else {
					filteredContent = data;
				}

				switch (manipulationMethod) {
					case "addFirst":
						// Add the loaded content first in the scrollable area
						$.data(el, "scrollableArea").children(":first").before(filteredContent);
						break;
					case "addLast":
						// Add the loaded content last in the scrollable area
						$.data(el, "scrollableArea").children(":last").after(filteredContent);
						break;
					default:
						// Replace the content in the scrollable area
						$.data(el, "scrollableArea").html(filteredContent);
						break;
				}

				// Recalculate the total width of the elements inside the scrollable area
				self.recalculateScrollableArea();

				// Determine which hotspots to show
				self._showHideHotSpots();

				// Trigger callback
				self._trigger("addedAjaxContent");

			});
		},
		getHtmlContent: function (content, manipulationMethod, filterTag) {
			var self = this, el = this.element;

			// No AJAX involved at all - just add raw HTML-content
			/* Arguments are:
			content - any raw HTML that you want - string
			manipulationMethod - addFirst, addLast or replace (default) - string
			filterTag - a jQuery selector that matches the elements from the AJAX content
			source that you want, for example ".myClass" or "#thisDiv" or "div" - string
			*/
			var filteredContent;
			if (filterTag !== undefined) {
				if (filterTag.length > 0) {
					// A bit of a hack since I can't know if the element
					// that the user wants is a direct child of body (= use filter)
					// or other types of elements (= use find)
					filteredContent = $("<div>").html(content).find(filterTag);
				} else {
					filteredContent = content;
				}
			} else {
				filteredContent = content;
			}

			switch (manipulationMethod) {
				case "addFirst":
					// Add the loaded content first in the scrollable area
					$.data(el, "scrollableArea").children(":first").before(filteredContent);
					break;
				case "addLast":
					// Add the loaded content last in the scrollable area
					$.data(el, "scrollableArea").children(":last").after(filteredContent);
					break;
				default:
					// Replace the content in the scrollable area
					$.data(el, "scrollableArea").html(filteredContent);
					break;
			}

			// Recalculate the total width of the elements inside the scrollable area
			self.recalculateScrollableArea();
	
			// Determine which hotspots to show
			self._showHideHotSpots();

			// Trigger callback
			self._trigger("addedHtmlContent");

		},
		/**********************************************************
		Recalculate the scrollable area
		**********************************************************/
		recalculateScrollableArea: function () {

			var tempScrollableAreaWidth = 0, foundStartAtElement = false, o = this.options, el = this.element;

			// Add up the total width of all the items inside the scrollable area
			$.data(el, "scrollableArea").children(o.countOnlyClass).each(function () {
				// Check to see if the current element in the loop is the one where the scrolling should start
				if ((o.startAtElementId.length > 0) && (($(this).attr("id")) === o.startAtElementId)) {
					$.data(el, "startingPosition", tempScrollableAreaWidth);
					foundStartAtElement = true;
				}
				tempScrollableAreaWidth = tempScrollableAreaWidth + $(this).outerWidth(true);

			});

			// If the element with the ID specified by startAtElementId
			// is not found, reset it
			if (!(foundStartAtElement)) {
				$.data(el, "startAtElementId", "");
			}

			// Set the width of the scrollable area
			$.data(el, "scrollableAreaWidth", tempScrollableAreaWidth);
			$.data(el, "scrollableArea").width($.data(el, "scrollableAreaWidth"));

			// Move to the starting position
			$.data(el, "scrollWrapper").scrollLeft($.data(el, "startingPosition"));
			$.data(el, "scrollXPos", $.data(el, "startingPosition"));
		},
		/**********************************************************
		Get current scrolling left offset
		**********************************************************/
		getScrollerOffset: function () {
			var el = this.element;

			// Returns the current left offset
			// Please remember that if the scroller is in continuous
			// mode, the offset is not that relevant anymore since
			// the plugin will swap the elements inside the scroller
			// around and manipulate the offset in this process.
			return $.data(el, "scrollWrapper").scrollLeft();
		},
		/**********************************************************
		Stopping, starting and doing the auto scrolling
		**********************************************************/
		stopAutoScrolling: function () {
			var self = this, el = this.element;

			if ($.data(el, "autoScrollingInterval") !== null) {
				clearInterval($.data(el, "autoScrollingInterval"));
				$.data(el, "autoScrollingInterval", null);

				// Check to see which hotspots should be active
				// in the position where the scroller has stopped
				self._showHideHotSpots();

				self._trigger("autoScrollingStopped");
			}
		},
		/**********************************************************
		Start Autoscrolling
		**********************************************************/
		startAutoScrolling: function () {
			var self = this, el = this.element, o = this.options;

			if ($.data(el, "enabled")) {
				self._showHideHotSpots();

				// Stop any running interval
				clearInterval($.data(el, "autoScrollingInterval"));
				$.data(el, "autoScrollingInterval", null);

				// Callback
				self._trigger("autoScrollingStarted");

				// Start interval
				$.data(el, "autoScrollingInterval", setInterval(function () {

					// If the scroller is not visible or
					// if the scrollable area is shorter than the scroll wrapper
					// any running auto scroll interval should stop.
					if (!($.data(el, "visible")) || ($.data(el, "scrollableAreaWidth") <= ($.data(el, "scrollWrapper").innerWidth()))) {
						// Stop any running interval
						clearInterval($.data(el, "autoScrollingInterval"));
						$.data(el, "autoScrollingInterval", null);

					}
					else {

						// Store the old scrollLeft value to see if the scrolling has reached the end
						$.data(el, "previousScrollLeft", $.data(el, "scrollWrapper").scrollLeft());

						switch (o.autoScrollingDirection) {
							case "right":

								$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + o.autoScrollingStep);
								if ($.data(el, "previousScrollLeft") === $.data(el, "scrollWrapper").scrollLeft()) {
									self._trigger("autoScrollingRightLimitReached");
									clearInterval($.data(el, "autoScrollingInterval"));
									$.data(el, "autoScrollingInterval", null);
									self._trigger("autoScrollingIntervalStopped");
								}
								break;

							case "left":
								$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() - o.autoScrollingStep);
								if ($.data(el, "previousScrollLeft") === $.data(el, "scrollWrapper").scrollLeft()) {
									self._trigger("autoScrollingLeftLimitReached");
									clearInterval($.data(el, "autoScrollingInterval"));
									$.data(el, "autoScrollingInterval", null);
									self._trigger("autoScrollingIntervalStopped");
								}
								break;

							case "backAndForth":
								if ($.data(el, "pingPongDirection") === "right") {
									$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + (o.autoScrollingStep));
								}
								else {
									$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() - (o.autoScrollingStep));
								}

								// If the scrollLeft hasnt't changed it means that the scrolling has reached
								// the end and the direction should be switched
								if ($.data(el, "previousScrollLeft") === $.data(el, "scrollWrapper").scrollLeft()) {
									if ($.data(el, "pingPongDirection") === "right") {
										$.data(el, "pingPongDirection", "left");
										self._trigger("autoScrollingRightLimitReached");
									}
									else {
										$.data(el, "pingPongDirection", "right");
										self._trigger("autoScrollingLeftLimitReached");
									}
								}
								break;

							case "endlessLoopRight":

								// Do the auto scrolling
								$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + o.autoScrollingStep);

								self._checkContinuousSwapRight();
								break;
							case "endlessLoopLeft":

								// Do the auto scrolling
								$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() - o.autoScrollingStep);

								self._checkContinuousSwapLeft();
								break;
							default:
								break;

						}
					}
				}, o.autoScrollingInterval));
			}
		},
		/**********************************************************
		Check Continuos Swap Right
		**********************************************************/
		_checkContinuousSwapRight: function () {
			var el = this.element, o = this.options;

			// Get the width of the first element. When it has scrolled out of view,
			// the element swapping should be executed. A true/false variable is used
			// as a flag variable so the swapAt value doesn't have to be recalculated
			// in each loop.  
			if ($.data(el, "getNextElementWidth")) {

				if ((o.startAtElementId.length > 0) && ($.data(el, "startAtElementHasNotPassed"))) {
					// If the user has set a certain element to start at, set swapAt 
					// to that element width. This happens once.
					$.data(el, "swapAt", $("#" + o.startAtElementId).outerWidth(true));
					$.data(el, "startAtElementHasNotPassed", false);
				}
				else {
					// Set swapAt to the first element in the scroller
					$.data(el, "swapAt", $.data(el, "scrollableArea").children(":first").outerWidth(true));
				}
				$.data(el, "getNextElementWidth", false);
			}


			// Check to see if the swap should be done
			if ($.data(el, "swapAt") <= $.data(el, "scrollWrapper").scrollLeft()) {
				$.data(el, "swappedElement", $.data(el, "scrollableArea").children(":first").detach());
				$.data(el, "scrollableArea").append($.data(el, "swappedElement"));
				var wrapperLeft = $.data(el, "scrollWrapper").scrollLeft();
				$.data(el, "scrollWrapper").scrollLeft(wrapperLeft - $.data(el, "swappedElement").outerWidth(true));
				$.data(el, "getNextElementWidth", true);
			}
		},
		/**********************************************************
		Check Continuos Swap Left
		**********************************************************/
		_checkContinuousSwapLeft: function () {
			var el = this.element, o = this.options;

			// Get the width of the first element. When it has scrolled out of view,
			// the element swapping should be executed. A true/false variable is used
			// as a flag variable so the swapAt value doesn't have to be recalculated
			// in each loop.

			if ($.data(el, "getNextElementWidth")) {
				if ((o.startAtElementId.length > 0) && ($.data(el, "startAtElementHasNotPassed"))) {
					$.data(el, "swapAt", $("#" + o.startAtElementId).outerWidth(true));
					$.data(el, "startAtElementHasNotPassed", false);
				}
				else {
					$.data(el, "swapAt", $.data(el, "scrollableArea").children(":first").outerWidth(true));
				}

				$.data(el, "getNextElementWidth", false);
			}

			// Check to see if the swap should be done
			if ($.data(el, "scrollWrapper").scrollLeft() === 0) {
       
				$.data(el, "swappedElement", $.data(el, "scrollableArea").children(":last").detach());
				$.data(el, "scrollableArea").prepend($.data(el, "swappedElement"));
				$.data(el, "scrollWrapper").scrollLeft($.data(el, "scrollWrapper").scrollLeft() + $.data(el, "swappedElement").outerWidth(true));
				$.data(el, "getNextElementWidth", true);
        
			}

		},
		restoreOriginalElements: function () {
			var self = this, el = this.element;

			// Restore the original content of the scrollable area
			$.data(el, "scrollableArea").html($.data(el, "originalElements"));
			self.recalculateScrollableArea();
			self.jumpToElement("first");
		},
		show: function () {
			var el = this.element;
			$.data(el, "visible", true);
			el.show();
		},
		hide: function () {
			var el = this.element;
			$.data(el, "visible", false);
			el.hide();
		},
		enable: function () {
			var el = this.element;

			// Enable touch scrolling
			if (this.options.touchScrolling) {
				$.data(el, "scrollWrapper").kinetic('attach');
			}

			// Set enabled to true
			$.data(el, "enabled", true);
		},
		disable: function () {
			var self = this, el = this.element;

			// Clear all running intervals
			self.stopAutoScrolling();
			clearInterval($.data(el, "rightScrollingInterval"));
			clearInterval($.data(el, "leftScrollingInterval"));
			clearInterval($.data(el, "hideHotSpotBackgroundsInterval"));

			// Disable touch scrolling
			if (this.options.touchScrolling) {
				$.data(el, "scrollWrapper").kinetic('detach');
			}

			// Set enabled to false
			$.data(el, "enabled", false);
		},
		destroy: function () {
			var self = this, el = this.element;

			// Clear all running intervals
			self.stopAutoScrolling();
			clearInterval($.data(el, "rightScrollingInterval"));
			clearInterval($.data(el, "leftScrollingInterval"));
			clearInterval($.data(el, "hideHotSpotBackgroundsInterval"));

			// Remove all element specific events
			$.data(el, "scrollingHotSpotRight").unbind("mouseover");
			$.data(el, "scrollingHotSpotRight").unbind("mouseout");
			$.data(el, "scrollingHotSpotRight").unbind("mousedown");

			$.data(el, "scrollingHotSpotLeft").unbind("mouseover");
			$.data(el, "scrollingHotSpotLeft").unbind("mouseout");
			$.data(el, "scrollingHotSpotLeft").unbind("mousedown");

			el.unbind("mousenter");
			el.unbind("mouseleave");

			// Remove all elements created by the plugin
			$.data(el, "scrollingHotSpotRight").remove();
			$.data(el, "scrollingHotSpotLeft").remove();
			$.data(el, "scrollableArea").remove();
			$.data(el, "scrollWrapper").remove();

			// Restore the original content of the scrollable area
			el.html($.data(el, "originalElements"));

			// Call the base destroy function
			$.Widget.prototype.destroy.apply(this, arguments);

		}


	});
})(jQuery);
