# Scrollstory

jQuery widget for stacked, scroll-based stories (or items) that need to give focus to a single item at a time.

Key features include:
- 100% style agnostic. Just a collection of scroll-based patterns I often use.
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
  $.awesome(); // "awesome"
});
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
