# White Border Image Tool

A simple web-based tool that helps you add white borders to your images while maintaining their aspect ratio. Perfect for preparing images for printing in different sizes without distortion.

## Features

- Upload any image file
- Two operating modes: Scale Mode (fit with borders) and Crop Mode (crop to aspect ratio with positioned white bars)
- Quick preset sizes for common print formats (4x6, 4x4, 3x3, 5x7, 8x10, 6x6)
- Specify target dimensions in inches
- Set custom DPI (dots per inch)
- Source aspect ratio controls in Crop Mode (1:1, 4:3, 3:2, 16:9, custom)
- White bar positioning (left, right, top, bottom, center)
- Live preview of the result
- Download processed image with white borders
- Works entirely in the browser - no server needed

## How to Use

### Scale Mode (Original Behavior)
1. Open the website
2. Click "Choose Image" to upload your image
3. Ensure "Scale Mode" is selected
4. Set your desired output dimensions (e.g., 8x10 inches) or choose a preset
5. Adjust DPI if needed (default is 300 DPI for high-quality prints)
6. Preview your image with white borders on all sides
7. Click "Download Image" to save the processed image

### Crop Mode (Position with White Bar)
1. Upload your image
2. Select "Crop Mode"
3. Choose a preset size (e.g., 4x6 inches for printing)
4. Set the source image aspect ratio (e.g., 1:1 for square images)
5. Choose white bar position (e.g., "Left" to place white bar on the right side)
6. Preview and download your positioned image

**Example Use Case:** You have a 4x4 square image but 4x6 prints are cheaper. Select Crop Mode, choose 4x6 preset, set source to 1:1 (square), position left or right, then print and cut off the white bar.

## Technical Details

- The tool runs entirely in your browser using HTML5 Canvas
- No image data is ever uploaded to any server
- Supports all common image formats (JPG, PNG, GIF, etc.)
- Output is always in PNG format for best quality

## Development

This is a static website that can be served from any web server. To run locally:

1. Clone this repository
2. Open `index.html` in your web browser
3. That's it! No build process or server setup required

## Deployment

The site is deployed using GitHub Pages. Any push to the gh-pages branch will automatically update the live site.

## License

MIT License - feel free to use, modify, and distribute as needed.
