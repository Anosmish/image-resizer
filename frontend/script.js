// Backend URL - Update this with your Render backend URL
const BACKEND_URL = 'https://image-resizer-xfs7.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    const originalSize = document.getElementById('originalSize');
    const originalDimensions = document.getElementById('originalDimensions');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainAspect = document.getElementById('maintainAspect');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const resizeBtn = document.getElementById('resizeBtn');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const newSize = document.getElementById('newSize');
    const newDimensions = document.getElementById('newDimensions');
    const reduction = document.getElementById('reduction');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 0;
    let uploadedFile = null;
    
    // Event listeners for upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Handle dimension inputs
    widthInput.addEventListener('input', updateHeight);
    heightInput.addEventListener('input', updateWidth);
    
    // Update quality value display
    qualityInput.addEventListener('input', () => {
        qualityValue.textContent = `${qualityInput.value}%`;
    });
    
    // Resize button click
    resizeBtn.addEventListener('click', resizeImage);
    
    function handleFile(file) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Please select an image smaller than 10MB');
            return;
        }
        
        uploadedFile = file;
        
        // Display file size
        originalSize.textContent = formatFileSize(file.size);
        
        // Create a preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewSection.style.display = 'block';
            
            // Get image dimensions
            const img = new Image();
            img.onload = function() {
                originalWidth = img.width;
                originalHeight = img.height;
                aspectRatio = originalWidth / originalHeight;
                
                originalDimensions.textContent = `${originalWidth} × ${originalHeight}`;
                
                // Set default resize dimensions
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                
                // Enable resize button
                resizeBtn.disabled = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function updateHeight() {
        if (maintainAspect.checked && widthInput.value) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
    }
    
    function updateWidth() {
        if (maintainAspect.checked && heightInput.value) {
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
    }
    
    function resizeImage() {
        if (!uploadedFile) return;
        
        const formData = new FormData();
        formData.append('image', uploadedFile);
        formData.append('width', widthInput.value);
        formData.append('height', heightInput.value);
        formData.append('quality', qualityInput.value);
        
        // Get selected format
        let selectedFormat = 'original';
        for (const radio of formatRadios) {
            if (radio.checked) {
                selectedFormat = radio.value;
                break;
            }
        }
        formData.append('format', selectedFormat);
        
        // Show loading state
        loadingOverlay.style.display = 'flex';
        resizeBtn.disabled = true;
        
        // Send to PHP backend
        fetch(`${BACKEND_URL}/resize.php`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayResult(data);
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while resizing the image: ' + error.message);
        })
        .finally(() => {
            loadingOverlay.style.display = 'none';
            resizeBtn.disabled = false;
        });
    }
    
    function displayResult(data) {
        // Construct full URL for the resized image
        const fullImageUrl = `${BACKEND_URL}/${data.imageUrl}`;
        resultImage.src = fullImageUrl;
        newSize.textContent = formatFileSize(data.fileSize);
        newDimensions.textContent = `${data.width} × ${data.height}`;
        
        // Calculate reduction percentage
        const originalSizeBytes = uploadedFile.size;
        const newSizeBytes = data.fileSize;
        const reductionPercent = ((originalSizeBytes - newSizeBytes) / originalSizeBytes * 100).toFixed(1);
        reduction.textContent = `${reductionPercent}% smaller`;
        
        // Set download link
        downloadBtn.href = fullImageUrl;
        downloadBtn.download = `resized-image.${data.format}`;
        
        // Show result section
        resultSection.style.display = 'block';
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
