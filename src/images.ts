export async function prepareImage(file:File,maxDimension=900):Promise<string>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG, or WebP image.')
 if(file.size>8*1024*1024)throw new Error('Please choose an image smaller than 8 MB.')
 const bitmap=await createImageBitmap(file)
 try{const scale=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)throw new Error('Unable to prepare image. Please try another image.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.8)}finally{bitmap.close()}
}
