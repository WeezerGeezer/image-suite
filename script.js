document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const targetWidthInput = document.getElementById('targetWidth');
    const targetHeightInput = document.getElementById('targetHeight');
    const dpiInput = document.getElementById('dpi');
    const presetSize = document.getElementById('presetSize');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const cropControls = document.getElementById('cropControls');
    const sourceAspect = document.getElementById('sourceAspect');
    const customSourceRatio = document.getElementById('customSourceRatio');
    const customSourceWidth = document.getElementById('customSourceWidth');
    const customSourceHeight = document.getElementById('customSourceHeight');
    const alignment = document.getElementById('alignment');

    let originalImage = null;

    imageInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadImage);

    // Update on any input change
    [targetWidthInput, targetHeightInput, dpiInput, sourceAspect, customSourceWidth, customSourceHeight, alignment].forEach(input => {
        input.addEventListener('input', () => {
            if (originalImage) {
                processImage(originalImage);
            }
        });
    });

    // Preset size selector
    presetSize.addEventListener('change', (e) => {
        const preset = e.target.value;
        if (preset) {
            const [width, height] = preset.split('x').map(Number);
            targetWidthInput.value = width;
            targetHeightInput.value = height;
            if (originalImage) {
                processImage(originalImage);
            }
        }
    });

    // Mode switcher
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            cropControls.style.display = e.target.value === 'crop' ? 'block' : 'none';
            if (originalImage) {
                processImage(originalImage);
            }
        });
    });

    // Custom source aspect ratio visibility
    sourceAspect.addEventListener('change', (e) => {
        customSourceRatio.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    });

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                processImage(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function processImage(img) {
        const targetWidth = parseFloat(targetWidthInput.value);
        const targetHeight = parseFloat(targetHeightInput.value);
        const dpi = parseInt(dpiInput.value);
        const mode = document.querySelector('input[name="mode"]:checked').value;

        if (!targetWidth || !targetHeight || !dpi) return;

        // Convert inches to pixels
        const targetWidthPx = Math.round(targetWidth * dpi);
        const targetHeightPx = Math.round(targetHeight * dpi);

        // Set canvas size to target dimensions
        previewCanvas.width = targetWidthPx;
        previewCanvas.height = targetHeightPx;

        const ctx = previewCanvas.getContext('2d');

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

        if (mode === 'scale') {
            // Original behavior - scale to fit
            processScaleMode(ctx, img, targetWidthPx, targetHeightPx);
        } else {
            // New crop mode
            processCropMode(ctx, img, targetWidthPx, targetHeightPx);
        }

        // Enable download button
        downloadBtn.disabled = false;
    }

    function processScaleMode(ctx, img, targetWidthPx, targetHeightPx) {
        // Calculate the scaling factor to maintain aspect ratio
        const originalAspectRatio = img.width / img.height;
        const targetAspectRatio = targetWidthPx / targetHeightPx;

        let scaledWidth, scaledHeight;
        if (originalAspectRatio > targetAspectRatio) {
            // Image is wider than target - fit to width
            scaledWidth = targetWidthPx;
            scaledHeight = targetWidthPx / originalAspectRatio;
        } else {
            // Image is taller than target - fit to height
            scaledHeight = targetHeightPx;
            scaledWidth = targetHeightPx * originalAspectRatio;
        }

        // Calculate position to center the image
        const x = (targetWidthPx - scaledWidth) / 2;
        const y = (targetHeightPx - scaledHeight) / 2;

        // Draw the image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }

    function processCropMode(ctx, img, targetWidthPx, targetHeightPx) {
        const alignmentValue = alignment.value;

        // Get source aspect ratio
        let sourceAspectRatio = null;
        const sourceAspectValue = sourceAspect.value;

        if (sourceAspectValue === '') {
            // Use full image
            sourceAspectRatio = img.width / img.height;
        } else if (sourceAspectValue === 'custom') {
            const customW = parseFloat(customSourceWidth.value);
            const customH = parseFloat(customSourceHeight.value);
            if (customW && customH) {
                sourceAspectRatio = customW / customH;
            } else {
                sourceAspectRatio = img.width / img.height;
            }
        } else {
            // Parse ratio like "4:3"
            const [w, h] = sourceAspectValue.split(':').map(Number);
            sourceAspectRatio = w / h;
        }

        // Crop the source image to the desired aspect ratio
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        const imgAspect = img.width / img.height;

        if (imgAspect > sourceAspectRatio) {
            // Image is wider - crop width
            sourceWidth = img.height * sourceAspectRatio;
            sourceX = (img.width - sourceWidth) / 2;
        } else {
            // Image is taller - crop height
            sourceHeight = img.width / sourceAspectRatio;
            sourceY = (img.height - sourceHeight) / 2;
        }

        // Now fit the cropped region into the target canvas
        const targetAspectRatio = targetWidthPx / targetHeightPx;
        let drawWidth, drawHeight;

        if (sourceAspectRatio > targetAspectRatio) {
            // Cropped image is wider than target - fit to width
            drawWidth = targetWidthPx;
            drawHeight = targetWidthPx / sourceAspectRatio;
        } else {
            // Cropped image is taller than target - fit to height
            drawHeight = targetHeightPx;
            drawWidth = targetHeightPx * sourceAspectRatio;
        }

        // Calculate position based on alignment
        let x, y;
        switch (alignmentValue) {
            case 'left':
                x = 0;
                y = (targetHeightPx - drawHeight) / 2;
                break;
            case 'right':
                x = targetWidthPx - drawWidth;
                y = (targetHeightPx - drawHeight) / 2;
                break;
            case 'top':
                x = (targetWidthPx - drawWidth) / 2;
                y = 0;
                break;
            case 'bottom':
                x = (targetWidthPx - drawWidth) / 2;
                y = targetHeightPx - drawHeight;
                break;
            case 'center':
            default:
                x = (targetWidthPx - drawWidth) / 2;
                y = (targetHeightPx - drawHeight) / 2;
                break;
        }

        // Draw the cropped and positioned image
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, drawWidth, drawHeight);
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'processed-image.png';
        link.href = previewCanvas.toDataURL('image/png');
        link.click();
    }
});
