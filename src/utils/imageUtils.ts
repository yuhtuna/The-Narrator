/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Processes an uploaded image file for API consumption.
 * 
 * This utility performs the following operations:
 * 1. Reads the file as a Data URL.
 * 2. Loads it into an HTML Image element.
 * 3. Draws it onto a canvas, resizing it to a max dimension of 512px (maintaining aspect ratio).
 * 4. Compresses it to JPEG format with 0.7 quality.
 * 5. Returns the raw Base64 string (without the data URI prefix).
 * 
 * @param file - The uploaded File object (from an input[type="file"]).
 * @returns A Promise resolving to the raw Base64 string of the compressed image.
 */
export async function processImageForAPI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Create a canvas for processing
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 512;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        // Set canvas dimensions and draw the resized image
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG Base64 string with 0.7 quality compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Strip the "data:image/jpeg;base64," prefix to get raw Base64
        // The prefix length is 23 characters for 'data:image/jpeg;base64,'
        const base64String = dataUrl.split(',')[1];

        resolve(base64String);
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image for processing'));
      };

      // Set the source of the image to the FileReader result
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('FileReader result is empty'));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read file'));
    };

    // Read the file as a Data URL
    reader.readAsDataURL(file);
  });
}
