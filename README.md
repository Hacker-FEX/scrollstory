# ScrollStory

jQuery UI widget for stacked, scroll-based stories (or items) that need to give focus to a single item at a time.

Key features include:
- 100% style agnostic. Just a collection of often-used scroll-based patterns.
- Can can you existing DOM or use an array of objects to create markup.
- 16+ jQueryUI-style events/callbacks for various application state events.
- Focus and blur event when an individual story becomes active or inactive.
- Items can be grouped into categories, with event dispatched as categories change.
- Items filterable by user-specifed tags.
- Items aware of their in-viewport status.
- Programatic animated scroll to any item.
- Throttled scroll events and minimal DOM usage.

## Dependencies
Any recent version of:
- jQuery
- jQuery UI (core, widget and optionally effects core for custom easings)
- Underscore

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/sjwilliams/scrollstory/master/dist/scrollstory.min.js
[max]: https://raw.github.com/sjwilliams/scrollstory/master/dist/scrollstory.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="jquery-ui.js"></script>
<script src="underscore.js"></script>
<script src="dist/scrollstory.min.js"></script>
<script>
jQuery(function($) {
  $('#container').ScrollStory();
});
</script>
```

## Documentation
### Basic Use
```javascript
$('#container').ScrollStory();
```
In its most basic form, ScrollStory takes an element and searches for '.story' child elements. Internally, ScrollStory turns those elements into 'item' objects and assigns them lots of default properities, like its 'index' position in the list, 'topOffset' (point from the top at which is becomes active), it's 'inViewport' status (true or false), and whether it has a custom 'scrollOffet' (or point on page it triggers active, different from the other items). These are covered in detail below.

In addition to object properties, ScrollStory modifies the DOM in a few ways: 
* A class of 'storyScroll_story' is added to every item
* A class of 'active' is added to the currently active item
* A class of 'scrollStory_active' is added to the container if any item is active.

[Demo](http://sjwilliams.github.io/scrollstory/examples/basic.html)

### Pass In Data Attributes
```html
<div class="story" data-bgcolor="#0000ff"></div>
```
Data can be dynamically added to individual story items by adding it as data attributes. Combined with ScrollStory's API methods, some very dynamic applications can be built. 

[Demo](http://sjwilliams.github.io/scrollstory/examples/dataattributes.html)

### Options
#### contentSelector
Type: `String`

Default value: '.story'

```js
$('#container').ScrollStory({
    contentSelector: '.story'
});
```
A jQuery selector to find story items within your widget.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/customselector.html)

#### throttleType
Type: `String`

Default value: 'debounce'

```js
$('#container').ScrollStory({
    throttleType: 'debounce' // debounce or throttle
});
```
Set the throttle -- or rate-limiting -- method used when testing items' active state. These are wrappers around Underscore's [throttle](http://underscorejs.org/#throttle) and [debounce](http://underscorejs.org/#debounce) functions. Use 'throttle' to trigger active state on the leading edge of the scroll event. Use 'debounce' trigger on trailing edge. 

[Example usage](http://sjwilliams.github.io/scrollstory/examples/throttletype.html)

#### scrollSensitivity
Type: `Number`

Default value: 100

```js
$('#container').ScrollStory({
    scrollSensitivity: 100
});
```
How often in milliseconds to check for the active item during a scroll.

[Example of a lower scroll sensitivity](http://sjwilliams.github.io/scrollstory/examples/scrollsensitivity.html)

#### triggerOffset
Type: `Number`

Default value: 0

```js
$('#container').ScrollStory({
    triggerOffset: 0
});
```
The trigger offset is the distance from the top of the page use to determine which item is active.

[Example of trigger point farther down the page](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)

#### preOffetActivation
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    preOffsetActivation: true
});
```
By default, ScrollStory activates the item closest to the trigger offset, indifferent to whether that item is above or below the line. If set to false, the widget will no longer allow items to be active 'pre' the triggerOffset point. Generally, a value of true gives a very natural feel.

[Example set to false](http://sjwilliams.github.io/scrollstory/examples/preoffsetactivation.html)

#### keyboard
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    keyboard: true
});
```
Enable left and right arrow keys to move between story items.

[Demo](http://sjwilliams.github.io/scrollstory/examples/basic.html)

#### scrollOffset
Type: `Number`

Default value: 0

```js
$('#container').ScrollStory({
    scrollOffset: 0
});
```
When programatically scrolled, the position from the top the item is scrolled to.

#### autoActivateFirst
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    autoActivateFirst: true
});
```
Automatically activate the first item on page load, regardless of its position relative to the offset and the 'preOffsetActivation' setting. Common case: you want to disable 'preOffsetActivation' to ensure late scroll activations but need the first item to be enabled on load. With 'preOffsetActivation:true', this is ignored.

#### delayFirstActivationToOffset
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    delayFirstActivationToOffset: 0
});
```
If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the first item would activate after a 1px scroll. Usually, we want to delay that first activation until the first item is to the offset, but maintain the activation behavior of other items. By default, we delay the activation on first item. Set to false otherwise. No effect if 'autoActivateFirst' is true or 'preOffsetActivation' is false.

#### speed
Type: `Number`

Default value: 800

```js
$('#container').ScrollStory({
    speed: 800
});
```
Automated scroll speed in ms. Set to 0 to remove animation.

#### scrollRate
Type: `String`

Default value: 'dynamic'

```js
$('#container').ScrollStory({
    scrollRate: 'dynamic' // 'dynamic' or 'fixed'
});
```
The rate of scroll for programatic scrolls. 'fixed' means travel the full distance over 'speed' time, regardless of distance. 'dynamic' means the speed is a guide for the target travel time. Longer distances will take longer, and shorter distance will take less time. This is meant to have a more natural feel. Tip: you'll want a  higher speed if you use 'dynamic' than you would for 'fixed'.

#### easing
Type: `String`

Default value: 'swing'

```js
$('#container').ScrollStory({
    easing: 'swing'
});
```
The easing type for programatic scrolls. If jQuery effects core is included in your jQuery UI build, all jQuery UI easings are available: http://api.jqueryui.com/easings/. Otherwise, you'll only have jQuery's built-in 'swing' and 'linear.' Tip: 'swing' and 'easeOutQuad' have a natural feel.

#### checkViewportVisibility
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    checkViewportVisibility: false
});
```
Whether to keep track of which individual elements are in the viewport. This is can be CPU intensive, so is turned off by default. It is checked at the 'scrollSensitivity 'rate.

When enabled, events are triggered for items entering and leaving the viewport, and class of 'inViewport' is added and removed from those items' markup.

Regardless of 'checkViewportVisibility' setting, the getItemsInViewport() method will alway return the items in the viewport.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/inviewport.html)

#### verboseItemClasses
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    verboseItemClasses: false
});
```
Add css classes to items to reflect their order from the active item. Class 'order0' for the active item. 'class-1', for the item above, continuing on through 'class-2' to 'class-N', and class 'order1' through 'orderN' for the items below.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/verboseitemclasses.html)

#### throttleTypeOptions
Type: `Boolean\Object`

Default value: null

```js
$('#container').ScrollStory({
    throttleTypeOptions: null
});
```
Options to pass to underscore's throttle or debounce for scroll. Type/functionality dependent on 'throttleType'

## Events
_(TODO)_

## API
_(TODO)_

## Examples
* [Programmatically scroll up and down](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)
* [Item active event](http://sjwilliams.github.io/scrollstory/examples/activeevent.html)
* [Move the trigger point](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)

## Release History
*0.0.1*

* Initial Release
