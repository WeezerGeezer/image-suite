document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupSection = document.getElementById('setupSection');
    const uploadSection = document.getElementById('uploadSection');
    const editorSection = document.getElementById('editorSection');

    const imageInput = document.getElementById('imageInput');
    const editorCanvas = document.getElementById('editorCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
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
    const scaleValue = document.getElementById('scaleValue');
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

    // Event Listeners - Image Upload
    imageInput.addEventListener('change', handleImageUpload);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

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
            imageState.scale = e.target.value / 100;
            scaleValue.textContent = e.target.value + '%';
            drawEditor();
            updatePreview();
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
        const innerX = (canvasSize.width - innerFrameSize.width) / 2;
        const innerY = (canvasSize.height - innerFrameSize.height) / 2;

        ctx.beginPath();
        ctx.rect(innerX, innerY, innerFrameSize.width, innerFrameSize.height);
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
        ctx.strokeRect(innerX, innerY, innerFrameSize.width, innerFrameSize.height);

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

        // Calculate inner frame position in output canvas
        const innerOutputX = (printWidthPx - imageWidthPx) / 2;
        const innerOutputY = (printHeightPx - imageHeightPx) / 2;

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
        scaleSlider.value = Math.round(scale * 100);
        scaleValue.textContent = Math.round(scale * 100) + '%';

        centerImage();
    }

    function fillCanvas() {
        if (!originalImage) return;

        // Scale image to fill entire inner frame
        const scaleX = innerFrameSize.width / originalImage.width;
        const scaleY = innerFrameSize.height / originalImage.height;
        const scale = Math.max(scaleX, scaleY);

        imageState.scale = scale;
        scaleSlider.value = Math.round(scale * 100);
        scaleValue.textContent = Math.round(scale * 100) + '%';

        centerImage();
    }

    function centerImage() {
        if (!originalImage) return;

        const drawWidth = originalImage.width * imageState.scale;
        const drawHeight = originalImage.height * imageState.scale;

        // Center within the inner frame
        const innerX = (canvasSize.width - innerFrameSize.width) / 2;
        const innerY = (canvasSize.height - innerFrameSize.height) / 2;

        imageState.x = innerX + (innerFrameSize.width - drawWidth) / 2;
        imageState.y = innerY + (innerFrameSize.height - drawHeight) / 2;

        drawEditor();
        updatePreview();
    }

    function topLeftImage() {
        if (!originalImage) return;

        // Position at top-left corner of inner frame
        const innerX = (canvasSize.width - innerFrameSize.width) / 2;
        const innerY = (canvasSize.height - innerFrameSize.height) / 2;

        imageState.x = innerX;
        imageState.y = innerY;

        drawEditor();
        updatePreview();
    }

    function resetImage() {
        if (!originalImage) return;

        imageState.scale = 1;
        imageState.x = 0;
        imageState.y = 0;
        scaleSlider.value = 100;
        scaleValue.textContent = '100%';

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
        newScale = Math.max(10, Math.min(200, newScale));

        scaleSlider.value = newScale;
        imageState.scale = newScale / 100;
        scaleValue.textContent = newScale + '%';

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
