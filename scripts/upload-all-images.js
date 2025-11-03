require('dotenv').config();
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadAllImages() {
  console.log('🚀 Starting image upload to Vercel Blob...\n');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('❌ ERROR: BLOB_READ_WRITE_TOKEN environment variable is not set!');
    console.log('Please add it to your .env file:');
    console.log('BLOB_READ_WRITE_TOKEN=your_token_here');
    process.exit(1);
  }

  const publicPath = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicPath)) {
    console.log('❌ ERROR: public directory not found!');
    console.log('Looking for:', publicPath);
    process.exit(1);
  }

  console.log('📁 Scanning public directory...');
  const allUrls = {};

  async function processDirectory(dirPath, blobPrefix = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await processDirectory(fullPath, `${blobPrefix}${item}/`);
      } else if (/(\.webp|\.jpg|\.jpeg|\.png|\.svg)$/i.test(item)) {
        try {
          const fileBuffer = fs.readFileSync(fullPath);
          const blobPath = `${blobPrefix}${item}`;
          
          console.log(`📤 Uploading: ${blobPath}`);
          
          const { url } = await put(blobPath, fileBuffer, {
            access: 'public',
          });
          
          const relativePath = path.relative(publicPath, fullPath).replace(/\\/g, '/');
          allUrls[relativePath] = url;
          
          console.log(`✅ Uploaded: ${relativePath}`);
          console.log(`   🔗 URL: ${url}\n`);
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`❌ Failed to upload ${item}:`, error.message);
        }
      }
    }
  }

  await processDirectory(publicPath);
  
  const libDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    console.log('📁 Created lib directory');
  }
  
  const outputPath = path.join(libDir, 'image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(allUrls, null, 2));
  
  console.log('🎉 UPLOAD COMPLETED!');
  console.log(`📊 Total images uploaded: ${Object.keys(allUrls).length}`);
  console.log(`💾 URLs saved to: ${outputPath}`);
  
  console.log('\n📋 Uploaded Images Summary:');
  Object.keys(allUrls).forEach(relativePath => {
    console.log(`   📄 ${relativePath}`);
  });
  
  console.log('\n🔧 Next steps:');
  console.log('   1. Update your components to use getImageUrl() from lib/images.ts');
  console.log('   2. Deploy your application');
  console.log('   3. Test that all images load correctly\n');
}

uploadAllImages().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});