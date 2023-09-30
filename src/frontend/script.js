const listImagesURL = '%%LIST_IMAGES_API_URL%%';
const uploadImageURL = 'https://m9inrnlk7l.execute-api.eu-north-1.amazonaws.com/test/images';
const uploadImage = () => {
const file = document.getElementById('fileUploader').files[0];
if (!file) {
alert('Please select a file to upload');
return;
}

// Request the presigned URL from our API Gateway
fetch(uploadImageURL, {
method: 'POST',
headers: {
 'Content-Type': 'application/json',
},
})
.then(response => response.json())
.then(data => {
const url = data.uploadUrl;
const options = {
 method: 'PUT',
 headers: {
   'Content-Type': file.type,
 },
 body: file,
};

// Use the presigned URL to upload the file to S3
fetch(url, options)
.then(() => {
 alert('Image upload successful');
 fileUploader.value = ''; // Clear file input

 let counter = 3; // start countdown from 3 seconds
 const intervalId = setInterval(() => {
     if (counter > 0) {
       console.log(`Refreshing in ${counter} seconds...`);
        counter--;
     } else {
        clearInterval(intervalId); // stop the countdown
       loadImages(); // refresh images
     }
   }, 1000);
})
.catch(error => console.error('Error:', error));
})
.catch(error => console.error('Error:', error));
};

  // The function to load images from API Gateway
const loadImages = () => {
fetch(listImagesURL)
 .then(response => response.json())
 .then(data => {
   const gallery = document.getElementById('gallery');
 gallery.innerHTML = ''; // Clear the gallery before populating it

   data.forEach(url => {
     const colDiv = document.createElement('div');
   colDiv.className = 'col-md-4';

   const cardDiv = document.createElement('div');
   cardDiv.className = 'card mb-4 box-shadow';

   const image = document.createElement('img');
   image.className = 'card-img-top';
   image.alt = 'Card image cap';
   image.src = url;
     gallery.appendChild(image);
     cardDiv.appendChild(image);
   colDiv.appendChild(cardDiv);
   gallery.appendChild(colDiv);
   });
 })
 .catch(error => console.error('Error:', error));
};

// Load the images when the page loads
window.onload = loadImages;