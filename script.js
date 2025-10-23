document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupSection = document.getElementById('setupSection');
    const uploadSection = document.getElementById('uploadSection');
    const editorSection = document.getElementById('editorSection');

    const imageInput = document.getElementById('imageInput');
    const dropZone = document.getElementById('dropZone');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const editorCanvas = document.getElementById('editorCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const cropAnotherBtn = document.getElementById('cropAnotherBtn');
    const continueBtn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');

    const targetWidthInput = document.getElementById('targetWidth');
    const targetHeightInput = document.getElementById('targetHeight');
    const innerWidthInput = document.getElementById('innerWidth');
    const innerHeightInput = document.getElementById('innerHeight');
    const dpiInput = document.getElementById('dpi');
    const presetSize = document.getElementById('presetSize');
    const innerPreset = document.getElementById('innerPreset');
    const customSizeInputs = document.getElementById('customSizeInputs');
    const customInnerInputs = document.getElementById('customInnerInputs');

    const scaleSlider = document.getElementById('scaleSlider');
    const scaleInput = document.getElementById('scaleInput');
    const scaleError = document.getElementById('scaleError');
    const fitBtn = document.getElementById('fitBtn');
    const fillBtn = document.getElementById('fillBtn');
    const centerBtn = document.getElementById('centerBtn');
    const topLeftBtn = document.getElementById('topLeftBtn');
    const resetBtn = document.getElementById('resetBtn');

    // State
    let config = {
        printWidth: 4,
        printHeight: 6,
        imageWidth: 4,
        imageHeight: 6,
        dpi: 300
    };

    let originalImage = null;
    let imageState = {
        x: 0,
        y: 0,
        scale: 1,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0
    };

    let canvasSize = { width: 600, height: 600 };
    let innerFrameSize = { width: 600, height: 600 };
    let innerFramePosition = { x: 0, y: 0 }; // Position of inner frame relative to outer frame

    // Event Listeners - Quick Presets
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const printSize = btn.dataset.print;
            const imageSize = btn.dataset.image;

            // Set print size
            presetSize.value = printSize;
            const [printW, printH] = printSize.split('x').map(Number);
            targetWidthInput.value = printW;
            targetHeightInput.value = printH;

            // Set image size
            innerPreset.value = imageSize;
            const [imageW, imageH] = imageSize.split('x').map(Number);
            innerWidthInput.value = imageW;
            innerHeightInput.value = imageH;

            // Visual feedback
            btn.classList.add('preset-active');
            setTimeout(() => btn.classList.remove('preset-active'), 300);
        });
    });

    // Event Listeners - Setup Section
    presetSize.addEventListener('change', (e) => {
        const preset = e.target.value;
        if (preset === 'custom') {
            customSizeInputs.style.display = 'flex';
        } else {
            customSizeInputs.style.display = 'none';
            const [width, height] = preset.split('x').map(Number);
            targetWidthInput.value = width;
            targetHeightInput.value = height;
        }
    });

    innerPreset.addEventListener('change', (e) => {
        const preset = e.target.value;
        if (preset === 'custom') {
            customInnerInputs.style.display = 'flex';
        } else {
            customInnerInputs.style.display = 'none';
            if (preset !== 'same') {
                const [width, height] = preset.split('x').map(Number);
                innerWidthInput.value = width;
                innerHeightInput.value = height;
            }
        }
    });

    continueBtn.addEventListener('click', () => {
        // Save configuration
        config.printWidth = parseFloat(targetWidthInput.value) || 4;
        config.printHeight = parseFloat(targetHeightInput.value) || 6;
        config.dpi = parseInt(dpiInput.value) || 300;

        const innerPresetValue = innerPreset.value;
        if (innerPresetValue === 'same') {
            config.imageWidth = config.printWidth;
            config.imageHeight = config.printHeight;
        } else {
            config.imageWidth = parseFloat(innerWidthInput.value) || config.printWidth;
            config.imageHeight = parseFloat(innerHeightInput.value) || config.printHeight;
        }

        // Move to upload section
        setupSection.style.display = 'none';
        uploadSection.style.display = 'block';
    });

    backBtn.addEventListener('click', () => {
        uploadSection.style.display = 'none';
        setupSection.style.display = 'block';
    });

    cropAnotherBtn.addEventListener('click', () => {
        // Reset image input
        imageInput.value = '';
        originalImage = null;

        // Reset image state
        imageState = {
            x: 0,
            y: 0,
            scale: 1,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0
        };

        // Go back to upload section
        editorSection.style.display = 'none';
        uploadSection.style.display = 'block';
    });

    // Event Listeners - Image Upload
    imageInput.addEventListener('change', handleImageUpload);

    // Drag and Drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drop-zone-active');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleImageFile(file);
            }
        }
    });

    // Click on drop zone to trigger file input
    dropZone.addEventListener('click', (e) => {
        if (e.target !== imageInput && !e.target.closest('label')) {
            imageInput.click();
        }
    });

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        handleImageFile(file);
    }

    function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                initializeEditor();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function initializeEditor() {
        // Show editor section
        uploadSection.style.display = 'none';
        editorSection.style.display = 'block';

        // Calculate canvas sizes
        updateCanvasSize();

        // Initialize image state
        resetImage();

        // Setup editor event listeners
        setupEditorEvents();
    }

    function setupEditorEvents() {
        scaleSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            scaleInput.value = value;
            imageState.scale = value / 100;
            scaleError.style.display = 'none';
            drawEditor();
            updatePreview();
        });

        scaleInput.addEventListener('input', (e) => {
            let value = e.target.value.trim();

            // Remove any non-numeric characters except decimal point
            value = value.replace(/[^\d.]/g, '');

            // Parse as number
            const numValue = parseFloat(value);

            // Validate
            if (isNaN(numValue) || numValue < 1 || numValue > 200) {
                scaleError.style.display = 'block';
                return;
            }

            scaleError.style.display = 'none';

            // Update slider and image
            scaleSlider.value = Math.round(numValue);
            imageState.scale = numValue / 100;
            drawEditor();
            updatePreview();
        });

        scaleInput.addEventListener('blur', (e) => {
            let value = e.target.value.trim();
            value = value.replace(/[^\d.]/g, '');
            const numValue = parseFloat(value);

            // On blur, if invalid, reset to current scale
            if (isNaN(numValue) || numValue < 1 || numValue > 200) {
                scaleInput.value = Math.round(imageState.scale * 100);
                scaleError.style.display = 'none';
            } else {
                // Round to whole number
                scaleInput.value = Math.round(numValue);
            }
        });

        fitBtn.addEventListener('click', fitToCanvas);
        fillBtn.addEventListener('click', fillCanvas);
        centerBtn.addEventListener('click', centerImage);
        topLeftBtn.addEventListener('click', topLeftImage);
        resetBtn.addEventListener('click', resetImage);

        editorCanvas.addEventListener('mousedown', handleMouseDown);
        editorCanvas.addEventListener('mousemove', handleMouseMove);
        editorCanvas.addEventListener('mouseup', handleMouseUp);
        editorCanvas.addEventListener('mouseleave', handleMouseUp);
        editorCanvas.addEventListener('wheel', handleWheel, { passive: false });

        downloadBtn.addEventListener('click', downloadImage);
    }

    function updateCanvasSize() {
        const aspectRatio = config.printWidth / config.printHeight;

        // Set editor canvas to a reasonable display size (outer frame)
        const maxSize = 600;
        if (aspectRatio > 1) {
            canvasSize.width = maxSize;
            canvasSize.height = maxSize / aspectRatio;
        } else {
            canvasSize.height = maxSize;
            canvasSize.width = maxSize * aspectRatio;
        }

        editorCanvas.width = canvasSize.width;
        editorCanvas.height = canvasSize.height;

        // Convert inner frame to canvas pixels
        const scaleFactorX = canvasSize.width / config.printWidth;
        const scaleFactorY = canvasSize.height / config.printHeight;

        innerFrameSize.width = config.imageWidth * scaleFactorX;
        innerFrameSize.height = config.imageHeight * scaleFactorY;

        // Default: center the inner frame
        innerFramePosition.x = (canvasSize.width - innerFrameSize.width) / 2;
        innerFramePosition.y = (canvasSize.height - innerFrameSize.height) / 2;
    }

    function drawEditor() {
        const ctx = editorCanvas.getContext('2d');

        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        if (!originalImage) return;

        // Save context for clipping
        ctx.save();

        // Clip to inner frame
        ctx.beginPath();
        ctx.rect(innerFramePosition.x, innerFramePosition.y, innerFrameSize.width, innerFrameSize.height);
        ctx.clip();

        // Draw the image with current position and scale
        const drawWidth = originalImage.width * imageState.scale;
        const drawHeight = originalImage.height * imageState.scale;

        ctx.drawImage(
            originalImage,
            imageState.x,
            imageState.y,
            drawWidth,
            drawHeight
        );

        ctx.restore();

        // Draw inner frame border (green box - image area)
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.strokeRect(innerFramePosition.x, innerFramePosition.y, innerFrameSize.width, innerFrameSize.height);

        // Draw outer border (blue - print boundary)
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height);
    }

    function updatePreview() {
        if (!originalImage) return;

        // Convert to pixels for final output
        const printWidthPx = Math.round(config.printWidth * config.dpi);
        const printHeightPx = Math.round(config.printHeight * config.dpi);
        const imageWidthPx = Math.round(config.imageWidth * config.dpi);
        const imageHeightPx = Math.round(config.imageHeight * config.dpi);

        // Set preview canvas size
        previewCanvas.width = printWidthPx;
        previewCanvas.height = printHeightPx;

        const ctx = previewCanvas.getContext('2d');

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, printWidthPx, printHeightPx);

        // Calculate scaling factor from editor canvas to final output
        const scaleFactorX = printWidthPx / canvasSize.width;
        const scaleFactorY = printHeightPx / canvasSize.height;

        // Calculate inner frame position in output canvas (scale the position)
        const innerOutputX = innerFramePosition.x * scaleFactorX;
        const innerOutputY = innerFramePosition.y * scaleFactorY;

        // Save context and clip to inner frame
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerOutputX, innerOutputY, imageWidthPx, imageHeightPx);
        ctx.clip();

        // Draw the image at the same relative position and scale
        const drawWidth = originalImage.width * imageState.scale * scaleFactorX;
        const drawHeight = originalImage.height * imageState.scale * scaleFactorY;
        const x = imageState.x * scaleFactorX;
        const y = imageState.y * scaleFactorY;

        ctx.drawImage(originalImage, x, y, drawWidth, drawHeight);

        ctx.restore();
    }

    function fitToCanvas() {
        if (!originalImage) return;

        // Scale image to fit entirely within inner frame
        const scaleX = innerFrameSize.width / originalImage.width;
        const scaleY = innerFrameSize.height / originalImage.height;
        const scale = Math.min(scaleX, scaleY);

        imageState.scale = scale;
        const scalePercent = Math.round(scale * 100);
        scaleSlider.value = scalePercent;
        scaleInput.value = scalePercent;

        // Center image within inner frame (at its current position)
        const drawWidth = originalImage.width * imageState.scale;
        const drawHeight = originalImage.height * imageState.scale;

        imageState.x = innerFramePosition.x + (innerFrameSize.width - drawWidth) / 2;
        imageState.y = innerFramePosition.y + (innerFrameSize.height - drawHeight) / 2;

        drawEditor();
        updatePreview();
    }

    function fillCanvas() {
        if (!originalImage) return;

        // Scale image to fill entire inner frame
        const scaleX = innerFrameSize.width / originalImage.width;
        const scaleY = innerFrameSize.height / originalImage.height;
        const scale = Math.max(scaleX, scaleY);

        imageState.scale = scale;
        const scalePercent = Math.round(scale * 100);
        scaleSlider.value = scalePercent;
        scaleInput.value = scalePercent;

        // Center image within inner frame (at its current position)
        const drawWidth = originalImage.width * imageState.scale;
        const drawHeight = originalImage.height * imageState.scale;

        imageState.x = innerFramePosition.x + (innerFrameSize.width - drawWidth) / 2;
        imageState.y = innerFramePosition.y + (innerFrameSize.height - drawHeight) / 2;

        drawEditor();
        updatePreview();
    }

    function centerImage() {
        if (!originalImage) return;

        const drawWidth = originalImage.width * imageState.scale;
        const drawHeight = originalImage.height * imageState.scale;

        // Center the inner frame within the outer frame
        innerFramePosition.x = (canvasSize.width - innerFrameSize.width) / 2;
        innerFramePosition.y = (canvasSize.height - innerFrameSize.height) / 2;

        // Center the image within the inner frame
        imageState.x = innerFramePosition.x + (innerFrameSize.width - drawWidth) / 2;
        imageState.y = innerFramePosition.y + (innerFrameSize.height - drawHeight) / 2;

        drawEditor();
        updatePreview();
    }

    function topLeftImage() {
        if (!originalImage) return;

        // Position inner frame at top-left corner of outer frame
        innerFramePosition.x = 0;
        innerFramePosition.y = 0;

        // Fit and center image within the (now top-left positioned) inner frame
        fitToCanvas();
    }

    function resetImage() {
        if (!originalImage) return;

        imageState.scale = 1;
        imageState.x = 0;
        imageState.y = 0;
        scaleSlider.value = 100;
        scaleInput.value = 100;

        fitToCanvas();
    }

    function handleMouseDown(e) {
        imageState.isDragging = true;
        const rect = editorCanvas.getBoundingClientRect();
        imageState.dragStartX = e.clientX - rect.left - imageState.x;
        imageState.dragStartY = e.clientY - rect.top - imageState.y;
        editorCanvas.style.cursor = 'grabbing';
    }

    function handleMouseMove(e) {
        if (!imageState.isDragging) {
            editorCanvas.style.cursor = 'grab';
            return;
        }

        const rect = editorCanvas.getBoundingClientRect();
        imageState.x = e.clientX - rect.left - imageState.dragStartX;
        imageState.y = e.clientY - rect.top - imageState.dragStartY;

        drawEditor();
        updatePreview();
    }

    function handleMouseUp() {
        imageState.isDragging = false;
        editorCanvas.style.cursor = 'grab';
    }

    function handleWheel(e) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -5 : 5;
        let newScale = parseInt(scaleSlider.value) + delta;
        newScale = Math.max(1, Math.min(200, newScale));

        scaleSlider.value = newScale;
        scaleInput.value = newScale;
        imageState.scale = newScale / 100;

        drawEditor();
        updatePreview();
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'processed-image.png';
        link.href = previewCanvas.toDataURL('image/png');
        link.click();
    }
});
