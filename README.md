# Ruby Enumeration Demo

A visualization of eager and lazy enumeration in Ruby.

![Screenshot of demo](./docs/screenshot.jpg 'A screenshot of the demo')

## About

Rubyists love Ruby’s `Enumerable`:

```ruby
1.upto(5).map { |item| item * 2 }.take(3)
# => [2, 4, 6]
```

But Ruby’s `.lazy` enumerator can be confusing:

```ruby
1.upto(5).lazy.map { |item| item * 2 }.take(3).to_a
# => [2, 4, 6]
```

What’s going on here?

This visualization may help illustrate the difference.

## Development

Make sure `node` and `npm` is installed. See `.node-version` for current version.

Install dependencies:

```
npm install
```

Run the Vite dev server:

```
npm run dev
```

Build static assets

```
npm run build
```
