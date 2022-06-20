#BACKGROUND
This scraper was created to get the necessary data to connect geo-location data to spot id's for all of magic seaweeds surf locations. This scraper is relatively straightforward, just fill in the name of the country or state that you want location data for and a JSON file will be appended to the local version of this project. Feel free to message me or fork this repo to add further functionality to this project.

##SET UP
Clone this repo and use npm install to download the necessary dependancies. In the index.js file fill the variable [countryMatch] in with whatever country you want to get data for - make sure the country is listed on http://magicseaweed.com/site-map.php Run the script in the index.js file by typing "node index.js" into your terminal. On intital running of this script change [fs.appendFile] to [fs.writeFile], this is documented at the bottom of index.js. After the iniital run of this script switch it back to [fs.appendFile].

##LIMITATIONS
This project currently does not have functionality for handling rate limiting or limiting the number of threads created in your local node env. This is something that I am open to and will most likely add when I have free time.
