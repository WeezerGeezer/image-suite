document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const editorCanvas = document.getElementById('editorCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const targetWidthInput = document.getElementById('targetWidth');
    const targetHeightInput = document.getElementById('targetHeight');
    const innerWidthInput = document.getElementById('innerWidth');
    const innerHeightInput = document.getElementById('innerHeight');
    const dpiInput = document.getElementById('dpi');
    const presetSize = document.getElementById('presetSize');
    const innerPreset = document.getElementById('innerPreset');
    const editorSection = document.getElementById('editorSection');
    const customSizeInputs = document.getElementById('customSizeInputs');
    const customInnerInputs = document.getElementById('customInnerInputs');
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    const fitBtn = document.getElementById('fitBtn');
    const fillBtn = document.getElementById('fillBtn');
    const centerBtn = document.getElementById('centerBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalImage = null;
    let imageState = {
        x: 0,
        y: 0,
        scale: 1,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0
    };

    let canvasSize = {
        width: 600,
        height: 600
    };

    let innerFrameSize = {
        width: 600,
        height: 600
    };

    imageInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadImage);

    // Preset size selector (outer frame)
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
        if (originalImage) {
            updateCanvasSize();
            drawEditor();
            updatePreview();
        }
    });

    // Inner frame preset selector
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
        if (originalImage) {
            updateCanvasSize();
            drawEditor();
            updatePreview();
        }
    });

    // Custom size inputs
    [targetWidthInput, targetHeightInput, innerWidthInput, innerHeightInput, dpiInput].forEach(input => {
        input.addEventListener('input', () => {
            if (originalImage) {
                updateCanvasSize();
                drawEditor();
                updatePreview();
            }
        });
    });

    // Scale slider
    scaleSlider.addEventListener('input', (e) => {
        imageState.scale = e.target.value / 100;
        scaleValue.textContent = e.target.value + '%';
        drawEditor();
        updatePreview();
    });

    // Control buttons
    fitBtn.addEventListener('click', fitToCanvas);
    fillBtn.addEventListener('click', fillCanvas);
    centerBtn.addEventListener('click', centerImage);
    resetBtn.addEventListener('click', resetImage);

    // Mouse events for dragging
    editorCanvas.addEventListener('mousedown', handleMouseDown);
    editorCanvas.addEventListener('mousemove', handleMouseMove);
    editorCanvas.addEventListener('mouseup', handleMouseUp);
    editorCanvas.addEventListener('mouseleave', handleMouseUp);

    // Wheel event for zooming
    editorCanvas.addEventListener('wheel', handleWheel, { passive: false });

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                editorSection.style.display = 'block';
                updateCanvasSize();
                resetImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function updateCanvasSize() {
        const targetWidth = parseFloat(targetWidthInput.value) || 4;
        const targetHeight = parseFloat(targetHeightInput.value) || 6;
        const aspectRatio = targetWidth / targetHeight;

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

        // Calculate inner frame size
        const innerPresetValue = innerPreset.value;
        let innerWidth, innerHeight;

        if (innerPresetValue === 'same') {
            innerWidth = targetWidth;
            innerHeight = targetHeight;
        } else {
            innerWidth = parseFloat(innerWidthInput.value) || targetWidth;
            innerHeight = parseFloat(innerHeightInput.value) || targetHeight;
        }

        // Convert inner frame to canvas pixels
        const scaleFactorX = canvasSize.width / targetWidth;
        const scaleFactorY = canvasSize.height / targetHeight;

        innerFrameSize.width = innerWidth * scaleFactorX;
        innerFrameSize.height = innerHeight * scaleFactorY;
    }

    function drawEditor() {
        const ctx = editorCanvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        if (!originalImage) return;

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

        // Draw inner frame (green box - where the image will be cropped)
        const innerX = (canvasSize.width - innerFrameSize.width) / 2;
        const innerY = (canvasSize.height - innerFrameSize.height) / 2;

        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.strokeRect(innerX, innerY, innerFrameSize.width, innerFrameSize.height);

        // Draw outer border around canvas (blue - print boundary)
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height);
    }

    function updatePreview() {
        if (!originalImage) return;

        const targetWidth = parseFloat(targetWidthInput.value) || 4;
        const targetHeight = parseFloat(targetHeightInput.value) || 6;
        const dpi = parseInt(dpiInput.value) || 300;

        // Get inner frame dimensions
        const innerPresetValue = innerPreset.value;
        let innerWidth, innerHeight;

        if (innerPresetValue === 'same') {
            innerWidth = targetWidth;
            innerHeight = targetHeight;
        } else {
            innerWidth = parseFloat(innerWidthInput.value) || targetWidth;
            innerHeight = parseFloat(innerHeightInput.value) || targetHeight;
        }

        // Convert inches to pixels for final output
        const targetWidthPx = Math.round(targetWidth * dpi);
        const targetHeightPx = Math.round(targetHeight * dpi);
        const innerWidthPx = Math.round(innerWidth * dpi);
        const innerHeightPx = Math.round(innerHeight * dpi);

        // Set preview canvas size
        previewCanvas.width = targetWidthPx;
        previewCanvas.height = targetHeightPx;

        const ctx = previewCanvas.getContext('2d');

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

        // Calculate scaling factor from editor canvas to final output
        const scaleFactorX = targetWidthPx / canvasSize.width;
        const scaleFactorY = targetHeightPx / canvasSize.height;

        // Calculate inner frame position in editor canvas
        const innerEditorX = (canvasSize.width - innerFrameSize.width) / 2;
        const innerEditorY = (canvasSize.height - innerFrameSize.height) / 2;

        // Calculate inner frame position in output canvas
        const innerOutputX = (targetWidthPx - innerWidthPx) / 2;
        const innerOutputY = (targetHeightPx - innerHeightPx) / 2;

        // Save context and clip to inner frame
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerOutputX, innerOutputY, innerWidthPx, innerHeightPx);
        ctx.clip();

        // Draw the image at the same relative position and scale
        // Adjust position to account for inner frame offset
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

        // Scale image to fill entire inner frame (may crop)
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
