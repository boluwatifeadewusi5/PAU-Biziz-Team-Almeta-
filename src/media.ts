export function categoryImage(category:string,width=900){
 const photos:Record<string,string>={
  'Food & drinks':'photo-1464305795204-6f5bbfc7fb81',
  Transport:'photo-1544620347-c4fd4a3d5957',
  'Tech & services':'photo-1517336714739-489689fd1ca8',
  Fashion:'photo-1523381210434-271e8be1f52b',
  'Beauty & grooming':'photo-1522337360788-8b13dee7a37e',
  'Academic support':'photo-1455390582262-044cdead277a',
  Wellness:'photo-1506126613408-eca07ce68773',
 }
 return `https://images.unsplash.com/${photos[category]||'photo-1455390582262-044cdead277a'}?auto=format&fit=crop&w=${width}&q=80`
}
