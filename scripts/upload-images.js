// scripts/upload-images.js
require('dotenv').config(); // Add this line to load .env file
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadImages() {
  // Check if public/banners directory exists
  const bannersPath = path.join(process.cwd(), 'public', 'banners');
  
  if (!fs.existsSync(bannersPath)) {
    console.log('❌ public/banners directory not found!');
    console.log('Current working directory:', process.cwd());
    console.log('Looking for:', bannersPath);
    return;
  }
  
  const files = fs.readdirSync(bannersPath);
  console.log(`Found ${files.length} files in banners directory:`);
  files.forEach(file => console.log(` - ${file}`));
  
  console.log('\nUploading images to Vercel Blob...');
  
  const uploadedUrls = {};
  
  for (const file of files) {
    if (file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) {
      try {
        const filePath = path.join(bannersPath, file);
        console.log(`📤 Uploading: ${file}`);
        
        const fileBuffer = fs.readFileSync(filePath);
        
        const { url } = await put(`banners/${file}`, fileBuffer, {
          access: 'public',
        });
        
        uploadedUrls[file] = url;
        console.log(`✅ Uploaded: ${file}`);
        console.log(`   URL: ${url}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
      }
    }
  }
  
  // Create lib directory if it doesn't exist
  const libDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  // Save the URLs to a JSON file
  const outputPath = path.join(libDir, 'image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(uploadedUrls, null, 2));
  
  console.log('\n🎉 Upload completed!');
  console.log(`📁 URLs saved to: ${outputPath}`);
  console.log('\nUploaded images:');
  Object.keys(uploadedUrls).forEach(key => {
    console.log(`  ${key} -> ${uploadedUrls[key]}`);
  });
}

// Check for BLOB_READ_WRITE_TOKEN
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.log('❌ BLOB_READ_WRITE_TOKEN environment variable is not set!');
  console.log('Current environment variables:');
  console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '***' : 'undefined');
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('BLOB')));
  process.exit(1);
}

console.log('✅ BLOB_READ_WRITE_TOKEN found, starting upload...');
uploadImages().catch(console.error);