<?php
header('Content-Type: application/json');

// Enable CORS for Netlify frontend
header('Access-Control-Allow-Origin: https://your-netlify-app.netlify.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if image was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No image uploaded or upload error']);
    exit;
}

$uploadedFile = $_FILES['image'];
$targetWidth = isset($_POST['width']) ? intval($_POST['width']) : null;
$targetHeight = isset($_POST['height']) ? intval($_POST['height']) : null;
$quality = isset($_POST['quality']) ? intval($_POST['quality']) : 80;
$format = isset($_POST['format']) ? $_POST['format'] : 'original';

// Validate inputs
if (!$targetWidth || !$targetHeight || $targetWidth <= 0 || $targetHeight <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid dimensions']);
    exit;
}

if ($quality < 1 || $quality > 100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid quality value']);
    exit;
}

// Check if the uploaded file is an image
$imageInfo = getimagesize($uploadedFile['tmp_name']);
if (!$imageInfo) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Uploaded file is not a valid image']);
    exit;
}

$mimeType = $imageInfo['mime'];
$originalWidth = $imageInfo[0];
$originalHeight = $imageInfo[1];

// Create image from uploaded file based on MIME type
switch ($mimeType) {
    case 'image/jpeg':
        $image = imagecreatefromjpeg($uploadedFile['tmp_name']);
        break;
    case 'image/png':
        $image = imagecreatefrompng($uploadedFile['tmp_name']);
        break;
    case 'image/gif':
        $image = imagecreatefromgif($uploadedFile['tmp_name']);
        break;
    case 'image/webp':
        $image = imagecreatefromwebp($uploadedFile['tmp_name']);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unsupported image format']);
        exit;
}

if (!$image) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to process image']);
    exit;
}

// Create new image with target dimensions
$resizedImage = imagecreatetruecolor($targetWidth, $targetHeight);

// Preserve transparency for PNG and GIF
if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
    imagealphablending($resizedImage, false);
    imagesavealpha($resizedImage, true);
    $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
    imagefilledrectangle($resizedImage, 0, 0, $targetWidth, $targetHeight, $transparent);
}

// Resize the image
imagecopyresampled(
    $resizedImage, $image,
    0, 0, 0, 0,
    $targetWidth, $targetHeight,
    $originalWidth, $originalHeight
);

// Determine output format and MIME type
if ($format === 'original') {
    $outputMime = $mimeType;
} else {
    $outputMime = 'image/' . $format;
}

// Generate unique filename
$outputFilename = 'resized_' . uniqid() . '.' . getExtensionFromMime($outputMime);
$outputPath = 'uploads/' . $outputFilename;

// Create uploads directory if it doesn't exist
if (!is_dir('uploads')) {
    mkdir('uploads', 0755, true);
}

// Save the resized image
$success = false;
switch ($outputMime) {
    case 'image/jpeg':
        $success = imagejpeg($resizedImage, $outputPath, $quality);
        break;
    case 'image/png':
        // PNG quality is compression level (0-9), so we need to convert from 0-100
        $pngQuality = 9 - round(($quality / 100) * 9);
        $success = imagepng($resizedImage, $outputPath, $pngQuality);
        break;
    case 'image/gif':
        $success = imagegif($resizedImage, $outputPath);
        break;
    case 'image/webp':
        $success = imagewebp($resizedImage, $outputPath, $quality);
        break;
}

// Free memory
imagedestroy($image);
imagedestroy($resizedImage);

if (!$success) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save resized image']);
    exit;
}

// Get file size of resized image
$fileSize = filesize($outputPath);

// Return success with image info
echo json_encode([
    'success' => true,
    'imageUrl' => $outputPath,
    'width' => $targetWidth,
    'height' => $targetHeight,
    'fileSize' => $fileSize,
    'format' => getExtensionFromMime($outputMime)
]);

function getExtensionFromMime($mimeType) {
    $mimeMap = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    
    return $mimeMap[$mimeType] ?? 'jpg';
}
?>