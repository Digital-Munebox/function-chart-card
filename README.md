# Function Chart Card for Home Assistant

A custom card that allows you to visualize mathematical functions and relations in your Home Assistant dashboard. Display mathematical functions, equations, and data relationships in a clear, interactive graph format.

![Function Chart Card Example](https://via.placeholder.com/600x400.png?text=Function+Chart+Card+Example)

## Features

- Plot multiple mathematical functions simultaneously
- Support for standard mathematical expressions and operations
- Customizable X and Y axis ranges
- Color customization for each function
- Integration with Home Assistant states and templates
- Responsive SVG-based rendering
- Dark/Light theme support

## Installation

### HACS (Recommended)

1. Make sure you have [HACS](https://hacs.xyz/) installed
2. Add this repository to HACS as a custom repository:
   - Open HACS in your Home Assistant instance
   - Click on the three dots in the top right corner
   - Select "Custom repositories"
   - Add the URL: `https://github.com/Digital-Munebox/function-chart-card`
   - Category: "Frontend"
3. Click "Install" when the repository appears
4. Restart Home Assistant

### Manual Installation

1. Download the latest release (function-chart-card.js) from the [releases page](https://github.com/Digital-Munebox/function-chart-card/releases)
2. Copy the file to your `config/www` folder
3. Add the following to your Lovelace configuration (Resource tab or raw configuration):
```yaml
resources:
  - url: /local/function-chart-card.js
    type: module
```

## Usage

Add the card to your Lovelace dashboard with configuration like this:

```yaml
type: custom:function-chart-card
title: Mathematical Functions
functions:
  - expression: "sin(x)"
    name: "Sine Wave"
    color: "#FF0000"
  - expression: "x^2"
    name: "Quadratic"
    color: "#00FF00"
xRange: [-10, 10]
steps: 100
```

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | **Required** | `custom:function-chart-card` |
| title | string | "Function Chart" | Title of the card |
| functions | array | **Required** | Array of function objects |
| xRange | array | [-10, 10] | Range of x-axis [min, max] |
| steps | number | 100 | Number of points to calculate |

#### Function Object Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| expression | string | **Required** | Mathematical expression (e.g., "sin(x)", "x^2") |
| name | string | "Function N" | Name/label for the function |
| color | string | "#FF6B6B" | Color for the function graph (CSS color) |

## Examples

### Basic Trigonometric Functions

```yaml
type: custom:function-chart-card
title: Trigonometric Functions
functions:
  - expression: "sin(x)"
    name: "Sine"
    color: "#FF0000"
  - expression: "cos(x)"
    name: "Cosine"
    color: "#00FF00"
xRange: [-6.28, 6.28]
steps: 200
```

### Polynomial Functions

```yaml
type: custom:function-chart-card
title: Polynomial Example
functions:
  - expression: "x^2"
    name: "Square"
    color: "#FF0000"
  - expression: "x^3"
    name: "Cube"
    color: "#0000FF"
  - expression: "2*x + 1"
    name: "Linear"
    color: "#00FF00"
xRange: [-5, 5]
```

## Supported Mathematical Expressions

The card uses the [Math.js](https://mathjs.org/) library for expression evaluation. You can use:
- Basic operators: +, -, *, /, ^
- Trigonometric functions: sin(), cos(), tan()
- Exponential and logarithmic: exp(), log(), sqrt()
- Constants: pi, e
- And many more from the Math.js library

## Troubleshooting

If the card doesn't appear:
1. Check your browser's developer console for errors
2. Verify the resource is properly loaded in your Lovelace configuration
3. Ensure your mathematical expressions are valid
4. Check that the function values are within a reasonable range

## Contributing

Feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.